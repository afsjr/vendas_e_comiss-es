"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, Eye, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

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

  if (userLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>;

  return (
    <DashboardLayout title="Fila de Auditoria" subtitle={`${vendas.length} pendentes de validação`}>
      <div className="flex gap-6 flex-col lg:flex-row mt-4">
        {/* Fila */}
        <div className="flex-1 space-y-4">
          {vendas.length === 0 ? (
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-10 text-center backdrop-blur-md">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-white">Fila Vazia</h3>
              <p className="text-slate-400 mt-2">Nenhuma venda aguardando validação no momento.</p>
            </div>
          ) : (
            vendas.map(v => (
              <div 
                key={v.id} 
                onClick={() => handleSelectVenda(v)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${selectedVenda?.id === v.id ? 'bg-rose-600/10 border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.1)]' : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/80 backdrop-blur-md'}`}
              >
                <div>
                  <h3 className="font-semibold text-white text-lg">{v.alunos?.nome}</h3>
                  <p className="text-sm text-slate-400 font-medium">{v.cursos?.nome}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400 text-lg">R$ {v.valor_entrada.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 justify-end mt-1"><Clock className="w-3 h-3" /> {new Date(v.criado_em).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detalhes */}
        {selectedVenda && (
          <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:sticky lg:top-28 h-fit shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Eye className="w-5 h-5 text-rose-400"/> Análise de Venda
            </h2>
            
            <div className="space-y-4 mb-6 bg-slate-950/50 p-5 rounded-2xl border border-white/5">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400 text-sm">Aluno</span>
                <span className="font-semibold text-white">{selectedVenda.alunos?.nome}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400 text-sm">Curso</span>
                <span className="font-semibold text-white">{selectedVenda.cursos?.nome}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400 text-sm">Entrada</span>
                <span className="font-bold text-emerald-400">R$ {selectedVenda.valor_entrada.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Início Aulas</span>
                <span className="font-semibold text-white">{new Date(selectedVenda.data_inicio_curso).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">Comprovante Anexado</span>
              {signedUrl ? (
                <a href={signedUrl} target="_blank" rel="noreferrer" className="block w-full h-48 bg-slate-950 border border-white/10 rounded-2xl overflow-hidden relative group">
                  {/* Se for imagem, tenta renderizar, se for PDF mostra icone */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                     <span className="px-5 py-2.5 bg-black/60 backdrop-blur-md rounded-xl text-sm text-white font-medium group-hover:bg-rose-600 transition-colors border border-white/10">Clique para ampliar o documento</span>
                  </div>
                </a>
              ) : (
                <div className="h-48 flex items-center justify-center bg-slate-950 border border-white/5 rounded-2xl"><Loader2 className="animate-spin text-slate-500 w-6 h-6" /></div>
              )}
            </div>

            <div className="space-y-4">
              <textarea 
                placeholder="Motivo (obrigatório para devolução)..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none h-24 shadow-inner"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAction('devolver')}
                  disabled={processing || motivo.length < 10}
                  className="w-full py-4 bg-slate-900 hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/30 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />} Devolver
                </button>
                <button 
                  onClick={() => handleAction('aprovar')}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Aprovar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
