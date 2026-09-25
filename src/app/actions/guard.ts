import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function getAdminClient() {
  if (!serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export type AuthzResult =
  | { ok: true; admin: NonNullable<ReturnType<typeof getAdminClient>>; userId: string }
  | { ok: false; error: string };

export async function authorizeGestor(accessToken: string): Promise<AuthzResult> {
  if (!accessToken) return { ok: false, error: 'Sessão não informada.' };

  const admin = getAdminClient();
  if (!admin) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' };
  }

  const { data: { user }, error } = await admin.auth.getUser(accessToken);
  if (error || !user) return { ok: false, error: 'Sessão inválida ou expirada.' };

  if (user.app_metadata?.app_role !== 'GESTOR') {
    return { ok: false, error: 'Acesso negado: apenas GESTOR.' };
  }

  return { ok: true, admin, userId: user.id };
}
