'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, Users } from 'lucide-react'

interface AlunoMock {
  id: string
  nome: string
  cpf: string
  email: string
  documentos: { nome: string; status: 'Pendente' | 'Entregue' }[]
  criado_em: string
}

const MOCK_ALUNOS: AlunoMock[] = [
  {
    id: '1',
    nome: 'Ana Beatriz Silva',
    cpf: '529.982.247-25',
    email: 'ana.silva@email.com',
    documentos: [
      { nome: 'RG', status: 'Entregue' },
      { nome: 'CPF', status: 'Entregue' },
      { nome: 'Comprovante de Residência', status: 'Pendente' },
      { nome: 'Histórico Escolar', status: 'Entregue' },
    ],
    criado_em: '2026-06-15T10:30:00Z',
  },
  {
    id: '2',
    nome: 'Carlos Eduardo Oliveira',
    cpf: '123.456.789-09',
    email: 'carlos.edu@email.com',
    documentos: [
      { nome: 'RG', status: 'Entregue' },
      { nome: 'CPF', status: 'Entregue' },
      { nome: 'Comprovante de Residência', status: 'Entregue' },
      { nome: 'Histórico Escolar', status: 'Pendente' },
    ],
    criado_em: '2026-07-02T14:00:00Z',
  },
  {
    id: '3',
    nome: 'Mariana Costa Rocha',
    cpf: '987.654.321-00',
    email: 'mariana.rocha@email.com',
    documentos: [
      { nome: 'RG', status: 'Pendente' },
      { nome: 'CPF', status: 'Pendente' },
      { nome: 'Comprovante de Residência', status: 'Pendente' },
      { nome: 'Histórico Escolar', status: 'Pendente' },
    ],
    criado_em: '2026-07-10T09:15:00Z',
  },
  {
    id: '4',
    nome: 'Pedro Henrique Almeida',
    cpf: '456.789.123-55',
    email: 'pedro.almeida@email.com',
    documentos: [
      { nome: 'RG', status: 'Entregue' },
      { nome: 'CPF', status: 'Entregue' },
      { nome: 'Comprovante de Residência', status: 'Entregue' },
      { nome: 'Histórico Escolar', status: 'Entregue' },
    ],
    criado_em: '2026-07-18T11:45:00Z',
  },
  {
    id: '5',
    nome: 'Juliana Fernandes Martins',
    cpf: '321.654.987-88',
    email: 'juliana.martins@email.com',
    documentos: [
      { nome: 'RG', status: 'Entregue' },
      { nome: 'CPF', status: 'Pendente' },
      { nome: 'Comprovante de Residência', status: 'Entregue' },
      { nome: 'Histórico Escolar', status: 'Pendente' },
    ],
    criado_em: '2026-07-22T08:30:00Z',
  },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function AlunosPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_ALUNOS
    const q = search.toLowerCase()
    return MOCK_ALUNOS.filter((a) => a.nome.toLowerCase().includes(q))
  }, [search])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Alunos</h1>
          </div>
          <Link
            href="/alunos/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Novo Aluno
          </Link>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-300">Nome</th>
                <th className="px-4 py-3 font-semibold text-slate-300">CPF</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Documentos</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Data Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map((aluno) => {
                const total = aluno.documentos.length
                const pendentes = aluno.documentos.filter(
                  (d) => d.status === 'Pendente'
                ).length
                return (
                  <tr key={aluno.id} className="bg-slate-800/50 transition hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium text-white">{aluno.nome}</td>
                    <td className="px-4 py-3 text-slate-300">{aluno.cpf}</td>
                    <td className="px-4 py-3 text-slate-300">{aluno.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                        <FileText className="h-3 w-3" />
                        {pendentes}/{total} pendentes
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(aluno.criado_em)}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
