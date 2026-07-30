"use client";

import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, UserPlus, FileText, ShieldCheck, Wallet, LogOut, Loader2, Sparkles, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DashboardLayout({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) {
  const { user, role, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const menuItems = [
    { label: 'Visão Geral', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['GESTOR'] },
    { label: 'Nova Venda', href: '/vendas/novo', icon: <FileText className="w-5 h-5" />, roles: ['GESTOR', 'VENDEDOR'] },
    { label: 'Novo Aluno', href: '/alunos/novo', icon: <UserPlus className="w-5 h-5" />, roles: ['GESTOR', 'VENDEDOR'] },
    { label: 'Auditoria', href: '/auditoria', icon: <ShieldCheck className="w-5 h-5" />, roles: ['GESTOR', 'AUDITOR'] },
    { label: 'Carteira', href: '/carteira', icon: <Wallet className="w-5 h-5" />, roles: ['GESTOR', 'VENDEDOR'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(role || ''));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex overflow-hidden">
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/60 backdrop-blur-2xl border-r border-white/5 shadow-2xl flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Area */}
        <div className="h-20 flex items-center px-6 border-b border-white/5 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-rose-900/20 to-slate-900/0 pointer-events-none" />
           <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-rose-500/20 border border-white/10 z-10">
             <Sparkles className="w-5 h-5 text-white" />
           </div>
           <span className="font-bold text-lg text-white tracking-tight z-10">SalesCore</span>
           
           <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden ml-auto z-10 p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {allowedItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(225,29,72,0.1)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-2 shadow-inner border border-white/5">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-white truncate w-full text-center">{user?.email}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full mt-1 mb-4 border border-rose-500/20">
              {role}
            </span>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-white/5">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              {title && <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-red-400">{title}</h1>}
              {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-3">
             {/* Decorative right side element, optional */}
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
             <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sistema Online</span>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-10 relative">
           {/* Global Background ambient glow */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
           <div className="relative z-10 max-w-7xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}
