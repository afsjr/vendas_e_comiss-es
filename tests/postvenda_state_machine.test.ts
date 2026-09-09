import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";

type StatusVenda =
  | 'PENDENTE_VALIDACAO'
  | 'APROVADA'
  | 'DEVOLVIDA_AJUSTE'
  | 'AGUARDANDO_FINANCEIRO'
  | 'AGUARDANDO_PAGAMENTO_1M'
  | 'PRIMEIRA_MENSALIDADE_PAGA'
  | 'CANCELADA';

type AcaoPostVenda =
  | 'mover_para_financeiro'
  | 'devolver_vendedor'
  | 'cancelar'
  | 'emitir_boleto'
  | 'devolver_secretaria'
  | 'confirmar_pgto_1m';

interface MoverInput {
  papel: string;
  acao: AcaoPostVenda;
  status_atual: StatusVenda;
  contrato_storage_path: string | null;
  boleto_referencia: string | null;
  comprovante_pgto_1m_path: string | null;
  motivo: string | null;
}

interface MoverResult {
  success: boolean;
  status_novo?: StatusVenda;
  comissao?: string;
  motivo_registrado?: string | null;
  code?: string;
}

// Porta pura da Edge Function `postvenda-mover` (matriz de transições por papel
// + travas RN-03/RF-05). O edge replica esta lógica com SERVICE_ROLE_KEY.
export function mover({ papel, acao, status_atual, ...campos }: MoverInput): MoverResult {
  const transicoes: Array<{
    acao: AcaoPostVenda;
    papel: string;
    origem: StatusVenda;
    destino: StatusVenda;
    trava?: { campo: string; valor: string | null; mensagem: string };
    comissao?: string;
  }> = [
    {
      acao: 'mover_para_financeiro',
      papel: 'SECRETARIA',
      origem: 'PENDENTE_VALIDACAO',
      destino: 'AGUARDANDO_FINANCEIRO',
      trava: { campo: 'contrato_storage_path', valor: campos.contrato_storage_path, mensagem: 'Contrato obrigatório antes de mover ao Financeiro' },
    },
    {
      acao: 'devolver_vendedor',
      papel: 'SECRETARIA',
      origem: 'PENDENTE_VALIDACAO',
      destino: 'DEVOLVIDA_AJUSTE',
      trava: { campo: 'motivo', valor: campos.motivo && campos.motivo.length >= 10 ? campos.motivo : null, mensagem: 'Motivo obrigatório com >= 10 caracteres' },
    },
    {
      acao: 'cancelar',
      papel: 'SECRETARIA',
      origem: 'PENDENTE_VALIDACAO',
      destino: 'CANCELADA',
      trava: { campo: 'motivo', valor: campos.motivo && campos.motivo.length > 0 ? campos.motivo : null, mensagem: 'Motivo obrigatório para cancelamento' },
      comissao: 'ESTORNADA',
    },
    {
      acao: 'emitir_boleto',
      papel: 'FINANCEIRO',
      origem: 'AGUARDANDO_FINANCEIRO',
      destino: 'AGUARDANDO_PAGAMENTO_1M',
      trava: { campo: 'boleto_referencia', valor: campos.boleto_referencia, mensagem: 'Referência do boleto obrigatória' },
    },
    {
      acao: 'devolver_secretaria',
      papel: 'FINANCEIRO',
      origem: 'AGUARDANDO_FINANCEIRO',
      destino: 'PENDENTE_VALIDACAO',
      trava: { campo: 'motivo', valor: campos.motivo && campos.motivo.length >= 10 ? campos.motivo : null, mensagem: 'Motivo obrigatório com >= 10 caracteres' },
    },
    {
      acao: 'confirmar_pgto_1m',
      papel: 'FINANCEIRO',
      origem: 'AGUARDANDO_PAGAMENTO_1M',
      destino: 'PRIMEIRA_MENSALIDADE_PAGA',
      trava: { campo: 'comprovante_pgto_1m_path', valor: campos.comprovante_pgto_1m_path, mensagem: 'Comprovante da 1ª mensalidade obrigatório' },
    },
  ];

  const transicao = transicoes.find(t => t.acao === acao);

  if (!transicao) {
    return { success: false, code: 'INVALID_TRANSITION' };
  }
  if (transicao.papel !== papel) {
    return { success: false, code: 'UNAUTHORIZED' };
  }
  if (transicao.origem !== status_atual) {
    return { success: false, code: 'INVALID_STATE' };
  }
  if (transicao.trava && !transicao.trava.valor) {
    return { success: false, code: 'TRABVA_BLOQUEADA' };
  }

  return {
    success: true,
    status_novo: transicao.destino,
    comissao: transicao.comissao,
    motivo_registrado: transicao.trava?.campo === 'motivo' ? campos.motivo : null,
  };
}

function base(papel: string, acao: AcaoPostVenda, status_atual: StatusVenda): MoverInput {
  return {
    papel,
    acao,
    status_atual,
    contrato_storage_path: null,
    boleto_referencia: null,
    comprovante_pgto_1m_path: null,
    motivo: null,
  };
}

Deno.test("postvenda: SECRETARIA move PENDENTE_VALIDACAO -> AGUARDANDO_FINANCEIRO com contrato", () => {
  const r = mover({ ...base('SECRETARIA', 'mover_para_financeiro', 'PENDENTE_VALIDACAO'), contrato_storage_path: 'contrato.pdf' });
  assertEquals(r.success, true);
  assertEquals(r.status_novo, 'AGUARDANDO_FINANCEIRO');
});

Deno.test("postvenda: mover sem contrato falha com TRABVA_BLOQUEADA", () => {
  const r = mover(base('SECRETARIA', 'mover_para_financeiro', 'PENDENTE_VALIDACAO'));
  assertEquals(r.success, false);
  assertEquals(r.code, 'TRABVA_BLOQUEADA');
});

Deno.test("postvenda: FINANCEIRO emite boleto com referencia", () => {
  const r = mover({ ...base('FINANCEIRO', 'emitir_boleto', 'AGUARDANDO_FINANCEIRO'), boleto_referencia: 'BOLETO-2026-09-0001' });
  assertEquals(r.success, true);
  assertEquals(r.status_novo, 'AGUARDANDO_PAGAMENTO_1M');
});

Deno.test("postvenda: emitir_boleto sem referencia falha", () => {
  const r = mover(base('FINANCEIRO', 'emitir_boleto', 'AGUARDANDO_FINANCEIRO'));
  assertEquals(r.code, 'TRABVA_BLOQUEADA');
});

Deno.test("postvenda: confirmar_pgto_1m com comprovante", () => {
  const r = mover({ ...base('FINANCEIRO', 'confirmar_pgto_1m', 'AGUARDANDO_PAGAMENTO_1M'), comprovante_pgto_1m_path: 'sub/123/comprovante.jpeg' });
  assertEquals(r.success, true);
  assertEquals(r.status_novo, 'PRIMEIRA_MENSALIDADE_PAGA');
});

Deno.test("postvenda: confirmar_pgto_1m sem comprovante falha", () => {
  const r = mover(base('FINANCEIRO', 'confirmar_pgto_1m', 'AGUARDANDO_PAGAMENTO_1M'));
  assertEquals(r.code, 'TRABVA_BLOQUEADA');
});

Deno.test("postvenda: cancelar gera CANCELADA e comissao ESTORNADA", () => {
  const r = mover({ ...base('SECRETARIA', 'cancelar', 'PENDENTE_VALIDACAO'), motivo: 'Desistência do aluno' });
  assertEquals(r.success, true);
  assertEquals(r.status_novo, 'CANCELADA');
  assertEquals(r.comissao, 'ESTORNADA');
});

Deno.test("postvenda: cancelar sem motivo falha", () => {
  const r = mover(base('SECRETARIA', 'cancelar', 'PENDENTE_VALIDACAO'));
  assertEquals(r.code, 'TRABVA_BLOQUEADA');
});

Deno.test("postvenda: devolver_vendedor exige motivo >= 10", () => {
  const curto = mover({ ...base('SECRETARIA', 'devolver_vendedor', 'PENDENTE_VALIDACAO'), motivo: 'curto' });
  const valido = mover({ ...base('SECRETARIA', 'devolver_vendedor', 'PENDENTE_VALIDACAO'), motivo: 'Documentação incompleta do aluno' });
  assertEquals(curto.code, 'TRABVA_BLOQUEADA');
  assertEquals(valido.success, true);
  assertEquals(valido.status_novo, 'DEVOLVIDA_AJUSTE');
  assertEquals(valido.motivo_registrado, 'Documentação incompleta do aluno');
});

Deno.test("postvenda: FINANCEIRO devolve a Secretaria (RN-04) com motivo registrado", () => {
  const r = mover({ ...base('FINANCEIRO', 'devolver_secretaria', 'AGUARDANDO_FINANCEIRO'), motivo: 'Contrato assinado de forma incorreta' });
  assertEquals(r.success, true);
  assertEquals(r.status_novo, 'PENDENTE_VALIDACAO');
  assertEquals(r.motivo_registrado, 'Contrato assinado de forma incorreta');
});

Deno.test("postvenda: papel errado para a acao -> UNAUTHORIZED", () => {
  const r = mover({ ...base('SECRETARIA', 'emitir_boleto', 'AGUARDANDO_FINANCEIRO'), boleto_referencia: 'X' });
  assertEquals(r.code, 'UNAUTHORIZED');
});

Deno.test("postvenda: acao desconhecida -> INVALID_TRANSITION", () => {
  const r = mover(base('SECRETARIA', 'cancelar', 'PENDENTE_VALIDACAO'));
  // cancelar é validade; usamos ação inexistente como contraprova de cobertura:
  const r2 = mover({ ...base('SECRETARIA', 'mover_para_financeiro', 'PENDENTE_VALIDACAO'), contrato_storage_path: 'c.pdf', acao: undefined } as any);
  assertEquals(r2.code, 'INVALID_TRANSITION');
});

Deno.test("postvenda: status atual fora da matriz -> INVALID_STATE", () => {
  const r = mover({ ...base('SECRETARIA', 'mover_para_financeiro', 'AGUARDANDO_FINANCEIRO'), contrato_storage_path: 'c.pdf' });
  assertEquals(r.code, 'INVALID_STATE');
});