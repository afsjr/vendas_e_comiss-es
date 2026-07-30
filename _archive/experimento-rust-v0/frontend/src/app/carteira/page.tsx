'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import {
  Wallet,
  CheckCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { Comissao, AppRole, StatusComissao } from '@/types'

const comissoesMock: Comissao[] = [
  { venda_id: 'V001', curso_nome: 'Formação em Vendas', valor_comissao: 450, status_comissao: 'PAGA', data_liberacao: '2026-07-15' },
  { venda_id: 'V002', curso_nome: 'MBA em Gestão Comercial', valor_comissao: 900, status_comissao: 'LIBERADA_PAGAMENTO', data_liberacao: '2026-07-22' },
  { venda_id: 'V003', curso_nome: 'Pacote Office Completo', valor_comissao: 240, status_comissao: 'BLOQUEADA_AUDITORIA', data_liberacao: null },
  { venda_id: 'V004', curso_nome: 'Programação Web Full Stack', valor_comissao: 750, status_comissao: 'AGUARDANDO_INICIO_AULAS', data_liberacao: null },
  { venda_id: 'V005', curso_nome: 'Design Gráfico', valor_comissao: 360, status_comissao: 'ESTORNADA', data_liberacao: '2026-07-10' },
  { venda_id: 'V006', curso_nome: 'Marketing Digital', valor_comissao: 540, status_comissao: 'LIBERADA_PAGAMENTO', data_liberacao: '2026-07-21' },
  { venda_id: 'V007', curso_nome: 'Excel Avançado', valor_comissao: 180, status_comissao: 'PAGA', data_liberacao: '2026-07-14' },
  { venda_id: 'V008', curso_nome: 'Inglês Corporativo', valor_comissao: 300, status_comissao: 'AGUARDANDO_INICIO_AULAS', data_liberacao: null },
]

const statusLabel: Record<StatusComissao, string> = {
  BLOQUEADA_AUDITORIA: 'Bloqueada (Auditoria)',
  AGUARDANDO_INICIO_AULAS: 'Aguardando Início Aulas',
  LIBERADA_PAGAMENTO: 'Liberada p/ Pagamento',
  PAGA: 'Paga',
  ESTORNADA: 'Estornada',
}

const statusColor: Record<StatusComissao, string> = {
  BLOQUEADA_AUDITORIA: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  AGUARDANDO_INICIO_AULAS: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  LIBERADA_PAGAMENTO: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  PAGA: 'bg-green-500/10 text-green-400 ring-green-500/20',
  ESTORNADA: 'bg-red-500/10 text-red-400 ring-red-500/20',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(date))
}

export default function CarteiraPage() {
  const router = useRouter()
  const [role, setRole] = useState<AppRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile().then((p) => {
      setRole((p ?? null) as AppRole | null)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!loading && role !== 'VENDEDOR' && role !== 'SECRETARIA') {
      router.push('/dashboard')
    }
  }, [loading, role, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (role !== 'VENDEDOR' && role !== 'SECRETARIA') return null

  const total = comissoesMock.reduce((acc, c) => acc + c.valor_comissao, 0)
  const liberadas = comissoesMock
    .filter((c) => c.status_comissao === 'LIBERADA_PAGAMENTO')
    .reduce((acc, c) => acc + c.valor_comissao, 0)
  const pendentes = comissoesMock
    .filter((c) => c.status_comissao === 'AGUARDANDO_INICIO_AULAS' || c.status_comissao === 'BLOQUEADA_AUDITORIA')
    .reduce((acc, c) => acc + c.valor_comissao, 0)
  const pagas = comissoesMock
    .filter((c) => c.status_comissao === 'PAGA')
    .reduce((acc, c) => acc + c.valor_comissao, 0)

  const cards = [
    { titulo: 'Total de Comissões', valor: formatCurrency(total), Icon: Wallet, color: 'text-blue-400' },
    { titulo: 'Comissões Liberadas', valor: formatCurrency(liberadas), Icon: DollarSign, color: 'text-emerald-400' },
    { titulo: 'Comissões Pendentes', valor: formatCurrency(pendentes), Icon: Clock, color: 'text-yellow-400' },
    { titulo: 'Comissões Pagas', valor: formatCurrency(pagas), Icon: CheckCircle, color: 'text-green-400' },
  ]

  return (
    <main className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Minha Carteira</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            Em construção — dados mockados
          </span>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.titulo}
              className="rounded-xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-600"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {card.titulo}
                </span>
                <card.Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{card.valor}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Venda ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Curso</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Valor Comissão</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Data Liberação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {comissoesMock.map((c) => (
                  <tr key={c.venda_id} className="bg-slate-800/50 transition hover:bg-slate-800">
                    <td className="px-4 py-3 font-mono text-xs text-white">{c.venda_id}</td>
                    <td className="px-4 py-3 text-white">{c.curso_nome}</td>
                    <td className="px-4 py-3 text-white">{formatCurrency(c.valor_comissao)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusColor[c.status_comissao]}`}
                      >
                        {statusLabel[c.status_comissao]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(c.data_liberacao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
