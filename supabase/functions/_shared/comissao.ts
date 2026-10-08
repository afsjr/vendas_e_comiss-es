export type StatusLiberacaoComissao = 'LIBERADA_PAGAMENTO' | 'AGUARDANDO_INICIO_AULAS';

export interface LiberacaoComissao {
  status: StatusLiberacaoComissao;
  data_liberacao: string | null;
}

export function avaliarLiberacaoComissao(
  dataInicioCurso: string | Date,
  agora: Date = new Date(),
): LiberacaoComissao {
  const inicio = dataInicioCurso instanceof Date ? dataInicioCurso : new Date(String(dataInicioCurso));
  if (inicio <= agora) {
    return { status: 'LIBERADA_PAGAMENTO', data_liberacao: agora.toISOString() };
  }
  return { status: 'AGUARDANDO_INICIO_AULAS', data_liberacao: null };
}
