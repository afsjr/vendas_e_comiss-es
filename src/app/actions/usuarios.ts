'use server';

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AppRole } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdminClient() {
  if (!serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function atualizarRole(userId: string, newRole: AppRole) {
  const { data, error } = await supabase
    .from('perfis')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  const admin = getAdminClient();
  if (!admin) {
    return {
      warning:
        'Role atualizada em perfis, mas app_metadata não foi sincronizado (falta SUPABASE_SERVICE_ROLE_KEY).',
      data,
    };
  }

  const { error: adminError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { app_role: newRole },
  });

  if (adminError) {
    return { error: adminError.message };
  }

  return { data };
}

export async function criarUsuario(nome: string, email: string, senha: string, role: AppRole) {
  const admin = getAdminClient();
  if (!admin) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { full_name: nome },
    app_metadata: { app_role: role },
  });

  if (error) {
    return { error: error.message };
  }

  return { data: { id: data.user.id } };
}
