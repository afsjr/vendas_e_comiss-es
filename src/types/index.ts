export type AppRole = 'VENDEDOR' | 'SECRETARIA' | 'AUDITOR' | 'GESTOR' | 'FINANCEIRO';

export type StatusVenda =
  | 'PENDENTE_VALIDACAO'
  | 'APROVADA'
  | 'DEVOLVIDA_AJUSTE'
  | 'AGUARDANDO_FINANCEIRO'
  | 'AGUARDANDO_PAGAMENTO_1M'
  | 'PRIMEIRA_MENSALIDADE_PAGA'
  | 'CANCELADA';

export interface Perfil {
  id: string; // uuid
  nome: string | null;
  email: string;
  role: AppRole;
  criado_em: string; // timestamptz
}

export interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string | null;
  is_whatsapp: boolean;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}
