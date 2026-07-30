export type AppRole = 'VENDEDOR' | 'SECRETARIA' | 'AUDITOR' | 'GESTOR';

export interface Perfil {
  id: string; // uuid
  nome: string | null;
  email: string;
  role: AppRole;
  criado_em: string; // timestamptz
}
