"use client";

import { useState, useEffect } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, FileText, UploadCloud, CheckCircle2, AlertTriangle, RefreshCw, Clock } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  PENDENTE_VALIDACAO: 'Em análise pela auditoria',
  APROVADA: 'Aprovada (aguardando contrato)',
  DEVOLVIDA_AJUSTE: 'Devolvida — precisa de correção',
  AGUARDANDO_FINANCEIRO: 'Aguardando financeiro',
  AGUARDANDO_PAGAMENTO_1M: 'Aguardando 1ª mensalidade',
  PRIMEIRA_MENSALIDADE_PAGA: '1ª mensalidade paga',
  CANCELADA: 'Cancelada',
};

const STATUS_COR: Record<string, string> = {
  PENDENTE_VALIDACAO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APROVADA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DEVOLVIDA_AJUSTE: 'bg-red-500/10 text-red-400 border-red-500/20',
  AGUARDANDO_FINANCEIRO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  AGUARDANDO_PAGAMENTO_1M: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  PRIMEIRA_MENSALIDADE_PAGA: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  CANCELADA: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function formatBRL(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MinhasVendas() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [resposta, setResposta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    if (!userLoading && !user) router.push('/auth/login');
  }, [user, userLoading, router]);

  const carregar = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('vendas')
      .select('*, alunos(nome), cursos(nome)')
      .eq('criado_por', user.id)
      .order('atualizado_em', { ascending: false });
    if (error) setErro('Erro ao carregar suas vendas.');
    else setVendas(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) carregar();
  }, [user]);

  const handleFile = (selected: File | null) => {
    setErro('');
    if (!selected) { setFile(null); return; }
    if (selected.size > 5 * 1024 * 1024) { setErro('O comprovante deve ter no máximo 5MB.'); setFile(null); return; }
    setFile(selected);
  };

  const handleReenviar = async () => {
    if (!user || !selecionada) return;
    if (!file) { setErro('Anexe o novo comprovante.'); return; }
    setErro('');
    setEnviando(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { path: upPath, error: upErr } = await uploadFile('comprovantes', path, file);
      if (upErr || !upPath) throw new Error('Falha no upload do comprovante.');

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/venda-reenviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ venda_id: selecionada.id, comprovante_storage_path: upPath, resposta }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao reenviar.');

      setSucesso('Lançamento reenviado para a auditoria.');
      setSelecionada(null);
      setFile(null);
      setResposta('');
      await carregar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado.');
    } finally {
      setEnviando(false);
    }
  };

  const handleNovaVenda = async () => {
    if (!selecionada) return;
    if (!window.confirm('Isto cancela este lançamento (devolvido) e abre um novo cadastro. Continuar?')) return;
    setErro('');
    setEnviando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/venda-cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ venda_id: selecionada.id, motivo: 'Substituída por novo lançamento' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message || 'Falha ao cancelar.');
      router.push('/cadastro-unificado');
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado.');
    } finally {
      setEnviando(false);
    }
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout title="Minhas Vendas">
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Minhas Vendas" subtitle="Acompanhe seus lançamentos e corrija devoluções da auditoria.">
      <div className="flex gap-6 flex-col lg:flex-row mt-4">
        <div className="flex-1 space-y-4">
          {sucesso && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {sucesso}
            </div>
          )}
          {vendas.length === 0 ? (
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-10 text-center backdrop-blur-md">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400">Você ainda não lançou vendas.</p>
            </div>
          ) : (
            vendas.map(v => (
              <div
                key={v.id}
                onClick={() => { setSelecionada(v); setFile(null); setResposta(''); setErro(''); }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${selecionada?.id === v.id ? 'bg-rose-600/10 border-rose-500/50' : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/80'}`}
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-lg truncate">{v.alunos?.nome}</h3>
                  <p className="text-sm text-slate-400 truncate">{v.cursos?.nome}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-emerald-400">{formatBRL(Number(v.valor_entrada))}</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COR[v.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {STATUS_LABEL[v.status] || v.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {selecionada && (
          <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:sticky lg:top-28 h-fit shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">{selecionada.alunos?.nome}</h2>
            <p className="text-sm text-slate-400 mb-6">{selecionada.cursos?.nome} · {formatBRL(Number(selecionada.valor_entrada))}</p>

            {selecionada.status === 'DEVOLVIDA_AJUSTE' ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-red-300 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4" /> O que precisa ser corrigido
                  </p>
                  {Array.isArray(selecionada.devolucao_itens) && selecionada.devolucao_itens.length > 0 && (
                    <ul className="space-y-1 mb-2">
                      {selecionada.devolucao_itens.map((item: string) => (
                        <li key={item} className="text-sm text-red-200 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {selecionada.devolucao_observacao && (
                    <p className="text-sm text-red-200/80 italic">"{selecionada.devolucao_observacao}"</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-rose-400" /> Novo comprovante
                  </label>
                  <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 hover:border-rose-500/50 transition-all text-center bg-slate-950/30">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => handleFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="pointer-events-none">
                      {file ? (
                        <p className="text-sm text-white font-bold truncate">{file.name}</p>
                      ) : (
                        <p className="text-sm text-slate-400">Clique para anexar (PDF, PNG ou JPG, ≤5MB)</p>
                      )}
                    </div>
                  </div>
                </div>

                <textarea
                  placeholder="Resposta ao auditor (opcional)..."
                  value={resposta}
                  onChange={e => setResposta(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none h-20"
                />

                {erro && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{erro}</div>}

                <button
                  onClick={handleReenviar}
                  disabled={enviando}
                  className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />} Reenviar para auditoria
                </button>

                <button
                  type="button"
                  onClick={handleNovaVenda}
                  disabled={enviando}
                  className="w-full py-3 bg-slate-900 hover:bg-red-500/10 text-red-300 border border-red-500/20 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  Valor ou comprovante errado? Cancelar e cadastrar nova venda
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <p className="text-sm text-slate-300">Este lançamento está em <strong>{STATUS_LABEL[selecionada.status] || selecionada.status}</strong>. Nada a fazer por aqui.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
