"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';

export default function NovoAluno() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('alunos').insert({ nome, cpf, email, criado_por: user.id }).select().single();
    if (error) {
      alert("Erro ao criar: " + error.message);
      setLoading(false);
    } else {
      router.push(`/alunos/${data.id}`);
    }
  };

  return (
    <DashboardLayout title="Cadastrar Aluno" subtitle="Insira os dados iniciais do aluno para compor a ficha de documentação e contrato.">
      <div className="w-full max-w-lg bg-slate-900/60 border border-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mt-4">
         <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-rose-500/20 border border-white/5">
           <UserPlus className="w-8 h-8" />
         </div>
         
         <form onSubmit={handleCreate} className="space-y-6">
           <div>
             <label className="text-sm font-semibold text-slate-300 mb-2 block">Nome Completo</label>
             <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full bg-slate-950/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner" placeholder="Ex: João da Silva" />
           </div>
           <div>
             <label className="text-sm font-semibold text-slate-300 mb-2 block">CPF</label>
             <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} required className="w-full bg-slate-950/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner" placeholder="000.000.000-00" />
           </div>
           <div>
             <label className="text-sm font-semibold text-slate-300 mb-2 block">E-mail</label>
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner" placeholder="aluno@email.com" />
           </div>
           <button type="submit" disabled={loading} className="w-full py-4 mt-8 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/25 flex justify-center items-center gap-2">
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Avançar e Criar'} {!loading && <ArrowRight className="w-5 h-5"/>}
           </button>
         </form>
      </div>
    </DashboardLayout>
  );
}
