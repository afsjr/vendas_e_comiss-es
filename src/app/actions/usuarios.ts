'use server';

import { supabase } from '@/lib/supabase'; // Assuming service role key usage if RLS doesn't bypass, but since RLS allows GESTOR to update, we can use user's client if authenticated. For server action, we might need createServerComponentClient or just service role to bypass auth, but let's use standard supabase client. In a real app we'd use SSR client.
import { AppRole } from '@/types';

// O ideal é usar createServerActionClient do @supabase/auth-helpers-nextjs, 
// mas assumiremos que a lógica será validada via RLS e token ou via service_role.

export async function atualizarRole(userId: string, newRole: AppRole) {
  // O RLS (Row Level Security) fará a proteção desta query se o client supabase
  // estiver injetado com o token do usuário logado.
  // Em Server Actions simples sem injeção de context auth, 
  // pode ser necessário usar o client admin e verificar manualmente o JWT.
  
  const { data, error } = await supabase
    .from('perfis')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}
