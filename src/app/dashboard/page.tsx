"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, TrendingUp, DollarSign, Download, Users, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <header className="bg-slate-900/80 border-b border-white/5 p-6 sticky top-0 z-40 backdrop-blur-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-red-400">
            Visão Geral
          </h1>
          <p className="text-sm text-slate-400 mt-1">Dashboard Gerencial</p>
        </div>
        <LayoutDashboard className="w-8 h-8 text-rose-400 opacity-50" />
      </header>
      
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-emerald-500/30 transition-colors">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Faturamento (Entradas)</p>
            <h2 className="text-3xl font-bold text-white">R$ {stats.faturamento.toFixed(2)}</h2>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-orange-500/30 transition-colors">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Comissões Apuradas</p>
            <h2 className="text-3xl font-bold text-white">R$ {stats.comissoes.toFixed(2)}</h2>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-rose-500/30 transition-colors">
            <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Vendas Pendentes</p>
            <h2 className="text-3xl font-bold text-white">{stats.vendasPendentes}</h2>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:border-red-500/30 transition-colors">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Regularização DOC</p>
            <h2 className="text-3xl font-bold text-white">{stats.taxaEmissao}%</h2>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center h-64 border-dashed mt-8">
           <button className="flex items-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-medium transition-colors border border-white/5 shadow-lg group">
              <Download className="w-5 h-5 text-rose-400 group-hover:-translate-y-1 transition-transform" />
              Exportar Relatório Consolidado (CSV)
           </button>
           <p className="text-xs text-slate-500 mt-4">Inclui listagem completa de apuração para folha de pagamento</p>
        </div>
      </main>
    </div>
  );
}
