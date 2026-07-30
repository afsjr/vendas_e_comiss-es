"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, uploadFile } from '@/lib/supabase';
import { UploadCloud, CheckCircle2, FileText, User as UserIcon, GraduationCap, DollarSign, Loader2 } from 'lucide-react';

export default function NovaVenda() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  
  const [cursos, setCursos] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  
  const [cursoId, setCursoId] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [valorEntrada, setValorEntrada] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) router.push('/auth/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cData }, { data: aData }] = await Promise.all([
        supabase.from('cursos').select('*').order('nome'),
        supabase.from('alunos').select('*').order('nome')
      ]);
      if (cData) setCursos(cData);
      if (aData) setAlunos(aData);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !cursoId || !alunoId || !valorEntrada || !dataInicio) return;
    
    setSubmitting(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { path, error: uploadErr } = await uploadFile('comprovantes', fileName, file);
      
      if (uploadErr || !path) throw new Error('Falha no upload');
      
      const { data: { session } } = await supabase.auth.getSession();
      const funcUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vendas`;
      
      const res = await fetch(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          aluno_id: alunoId,
          curso_id: cursoId,
          valor_entrada: parseFloat(valorEntrada),
          data_inicio_curso: dataInicio,
          comprovante_storage_path: path
        })
      });
      
      if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error?.message || 'Erro ao criar venda');
      }
      
      setSuccess(true);
      setCursoId('');
      setAlunoId('');
      setValorEntrada('');
      setDataInicio('');
      setFile(null);
      
    } catch (error: any) {
      console.error(error);
      alert('Erro: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans">
      <header className="bg-slate-900/80 border-b border-white/5 p-5 sticky top-0 z-50 backdrop-blur-xl">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          Novo Apontamento
        </h1>
      </header>
      
      <main className="p-4 max-w-lg mx-auto mt-6">
        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Venda Registrada!</h2>
            <p className="text-slate-400 text-sm">O comprovante foi enviado e a venda aguarda auditoria.</p>
            <button 
              onClick={() => setSuccess(false)}
              className="mt-6 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl transition-all shadow-lg w-full"
            >
              Lançar Outra Venda
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-400" /> Aluno
                </label>
                <Link href="/alunos/novo" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                  + Cadastrar Aluno
                </Link>
              </div>
              <select 
                value={alunoId} onChange={e => setAlunoId(e.target.value)} required
                className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all shadow-inner"
              >
                <option value="" className="bg-slate-900">Selecione um aluno...</option>
                {alunos.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.nome}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-400" /> Curso
              </label>
              <select 
                value={cursoId} onChange={e => setCursoId(e.target.value)} required
                className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all shadow-inner"
              >
                <option value="" className="bg-slate-900">Selecione o curso...</option>
                {cursos.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.nome}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Entrada (R$)
                </label>
                <input 
                  type="number" step="0.01" min="0" value={valorEntrada} onChange={e => setValorEntrada(e.target.value)} required placeholder="0.00"
                  className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" /> Início
                </label>
                <input 
                  type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} required
                  className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" /> Comprovante
              </label>
              <div className="relative border-2 border-dashed border-white/10 rounded-3xl p-8 hover:bg-white/5 transition-colors group cursor-pointer text-center bg-slate-900/30">
                <input 
                  type="file" accept="image/*,application/pdf" required onChange={e => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  {file ? (
                    <>
                      <FileText className="w-12 h-12 text-blue-500 mb-3" />
                      <p className="text-sm text-white font-medium truncate w-full max-w-[200px]">{file.name}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                        <UploadCloud className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-300 font-medium">Toque para anexar</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button 
              type="submit" disabled={submitting}
              className="w-full py-4 mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Registrar Venda'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
