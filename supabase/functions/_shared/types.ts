export type StatusVenda = 
  | 'PENDENTE_VALIDACAO'
  | 'APROVADA'
  | 'DEVOLVIDA_AJUSTE';

export type StatusComissao = 
  | 'AGUARDANDO_INICIO_AULAS'
  | 'LIBERADA_PAGAMENTO'
  | 'PAGA'
  | 'BLOQUEADA_AUDITORIA'
  | 'ESTORNADA';

export type UserRole = 
  | 'VENDEDOR'
  | 'SECRETARIA'
  | 'AUDITOR'
  | 'GESTOR';

export type LancamentoTipo = 'CRÉDITO' | 'DÉBITO';

export interface Venda {
  id: string;
  aluno_id: string;
  curso_id: string;
  valor_entrada: number;
  status: StatusVenda;
  data_inicio_curso: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Comissao {
  id: string;
  venda_id: string;
  valor_comissao: number;
  status: StatusComissao;
  data_liberacao: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  rg: string | null;
  email: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Curso {
  id: string;
  nome: string;
  categoria: 'Técnico' | 'Graduação' | 'Pós-Graduação' | 'Cursos Livres';
  valor_comissao_fixo: number;
  criado_em: string;
  atualizado_em: string;
}

export interface EvidenciaVenda {
  id: string;
  venda_id: string;
  comprovante_storage_path: string;
  sha256_checksum: string;
  criado_em: string;
}

export interface VendaHistoricoStatus {
  id: string;
  venda_id: string;
  status_anterior: StatusVenda;
  status_novo: StatusVenda;
  motivo: string | null;
  mudado_por: string;
  mudado_em: string;
}

export interface LivroCaixaLancamento {
  id: string;
  comissao_id: string;
  tipo: LancamentoTipo;
  valor_credito: number | null;
  valor_debito: number | null;
  descricao: string | null;
  criado_em: string;
}

export interface CreateVendaRequest {
  aluno_id: string;
  curso_id: string;
  valor_entrada: number;
  data_inicio_curso: string;
}

export interface AprovVendaRequest {
  venda_id: string;
}

export interface DevolverVendaRequest {
  venda_id: string;
  motivo: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface JWTPayload {
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  app_metadata: {
    app_role?: UserRole;
    [key: string]: unknown;
  };
  user_metadata?: Record<string, unknown>;
}
