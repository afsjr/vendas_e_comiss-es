"use client";

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BarChart3, ChevronDown, ChevronRight, Download, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { agregarPorVendedor, buildConsolidadoCsv, dentroDoPeriodo, rotuloStatus, type ComissaoRow } from '@/lib/consolidado';

interface Detalhe {
  vendedor_id: string;
  aluno: string;
  curso: string;
  valor: number;
  status: string;
  data_liberacao: string | null;
}

const ACESSO = ['GESTOR', 'FINANCEIRO'];

function formatBRL(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ConsolidadoPage() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();

  const [rows, setRows] = useState<ComissaoRow[]>([]);
  const [detalhes, setDetalhes] = useState<Detalhe[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && (!user || !ACESSO.includes(role || ''))) router.push('/auth/login');
  }, [user, role, userLoading, router]);

  useEffect(() => {
    if (!user || !ACESSO.includes(role || '')) return;
    (async () => {
      setLoading(true);
      const [{ data: cData, error: cError }, { data: pData }] = await Promise.all([
        supabase
          .from('comissoes')
          .select('id, valor_comissao, status, data_liberacao, criado_em, vendas(criado_por, alunos(nome), cursos(nome))')
          .order('criado_em', { ascending: false }),
        supabase.from('perfis').select('id, nome, email'),
      ]);

      if (cError) setError('Não foi possível carregar as comissões.');

      const mapa: Record<string, string> = {};
      (pData || []).forEach((p: any) => { mapa[p.id] = p.nome || p.email; });
      setNomes(mapa);

      const r: ComissaoRow[] = [];
      const d: Detalhe[] = [];
      (cData || []).forEach((c: any) => {
        const vendedorId = c.vendas?.criado_por;
        if (!vendedorId) return;
        r.push({ vendedor_id: vendedorId, valor: Number(c.valor_comissao), status: c.status, data_liberacao: c.data_liberacao });
        d.push({
          vendedor_id: vendedorId,
          aluno: c.vendas?.alunos?.nome || '—',
          curso: c.vendas?.cursos?.nome || '—',
          valor: Number(c.valor_comissao),
          status: c.status,
          data_liberacao: c.data_liberacao,
        });
      });
      setRows(r);
      setDetalhes(d);
      setLoading(false);
    })();
  }, [user, role]);

  const linhas = useMemo(
    () => agregarPorVendedor(rows, nomes, { de: de || null, ate: ate || null }),
    [rows, nomes, de, ate],
  );

  const totais = useMemo(
    () => linhas.reduce(
      (acc, l) => ({ aPagar: acc.aPagar + l.aPagar, previsto: acc.previsto + l.previsto, pago: acc.pago + l.pago }),
      { aPagar: 0, previsto: 0, pago: 0 },
    ),
    [linhas],
  );

  const exportar = () => {
    const csv = buildConsolidadoCsv(linhas);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consolidado-comissoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout title="Consolidado de Comissões">
        <div className="flex items-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /> Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Consolidado de Comissões" subtitle="Totais por vendedor para o pagamento.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">A pagar</p>
            <h2 className="text-3xl font-bold text-emerald-400">{formatBRL(totais.aPagar)}</h2>
          </div>
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">Previsto</p>
            <h2 className="text-3xl font-bold text-amber-400">{formatBRL(totais.previsto)}</h2>
          </div>
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">Pago</p>
            <h2 className="text-3xl font-bold text-slate-200">{formatBRL(totais.pago)}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm text-slate-400">
            Liberação de
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="block mt-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-rose-500" />
          </label>
          <label className="text-sm text-slate-400">
            até
            <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="block mt-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-rose-500" />
          </label>
          <button onClick={() => { setDe(''); setAte(''); }} className="px-4 py-2 rounded-xl text-sm border border-white/10 text-slate-300 hover:bg-white/5">Limpar</button>
          <button onClick={exportar} disabled={linhas.length === 0} className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-3 text-sm">{error}</div>}

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
          {linhas.length === 0 ? (
            <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-2">
              <BarChart3 className="w-8 h-8 text-slate-600" /> Nenhuma comissão no período.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60 text-slate-400">
                  <tr>
                    <th className="w-8 p-4"></th>
                    <th className="text-left p-4 font-semibold">Vendedor</th>
                    <th className="text-right p-4 font-semibold">A pagar</th>
                    <th className="text-right p-4 font-semibold">Previsto</th>
                    <th className="text-right p-4 font-semibold">Pago</th>
                    <th className="text-right p-4 font-semibold">Estornada</th>
                    <th className="text-right p-4 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => {
                    const aberto = expandido === l.vendedor_id;
                    const itens = detalhes.filter(
                      (d) => d.vendedor_id === l.vendedor_id && (de || ate ? dentroDoPeriodo(d.data_liberacao, de || null, ate || null) : true),
                    );
                    return (
                      <Fragment key={l.vendedor_id}>
                        <tr className="border-t border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => setExpandido(aberto ? null : l.vendedor_id)}>
                          <td className="p-4 text-slate-500">{aberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                          <td className="p-4 text-white font-medium">{l.nome}</td>
                          <td className="p-4 text-right text-emerald-400 font-semibold">{formatBRL(l.aPagar)}</td>
                          <td className="p-4 text-right text-amber-400">{formatBRL(l.previsto)}</td>
                          <td className="p-4 text-right text-slate-300">{formatBRL(l.pago)}</td>
                          <td className="p-4 text-right text-slate-400">{formatBRL(l.estornada)}</td>
                          <td className="p-4 text-right text-white">{formatBRL(l.total)}</td>
                        </tr>
                        {aberto && (
                          <tr className="bg-slate-950/40">
                            <td colSpan={7} className="p-4">
                              <table className="w-full text-xs">
                                <thead className="text-slate-500">
                                  <tr>
                                    <th className="text-left py-1">Aluno</th>
                                    <th className="text-left py-1">Curso</th>
                                    <th className="text-right py-1">Valor</th>
                                    <th className="text-left py-1 pl-4">Situação</th>
                                    <th className="text-left py-1">Liberação</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {itens.map((d, i) => (
                                    <tr key={i} className="text-slate-300 border-t border-white/5">
                                      <td className="py-1">{d.aluno}</td>
                                      <td className="py-1">{d.curso}</td>
                                      <td className="py-1 text-right">{formatBRL(d.valor)}</td>
                                      <td className="py-1 pl-4">{rotuloStatus(d.status)}</td>
                                      <td className="py-1">{d.data_liberacao ? new Date(d.data_liberacao).toLocaleDateString('pt-BR') : '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
