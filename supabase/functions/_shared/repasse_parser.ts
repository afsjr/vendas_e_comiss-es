// Parser e regras puras da pré-auditoria de repasses de Graduação.
// Sem dependências externas: roda no runtime Deno das Edge Functions e nos testes.

export interface RepasseLinha {
  cpf: string;
  parcela: number | null;
  operacao: string;
  competencia: string;
  valorDocumento: number;
  valorRepasse: number;
  tipoDocumento: string;
  dataCompensacao: string | null;
}

export interface ResultadoConciliacao {
  resultado: 'APARECEU' | 'NAO_APARECEU' | 'AMBIGUO';
  competenciaInicio: string | null;
  valorRepasse: number | null;
}

const MESES: Record<string, string> = {
  JANEIRO: '01', FEVEREIRO: '02', MARCO: '03', ABRIL: '04', MAIO: '05', JUNHO: '06',
  JULHO: '07', AGOSTO: '08', SETEMBRO: '09', OUTUBRO: '10', NOVEMBRO: '11', DEZEMBRO: '12',
};

export function decodeLatin1(bytes: Uint8Array): string {
  let start = 0;
  // Remove o BOM UTF-8 (EF BB BF) antes de decodificar como Latin-1.
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) start = 3;
  let out = '';
  for (let i = start; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  // Defensivo: remove BOM já decodificado, se houver.
  return out.replace(/^\uFEFF/, '').replace(/^ï»¿/, '');
}

export function normalizeToken(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function parseValorBR(value: string): number {
  if (!value) return 0;
  const cleaned = value
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function parseParcela(value: string): number | null {
  const n = parseInt((value || '').trim(), 10);
  return Number.isFinite(n) ? n : null;
}

// "SETEMBRO/2026" -> "SETEMBRO/2026" (normalizado em maiúsculas)
export function normalizeCompetencia(value: string): string {
  return (value || '').trim().toUpperCase();
}

// "SETEMBRO/2026" -> 202609, para eventual ordenação. Retorna 0 se inválido.
export function competenciaOrdenavel(value: string): number {
  const [mes, ano] = normalizeCompetencia(value).split('/');
  const mm = MESES[mes || ''];
  if (!mm || !ano || !/^\d{4}$/.test(ano)) return 0;
  return Number(`${ano}${mm}`);
}

const REQUIRED_COLUMNS = [
  'cpf aluno',
  'mensalidade',
  'operacao principal',
  'data competencia',
  'valor documento',
  'valor_repasse',
  'tipo documento',
  'dt compensacao',
] as const;

type ColumnIndex = Record<(typeof REQUIRED_COLUMNS)[number], number>;

function indexarHeader(cells: string[]): ColumnIndex | null {
  const normalized = cells.map(normalizeToken);
  const idx = {} as ColumnIndex;
  for (const col of REQUIRED_COLUMNS) {
    const found = normalized.indexOf(col);
    if (found < 0) return null;
    idx[col] = found;
  }
  return idx;
}

/**
 * Lê o CSV do relatório de repasses (delimitador ';', cabeçalho repetido a cada
 * página, valores pt-BR, competência em português). Tolera linhas malformadas.
 * Retorna as linhas com CPF válido.
 */
export function parseRepasseCsv(content: string): { linhas: RepasseLinha[]; totalLinhas: number } {
  const linhas: RepasseLinha[] = [];
  let totalLinhas = 0;
  let columns: ColumnIndex | null = null;

  for (const raw of content.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const cells = raw.split(';');

    if (normalizeToken(cells[0] || '') === 'bp polo') {
      columns = indexarHeader(cells);
      continue;
    }

    totalLinhas += 1;
    if (!columns) continue;

    const cpf = (cells[columns['cpf aluno']] || '').replace(/\D/g, '');
    if (cpf.length !== 11) continue;

    linhas.push({
      cpf,
      parcela: parseParcela(cells[columns['mensalidade']] || ''),
      operacao: (cells[columns['operacao principal']] || '').trim().toUpperCase(),
      competencia: normalizeCompetencia(cells[columns['data competencia']] || ''),
      valorDocumento: parseValorBR(cells[columns['valor documento']] || ''),
      valorRepasse: parseValorBR(cells[columns['valor_repasse']] || ''),
      tipoDocumento: (cells[columns['tipo documento']] || '').trim(),
      dataCompensacao: (cells[columns['dt compensacao']] || '').trim() || null,
    });
  }

  return { linhas, totalLinhas };
}

/**
 * Regras de conciliação (RN-04, RN-09):
 * - mais de uma venda de Graduação para o mesmo CPF => AMBIGUO;
 * - 1ª mensalidade = linha R101 com parcela 1 e Valor_Repasse > 0 => APARECEU;
 * - caso contrário => NAO_APARECEU.
 */
export function resultadoConciliacao(
  linhasDoCpf: RepasseLinha[],
  quantidadeVendas: number,
): ResultadoConciliacao {
  if (quantidadeVendas > 1) {
    return { resultado: 'AMBIGUO', competenciaInicio: null, valorRepasse: null };
  }

  const parcela1 = linhasDoCpf.find(
    (l) => l.operacao === 'R101' && l.parcela === 1 && l.valorRepasse > 0,
  );

  if (parcela1) {
    return {
      resultado: 'APARECEU',
      competenciaInicio: parcela1.competencia || null,
      valorRepasse: parcela1.valorRepasse,
    };
  }

  return { resultado: 'NAO_APARECEU', competenciaInicio: null, valorRepasse: null };
}

/** Soma de Valor_Repasse por CPF (para o resumo por aluno). */
export function resumoPorCpf(linhas: RepasseLinha[]): Map<string, { total: number; linhas: RepasseLinha[] }> {
  const map = new Map<string, { total: number; linhas: RepasseLinha[] }>();
  for (const l of linhas) {
    const atual = map.get(l.cpf) || { total: 0, linhas: [] };
    atual.total += l.valorRepasse;
    atual.linhas.push(l);
    map.set(l.cpf, atual);
  }
  return map;
}
