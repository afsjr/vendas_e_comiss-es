// Agregação pura do consolidado de comissões por vendedor.
// Sem dependências: roda no cliente (Next) e nos testes Deno.

export interface ComissaoRow {
  vendedor_id: string;
  valor: number;
  status: string;
  data_liberacao: string | null;
}

export interface ConsolidadoLinha {
  vendedor_id: string;
  nome: string;
  qtd: number;
  aPagar: number;
  previsto: number;
  pago: number;
  estornada: number;
  total: number;
}

export type RotuloStatus = 'A pagar' | 'Previsto' | 'Pago' | 'Estornada' | '—';

export function rotuloStatus(status: string): RotuloStatus {
  switch (status) {
    case 'LIBERADA_PAGAMENTO':
      return 'A pagar';
    case 'AGUARDANDO_INICIO_AULAS':
    case 'BLOQUEADA_AUDITORIA':
      return 'Previsto';
    case 'PAGA':
      return 'Pago';
    case 'ESTORNADA':
      return 'Estornada';
    default:
      return '—';
  }
}

function somenteData(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function dentroDoPeriodo(
  dataLiberacao: string | null,
  de: string | null,
  ate: string | null,
): boolean {
  const dia = somenteData(dataLiberacao);
  if (!dia) return false;
  if (de && dia < de) return false;
  if (ate && dia > ate) return false;
  return true;
}

export function agregarPorVendedor(
  rows: ComissaoRow[],
  nomes: Record<string, string>,
  opts: { de?: string | null; ate?: string | null } = {},
): ConsolidadoLinha[] {
  const de = opts.de || null;
  const ate = opts.ate || null;
  const usaPeriodo = Boolean(de || ate);

  const map = new Map<string, ConsolidadoLinha>();

  for (const r of rows) {
    if (!r.vendedor_id) continue;
    if (usaPeriodo && !dentroDoPeriodo(r.data_liberacao, de, ate)) continue;

    const linha = map.get(r.vendedor_id) || {
      vendedor_id: r.vendedor_id,
      nome: nomes[r.vendedor_id] || r.vendedor_id,
      qtd: 0,
      aPagar: 0,
      previsto: 0,
      pago: 0,
      estornada: 0,
      total: 0,
    };

    const valor = Number(r.valor) || 0;
    linha.qtd += 1;

    switch (r.status) {
      case 'LIBERADA_PAGAMENTO':
        linha.aPagar += valor;
        break;
      case 'AGUARDANDO_INICIO_AULAS':
      case 'BLOQUEADA_AUDITORIA':
        linha.previsto += valor;
        break;
      case 'PAGA':
        linha.pago += valor;
        break;
      case 'ESTORNADA':
        linha.estornada += valor;
        break;
    }
    linha.total = linha.aPagar + linha.previsto + linha.pago + linha.estornada;

    map.set(r.vendedor_id, linha);
  }

  return Array.from(map.values()).sort(
    (a, b) => b.aPagar - a.aPagar || a.nome.localeCompare(b.nome),
  );
}

function moeda(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

export function buildConsolidadoCsv(linhas: ConsolidadoLinha[]): string {
  const cabecalho = 'Vendedor;A pagar;Previsto;Pago;Estornada;Total';
  const corpo = linhas.map((l) =>
    [l.nome, moeda(l.aPagar), moeda(l.previsto), moeda(l.pago), moeda(l.estornada), moeda(l.total)].join(';'),
  );
  return [cabecalho, ...corpo].join('\n');
}
