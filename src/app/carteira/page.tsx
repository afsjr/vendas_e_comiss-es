"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { ArrowDownRight, Clock, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

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

  if (userLoading || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>;

  const totalPago = comissoes.filter(c => c.status === 'PAGA').reduce((acc, c) => acc + c.valor_comissao, 0);
  const totalAprovado = comissoes.filter(c => c.status === 'LIBERADA_PAGAMENTO').reduce((acc, c) => acc + c.valor_comissao, 0);

  return (
    <DashboardLayout title="Minha Carteira" subtitle="Extrato de comissões e histórico de pagamentos.">
      <div className="max-w-3xl mx-auto mt-4 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <p className="text-emerald-100 text-sm font-semibold mb-2 flex items-center gap-2"><ArrowDownRight className="w-5 h-5"/> Saldo Recebido</p>
            <h2 className="text-4xl font-bold text-white">R$ {totalPago.toFixed(2)}</h2>
          </div>
          <div className="bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-3xl p-8 shadow-xl">
             <p className="text-slate-400 text-sm font-semibold mb-2 flex items-center gap-2"><Clock className="w-5 h-5"/> A Receber (Aprovado)</p>
             <h2 className="text-4xl font-bold text-white">R$ {totalAprovado.toFixed(2)}</h2>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white px-2 mb-4">Histórico de Transações</h3>
          {comissoes.length === 0 ? (
            <p className="text-slate-500 text-center py-10">Nenhuma comissão registrada ainda.</p>
          ) : (
            comissoes.map(c => (
              <div key={c.id} className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex justify-between items-center hover:bg-slate-800/80 transition-colors shadow-lg">
                <div>
                  <p className="font-semibold text-white text-lg">{c.vendas?.cursos?.nome}</p>
                  <p className="text-sm text-slate-400 font-medium">{c.vendas?.alunos?.nome}</p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full mt-3 inline-block border ${c.status === 'PAGA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-2xl ${c.status === 'PAGA' ? 'text-emerald-400' : 'text-white'}`}>
                    {c.status === 'PAGA' ? '+' : ''} R$ {c.valor_comissao.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{new Date(c.criado_em).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
