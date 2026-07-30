import Link from 'next/link';
import { ShieldCheck, TrendingUp, UserPlus, LineChart, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden font-sans text-slate-200">
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[30%] rounded-full bg-purple-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* Header */}
        <header className="text-center mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md mb-8 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-300 tracking-wide">Sistema Operacional</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight text-white">
            Gestão Inteligente de <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Vendas e Comissões
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            Plataforma unificada para lançamento, auditoria e acompanhamento de carteiras estudantis.
          </p>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          
          <Link href="/auth/login" className="group relative bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150" />
            <UserPlus className="w-10 h-10 text-blue-400 mb-6 relative z-10" />
            <h2 className="text-2xl font-bold mb-3 text-white flex items-center justify-between relative z-10">
              Acesso
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed relative z-10">
              Faça login no sistema para iniciar sua sessão segura.
            </p>
          </Link>

          <Link href="/dashboard" className="group relative bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150" />
            <LineChart className="w-10 h-10 text-indigo-400 mb-6 relative z-10" />
            <h2 className="text-2xl font-bold mb-3 text-white flex items-center justify-between relative z-10">
              Dashboard
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed relative z-10">
              Visualize suas métricas, conversões e comissionamentos em tempo real.
            </p>
          </Link>

          <Link href="/vendas/novo" className="group relative bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150" />
            <TrendingUp className="w-10 h-10 text-emerald-400 mb-6 relative z-10" />
            <h2 className="text-2xl font-bold mb-3 text-white flex items-center justify-between relative z-10">
              Nova Venda
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed relative z-10">
              Registre novos alunos, anexe comprovantes e inicie o fluxo.
            </p>
          </Link>

          <Link href="/auditoria" className="group relative bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150" />
            <ShieldCheck className="w-10 h-10 text-purple-400 mb-6 relative z-10" />
            <h2 className="text-2xl font-bold mb-3 text-white flex items-center justify-between relative z-10">
              Auditoria
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed relative z-10">
              Área restrita para aprovação e revisão de transações e comissões.
            </p>
          </Link>

        </div>
      </div>
    </div>
  );
}
