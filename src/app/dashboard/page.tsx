"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { TrendingUp, DollarSign, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

const STATUS_LABEL: Record<string, string> = {
  PENDENTE_VALIDACAO: 'Pendente de validação',
  APROVADA: 'Aprovada (contrato)',
  DEVOLVIDA_AJUSTE: 'Devolvida ao vendedor',
  AGUARDANDO_FINANCEIRO: 'Aguardando financeiro',
  AGUARDANDO_PAGAMENTO_1M: 'Aguardando 1ª mensalidade',
  PRIMEIRA_MENSALIDADE_PAGA: '1ª mensalidade paga',
  CANCELADA: 'Cancelada',
  CANCELADA_ESTORNADA: 'Cancelada/estornada',
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

const APROVADAS = ['APROVADA', 'AGUARDANDO_FINANCEIRO', 'AGUARDANDO_PAGAMENTO_1M', 'PRIMEIRA_MENSALIDADE_PAGA'];

function formatBRL(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DashboardPage() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState({ faturamento: 0, comissoes: 0, pendentes: 0, aprovadas: 0 });
  const [vendas, setVendas] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<Record<string, string>>({});
  const [porCurso, setPorCurso] = useState<any[]>([]);
  const [recomendacoes, setRecomendacoes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && (!user || role !== 'GESTOR')) {
      router.push('/auth/login');
    }
  }, [user, role, userLoading, router]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const [{ data: vData }, { data: cData }, { data: pData }] = await Promise.all([
        supabase.from('vendas').select('*, alunos(nome), cursos(nome)').order('criado_em', { ascending: false }),
        supabase.from('comissoes').select('*'),
        supabase.from('perfis').select('id, email'),
      ]);

      if (vData && cData) {
        const fat = vData.filter(v => APROVADAS.includes(v.status)).reduce((acc, v) => acc + Number(v.valor_entrada), 0);
        const com = cData.filter(c => c.status !== 'ESTORNADA').reduce((acc, c) => acc + Number(c.valor_comissao), 0);
        const pendentes = vData.filter(v => v.status === 'PENDENTE_VALIDACAO').length;
        const aprovadas = vData.filter(v => v.status === 'APROVADA').length;
        setStats({ faturamento: fat, comissoes: com, pendentes, aprovadas });
        setVendas(vData);

        // Agregação por curso
        const map: Record<string, any> = {};
        vData.forEach(v => {
          const nome = v.cursos?.nome || '—';
          if (!map[nome]) map[nome] = { curso: nome, total: 0, aprovadas: 0, devolvidas: 0, entrada: 0 };
          map[nome].total++;
          if (APROVADAS.includes(v.status)) map[nome].aprovadas++;
          if (v.status === 'DEVOLVIDA_AJUSTE') map[nome].devolvidas++;
          if (v.status !== 'CANCELADA') map[nome].entrada += Number(v.valor_entrada);
        });
        const cursos = Object.values(map).map((c: any) => ({
          ...c,
          ticketMedio: c.total ? c.entrada / c.total : 0,
          taxaAprovacao: c.total ? c.aprovadas / c.total : 0,
          taxaDevolucao: c.total ? c.devolvidas / c.total : 0,
        })).sort((a: any, b: any) => b.total - a.total);
        setPorCurso(cursos);

        // Recomendações (regras simples)
        const mesRef = (d: string | Date) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}`; };
        const agora = new Date();
        const mesAnt = new Date(); mesAnt.setMonth(mesAnt.getMonth() - 1);
        const vendasMes: Record<string, { atual: number; anterior: number }> = {};
        vData.forEach(v => {
          const nome = v.cursos?.nome || '—';
          if (!vendasMes[nome]) vendasMes[nome] = { atual: 0, anterior: 0 };
          if (mesRef(v.criado_em) === mesRef(agora)) vendasMes[nome].atual++;
          else if (mesRef(v.criado_em) === mesRef(mesAnt)) vendasMes[nome].anterior++;
        });
        const recs: string[] = [];
        cursos.forEach((c: any) => {
          if (c.total >= 3 && c.taxaDevolucao > 0.3) {
            recs.push(`Curso "${c.curso}" com ${Math.round(c.taxaDevolucao * 100)}% de devolução — revisar qualidade das evidências/orientação ao vendedor.`);
          }
          if (c.total >= 3 && c.taxaAprovacao < 0.5) {
            recs.push(`Curso "${c.curso}" com baixa taxa de aprovação (${Math.round(c.taxaAprovacao * 100)}%).`);
          }
          const m = vendasMes[c.curso];
          if (m && m.anterior >= 3 && m.atual < m.anterior * 0.7) {
            recs.push(`Curso "${c.curso}" caiu ${Math.round((1 - m.atual / m.anterior) * 100)}% nas vendas vs. mês anterior.`);
          }
        });
        setRecomendacoes(recs.length ? recs : ['Sem alertas no momento. Funil dentro do esperado.']);
      }
      if (pData) {
        const map: Record<string, string> = {};
        pData.forEach(p => { map[p.id] = p.email; });
        setVendedores(map);
      }
      setLoading(false);
    };
    if (user && role === 'GESTOR') fetchDashboard();
  }, [user, role]);

  if (userLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>;

  return (
    <DashboardLayout title="Visão Geral" subtitle="Acompanhe as métricas e o funil de vendas.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Entradas (vendas validadas)</p>
            <h2 className="text-3xl font-bold text-white">{formatBRL(stats.faturamento)}</h2>
          </div>

          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-orange-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-orange-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Comissões Apuradas</p>
            <h2 className="text-3xl font-bold text-white">{formatBRL(stats.comissoes)}</h2>
          </div>

          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-rose-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-rose-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Pendentes de Validação</p>
            <h2 className="text-3xl font-bold text-white">{stats.pendentes}</h2>
          </div>

          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-teal-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-teal-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Aprovadas (aguardando contrato)</p>
            <h2 className="text-3xl font-bold text-white">{stats.aprovadas}</h2>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Acompanhamento de Vendas</h3>
          {vendas.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">Nenhuma venda registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/5">
                    <th className="py-3 pr-4 font-semibold">Aluno</th>
                    <th className="py-3 pr-4 font-semibold">Curso</th>
                    <th className="py-3 pr-4 font-semibold">Vendedor</th>
                    <th className="py-3 pr-4 font-semibold">Entrada</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map(v => (
                    <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4 text-white font-medium">{v.alunos?.nome}</td>
                      <td className="py-3 pr-4 text-slate-300">{v.cursos?.nome}</td>
                      <td className="py-3 pr-4 text-slate-400">{vendedores[v.criado_por] || '—'}</td>
                      <td className="py-3 pr-4 text-emerald-400 font-semibold">{formatBRL(Number(v.valor_entrada))}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COR[v.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                          {STATUS_LABEL[v.status] || v.status}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Desempenho por Curso</h3>
            {porCurso.length === 0 ? (
              <p className="text-slate-400 text-sm py-6 text-center">Sem dados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/5">
                      <th className="py-3 pr-4 font-semibold">Curso</th>
                      <th className="py-3 pr-4 font-semibold">Vendas</th>
                      <th className="py-3 pr-4 font-semibold">Ticket médio</th>
                      <th className="py-3 pr-4 font-semibold">Aprovação</th>
                      <th className="py-3 pr-4 font-semibold">Devolução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porCurso.map(c => (
                      <tr key={c.curso} className="border-b border-white/5">
                        <td className="py-3 pr-4 text-white font-medium">{c.curso}</td>
                        <td className="py-3 pr-4 text-slate-300">{c.total}</td>
                        <td className="py-3 pr-4 text-emerald-400">{formatBRL(c.ticketMedio)}</td>
                        <td className="py-3 pr-4 text-slate-300">{Math.round(c.taxaAprovacao * 100)}%</td>
                        <td className="py-3 pr-4 text-slate-300">{Math.round(c.taxaDevolucao * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
        </div>
      </div>
    </DashboardLayout>
  );
}
