// Agregação pura do painel de comissões por vendedor (feature 010).
// Sem dependências: roda no cliente (Next) e nos testes Deno,
// no mesmo padrão de src/lib/consolidado.ts.

export interface ComissaoPagamentoRow {
  id: string;
  vendedor_id: string;
  curso_nome: string;
  valor: number;
  status: string; // status_comissao_enum
  data_liberacao: string | null;
  data_venda: string | null;
  data_inicio_curso: string | null;
  data_pagamento: string | null;
}

export type SituacaoFiltro = 'TODAS' | 'A_PAGAR' | 'PAGAS';

export interface TotaisVendedor {
  vendedor_id: string;
  nome: string;
  qtd: number;
  aPagar: number;
  pago: number;
  total: number;
}

export type RotuloSituacao =
  | 'A pagar'
  | 'Paga'
  | 'Bloqueada'
  | 'Aguardando início'
  | 'Estornada'
  | '—';

const PAPEIS_PAGAMENTO = ['GESTOR', 'AUDITOR', 'FINANCEIRO'];

export function podeOperarComissoes(role: string | null | undefined): boolean {
  return !!role && PAPEIS_PAGAMENTO.includes(role);
}

export function rotuloSituacao(status: string): RotuloSituacao {
  switch (status) {
    case 'LIBERADA_PAGAMENTO':
      return 'A pagar';
    case 'PAGA':
      return 'Paga';
    case 'BLOQUEADA_AUDITORIA':
      return 'Bloqueada';
    case 'AGUARDANDO_INICIO_AULAS':
      return 'Aguardando início';
    case 'ESTORNADA':
      return 'Estornada';
    default:
      return '—';
  }
}

export function ehAPagar(status: string): boolean {
  return status === 'LIBERADA_PAGAMENTO';
}

export function ehPaga(status: string): boolean {
  return status === 'PAGA';
}

export function semDataInicio(row: Pick<ComissaoPagamentoRow, 'data_inicio_curso'>): boolean {
  return !row.data_inicio_curso;
}

export function somenteData(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function dentroDoPeriodo(data: string | null, de: string | null, ate: string | null): boolean {
  const dia = somenteData(data);
  if (!dia) return false;
  if (de && dia < de) return false;
  if (ate && dia > ate) return false;
  return true;
}

// Data de referência do recorte: usa a data de pagamento quando a comissão
// já foi paga e a data de liberação nos demais casos.
export function dataReferencia(row: ComissaoPagamentoRow): string | null {
  if (row.status === 'PAGA' && row.data_pagamento) return row.data_pagamento;
  return row.data_liberacao;
}

// Retorna o intervalo do mês de referência (padrão: mês corrente) no formato
// de datas ISO (YYYY-MM-DD), adequado ao filtro de período.
export function mesIntervalo(ref: Date = new Date()): { de: string; ate: string } {
  const ano = ref.getUTCFullYear();
  const mes = ref.getUTCMonth(); // 0-11
  const de = new Date(Date.UTC(ano, mes, 1));
  const ate = new Date(Date.UTC(ano, mes + 1, 0));
  return { de: de.toISOString().slice(0, 10), ate: ate.toISOString().slice(0, 10) };
}

// Regra do fechamento: a partir do dia 22 o fechamento está iminente.
// O dia é lido em America/Sao_Paulo (UTC-3).
export const DIA_FECHAMENTO = 22;

export function diaSaoPaulo(ref: Date = new Date()): number {
  const sp = new Date(ref.getTime() - 3 * 60 * 60 * 1000);
  return sp.getUTCDate();
}

export function alertaFechamento(ref: Date = new Date()): { ativo: boolean; dia: number } {
  const dia = diaSaoPaulo(ref);
  return { ativo: dia >= DIA_FECHAMENTO, dia };
}

export interface FiltroOpcoes {
  de?: string | null;
  ate?: string | null;
  situacao?: SituacaoFiltro;
  vendedorId?: string | null;
}

export function filtrarComissoes(
  rows: ComissaoPagamentoRow[],
  opts: FiltroOpcoes = {},
): ComissaoPagamentoRow[] {
  const de = opts.de || null;
  const ate = opts.ate || null;
  const usaPeriodo = Boolean(de || ate);
  const situacao: SituacaoFiltro = opts.situacao || 'TODAS';
  const vendedorId = opts.vendedorId || null;

  return rows.filter((r) => {
    if (vendedorId && r.vendedor_id !== vendedorId) return false;
    if (situacao === 'A_PAGAR' && !ehAPagar(r.status)) return false;
    if (situacao === 'PAGAS' && !ehPaga(r.status)) return false;
    if (usaPeriodo && !dentroDoPeriodo(dataReferencia(r), de, ate)) return false;
    return true;
  });
}

export function agruparPorVendedor(
  rows: ComissaoPagamentoRow[],
  nomes: Record<string, string> = {},
): TotaisVendedor[] {
  const map = new Map<string, TotaisVendedor>();
  for (const r of rows) {
    if (!r.vendedor_id) continue;
    const linha = map.get(r.vendedor_id) || {
      vendedor_id: r.vendedor_id,
      nome: nomes[r.vendedor_id] || r.vendedor_id,
      qtd: 0,
      aPagar: 0,
      pago: 0,
      total: 0,
    };
    const valor = Number(r.valor) || 0;
    linha.qtd += 1;
    if (ehAPagar(r.status)) linha.aPagar += valor;
    if (ehPaga(r.status)) linha.pago += valor;
    linha.total = linha.aPagar + linha.pago;
    map.set(r.vendedor_id, linha);
  }
  return Array.from(map.values()).sort(
    (a, b) => b.aPagar - a.aPagar || a.nome.localeCompare(b.nome),
  );
}

export function totaisGerais(rows: ComissaoPagamentoRow[]): { aPagar: number; pago: number; qtd: number } {
  let aPagar = 0;
  let pago = 0;
  let qtd = 0;
  for (const r of rows) {
    const valor = Number(r.valor) || 0;
    qtd += 1;
    if (ehAPagar(r.status)) aPagar += valor;
    if (ehPaga(r.status)) pago += valor;
  }
  return { aPagar, pago, qtd };
}
