"use client";
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileSignature, UploadCloud, CheckCircle2, Loader2, User as UserIcon, Phone, MessageCircle, ShieldCheck, History } from 'lucide-react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { formatCpf, isValidCpf } from '@/lib/cpf';
import { corrigirCpf } from '@/app/actions/alunos';

interface HistoricoCpf {
  id: string;
  valor_anterior: string;
  valor_novo: string;
  motivo: string;
  autor_id: string;
  criado_em: string;
}

export default function AlunoDetails() {
  const { id } = useParams();
  const { role } = useUser();
  const [aluno, setAluno] = useState<any>(null);
  const [vendaId, setVendaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

  const [historico, setHistorico] = useState<HistoricoCpf[]>([]);
  const [novoCpf, setNovoCpf] = useState('');
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [cpfErro, setCpfErro] = useState<string | null>(null);
  const [cpfOk, setCpfOk] = useState<string | null>(null);

  const verCompleto = role === 'GESTOR' || role === 'AUDITOR';
  const podeCorrigir = role === 'GESTOR';

  const fetchAluno = useCallback(async () => {
    const { data } = await supabase.from('alunos_resumo').select('*').eq('id', id).single();
    if (data) setAluno(data);
    const { data: venda } = await supabase
      .from('vendas')
      .select('id')
      .eq('aluno_id', id)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    setVendaId(venda?.id ?? null);
    setLoading(false);
  }, [id]);

  const fetchHistorico = useCallback(async () => {
    const { data } = await supabase
      .from('alunos_cpf_historico')
      .select('*')
      .eq('aluno_id', id)
      .order('criado_em', { ascending: false });
    setHistorico((data as HistoricoCpf[]) || []);
  }, [id]);

  useEffect(() => {
    if (id) fetchAluno();
  }, [id, fetchAluno]);

  useEffect(() => {
    if (id && verCompleto) fetchHistorico();
  }, [id, verCompleto, fetchHistorico]);

  const handleGenerateContract = async () => {
    if (!vendaId) {
      alert('Nenhuma venda encontrada para este aluno.');
      return;
    }
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
        body: JSON.stringify({ venda_id: vendaId })
      });

      if (!res.ok) throw new Error('Falha ao gerar');

      const json = await res.json();
      setContractUrl(json.signedUrl);
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCorrigirCpf = async () => {
    setCpfErro(null);
    setCpfOk(null);
    setSalvando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await corrigirCpf(id as string, novoCpf, motivo, session?.access_token || '');
      if ('error' in res && res.error) {
        setCpfErro(res.error);
        return;
      }
      setCpfOk('CPF atualizado com sucesso.');
      setNovoCpf('');
      setMotivo('');
      await fetchAluno();
      await fetchHistorico();
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-rose-500 w-8 h-8" /></div>;

  const cpfInvalido = verCompleto && aluno?.cpf && !isValidCpf(aluno.cpf);

  return (
    <DashboardLayout title="Detalhes do Aluno" subtitle="Gerencie a documentação e contratos do aluno.">
      <div className="max-w-5xl mx-auto space-y-6 mt-4">
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex items-center gap-6">
           <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 border border-white/5">
             <UserIcon className="w-10 h-10" />
           </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">{aluno?.nome}</h1>
              <p className="text-rose-400 mt-1 font-mono text-lg font-medium flex items-center gap-2">
                {verCompleto ? formatCpf(aluno?.cpf || '') : (aluno?.cpf || '')}
                {cpfInvalido && verCompleto && (
                  <span className="text-rose-300 text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">CPF inválido</span>
                )}
              </p>
              {aluno?.telefone && (
                <div className="flex items-center gap-2 mt-2 text-slate-300">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{aluno.telefone}</span>
                  {aluno.is_whatsapp && (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </span>
                  )}
                </div>
              )}
            </div>
        </div>

        {podeCorrigir && (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" /> Corrigir CPF
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                value={novoCpf}
                onChange={(e) => setNovoCpf(e.target.value)}
                placeholder="CPF completo (000.000.000-00)"
                className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 font-mono"
              />
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo da correção (obrigatório)"
                className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 md:col-span-2"
              />
            </div>
            {cpfErro && <p className="text-rose-400 text-sm mt-3">{cpfErro}</p>}
            {cpfOk && <p className="text-emerald-400 text-sm mt-3">{cpfOk}</p>}
            <button
              onClick={handleCorrigirCpf}
              disabled={salvando}
              className="mt-4 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Salvar correção
            </button>
          </div>
        )}

        {verCompleto && (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-rose-400" /> Histórico de CPF
            </h2>
            {historico.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma alteração de CPF registrada.</p>
            ) : (
              <ul className="space-y-3">
                {historico.map((h) => (
                  <li key={h.id} className="text-sm text-slate-300 border border-white/5 rounded-xl p-4">
                    <span className="font-mono">{formatCpf(h.valor_anterior)}</span>
                    <span className="text-slate-500"> → </span>
                    <span className="font-mono text-white">{formatCpf(h.valor_novo)}</span>
                    <p className="text-slate-400 mt-1">Motivo: {h.motivo}</p>
                    <p className="text-slate-500 text-xs mt-1">{new Date(h.criado_em).toLocaleString('pt-BR')}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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
