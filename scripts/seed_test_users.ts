import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRole) {
  console.error('[seed_test_users] Falta SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  console.error('[seed_test_users] Adicione ao .env.local: SUPABASE_SERVICE_ROLE_KEY=<sua service role key>');
  Deno.exit(1);
}

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

const PASSWORD = 'Teste@123';
const usuarios: Array<{ nome: string; email: string; role: string }> = [
  { nome: 'Teste Gestor', email: 'gestor@teste.local', role: 'GESTOR' },
  { nome: 'Teste Secretaria', email: 'secretaria@teste.local', role: 'SECRETARIA' },
  { nome: 'Teste Financeiro', email: 'financeiro@teste.local', role: 'FINANCEIRO' },
  { nome: 'Teste Auditor', email: 'auditor@teste.local', role: 'AUDITOR' },
  { nome: 'Teste Vendedor', email: 'vendedor@teste.local', role: 'VENDEDOR' },
];

async function findUserByEmail(email: string): Promise<{ id: string; app_role?: string } | null> {
  const { data } = await supabase.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email === email);
  if (!user) return null;
  return { id: user.id, app_role: user.app_metadata?.app_role as string | undefined };
}

for (const u of usuarios) {
  const existing = await findUserByEmail(u.email);

  if (existing) {
    if (existing.app_role !== u.role) {
      await supabase.auth.admin.updateUserById(existing.id, { app_metadata: { app_role: u.role } });
    }
    await supabase.from('perfis').upsert({ id: existing.id, email: u.email, nome: u.nome, role: u.role });
    console.log('[seed_test_users] Atualizado:', u.email, '→', u.role);
    continue;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.nome },
    app_metadata: { app_role: u.role },
  });

  if (error) {
    console.error('[seed_test_users] Falha ao criar', u.email, ':', error.message);
    continue;
  }

  if (data.user) {
    await supabase.from('perfis').upsert({ id: data.user.id, email: u.email, nome: u.nome, role: u.role });
  }
  console.log('[seed_test_users] Criado:', u.email, '→', u.role);
}

console.log('[seed_test_users] Concluído. Senha de todos os usuários:', PASSWORD);