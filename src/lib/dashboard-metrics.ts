// Agregações puras do dashboard (funil, volume e comparativos).
// Sem dependências: roda no cliente (Next) e nos testes Deno.

export const ROTULO_ETAPA: Record<string, string> = {
  PENDENTE_VALIDACAO: 'Pendente de validação',
  APROVADA: 'Aprovada (contrato)',
  DEVOLVIDA_AJUSTE: 'Devolvida ao vendedor',
  AGUARDANDO_FINANCEIRO: 'Aguardando financeiro',
  AGUARDANDO_PAGAMENTO_1M: 'Aguardando 1ª mensalidade',
  PRIMEIRA_MENSALIDADE_PAGA: '1ª mensalidade paga',
  CANCELADA: 'Cancelada',
};

export const ORDEM_ETAPAS: string[] = [
  'PENDENTE_VALIDACAO',
  'APROVADA',
  'DEVOLVIDA_AJUSTE',
  'AGUARDANDO_FINANCEIRO',
  'AGUARDANDO_PAGAMENTO_1M',
  'PRIMEIRA_MENSALIDADE_PAGA',
  'CANCELADA',
];

export const APROVADAS: string[] = [
  'APROVADA',
  'AGUARDANDO_FINANCEIRO',
  'AGUARDANDO_PAGAMENTO_1M',
  'PRIMEIRA_MENSALIDADE_PAGA',
];

export const CATEGORIAS: string[] = ['Técnico', 'Graduação', 'Pós-Graduação', 'Cursos Livres'];

export const FATOR_REPASSE: Record<string, number> = {
  Técnico: 1.0,
  'Cursos Livres': 1.0,
  Graduação: 0.36,
};

export interface VendaRow {
  id: string;
  valor_entrada: number | string;
  status: string;
  criado_por: string;
  criado_em: string;
  cursos?: { nome?: string | null; categoria?: string | null } | null;
  alunos?: { nome?: string | null } | null;
}

export interface ComissaoRow {
  valor_comissao: number | string;
  status: string;
  venda_id?: string | null;
  data_liberacao?: string | null;
  criado_em?: string | null;
}

export interface Periodo {
  de: string | null;
  ate: string | null;
}

export type PresetPeriodo = 'mes-atual' | 'mes-anterior' | 'tudo';

export function formatBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function num(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function resolverPeriodo(preset: PresetPeriodo, agora: Date = new Date()): Periodo {
  if (preset === 'tudo') return { de: null, ate: null };
  const offset = preset === 'mes-anterior' ? -1 : 0;
  const base = new Date(agora.getFullYear(), agora.getMonth() + offset, 1);
  const fim = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { de: ymd(base), ate: ymd(fim) };
}

export function periodoAtivo(periodo: Periodo | null | undefined): boolean {
  return Boolean(periodo && (periodo.de || periodo.ate));
}

export function dentroDoPeriodo(iso: string | null | undefined, periodo: Periodo | null | undefined): boolean {
  if (!periodoAtivo(periodo)) return true;
  const dia = iso ? iso.slice(0, 10) : null;
  if (!dia) return false;
  if (periodo!.de && dia < periodo!.de) return false;
  if (periodo!.ate && dia > periodo!.ate) return false;
  return true;
}

export function repassePrevisto(v: VendaRow): number {
  const fator = FATOR_REPASSE[v?.cursos?.categoria || ''];
  if (!fator) return 0;
  return num(v.valor_entrada) * fator;
}

export interface FunilEtapa {
  etapa: string;
  quantidade: number;
  valor: number;
}

export function agruparFunil(vendas: VendaRow[], periodo?: Periodo | null): FunilEtapa[] {
  const acc = new Map<string, FunilEtapa>();
  for (const etapa of ORDEM_ETAPAS) acc.set(etapa, { etapa, quantidade: 0, valor: 0 });

  for (const v of vendas) {
    if (!dentroDoPeriodo(v.criado_em, periodo)) continue;
    const linha = acc.get(v.status);
    if (!linha) continue;
    linha.quantidade += 1;
    linha.valor += num(v.valor_entrada);
  }

  return ORDEM_ETAPAS.map((etapa) => acc.get(etapa)!);
}

export interface VolumeResumo {
  entradas: number;
  entradasValidadas: number;
  comissoes: number;
  repasse: number;
  pendentes: number;
  aprovadas: number;
}

function filtrarVendas(vendas: VendaRow[], periodo?: Periodo | null): VendaRow[] {
  return vendas.filter((v) => dentroDoPeriodo(v.criado_em, periodo));
}

export function volumeAcumulado(
  vendas: VendaRow[],
  comissoes: ComissaoRow[],
  periodo?: Periodo | null,
): VolumeResumo {
  const incluidas = filtrarVendas(vendas, periodo);
  const ids = new Set(incluidas.map((v) => v.id));

  let entradas = 0;
  let entradasValidadas = 0;
  let repasse = 0;
  let pendentes = 0;
  let aprovadas = 0;

  for (const v of incluidas) {
    const valor = num(v.valor_entrada);
    if (v.status !== 'CANCELADA') {
      entradas += valor;
      repasse += repassePrevisto(v);
    }
    if (APROVADAS.includes(v.status)) entradasValidadas += valor;
    if (v.status === 'PENDENTE_VALIDACAO') pendentes += 1;
    if (v.status === 'APROVADA') aprovadas += 1;
  }

  let totalComissoes = 0;
  for (const c of comissoes) {
    if (c.status === 'ESTORNADA') continue;
    if (!c.venda_id || !ids.has(c.venda_id)) continue;
    totalComissoes += num(c.valor_comissao);
  }

  return { entradas, entradasValidadas, comissoes: totalComissoes, repasse, pendentes, aprovadas };
}

export interface CategoriaSlice {
  categoria: string;
  quantidade: number;
  valor: number;
  percentual: number;
}

export function agruparPorCategoria(vendas: VendaRow[], periodo?: Periodo | null): CategoriaSlice[] {
  const map = new Map<string, CategoriaSlice>();
  let total = 0;

  for (const v of filtrarVendas(vendas, periodo)) {
    if (v.status === 'CANCELADA') continue;
    const categoria = v.cursos?.categoria || '—';
    const linha = map.get(categoria) || { categoria, quantidade: 0, valor: 0, percentual: 0 };
    linha.quantidade += 1;
    linha.valor += num(v.valor_entrada);
    total += num(v.valor_entrada);
    map.set(categoria, linha);
  }

  return Array.from(map.values())
    .map((l) => ({ ...l, percentual: total ? l.valor / total : 0 }))
    .sort((a, b) => b.valor - a.valor);
}

export interface ComparativoLinha {
  vendedor_id: string;
  nome: string;
  quantidade: number;
  valor: number;
  aprovadas: number;
  repasse: number;
}

export interface VendedorRef {
  id: string;
  nome?: string | null;
}

export function comparativoPorVendedor(
  vendas: VendaRow[],
  nomes: Record<string, string>,
  periodo?: Periodo | null,
  vendedores: VendedorRef[] = [],
): ComparativoLinha[] {
  const map = new Map<string, ComparativoLinha>();

  // Semeia todos os vendedores informados para que apareçam mesmo sem venda no
  // período (BUG-20261005-CJOB).
  const seed = (id: string, nome?: string | null) => {
    if (!id || map.has(id)) return;
    map.set(id, {
      vendedor_id: id,
      nome: nomes[id] || nome || id,
      quantidade: 0,
      valor: 0,
      aprovadas: 0,
      repasse: 0,
    });
  };

  for (const vend of vendedores) seed(vend.id, vend.nome);

  for (const v of filtrarVendas(vendas, periodo)) {
    if (v.status === 'CANCELADA') continue;
    const id = v.criado_por;
    if (!id) continue;
    if (!map.has(id)) seed(id);
    const linha = map.get(id)!;
    linha.quantidade += 1;
    linha.valor += num(v.valor_entrada);
    if (APROVADAS.includes(v.status)) linha.aprovadas += 1;
    linha.repasse += repassePrevisto(v);
  }

  return Array.from(map.values()).sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome));
}
