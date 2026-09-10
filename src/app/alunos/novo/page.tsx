"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowRight, Loader2, Phone, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useUser } from '@/hooks/useUser';
import { isValidCpf, formatCpf, formatPhone } from '@/lib/cpf';

export default function NovoAluno() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isWhatsapp, setIsWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const router = useRouter();
  const { user } = useUser();

  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setCpf(formatted);
    if (formatted.length === 14) {
      setCpfError(isValidCpf(formatted) ? '' : 'CPF inválido');
    } else {
      setCpfError('');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isValidCpf(cpf)) {
      setCpfError('CPF inválido');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from('alunos').insert({
      nome,
      cpf: cpf.replace(/\D/g, ''),
      email,
      telefone: telefone.replace(/\D/g, '') || null,
      is_whatsapp: isWhatsapp,
      criado_por: user.id,
    }).select().single();
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
             <input type="text" value={cpf} onChange={e => handleCpfChange(e.target.value)} required maxLength={14} className={`w-full bg-slate-950/50 border p-4 rounded-xl text-white outline-none transition-all shadow-inner ${cpfError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'}`} placeholder="000.000.000-00" />
             {cpfError && (
               <p className="text-red-400 text-xs mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{cpfError}</p>
             )}
           </div>
           <div>
             <label className="text-sm font-semibold text-slate-300 mb-2 block">E-mail</label>
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner" placeholder="aluno@email.com" />
           </div>
           <div>
             <label className="text-sm font-semibold text-slate-300 mb-2 block">Telefone</label>
             <div className="flex gap-3">
               <div className="relative flex-1">
                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input type="text" value={telefone} onChange={e => setTelefone(formatPhone(e.target.value))} maxLength={15} className="w-full bg-slate-950/50 border border-white/10 pl-11 pr-4 p-4 rounded-xl text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all shadow-inner" placeholder="(00) 00000-0000" />
               </div>
               <button type="button" onClick={() => setIsWhatsapp(!isWhatsapp)} className={`px-4 rounded-xl border font-bold text-sm transition-all ${isWhatsapp ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-950/50 border-white/10 text-slate-400 hover:border-white/20'}`}>
                 {isWhatsapp ? 'WhatsApp' : 'Sem WhatsApp'}
               </button>
             </div>
           </div>
           <button type="submit" disabled={loading} className="w-full py-4 mt-8 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/25 flex justify-center items-center gap-2">
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Avançar e Criar'} {!loading && <ArrowRight className="w-5 h-5"/>}
           </button>
         </form>
      </div>
    </DashboardLayout>
  );
}
