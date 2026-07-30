"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { TrendingUp, DollarSign, Download, Users, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState({ faturamento: 0, comissoes: 0, vendasPendentes: 0, taxaEmissao: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && (!user || role !== 'GESTOR')) {
      router.push('/auth/login');
    }
  }, [user, role, userLoading, router]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const { data: vendas } = await supabase.from('vendas').select('*');
      const { data: comissoes } = await supabase.from('comissoes').select('*');
      
      if (vendas && comissoes) {
        const fat = vendas.filter(v => v.status === 'APROVADA').reduce((acc, v) => acc + v.valor_entrada, 0);
        const com = comissoes.reduce((acc, c) => acc + c.valor_comissao, 0);
        const pendentes = vendas.filter(v => v.status === 'PENDENTE_VALIDACAO').length;
        
        setStats({ faturamento: fat, comissoes: com, vendasPendentes: pendentes, taxaEmissao: 85 });
      }
      setLoading(false);
    };
    if (user && role === 'GESTOR') fetchDashboard();
  }, [user, role]);

  if (userLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>;

  return (
    <DashboardLayout title="Visão Geral" subtitle="Acompanhe as métricas e desempenho do comissionamento.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Faturamento (Entradas)</p>
            <h2 className="text-3xl font-bold text-white">R$ {stats.faturamento.toFixed(2)}</h2>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-orange-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-orange-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Comissões Apuradas</p>
            <h2 className="text-3xl font-bold text-white">R$ {stats.comissoes.toFixed(2)}</h2>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-rose-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-rose-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Vendas Pendentes</p>
            <h2 className="text-3xl font-bold text-white">{stats.vendasPendentes}</h2>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-red-500/30 transition-all hover:-translate-y-1 group">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Regularização DOC</p>
            <h2 className="text-3xl font-bold text-white">{stats.taxaEmissao}%</h2>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center h-72 border-dashed mt-8 relative overflow-hidden group hover:bg-slate-900/60 transition-colors">
           <div className="absolute inset-0 bg-gradient-to-t from-rose-900/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
             <Download className="w-8 h-8 text-rose-400" />
           </div>
           <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/25">
              Exportar Relatório Consolidado (CSV)
           </button>
           <p className="text-sm text-slate-500 mt-4">Inclui listagem completa de apuração para folha de pagamento</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
