"use client";

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { TrendingUp, DollarSign, Clock, CheckCircle, Loader2, PiggyBank, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ChartFrame from '@/components/charts/ChartFrame';
import FunnelChart from '@/components/charts/FunnelChart';
import CategoryChart from '@/components/charts/CategoryChart';
import ComparisonChart from '@/components/charts/ComparisonChart';
import {
  APROVADAS,
  ROTULO_ETAPA,
  agruparFunil,
  agruparPorCategoria,
  comparativoPorVendedor,
  dentroDoPeriodo,
  formatBRL,
  resolverPeriodo,
  volumeAcumulado,
  type ComissaoRow,
  type Periodo,
  type PresetPeriodo,
  type VendaRow,
} from '@/lib/dashboard-metrics';

const PAPEIS_VENDEDOR = ['VENDEDOR', 'SECRETARIA'];
const PAPEIS_GERAIS = ['GESTOR', 'AUDITOR', 'FINANCEIRO'];

const STATUS_COR: Record<string, string> = {
  PENDENTE_VALIDACAO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APROVADA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DEVOLVIDA_AJUSTE: 'bg-red-500/10 text-red-400 border-red-500/20',
  AGUARDANDO_FINANCEIRO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  AGUARDANDO_PAGAMENTO_1M: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  PRIMEIRA_MENSALIDADE_PAGA: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  CANCELADA: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const PRESETS: { id: PresetPeriodo; label: string }[] = [
  { id: 'mes-atual', label: 'Mês atual' },
  { id: 'mes-anterior', label: 'Mês anterior' },
  { id: 'tudo', label: 'Tudo' },
];

export default function DashboardPage() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();

  const [vendasRaw, setVendasRaw] = useState<VendaRow[]>([]);
  const [comissoesRaw, setComissoesRaw] = useState<ComissaoRow[]>([]);
  const [perfis, setPerfis] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preset, setPreset] = useState<PresetPeriodo>('mes-atual');
  const [deCustom, setDeCustom] = useState('');
  const [ateCustom, setAteCustom] = useState('');
  const [escopoGeral, setEscopoGeral] = useState(true);

  const ehVendedor = PAPEIS_VENDEDOR.includes(role || '');
  const ehGeral = PAPEIS_GERAIS.includes(role || '');

  const periodo: Periodo = useMemo(() => {
    if (deCustom || ateCustom) return { de: deCustom || null, ate: ateCustom || null };
    return resolverPeriodo(preset);
  }, [preset, deCustom, ateCustom]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        let vQuery = supabase
          .from('vendas')
          .select('*, alunos(nome), cursos(nome, categoria)')
          .order('criado_em', { ascending: false });
        // Recorte de vendedor/secretaria aplicado já na consulta.
        // Observação: a policy de SELECT de SECRETARIA é ampla (necessária ao
        // pós-venda); por isso o filtro por criado_por é explícito aqui.
        if (ehVendedor) vQuery = vQuery.eq('criado_por', user.id);

        const [{ data: vData, error: vError }, { data: cData }, { data: pData }] = await Promise.all([
          vQuery,
          supabase.from('comissoes').select('id, valor_comissao, status, venda_id, data_liberacao, criado_em'),
          supabase.from('perfis').select('id, nome, email'),
        ]);

        if (vError) throw vError;

        setVendasRaw((vData as unknown as VendaRow[]) || []);
        setComissoesRaw((cData as unknown as ComissaoRow[]) || []);

        const mapa: Record<string, string> = {};
        (pData || []).forEach((p: any) => {
          mapa[p.id] = p.nome || p.email;
        });
        setPerfis(mapa);
      } catch {
        setError('Não foi possível carregar os dados do dashboard. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user, userLoading, role, ehVendedor, router]);

  const vendasEscopo = useMemo(() => {
    if (!user) return [];
    if (ehVendedor) return vendasRaw.filter((v) => v.criado_por === user.id);
    if (ehGeral && !escopoGeral) return vendasRaw.filter((v) => v.criado_por === user.id);
    return vendasRaw;
  }, [vendasRaw, user, ehVendedor, ehGeral, escopoGeral]);

  const funil = useMemo(() => agruparFunil(vendasEscopo, periodo), [vendasEscopo, periodo]);
  const volume = useMemo(
    () => volumeAcumulado(vendasEscopo, comissoesRaw, periodo),
    [vendasEscopo, comissoesRaw, periodo],
  );
  const categorias = useMemo(() => agruparPorCategoria(vendasEscopo, periodo), [vendasEscopo, periodo]);
  const comparativo = useMemo(
    () => comparativoPorVendedor(vendasEscopo, perfis, periodo),
    [vendasEscopo, perfis, periodo],
  );

  const vendasPeriodo = useMemo(
    () => vendasEscopo.filter((v) => dentroDoPeriodo(v.criado_em, periodo)),
    [vendasEscopo, periodo],
  );

  const recomendacoes = useMemo(() => {
    if (!ehGeral) return [];
    const map: Record<string, { total: number; devolvidas: number; aprovadas: number }> = {};
    vendasPeriodo.forEach((v) => {
      const nome = v.cursos?.nome || '—';
      const m = map[nome] || { total: 0, devolvidas: 0, aprovadas: 0 };
      m.total += 1;
      if (v.status === 'DEVOLVIDA_AJUSTE') m.devolvidas += 1;
      if (APROVADAS.includes(v.status)) m.aprovadas += 1;
      map[nome] = m;
    });
    const recs: string[] = [];
    Object.entries(map).forEach(([curso, m]) => {
      if (m.total >= 3 && m.devolvidas / m.total > 0.3) {
        recs.push(`Curso "${curso}" com ${Math.round((m.devolvidas / m.total) * 100)}% de devolução — revisar qualidade das evidências/orientação ao vendedor.`);
      }
      if (m.total >= 3 && m.aprovadas / m.total < 0.5) {
        recs.push(`Curso "${curso}" com baixa taxa de aprovação (${Math.round((m.aprovadas / m.total) * 100)}%).`);
      }
    });
    return recs.length ? recs : ['Sem alertas no momento. Funil dentro do esperado.'];
  }, [vendasPeriodo, ehGeral]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  const semDados = vendasPeriodo.length === 0;

  return (
    <DashboardLayout
      title="Visão Geral"
      subtitle={ehGeral ? 'Funil, volume e comparativo consolidado.' : 'Seu funil e o volume das suas vendas.'}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-slate-900/40 border border-white/5 rounded-3xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setPreset(p.id); setDeCustom(''); setAteCustom(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  !deCustom && !ateCustom && preset === p.id
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-slate-950/40 text-slate-400 border-white/5 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={deCustom}
                onChange={(e) => setDeCustom(e.target.value)}
                className="bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
              />
              <span className="text-slate-500 text-sm">até</span>
              <input
                type="date"
                value={ateCustom}
                onChange={(e) => setAteCustom(e.target.value)}
                className="bg-slate-950/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
              />
            </div>
          </div>

          {ehGeral && (
            <div className="inline-flex rounded-xl border border-white/5 overflow-hidden self-start">
              <button
                type="button"
                onClick={() => setEscopoGeral(true)}
                className={`px-4 py-2 text-sm font-semibold ${escopoGeral ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-950/40 text-slate-400'}`}
              >
                Geral
              </button>
              <button
                type="button"
                onClick={() => setEscopoGeral(false)}
                className={`px-4 py-2 text-sm font-semibold ${!escopoGeral ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-950/40 text-slate-400'}`}
              >
                Meu recorte
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Entradas no período</p>
            <h2 className="text-3xl font-bold text-white">{formatBRL(volume.entradas)}</h2>
            <p className="text-[11px] text-slate-500 mt-2">Validadas: {formatBRL(volume.entradasValidadas)}</p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-orange-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-orange-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Comissões apuradas</p>
            <h2 className="text-3xl font-bold text-white">{formatBRL(volume.comissoes)}</h2>
          </div>

          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-rose-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-rose-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Pendentes de validação</p>
            <h2 className="text-3xl font-bold text-white">{volume.pendentes}</h2>
          </div>

          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-teal-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-teal-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Aprovadas (aguardando contrato)</p>
            <h2 className="text-3xl font-bold text-white">{volume.aprovadas}</h2>
          </div>

          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-fuchsia-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PiggyBank className="w-6 h-6 text-fuchsia-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Repasse previsto</p>
            <h2 className="text-3xl font-bold text-white">{formatBRL(volume.repasse)}</h2>
            <p className="text-[11px] text-slate-500 mt-2">100% Técnico/Livre · 36% Graduação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartFrame
              title="Funil por etapa"
              subtitle="Quantidade e valor das vendas em cada etapa do processo."
              vazio={semDados}
            >
              <FunnelChart dados={funil} />
            </ChartFrame>
          </div>
          <ChartFrame
            title="Entradas por categoria"
            subtitle="Distribuição do volume no período."
            vazio={categorias.length === 0}
          >
            <CategoryChart dados={categorias} />
          </ChartFrame>
        </div>

        {ehGeral && (
          <ChartFrame
            title="Comparativo por vendedor"
            subtitle="Entradas e repasse, lado a lado."
            legenda={
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f43f5e' }} /> Entradas</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#d946ef' }} /> Repasse</span>
              </span>
            }
            vazio={comparativo.length === 0}
          >
            <ComparisonChart dados={comparativo} />
          </ChartFrame>
        )}

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">{ehVendedor ? 'Minhas vendas' : 'Acompanhamento de Vendas'}</h3>
          {vendasPeriodo.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">Nenhuma venda registrada no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/5">
                    <th className="py-3 pr-4 font-semibold">Aluno</th>
                    <th className="py-3 pr-4 font-semibold">Curso</th>
                    {ehGeral && <th className="py-3 pr-4 font-semibold">Vendedor</th>}
                    <th className="py-3 pr-4 font-semibold">Entrada</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasPeriodo.map((v) => (
                    <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4 text-white font-medium">{v.alunos?.nome}</td>
                      <td className="py-3 pr-4 text-slate-300">{v.cursos?.nome}</td>
                      {ehGeral && <td className="py-3 pr-4 text-slate-400">{perfis[v.criado_por] || '—'}</td>}
                      <td className="py-3 pr-4 text-emerald-400 font-semibold">{formatBRL(Number(v.valor_entrada))}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COR[v.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                          {ROTULO_ETAPA[v.status] || v.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{new Date(v.criado_em).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {ehGeral && (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recomendações</h3>
            <ul className="space-y-3">
              {recomendacoes.map((r, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
