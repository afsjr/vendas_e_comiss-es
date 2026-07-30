"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { Wallet, ArrowDownRight, Clock, Loader2 } from 'lucide-react';

export default function CarteiraPage() {
  const { user, loading: userLoading } = useUser();
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && user) {
      fetchComissoes();
    }
  }, [user, userLoading]);

  const fetchComissoes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comissoes')
      .select('*, vendas(cursos(nome), alunos(nome))')
      .order('criado_em', { ascending: false });
    
    if (data) setComissoes(data);
    setLoading(false);
  };

  if (userLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  const totalPago = comissoes.filter(c => c.status === 'PAGA').reduce((acc, c) => acc + c.valor_comissao, 0);
  const totalAprovado = comissoes.filter(c => c.status === 'LIBERADA_PAGAMENTO').reduce((acc, c) => acc + c.valor_comissao, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
      <header className="bg-slate-900/80 border-b border-white/5 p-6 sticky top-0 z-40 backdrop-blur-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            Minha Carteira
          </h1>
          <p className="text-sm text-slate-400 mt-1">Extrato de comissões</p>
        </div>
        <Wallet className="w-8 h-8 text-teal-400 opacity-50" />
      </header>

      <main className="p-4 max-w-lg mx-auto mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <p className="text-emerald-100 text-sm font-medium mb-1 flex items-center gap-2"><ArrowDownRight className="w-4 h-4"/> Recebido</p>
            <h2 className="text-3xl font-bold text-white">R$ {totalPago.toFixed(2)}</h2>
          </div>
          <div className="bg-slate-900/80 border border-white/5 backdrop-blur-md rounded-3xl p-6">
             <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2"><Clock className="w-4 h-4"/> A Receber</p>
             <h2 className="text-3xl font-bold text-white">R$ {totalAprovado.toFixed(2)}</h2>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white px-2">Histórico</h3>
          {comissoes.map(c => (
            <div key={c.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:bg-slate-900/80 transition-colors">
              <div>
                <p className="font-medium text-white">{c.vendas?.cursos?.nome}</p>
                <p className="text-xs text-slate-400">{c.vendas?.alunos?.nome}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${c.status === 'PAGA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {c.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-right">
                <p className={`font-bold ${c.status === 'PAGA' ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {c.status === 'PAGA' ? '+' : ''} R$ {c.valor_comissao.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{new Date(c.criado_em).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
