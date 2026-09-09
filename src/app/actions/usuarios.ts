'use server';

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AppRole } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// O RLS faz a proteção do UPDATE em perfis (policy "Update gestor").
// Exige o session do usuário para chamadas do browser client; em Server
// Actions, o client de perfis segue o padrão atual do projeto.
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

  if (!serviceRoleKey) {
    return {
      warning:
        'Role atualizada em perfis, mas app_metadata não foi sincronizado (falta SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor).',
      data,
    };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error: adminError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { app_role: newRole },
  });

  if (adminError) {
    return { error: adminError.message };
  }

  return { data };
}
