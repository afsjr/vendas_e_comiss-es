"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session.user.app_metadata?.app_role;
        if (role === 'AUDITOR') router.push('/auditoria');
        else if (role === 'GESTOR') router.push('/dashboard');
        else router.push('/vendas/novo');
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      setError('Credenciais inválidas. Tente novamente.');
      setLoading(false);
      return;
    }
    
    const role = data.user?.app_metadata?.app_role;
    if (role === 'AUDITOR') router.push('/auditoria');
    else if (role === 'GESTOR') router.push('/dashboard');
    else router.push('/vendas/novo');
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-950 font-sans">
      
      {/* Left Panel - Creative Visual Area */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden border-r border-white/5">
         {/* Abstract glowing layers */}
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-900/40 via-slate-900 to-slate-950" />
         <div className="absolute w-[600px] h-[600px] bg-red-500/20 rounded-full blur-[100px] top-1/4 left-1/4 -translate-x-1/2 mix-blend-screen" />
         <div className="absolute w-[400px] h-[400px] bg-rose-500/20 rounded-full blur-[80px] bottom-0 right-0 mix-blend-screen animate-pulse" />
         
         {/* Floating grid pattern */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
         
         {/* Content */}
         <div className="relative z-10 p-12 text-slate-200 flex flex-col justify-center h-full max-w-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-rose-500/20 border border-white/10">
               <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-5xl font-extrabold mb-6 leading-tight text-white tracking-tight">
              Acelere suas matrículas. <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-red-400">
                Otimize seus ganhos.
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-12 leading-relaxed">
              O ecossistema completo para registrar alunos, validar comprovantes e auditar comissionamentos com transparência absoluta e em tempo real.
            </p>
            
            {/* Floating Info Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative shadow-2xl transform transition-transform hover:-translate-y-1">
              <div className="absolute -left-4 -top-4 w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                 <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-start gap-4">
                 <TrendingUp className="w-8 h-8 text-emerald-400 mt-1 flex-shrink-0" />
                 <div>
                   <h3 className="text-white font-bold text-lg mb-1">Auditoria Inteligente</h3>
                   <p className="text-sm text-slate-400">Fluxos de validação de vendas integrados diretamente ao storage de comprovantes.</p>
                 </div>
              </div>
            </div>
         </div>
      </div>

      {/* Right Panel - Login Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-slate-950 to-slate-950 pointer-events-none" />
         
        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 lg:mb-12">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Bem-vindo de volta</h2>
            <p className="text-slate-400 text-lg">Insira suas credenciais para acessar o sistema.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">E-mail corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all outline-none shadow-inner"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex justify-between">
                <span>Senha de acesso</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all outline-none shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl text-white font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/25 mt-8"
            >
              {loading ? 'Autenticando...' : 'Acessar Plataforma'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
