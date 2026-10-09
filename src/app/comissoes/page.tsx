'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import {
  agruparPorVendedor,
  alertaFechamento,
  dataInicioExibicao,
  ehAPagar,
  filtrarComissoes,
  mesIntervalo,
  podeOperarComissoes,
  rotuloSituacao,
  semDataInicio,
  totaisGerais,
  type ComissaoPagamentoRow,
  type SituacaoFiltro,
} from '@/lib/comissoes-pagamento';
import { registrarPagamento } from '@/app/actions/comissoes';
import { Loader2, AlertTriangle, FileDown, Wallet, CheckCircle2 } from 'lucide-react';

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dataCurta(iso: string | null): string {
  return iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—';
}

// Painel de comissões (feature 010).
// Regra de fechamento: a partir do dia 22 de cada mês o painel exibe alerta e
// permite o fechamento prévio (RN-06, RF-13); o dia é lido em America/Sao_Paulo.
// Comissões antigas já PAGA sem data_pagamento aparecem com "Data de pagamento: —"
// (não quebram totais). A baixa é feita via RPC registrar_pagamento_comissoes.

export default function ComissoesPage() {
  const router = useRouter();
  const { role, loading: loadingUser } = useUser();

  const [rows, setRows] = useState<ComissaoPagamentoRow[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [de, setDe] = useState(mesIntervalo().de);
  const [ate, setAte] = useState(mesIntervalo().ate);
  const [situacao, setSituacao] = useState<SituacaoFiltro>('TODAS');
  const [vendedorId, setVendedorId] = useState<string>('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [pagando, setPagando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingUser && !podeOperarComissoes(role)) {
      router.replace('/dashboard?aviso=acesso-negado');
    }
  }, [loadingUser, role, router]);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, { data: perfis }] = await Promise.all([
      supabase
        .from('comissoes')
        .select('id, valor_comissao, status, data_liberacao, data_pagamento, vendas!inner(criado_por, criado_em, data_inicio_curso, cursos(nome))')
        .order('criado_em', { ascending: false }),
      supabase.from('perfis').select('id, nome'),
    ]);

    if (error) {
      setErro('Não foi possível carregar as comissões.');
      setLoading(false);
      return;
    }
    setErro(null);

    const mapa: Record<string, string> = {};
    for (const p of perfis || []) mapa[p.id] = p.nome;
    setNomes(mapa);

    setRows(
      (data || []).map((c: any) => ({
        id: c.id,
        vendedor_id: c.vendas?.criado_por ?? '',
        curso_nome: c.vendas?.cursos?.nome ?? '-',
        valor: Number(c.valor_comissao) || 0,
        status: c.status,
        data_liberacao: c.data_liberacao,
        data_venda: c.vendas?.criado_em ?? null,
        data_inicio_curso: c.vendas?.data_inicio_curso ?? null,
        data_pagamento: c.data_pagamento,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (role && podeOperarComissoes(role)) fetchDados();
  }, [role, fetchDados]);

  const toggle = (id: string) =>
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const marcarComoPagas = async () => {
    if (selecionados.length === 0) return;
    if (!confirm(`Marcar ${selecionados.length} comissão(ões) como pagas?`)) return;
    setPagando(true);
    setMensagem(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await registrarPagamento(selecionados, session?.access_token || '');
    setPagando(false);
    if ('error' in res && res.error) {
      setMensagem(res.error);
      return;
    }
    const r = (res as { data?: { pagas: number; ignoradas: number } }).data;
    setMensagem(`${r?.pagas ?? 0} comissão(ões) baixada(s); ${r?.ignoradas ?? 0} ignorada(s).`);
    setSelecionados([]);
    await fetchDados();
  };

  const gerarRelatorio = async () => {
    setGerando(true);
    setMensagem(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/relatorio-repasse`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          periodo: { inicio: de, fim: ate },
          vendedor_id: vendedorId || null,
          situacao,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message || 'Falha ao gerar o relatório.');
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `repasse-${de}-${ate}.pdf`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch (e: any) {
      setMensagem(e.message);
    } finally {
      setGerando(false);
    }
  };

  const vendedores = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.vendedor_id, nomes[r.vendedor_id] || r.vendedor_id);
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [rows, nomes]);

  const filtradas = useMemo(
    () => filtrarComissoes(rows, { de, ate, situacao, vendedorId: vendedorId || null }),
    [rows, de, ate, situacao, vendedorId],
  );

  const porVendedor = useMemo(() => agruparPorVendedor(filtradas, nomes), [filtradas, nomes]);
  const totais = useMemo(() => totaisGerais(filtradas), [filtradas]);
  const alerta = useMemo(() => alertaFechamento(), []);

  if (loading) {
    return (
      <DashboardLayout title="Comissões" subtitle="O que já foi pago e o que ainda falta pagar, por vendedor.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (erro) {
    return (
      <DashboardLayout title="Comissões" subtitle="O que já foi pago e o que ainda falta pagar, por vendedor.">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl p-5 flex items-center justify-between">
          <span className="text-sm">{erro}</span>
          <button onClick={fetchDados} className="text-sm underline">Tentar novamente</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Comissões" subtitle="O que já foi pago e o que ainda falta pagar, por vendedor.">
      {/* Alerta de fechamento a partir do dia 22 */}
      {alerta.ativo && (
        <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-200 px-5 py-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Fechamento do mês em curso (a partir do dia 22). Revise as comissões e faça o fechamento prévio.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">De</label>
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Até</label>
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Situação</label>
          <select value={situacao} onChange={(e) => setSituacao(e.target.value as SituacaoFiltro)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200">
            <option value="TODAS">Todas</option>
            <option value="A_PAGAR">A pagar</option>
            <option value="PAGAS">Pagas</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Vendedor</label>
          <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200">
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1"><Wallet className="w-4 h-4" /> A receber</div>
          <p className="text-2xl font-bold text-amber-400">{brl(totais.aPagar)}</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1"><CheckCircle2 className="w-4 h-4" /> Pago</div>
          <p className="text-2xl font-bold text-emerald-400">{brl(totais.pago)}</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">Comissões no recorte</div>
          <p className="text-2xl font-bold text-slate-200">{totais.qtd}</p>
        </div>
      </div>

      {/* Totais por vendedor */}
      {porVendedor.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {porVendedor.map((v) => (
            <div key={v.vendedor_id} className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
              <p className="text-sm font-semibold text-white truncate">{v.nome}</p>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-amber-400">A receber {brl(v.aPagar)}</span>
                <span className="text-emerald-400">Pago {brl(v.pago)}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{v.qtd} comissão(ões)</p>
            </div>
          ))}
        </div>
      )}

      {/* Barra de ações */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm text-slate-400">{selecionados.length} selecionada(s)</p>
        <div className="flex items-center gap-3">
          {mensagem && <span className="text-xs text-slate-300">{mensagem}</span>}
          <button
            onClick={gerarRelatorio}
            disabled={gerando}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700 disabled:opacity-40"
          >
            {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Gerar relatório PDF
          </button>
          <button
            onClick={marcarComoPagas}
            disabled={pagando || selecionados.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pagando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Marcar como pagas
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="p-4 w-10"></th>
                <th className="p-4">Vendedor</th>
                <th className="p-4">Curso</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Situação</th>
                <th className="p-4">Data da venda</th>
                <th className="p-4">Início do curso</th>
                <th className="p-4">Data de pagamento</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-sm">
                    Nenhuma comissão no período selecionado.
                  </td>
                </tr>
              )}
              {filtradas.map((c) => {
                const inicio = dataInicioExibicao(c);
                return (
                <tr key={c.id} className={`border-t border-white/5 hover:bg-white/5 ${semDataInicio(c) ? 'bg-amber-500/5' : ''}`}>
                  <td className="p-4">
                    {ehAPagar(c.status) && (
                      <input
                        type="checkbox"
                        checked={selecionados.includes(c.id)}
                        onChange={() => toggle(c.id)}
                        aria-label={`Selecionar comissão de ${nomes[c.vendedor_id] || c.vendedor_id}`}
                        className="w-4 h-4 accent-emerald-500"
                      />
                    )}
                  </td>
                  <td className="p-4 text-slate-200">{nomes[c.vendedor_id] || c.vendedor_id}</td>
                  <td className="p-4 text-slate-300">{c.curso_nome}</td>
                  <td className="p-4 text-slate-300 font-mono">{brl(c.valor)}</td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-slate-300">
                      {rotuloSituacao(c.status)}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{dataCurta(c.data_venda)}</td>
                  <td className="p-4 text-slate-400 font-mono">
                    {dataCurta(inicio.data)}
                    {inicio.fallback && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30 text-amber-300">via data da venda</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{dataCurta(c.data_pagamento)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
