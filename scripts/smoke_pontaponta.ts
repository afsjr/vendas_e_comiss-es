import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") || '';
const anonKey = process.env.SUPABASE_ANON_KEY || Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") || '';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !anonKey || !serviceRole) {
  console.error('[smoke] Faltam credenciais de ambiente.');
  Deno.exit(1);
}

const svc = createClient(url, serviceRole, { auth: { persistSession: false } });
const FUNC = `${url}/functions/v1`;

let failures = 0;
function check(desc: string, ok: boolean, extra = '') {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${desc}${extra ? ' — ' + extra : ''}`);
  if (!ok) failures++;
}

async function signIn(email: string) {
  const { data, error } = await createClient(url, anonKey, { auth: { persistSession: false } })
    .auth.signInWithPassword({ email, password: 'Teste@123' });
  if (error || !data.session) throw new Error(`login ${email}: ${error?.message}`);
  return data.session.access_token;
}

async function callFunc(token: string, name: string, body: Record<string, unknown>) {
  const res = await fetch(`${FUNC}/${name}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function pdfBytes(): Uint8Array {
  return new TextEncoder().encode('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
}

async function upload(bucket: string, path: string) {
  const { error } = await svc.storage.from(bucket).upload(path, pdfBytes(), {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new Error(`upload ${bucket}/${path}: ${error.message}`);
}

const PASS = Deno.env.get('SMOKE_PASS') ?? 'Teste@123';
const PKEY = process.env.PKEY || '';

console.log('[smoke] 1. Garantir buckets de storage');
const { data: buckets } = await svc.storage.listBuckets();
for (const b of ['comprovantes', 'contratos_pdf', 'documentos_alunos']) {
  const exists = buckets?.some((x) => x.id === b);
  if (exists) {
    check(`bucket ${b} existe`, true);
  } else {
    const { error } = await svc.storage.createBucket(b, { public: false, fileSizeLimit: 52428800 });
    check(`bucket ${b} criado`, !error, error?.message ?? '');
  }
}

console.log('[smoke] 2. Garantir curso e aluno de teste');
const CURS = '00000000-0000-0000-0000-000000000101';
const ALUNO = '00000000-0000-0000-0000-000000000102';
const { error: errCurso } = await svc.from('cursos').upsert({ id: CURS, nome: 'Curso Smoke Test', categoria: 'Cursos Livres', valor_comissao_fixo: 42.0 });
const { error: errAluno } = await svc.from('alunos').upsert({ id: ALUNO, nome: 'Aluno Smoke Test', cpf: '99999999999', email: 'aluno.smoke@teste.local', criado_por: '00000000-0000-0000-0000-000000000100' });
check('curso c-smoke', !errCurso, errCurso?.message ?? '');
check('aluno a-smoke', !errAluno, errAluno?.message ?? '');

console.log('[smoke] 3. VENDEDOR cria venda (PENDENTE_VALIDACAO)');
const vendedorToken = await signIn('vendedor@teste.local');
const { data: me } = await svc.from('perfis').select('id').eq('email', 'vendedor@teste.local').maybeSingle();
const vendedorId = me?.id as string;
await upload('comprovantes', `smoke/${vendedorId}/comprovante.pdf`);
const r1 = await callFunc(vendedorToken, 'vendas', {
  aluno_id: ALUNO, curso_id: CURS, valor_entrada: 150.0,
  data_inicio_curso: '2026-10-01', comprovante_storage_path: `smoke/${vendedorId}/comprovante.pdf`,
});
check('venda criada 201 + PENDENTE_VALIDACAO', r1.status === 201 && r1.json?.data?.status === 'PENDENTE_VALIDACAO', JSON.stringify(r1.json?.error ?? r1.json?.data));
const vendaId = r1.json?.data?.id as string;

console.log('[smoke] 4. SECRETARIA move para financeiro (trava: contrato no storage)');
const secToken = await signIn('secretaria@teste.local');
await upload('contratos_pdf', `smoke/${vendedorId}/contrato.pdf`);
const r2 = await callFunc(secToken, 'postvenda-mover', {
  venda_id: vendaId, acao: 'mover_para_financeiro', contrato_storage_path: `smoke/${vendedorId}/contrato.pdf`,
});
check('secretaria → AGUARDANDO_FINANCEIRO', r2.status === 200 && r2.json?.data?.status_novo === 'AGUARDANDO_FINANCEIRO', JSON.stringify(r2.json?.error ?? r2.json?.data));

console.log('[smoke] 5. Financeiro sem trava -> TRABVA_BLOQUEADA');
const finToken = await signIn('financeiro@teste.local');
const rNeg1 = await callFunc(finToken, 'postvenda-mover', { venda_id: vendaId, acao: 'emitir_boleto' });
check('emitir_boleto sem boleto_referencia -> 400 TRABVA_BLOQUEADA', rNeg1.status === 400 && rNeg1.json?.error?.code === 'TRABVA_BLOQUEADA', JSON.stringify(rNeg1.json?.error));

console.log('[smoke] 6. Papel errado (SECRETARIA tenta confirmar pgto) -> 401');
const rNeg2 = await callFunc(secToken, 'postvenda-mover', { venda_id: vendaId, acao: 'confirmar_pgto_1m', comprovante_pgto_1m_path: 'x' });
check('secretaria confirmar_pgto_1m -> 401', rNeg2.status === 401, JSON.stringify(rNeg2.json?.error));

console.log('[smoke] 7. FINANCEIRO emite boleto');
const r3 = await callFunc(finToken, 'postvenda-mover', { venda_id: vendaId, acao: 'emitir_boleto', boleto_referencia: 'BB-SMOKE-001' });
check('emitir_boleto → AGUARDANDO_PAGAMENTO_1M', r3.status === 200 && r3.json?.data?.status_novo === 'AGUARDANDO_PAGAMENTO_1M', JSON.stringify(r3.json?.error ?? r3.json?.data));

console.log('[smoke] 8. FINANCEIRO confirma pagamento com arquivo real');
await upload('comprovantes', `smoke/${vendedorId}/pgto-1m.pdf`);
const r4 = await callFunc(finToken, 'postvenda-mover', {
  venda_id: vendaId, acao: 'confirmar_pgto_1m', comprovante_pgto_1m_path: `smoke/${vendedorId}/pgto-1m.pdf`,
});
check('confirmar_pgto_1m → PRIMEIRA_MENSALIDADE_PAGA', r4.status === 200 && r4.json?.data?.status_novo === 'PRIMEIRA_MENSALIDADE_PAGA', JSON.stringify(r4.json?.error ?? r4.json?.data));

console.log('[smoke] 9. AUDITOR aprova (partida PRIMEIRA_MENSALIDADE_PAGA)');
const audToken = await signIn('auditor@teste.local');
const r5 = await callFunc(audToken, 'auditoria-aprovar', { venda_id: vendaId });
check('auditoria-aprovar → 200 APROVADA', r5.status === 200, JSON.stringify(r5.json?.error));

console.log('[smoke] 10. RLS: FINANCEIRO enxerga venda e comissão');
const finClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${finToken}` } } });
const { data: vFin, error: eFin } = await finClient.from('vendas').select('*').eq('id', vendaId).maybeSingle();
check('financeiro vê a venda (RLS)', !eFin && vFin?.status === 'APROVADA', eFin?.message ?? '');
const { data: cFin } = await finClient.from('comissoes').select('*').eq('venda_id', vendaId).maybeSingle();
check('financeiro vê a comissão', !!cFin, JSON.stringify(cFin));

console.log(`[smoke] Venda de teste: ${vendaId}`);
if (failures === 0) console.log('[smoke] RESULTADO: TUDO PASSOU');
else { console.log(`[smoke] RESULTADO: ${failures} falha(s)`); Deno.exit(1); }