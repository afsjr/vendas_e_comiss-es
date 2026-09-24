'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Perfil, AppRole } from '@/types';
import { atualizarRole, criarUsuario, redefinirSenha, excluirUsuario } from '@/app/actions/usuarios';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, Users, UserPlus, X, CheckCircle, KeyRound, Trash2 } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  GESTOR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  VENDEDOR: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FINANCEIRO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  SECRETARIA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  AUDITOR: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

export default function AdminUsuarios() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('VENDEDOR');
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    if (!userLoading && (!user || role !== 'GESTOR')) {
      router.push('/auth/login');
    }
  }, [user, role, userLoading, router]);

  async function carregarUsuarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      setErro('Erro ao carregar usuários. Verifique se você tem permissão.');
    } else {
      setUsuarios(data as Perfil[]);
    }
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: AppRole) {
    const token = await getAccessToken();
    const res = await atualizarRole(userId, newRole, token);
    if (res.error) {
      alert(`Erro: ${res.error}`);
    } else {
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  }

  async function handleResetSenha(alvo: Perfil) {
    const nova = window.prompt(`Nova senha provisória para ${alvo.email} (mín. 6 caracteres):`);
    if (!nova) return;
    const token = await getAccessToken();
    const res = await redefinirSenha(alvo.id, nova, token);
    if (res.error) alert(`Erro: ${res.error}`);
    else alert('Senha redefinida com sucesso.');
  }

  async function handleExcluir(alvo: Perfil) {
    if (alvo.id === user?.id) {
      alert('Você não pode excluir a própria conta.');
      return;
    }
    if (!window.confirm(`Excluir ${alvo.email}? Esta ação não pode ser desfeita.`)) return;
    const token = await getAccessToken();
    const res = await excluirUsuario(alvo.id, token);
    if (res.error) alert(`Erro: ${res.error}`);
    else setUsuarios(prev => prev.filter(u => u.id !== alvo.id));
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    setCreateSuccess(false);

    const token = await getAccessToken();
    const res = await criarUsuario(nome, email, senha, newUserRole, token);

    if (res.error) {
      setCreateError(res.error);
    } else {
      setCreateSuccess(true);
      setNome('');
      setEmail('');
      setSenha('');
      setNewUserRole('VENDEDOR');
      await carregarUsuarios();
      setTimeout(() => { setCreateSuccess(false); setShowForm(false); }, 2000);
    }
    setCreating(false);
  }

  if (userLoading || loading) return <DashboardLayout title="Usuários"><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div></DashboardLayout>;
  if (erro) return <DashboardLayout title="Usuários"><div className="p-8 text-red-400">{erro}</div></DashboardLayout>;
  if (!user || role !== 'GESTOR') return null;

  return (
    <DashboardLayout title="Administração de Usuários" subtitle={`${usuarios.length} usuários cadastrados`}>
      <div className="mt-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-rose-500/25"
          >
            {showForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showForm ? 'Fechar' : 'Novo Funcionário'}
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-400" /> Cadastrar Novo Funcionário
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-1 block">Nome completo</label>
                  <input
                    type="text" value={nome} onChange={e => setNome(e.target.value)} required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="João da Silva"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-1 block">E-mail</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="joao@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-1 block">Senha provisória</label>
                  <input
                    type="password" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-1 block">Perfil de acesso</label>
                  <select
                    value={newUserRole} onChange={e => setNewUserRole(e.target.value as AppRole)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="SECRETARIA">Secretaria</option>
                    <option value="FINANCEIRO">Financeiro</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="GESTOR">Gestor</option>
                  </select>
                </div>
              </div>

              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{createError}</div>
              )}
              {createSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Funcionário criado com sucesso!
                </div>
              )}

              <button
                type="submit" disabled={creating}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-4" />}
                {creating ? 'Criando...' : 'Criar Funcionário'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {usuarios.map(perfil => (
            <div key={perfil.id} className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 border border-white/5">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{perfil.nome || 'N/A'}</p>
                  <p className="text-sm text-slate-400 truncate">{perfil.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ROLE_COLORS[perfil.role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                  {perfil.role}
                </span>
                <select
                  value={perfil.role}
                  onChange={(e) => handleRoleChange(perfil.id, e.target.value as AppRole)}
                  className="bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="SECRETARIA">Secretaria</option>
                  <option value="FINANCEIRO">Financeiro</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="GESTOR">Gestor</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleResetSenha(perfil)}
                  title="Redefinir senha"
                  className="p-2 rounded-xl bg-slate-950/50 border border-white/10 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExcluir(perfil)}
                  disabled={perfil.id === user?.id}
                  title={perfil.id === user?.id ? 'Você não pode excluir a própria conta' : 'Excluir usuário'}
                  className="p-2 rounded-xl bg-slate-950/50 border border-white/10 text-slate-300 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-300 disabled:hover:border-white/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
