"use client";

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase, uploadFile } from '@/lib/supabase';
import { useDropzone } from 'react-dropzone';
import { AlertTriangle, CheckCircle2, Clock, Loader2, UploadCloud, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const BUCKET = 'relatorios_repasse';
const FUNC_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pre-auditoria-repasses`;

type Resultado = 'APARECEU' | 'NAO_APARECEU' | 'AMBIGUO';

interface Relatorio {
  id: string;
  competencia_pagamento: string | null;
  total_linhas: number;
  linhas_validas: number;
  criado_em: string;
}

interface Conciliacao {
  id: string;
  cpf_aluno: string;
  resultado: Resultado;
  competencia_inicio: string | null;
  valor_repasse: number | null;
  confirmado_em: string | null;
  vendas?: { alunos?: { nome?: string } | null; cursos?: { nome?: string } | null } | null;
}

async function callFunction(body: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(FUNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || 'Falha ao chamar a pré-auditoria.');
  }
  return json.data;
}

const badge: Record<Resultado, { label: string; className: string; icon: JSX.Element }> = {
  APARECEU: { label: 'Apareceu', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  NAO_APARECEU: { label: 'Ainda não apareceu', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock className="w-3.5 h-3.5" /> },
  AMBIGUO: { label: 'Ambíguo (manual)', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

export default function PreAuditoriaPage() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();

  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [conciliacoes, setConciliacoes] = useState<Conciliacao[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && (!user || role !== 'GESTOR')) router.push('/auth/login');
  }, [user, role, userLoading, router]);

  const carregarRelatorios = useCallback(async () => {
    const { data } = await supabase
      .from('relatorios_repasse')
      .select('id, competencia_pagamento, total_linhas, linhas_validas, criado_em')
      .order('criado_em', { ascending: false });
    setRelatorios((data as Relatorio[]) || []);
    return (data as Relatorio[]) || [];
  }, []);

  const carregarConciliacoes = useCallback(async (relatorioId: string) => {
    const { data, error } = await supabase
      .from('conciliacoes_repasse')
      .select('id, cpf_aluno, resultado, competencia_inicio, valor_repasse, confirmado_em, vendas(alunos(nome), cursos(nome))')
      .eq('relatorio_id', relatorioId)
      .order('resultado', { ascending: true });
    if (error) setError('Não foi possível carregar os resultados.');
    setConciliacoes((data as unknown as Conciliacao[]) || []);
    setSelected(new Set());
  }, []);

  useEffect(() => {
    if (!user || role !== 'GESTOR') return;
    (async () => {
      setLoading(true);
      const lista = await carregarRelatorios();
      if (lista.length > 0) {
        setCurrentId(lista[0].id);
        await carregarConciliacoes(lista[0].id);
      }
      setLoading(false);
    })();
  }, [user, role, carregarRelatorios, carregarConciliacoes]);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const path = `${crypto.randomUUID()}/${file.name}`;
      const { error: upErr } = await uploadFile(BUCKET, path, file);
      if (upErr) throw new Error('Falha no upload do arquivo.');

      const data = await callFunction({ acao: 'importar', storage_path: path });
      setFeedback(
        `Importado: ${data.linhas_validas} de ${data.total_linhas} linhas · ` +
          `${data.resultados.APARECEU} apareceu · ${data.resultados.NAO_APARECEU} não apareceu · ${data.resultados.AMBIGUO} ambíguos`,
      );
      await carregarRelatorios();
      setCurrentId(data.relatorio_id);
      await carregarConciliacoes(data.relatorio_id);
    } catch (e: any) {
      setError(e?.message || 'Falha ao importar o relatório.');
    } finally {
      setBusy(false);
    }
  }, [carregarRelatorios, carregarConciliacoes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv'] },
  });

  const confirmar = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const data = await callFunction({ acao: 'confirmar', conciliacao_ids: ids });
      setFeedback(`${data.confirmados} comissão(ões) liberada(s); ${data.ignorados} ignorada(s).`);
      if (currentId) await carregarConciliacoes(currentId);
    } catch (e: any) {
      setError(e?.message || 'Falha ao confirmar.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout title="Pré-auditoria de Repasses">
        <div className="flex items-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /> Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pré-auditoria de Repasses" subtitle="Conciliação de mensalidades de Graduação por relatório do polo">
      <div className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 bg-slate-900/40 hover:border-rose-500/40'}`}
        >
          <input {...getInputProps()} />
          {busy ? (
            <div className="flex items-center justify-center gap-3 text-slate-300"><Loader2 className="w-5 h-5 animate-spin" /> Processando...</div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <UploadCloud className="w-8 h-8 text-rose-400" />
              <p className="font-medium text-slate-200">Arraste o CSV do relatório de repasses</p>
              <p className="text-xs">Somente CSV · perfil GESTOR</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-3 text-sm">
            <XCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {feedback && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl px-4 py-3 text-sm">
            <CheckCircle2 className="w-4 h-4" /> {feedback}
          </div>
        )}

        {relatorios.length === 0 ? (
          <div className="text-center text-slate-500 py-10">Nenhuma importação registrada ainda.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {relatorios.map((r) => (
              <button
                key={r.id}
                onClick={() => { setCurrentId(r.id); carregarConciliacoes(r.id); }}
                className={`px-3 py-1.5 rounded-lg text-xs border ${currentId === r.id ? 'border-rose-500/40 text-rose-300 bg-rose-500/10' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}
              >
                {r.competencia_pagamento || new Date(r.criado_em).toLocaleDateString('pt-BR')} · {r.linhas_validas} linhas
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">{conciliacoes.length} lançamento(s) · {selected.size} selecionado(s)</p>
          <button
            onClick={confirmar}
            disabled={busy || selected.size === 0}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar selecionados
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-400">
              <tr>
                <th className="w-10 p-3"></th>
                <th className="text-left p-3">Aluno</th>
                <th className="text-left p-3">CPF</th>
                <th className="text-left p-3">Curso</th>
                <th className="text-left p-3">Resultado</th>
                <th className="text-left p-3">Competência início</th>
                <th className="text-right p-3">Repasse</th>
              </tr>
            </thead>
            <tbody>
              {conciliacoes.map((c) => {
                const b = badge[c.resultado];
                const podeSelecionar = c.resultado === 'APARECEU' && !c.confirmado_em;
                return (
                  <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-3 text-center">
                      {podeSelecionar && (
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                      )}
                      {c.confirmado_em && <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />}
                    </td>
                    <td className="p-3 text-slate-200">{c.vendas?.alunos?.nome || '—'}</td>
                    <td className="p-3 text-slate-400 font-mono">{c.cpf_aluno}</td>
                    <td className="p-3 text-slate-400">{c.vendas?.cursos?.nome || '—'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${b.className}`}>
                        {b.icon} {b.label}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{c.competencia_inicio || '—'}</td>
                    <td className="p-3 text-right text-slate-300">
                      {c.valor_repasse != null ? `R$ ${c.valor_repasse.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {conciliacoes.length === 0 && (
            <div className="text-center text-slate-500 py-10">Sem lançamentos conciliados para esta importação.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
