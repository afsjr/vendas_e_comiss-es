"use client";

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AlertTriangle, Loader2, Search, Users } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { formatCpf, isValidCpf } from '@/lib/cpf';

interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  email: string | null;
  criado_por: string;
  criado_em: string;
}

export default function AlunosPage() {
  const { user, role, loading: userLoading } = useUser();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verCompleto = role === 'GESTOR' || role === 'AUDITOR';

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: aData, error: aError }, { data: pData }] = await Promise.all([
        supabase.from('alunos_resumo').select('id, nome, cpf, email, criado_por, criado_em').order('nome', { ascending: true }),
        supabase.from('perfis').select('id, email'),
      ]);
      if (aError) setError('Não foi possível carregar os alunos.');
      setAlunos((aData as Aluno[]) || []);
      const map: Record<string, string> = {};
      (pData || []).forEach((p: any) => { map[p.id] = p.email; });
      setUsuarios(map);
      setLoading(false);
    })();
  }, [user]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return alunos;
    return alunos.filter((a) =>
      a.nome?.toLowerCase().includes(termo) ||
      (a.email || '').toLowerCase().includes(termo) ||
      a.cpf.includes(termo.replace(/\D/g, '')),
    );
  }, [alunos, busca]);

  if (userLoading || loading) {
    return (
      <DashboardLayout title="Alunos">
        <div className="flex items-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /> Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Alunos" subtitle="Consulta de alunos cadastrados.">
      <div className="space-y-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou CPF"
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white outline-none focus:border-rose-500"
          />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
          {filtrados.length === 0 ? (
            <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-slate-600" />
              {alunos.length === 0 ? 'Nenhum aluno cadastrado.' : 'Nenhum aluno encontrado para a busca.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/60 text-slate-400">
                  <tr>
                    <th className="text-left p-4 font-semibold">Nome</th>
                    <th className="text-left p-4 font-semibold">CPF</th>
                    <th className="text-left p-4 font-semibold">E-mail</th>
                    <th className="text-left p-4 font-semibold">Cadastrado por</th>
                    <th className="text-left p-4 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((a) => {
                    const cpfInvalido = verCompleto && !isValidCpf(a.cpf);
                    return (
                      <tr key={a.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <Link href={`/alunos/${a.id}`} className="text-white font-medium hover:text-rose-400">{a.nome}</Link>
                        </td>
                        <td className="p-4 text-slate-300 font-mono">
                          <span className="inline-flex items-center gap-2">
                            {verCompleto ? formatCpf(a.cpf) : a.cpf}
                            {cpfInvalido && verCompleto && (
                              <span className="inline-flex items-center gap-1 text-rose-400 text-xs" title="CPF com dígito verificador inválido">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{a.email || '—'}</td>
                        <td className="p-4 text-slate-400">{usuarios[a.criado_por] || '—'}</td>
                        <td className="p-4 text-slate-400">{new Date(a.criado_em).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
