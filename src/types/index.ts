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
