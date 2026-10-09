'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, ChevronLeft, ShieldAlert, X } from 'lucide-react';

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export default function GlobalAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('aviso') === 'acesso-negado') {
      setNotice('Acesso negado para o seu perfil.');
      const url = new URL(window.location.href);
      url.searchParams.delete('aviso');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Session inactivity timeout
  useEffect(() => {
    if (!isAuthenticated || pathname === '/auth/login') return;

    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
      }, TIMEOUT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimeout));
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimeout));
    };
  }, [isAuthenticated, pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (!isAuthenticated || pathname === '/auth/login') return null;

  return (
    <>
      {notice && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{notice}</span>
          <button
            onClick={() => setNotice(null)}
            aria-label="Fechar aviso"
            className="ml-2 text-red-300/70 hover:text-red-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="bg-slate-900 border-b border-white/10 px-5 py-3 flex justify-between items-center sticky top-0 z-[60] shadow-md">
        <button 
          onClick={() => {
            // Prevent back button on root dashboard, redirect to home if possible
            if (pathname === '/dashboard') return;
            router.back();
          }} 
          className={`flex items-center gap-1 transition-colors ${pathname === '/dashboard' ? 'text-transparent pointer-events-none' : 'text-slate-300 hover:text-white'}`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-4 py-2 rounded-full border border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </>
  );
}
