'use server';

import { createClient } from '@supabase/supabase-js';
import { AppRole } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdminClient() {
  if (!serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

type AuthzResult =
  | { ok: true; admin: NonNullable<ReturnType<typeof getAdminClient>>; userId: string }
  | { ok: false; error: string };

async function authorizeGestor(accessToken: string): Promise<AuthzResult> {
  if (!accessToken) return { ok: false, error: 'Sessão não informada.' };

  const admin = getAdminClient();
  if (!admin) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' };
  }

  const { data: { user }, error } = await admin.auth.getUser(accessToken);
  if (error || !user) return { ok: false, error: 'Sessão inválida ou expirada.' };

  if (user.app_metadata?.app_role !== 'GESTOR') {
    return { ok: false, error: 'Acesso negado: apenas GESTOR pode gerenciar usuários.' };
  }

  return { ok: true, admin, userId: user.id };
}

export async function atualizarRole(userId: string, newRole: AppRole, accessToken: string) {
  const auth = await authorizeGestor(accessToken);
  if (!auth.ok) return { error: auth.error };

  const { data, error } = await auth.admin
    .from('perfis')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) return { error: error.message };

  const { error: adminError } = await auth.admin.auth.admin.updateUserById(userId, {
    app_metadata: { app_role: newRole },
  });

  if (adminError) return { error: adminError.message };

  return { data };
}

export async function criarUsuario(
  nome: string,
  email: string,
  senha: string,
  role: AppRole,
  accessToken: string
) {
  const auth = await authorizeGestor(accessToken);
  if (!auth.ok) return { error: auth.error };

  const { data, error } = await auth.admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { full_name: nome },
    app_metadata: { app_role: role },
  });

  if (error) return { error: error.message };

  const { error: perfilError } = await auth.admin
    .from('perfis')
    .upsert({ id: data.user.id, email, nome, role }, { onConflict: 'id' });

  if (perfilError) return { error: perfilError.message };

  return { data: { id: data.user.id } };
}

export async function redefinirSenha(userId: string, novaSenha: string, accessToken: string) {
  const auth = await authorizeGestor(accessToken);
  if (!auth.ok) return { error: auth.error };

  if (!novaSenha || novaSenha.length < 6) {
    return { error: 'A senha provisória deve ter ao menos 6 caracteres.' };
  }

  const { error } = await auth.admin.auth.admin.updateUserById(userId, { password: novaSenha });
  if (error) return { error: error.message };

  return { data: { id: userId } };
}

export async function excluirUsuario(userId: string, accessToken: string) {
  const auth = await authorizeGestor(accessToken);
  if (!auth.ok) return { error: auth.error };

  if (auth.userId === userId) {
    return { error: 'Você não pode excluir a própria conta.' };
  }

  const { error } = await auth.admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  return { data: { id: userId } };
}
