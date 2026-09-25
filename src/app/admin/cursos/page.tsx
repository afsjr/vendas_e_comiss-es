'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { criarCurso, atualizarCurso, excluirCurso, Categoria } from '@/app/actions/cursos';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, GraduationCap, Plus, Pencil, Trash2, X, CheckCircle } from 'lucide-react';

const CATEGORIAS: Categoria[] = ['Técnico', 'Graduação', 'Pós-Graduação', 'Cursos Livres'];

type Curso = {
  id: string;
  nome: string;
  categoria: Categoria;
  valor_comissao_fixo: number;
};

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

function formatBRL(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminCursos() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('Técnico');
  const [valorComissao, setValorComissao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    carregarCursos();
  }, []);

  useEffect(() => {
    if (!userLoading && (!user || role !== 'GESTOR')) {
      router.push('/auth/login');
    }
  }, [user, role, userLoading, router]);

  async function carregarCursos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cursos')
      .select('id, nome, categoria, valor_comissao_fixo')
      .order('nome');
    if (error) setErro('Erro ao carregar cursos.');
    else setCursos((data || []) as Curso[]);
    setLoading(false);
  }

  function abrirNovo() {
    setEditandoId(null);
    setNome('');
    setCategoria('Técnico');
    setValorComissao('');
    setFormErro('');
    setSucesso(false);
    setShowForm(true);
  }

  function abrirEdicao(curso: Curso) {
    setEditandoId(curso.id);
    setNome(curso.nome);
    setCategoria(curso.categoria);
    setValorComissao(String(curso.valor_comissao_fixo));
    setFormErro('');
    setSucesso(false);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setFormErro('');

    const dados = {
      nome,
      categoria,
      valor_comissao_fixo: parseFloat(valorComissao),
    };
    const token = await getAccessToken();

    const res = editandoId
      ? await atualizarCurso(editandoId, dados, token)
      : await criarCurso(dados, token);

    if (res.error) {
      setFormErro(res.error);
    } else {
      setSucesso(true);
      await carregarCursos();
      setTimeout(() => {
        setSucesso(false);
        setShowForm(false);
      }, 1500);
    }
    setSalvando(false);
  }

  async function handleExcluir(curso: Curso) {
    if (!window.confirm(`Excluir o curso "${curso.nome}"?`)) return;
    const token = await getAccessToken();
    const res = await excluirCurso(curso.id, token);
    if (res.error) alert(`Erro: ${res.error}`);
    else setCursos(prev => prev.filter(c => c.id !== curso.id));
  }

  if (userLoading || loading) {
    return (
      <DashboardLayout title="Cursos">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
  if (erro) return <DashboardLayout title="Cursos"><div className="p-8 text-red-400">{erro}</div></DashboardLayout>;
  if (!user || role !== 'GESTOR') return null;

  return (
    <DashboardLayout title="Catálogo de Cursos" subtitle={`${cursos.length} cursos cadastrados`}>
      <div className="mt-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => (showForm ? setShowForm(false) : abrirNovo())}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-rose-500/25"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Fechar' : 'Novo Curso'}
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-rose-400" />
              {editandoId ? 'Editar Curso' : 'Cadastrar Curso'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-1 block">Nome do curso</label>
                  <input
                    type="text" value={nome} onChange={e => setNome(e.target.value)} required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="Ex: Técnico em Enfermagem"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-1 block">Categoria</label>
                  <select
                    value={categoria} onChange={e => setCategoria(e.target.value as Categoria)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-1 block">Valor de comissão (R$)</label>
                  <input
                    type="number" step="0.01" min="0.01" value={valorComissao}
                    onChange={e => setValorComissao(e.target.value)} required
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="50.00"
                  />
                </div>
              </div>

              {formErro && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{formErro}</div>
              )}
              {sucesso && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Curso salvo com sucesso!
                </div>
              )}

              <button
                type="submit" disabled={salvando}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : editandoId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {salvando ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Criar Curso'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {cursos.map(curso => (
            <div key={curso.id} className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 border border-white/5">
                  <GraduationCap className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{curso.nome}</p>
                  <p className="text-sm text-slate-400 truncate">{curso.categoria}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:ml-auto">
                <span className="px-3 py-1 rounded-full text-xs font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {formatBRL(Number(curso.valor_comissao_fixo))}
                </span>
                <button
                  type="button" onClick={() => abrirEdicao(curso)} title="Editar"
                  className="p-2 rounded-xl bg-slate-950/50 border border-white/10 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button" onClick={() => handleExcluir(curso)} title="Excluir"
                  className="p-2 rounded-xl bg-slate-950/50 border border-white/10 text-slate-300 hover:text-red-400 hover:border-red-500/30 transition-all"
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
