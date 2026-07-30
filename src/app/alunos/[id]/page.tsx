"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileSignature, UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function AlunoDetails() {
  const { id } = useParams();
  const [aluno, setAluno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAluno = async () => {
      const { data } = await supabase.from('alunos').select('*').eq('id', id).single();
      if (data) setAluno(data);
      setLoading(false);
    };
    if (id) fetchAluno();
  }, [id]);

  const handleGenerateContract = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const funcUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gerar-contrato`;
      
      const res = await fetch(funcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ aluno_id: id, curso_id: '123' }) // mock curso_id for demo
      });
      
      if (!res.ok) throw new Error('Falha ao gerar');
      
      const json = await res.json();
      setContractUrl(json.url);
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-lg">
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{aluno?.nome}</h1>
           <p className="text-slate-400 mt-2 font-mono">CPF: {aluno?.cpf}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6">Checklist Documentação</h2>
              <div className="space-y-4">
                 {['RG/CPF', 'Comprovante de Residência', 'Histórico Escolar'].map(doc => (
                   <div key={doc} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                     <span className="text-sm font-medium text-slate-300">{doc}</span>
                     <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shadow-inner"><UploadCloud className="w-5 h-5 text-blue-400" /></button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-blue-500/20 rounded-3xl p-8 flex flex-col shadow-[0_0_40px_rgba(37,99,235,0.1)]">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                 <FileSignature className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Contrato Digital</h2>
              <p className="text-sm text-blue-200/60 mb-8 flex-1">Gere a minuta padronizada preenchida com os dados do aluno e do curso escolhido. Válido por 15 minutos.</p>
              
              {contractUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-emerald-400 bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/20">
                     <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                     <span className="text-sm font-medium">Contrato gerado com sucesso</span>
                  </div>
                  <a href={contractUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25">
                    Visualizar PDF
                  </a>
                </div>
              ) : (
                <button onClick={handleGenerateContract} disabled={generating} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 disabled:opacity-50">
                  {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSignature className="w-6 h-6" />}
                  Gerar Minuta de Contrato
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
