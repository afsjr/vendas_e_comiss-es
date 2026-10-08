import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") || "";
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!url || !serviceRole) {
  console.error("Faltam SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  Deno.exit(1);
}

const svc = createClient(url, serviceRole, { auth: { persistSession: false } });
const hoje = new Date().toISOString().slice(0, 10);

const [{ data: comissoes, error: cErr }, { data: perfis }] = await Promise.all([
  svc
    .from("comissoes")
    .select(
      "id, valor_comissao, status, data_liberacao, criado_em, atualizado_em, vendas(status, data_inicio_curso, criado_por, alunos(nome), cursos(nome, categoria))",
    ),
  svc.from("perfis").select("id, nome, email"),
]);

if (cErr) {
  console.error("Erro na consulta de comissoes:", cErr.message);
  Deno.exit(1);
}

const nomeVendedor: Record<string, string> = {};
(perfis || []).forEach((p: any) => {
  nomeVendedor[p.id] = p.nome || p.email || p.id;
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");

type Bucket = "A_bug_data" | "B_previsto_travado" | "C_previsto_futuro" | "OK" | "OUTRO";

const linhas = (comissoes || []).map((c: any) => {
  const venda = c.vendas || {};
  const categoria = venda.cursos?.categoria || "—";
  const vencida = Boolean(venda.data_inicio_curso) && String(venda.data_inicio_curso) <= hoje;
  const vendaPaga1m = venda.status === "PRIMEIRA_MENSALIDADE_PAGA";

  let bucket: Bucket;
  if ((c.status === "LIBERADA_PAGAMENTO" || c.status === "PAGA") && !c.data_liberacao) {
    bucket = "A_bug_data";
  } else if (c.status === "AGUARDANDO_INICIO_AULAS" && vencida && !vendaPaga1m) {
    bucket = "B_previsto_travado";
  } else if (c.status === "AGUARDANDO_INICIO_AULAS" && !vencida) {
    bucket = "C_previsto_futuro";
  } else if (c.status === "AGUARDANDO_INICIO_AULAS" && vencida && vendaPaga1m) {
    bucket = "OUTRO";
  } else {
    bucket = "OK";
  }

  return {
    bucket,
    aluno: venda.alunos?.nome || "—",
    curso: venda.cursos?.nome || "—",
    categoria,
    vendedor: nomeVendedor[venda.criado_por] || venda.criado_por || "—",
    valor: Number(c.valor_comissao) || 0,
    statusComissao: c.status,
    statusVenda: venda.status || "—",
    inicioCurso: dia(venda.data_inicio_curso),
    liberacao: dia(c.data_liberacao),
  };
});

const ordem: Bucket[] = ["A_bug_data", "B_previsto_travado", "OUTRO", "C_previsto_futuro", "OK"];
const titulos: Record<Bucket, string> = {
  A_bug_data: "A) BUG DE DATA — A pagar/Pago sem data_liberacao",
  B_previsto_travado: "B) PREVISTO TRAVADO — curso ja iniciou, 1a mensalidade nao confirmada",
  OUTRO: "OUTRO — previsto vencido com venda paga 1m (cron pode nao ter rodado)",
  C_previsto_futuro: "C) PREVISTO — curso ainda nao iniciou (correto)",
  OK: "OK — demais situacoes",
};

console.log(`\nDiagnostico de comissoes — ${new Date().toISOString()}`);
console.log(`Total de comissoes: ${linhas.length}\n`);

for (const b of ordem) {
  const grupo = linhas.filter((l) => l.bucket === b);
  if (grupo.length === 0) continue;
  const total = grupo.reduce((acc, l) => acc + l.valor, 0);
  console.log(`## ${titulos[b]}  (${grupo.length} | ${brl(total)})`);
  for (const l of grupo) {
    console.log(
      `  - ${l.aluno} | ${l.curso} (${l.categoria}) | ${brl(l.valor)} | venda=${l.statusVenda} | comissao=${l.statusComissao} | inicio=${l.inicioCurso} | liberacao=${l.liberacao} | vendedor=${l.vendedor}`,
    );
  }
  console.log("");
}
