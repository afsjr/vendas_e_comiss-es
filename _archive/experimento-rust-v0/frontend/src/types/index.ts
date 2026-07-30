export type AppRole = 'VENDEDOR' | 'SECRETARIA' | 'AUDITOR' | 'GESTOR';
export type StatusVenda = 'PENDENTE_VALIDACAO' | 'DEVOLVIDA_AJUSTE' | 'APROVADA' | 'CANCELADA_ESTORNADA';
export type StatusComissao = 'BLOQUEADA_AUDITORIA' | 'AGUARDANDO_INICIO_AULAS' | 'LIBERADA_PAGAMENTO' | 'PAGA' | 'ESTORNADA';

export interface Curso {
  id: string;
  nome: string;
  categoria: string;
  valor_curso: number;
  valor_comissao_fixo: number;
  data_inicio_curso: string;
}

export interface Venda {
  id: string;
  aluno_id: string;
  curso_id: string;
  valor_entrada: number;
  status_venda: StatusVenda;
  criado_em: string;
}

export interface VendaDetalhada extends Venda {
  aluno_nome: string;
  curso_nome: string;
}

export interface Comissao {
  venda_id: string;
  curso_nome: string;
  valor_comissao: number;
  status_comissao: StatusComissao;
  data_liberacao: string | null;
}

export interface DashboardKpi {
  titulo: string;
  valor: string;
  variacao: string;
}
