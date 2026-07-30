"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileSignature, UploadCloud, CheckCircle2, Loader2, User as UserIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

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

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-rose-500 w-8 h-8" /></div>;

  return (
    <DashboardLayout title="Detalhes do Aluno" subtitle="Gerencie a documentação e contratos do aluno.">
      <div className="max-w-5xl mx-auto space-y-6 mt-4">
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex items-center gap-6">
           <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 border border-white/5">
             <UserIcon className="w-10 h-10" />
           </div>
           <div>
             <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">{aluno?.nome}</h1>
             <p className="text-rose-400 mt-1 font-mono text-lg font-medium">{aluno?.cpf}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                Checklist Documentação
              </h2>
              <div className="space-y-4">
                 {['RG/CPF', 'Comprovante de Residência', 'Histórico Escolar'].map(doc => (
                   <div key={doc} className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-white/20 transition-all group shadow-inner">
                     <span className="text-sm font-semibold text-slate-300">{doc}</span>
                     <button className="p-3 bg-slate-900 group-hover:bg-rose-500/10 border border-white/5 group-hover:border-rose-500/30 rounded-xl transition-all shadow-lg text-slate-400 group-hover:text-rose-400">
                       <UploadCloud className="w-5 h-5" />
                     </button>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-rose-900/40 to-red-900/20 border border-rose-500/20 rounded-3xl p-8 flex flex-col shadow-[0_0_40px_rgba(225,29,72,0.1)] backdrop-blur-md">
              <div className="w-14 h-14 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center mb-6 text-rose-400 shadow-lg">
                 <FileSignature className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Contrato Digital</h2>
              <p className="text-sm text-rose-200/60 mb-8 flex-1 leading-relaxed">Gere a minuta padronizada preenchida com os dados do aluno e do curso escolhido. O link é seguro e tem validade de 15 minutos.</p>
              
              {contractUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-inner">
                     <CheckCircle2 className="w-7 h-7 flex-shrink-0" />
                     <span className="text-sm font-semibold">Contrato gerado com sucesso!</span>
                  </div>
                  <a href={contractUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    Visualizar e Baixar PDF
                  </a>
                </div>
              ) : (
                <button onClick={handleGenerateContract} disabled={generating} className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(225,29,72,0.3)] flex items-center justify-center gap-3 disabled:opacity-50 text-lg">
                  {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileSignature className="w-6 h-6" />}
                  Gerar Minuta de Contrato
                </button>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
