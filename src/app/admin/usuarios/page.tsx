'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Perfil, AppRole } from '@/types';
import { atualizarRole } from '@/app/actions/usuarios';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      setErro('Erro ao carregar usuários. Verifique se você tem permissão.');
    } else {
      setUsuarios(data as Perfil[]);
    }
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: AppRole) {
    const res = await atualizarRole(userId, newRole);
    if (res.error) {
      alert(`Erro: ${res.error}`);
    } else {
      // Atualiza a lista local
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  }

  if (loading) return <div className="p-8">Carregando usuários...</div>;
  if (erro) return <div className="p-8 text-red-600">{erro}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Administração de Usuários</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left py-3 px-4">Nome</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Role Atual</th>
              <th className="text-left py-3 px-4">Ação</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{user.nome || 'N/A'}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${user.role === 'GESTOR' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'VENDEDOR' ? 'bg-green-100 text-green-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <select 
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as AppRole)}
                    className="border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="SECRETARIA">Secretaria</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="GESTOR">Gestor</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
