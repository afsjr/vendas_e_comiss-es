"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, Eye, ShieldCheck, Clock } from 'lucide-react';

export default function AuditoriaPage() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();
  
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [processing, setProcessing] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && (!user || !['AUDITOR', 'GESTOR'].includes(role || ''))) {
      router.push('/auth/login');
    }
  }, [user, role, userLoading, router]);

  const fetchVendas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendas')
      .select('*, alunos(nome), cursos(nome), evidencias_vendas(comprovante_storage_path)')
      .eq('status', 'PENDENTE_VALIDACAO')
      .order('criado_em', { ascending: false });
      
    if (error) console.error('Erro ao buscar vendas:', error);
    if (data) setVendas(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user && ['AUDITOR', 'GESTOR'].includes(role || '')) {
      fetchVendas();
    }
  }, [user, role]);

  const handleSelectVenda = async (venda: any) => {
    setSelectedVenda(venda);
    setSignedUrl(null);
    setMotivo('');
    if (venda.evidencias_vendas?.[0]?.comprovante_storage_path) {
      const { data } = await supabase.storage
        .from('comprovantes')
        .createSignedUrl(venda.evidencias_vendas[0].comprovante_storage_path, 60 * 15);
      if (data) setSignedUrl(data.signedUrl);
    }
  };

  const handleAction = async (action: 'aprovar' | 'devolver') => {
    if (action === 'devolver' && motivo.length < 10) {
      alert("Para devolução, o motivo deve ter no mínimo 10 caracteres.");
      return;
    }
    setProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const endpoint = action === 'aprovar' ? 'auditoria-aprovar' : 'auditoria-devolver';
      const funcUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${endpoint}`;
      
      const res = await fetch(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          venda_id: selectedVenda.id,
          motivo: action === 'devolver' ? motivo : undefined
        })
      });
      
      if (!res.ok) throw new Error('Falha na operação');
      
      setSelectedVenda(null);
      fetchVendas();
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (userLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <header className="bg-slate-900/80 border-b border-white/5 p-6 sticky top-0 z-40 backdrop-blur-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            Fila de Auditoria
          </h1>
          <p className="text-sm text-slate-400 mt-1">{vendas.length} pendentes</p>
        </div>
        <ShieldCheck className="w-8 h-8 text-indigo-400 opacity-50" />
      </header>

      <main className="p-6 max-w-7xl mx-auto flex gap-6 flex-col lg:flex-row">
        {/* Fila */}
        <div className="flex-1 space-y-4">
          {vendas.length === 0 ? (
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-10 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-white">Fila Vazia</h3>
              <p className="text-slate-400 mt-2">Nenhuma venda aguardando validação no momento.</p>
            </div>
          ) : (
            vendas.map(v => (
              <div 
                key={v.id} 
                onClick={() => handleSelectVenda(v)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${selectedVenda?.id === v.id ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-slate-900/40 border-white/5 hover:bg-slate-800'}`}
              >
                <div>
                  <h3 className="font-semibold text-white">{v.alunos?.nome}</h3>
                  <p className="text-sm text-slate-400">{v.cursos?.nome}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-emerald-400">R$ {v.valor_entrada.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(v.criado_em).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detalhes */}
        {selectedVenda && (
          <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:sticky lg:top-28 h-fit shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Auditar Venda</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Aluno</span>
                <span className="font-medium text-white">{selectedVenda.alunos?.nome}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Curso</span>
                <span className="font-medium text-white">{selectedVenda.cursos?.nome}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Entrada</span>
                <span className="font-medium text-emerald-400">R$ {selectedVenda.valor_entrada.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Início Aulas</span>
                <span className="font-medium text-white">{new Date(selectedVenda.data_inicio_curso).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2"><Eye className="w-4 h-4"/> Comprovante</span>
              {signedUrl ? (
                <a href={signedUrl} target="_blank" rel="noreferrer" className="block w-full h-48 bg-slate-950 border border-white/10 rounded-xl overflow-hidden relative group">
                  {/* Se for imagem, tenta renderizar, se for PDF mostra icone */}
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="px-4 py-2 bg-black/60 rounded-lg text-sm group-hover:bg-indigo-600 transition-colors">Clique para ampliar</span>
                  </div>
                </a>
              ) : (
                <div className="h-48 flex items-center justify-center bg-slate-950 border border-white/5 rounded-xl"><Loader2 className="animate-spin text-slate-500" /></div>
              )}
            </div>

            <div className="space-y-3">
              <textarea 
                placeholder="Motivo (obrigatório para devolução)..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-red-500 outline-none resize-none h-24 shadow-inner"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleAction('devolver')}
                  disabled={processing || motivo.length < 10}
                  className="w-full py-3 bg-slate-800 hover:bg-red-500/20 text-red-400 border border-transparent hover:border-red-500/50 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />} Devolver
                </button>
                <button 
                  onClick={() => handleAction('aprovar')}
                  disabled={processing}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Aprovar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
