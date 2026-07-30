'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { AppRole, DashboardKpi } from '@/types'

interface CursoFaturamento {
  curso: string
  valor: number
}

interface VendaRecente {
  id: string
  aluno: string
  curso: string
  valor: number
  data: string
}

const kpis: (DashboardKpi & { Icon: React.ComponentType<{ className?: string }> })[] = [
  { titulo: 'Faturamento do Mês', valor: 'R$ 158.430', variacao: '+12,5%', Icon: DollarSign },
  { titulo: 'Comissões Apuradas', valor: 'R$ 47.529', variacao: '+8,3%', Icon: TrendingUp },
  { titulo: 'Taxa de Contratos Emitidos', valor: '87,5%', variacao: '+3,2 p.p.', Icon: FileText },
  { titulo: 'Taxa de Regularização Documental', valor: '92,3%', variacao: '+1,8 p.p.', Icon: Users },
]

const faturamentoPorCurso: CursoFaturamento[] = [
  { curso: 'Formação em Vendas', valor: 45000 },
  { curso: 'MBA em Gestão Comercial', valor: 38000 },
  { curso: 'Programação Web Full Stack', valor: 25000 },
  { curso: 'Marketing Digital', valor: 22000 },
  { curso: 'Design Gráfico', valor: 18430 },
  { curso: 'Outros', valor: 10000 },
]

const vendasRecentes: VendaRecente[] = [
  { id: 'V024', aluno: 'João Silva', curso: 'Formação em Vendas Avançado', valor: 1500, data: '20/07/2026' },
  { id: 'V023', aluno: 'Maria Santos', curso: 'MBA em Gestão Comercial', valor: 3000, data: '19/07/2026' },
  { id: 'V022', aluno: 'Pedro Oliveira', curso: 'Pacote Office Completo', valor: 800, data: '18/07/2026' },
  { id: 'V021', aluno: 'Ana Costa', curso: 'Programação Web Full Stack', valor: 2500, data: '17/07/2026' },
  { id: 'V020', aluno: 'Carlos Souza', curso: 'Design Gráfico', valor: 1200, data: '15/07/2026' },
]

const maxFaturamento = Math.max(...faturamentoPorCurso.map((c) => c.valor))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function DashboardPage() {
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
    if (!loading && role !== 'GESTOR') {
      router.push('/')
    }
  }, [loading, role, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (role !== 'GESTOR') return null

  return (
    <main className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Dashboard Gerencial</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            Em construção — dados mockados
          </span>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const colors: Record<string, string> = {
              DollarSign: 'text-emerald-400',
              TrendingUp: 'text-blue-400',
              FileText: 'text-violet-400',
              Users: 'text-amber-400',
            }
            return (
              <div
                key={kpi.titulo}
                className="rounded-xl border border-slate-700 bg-slate-800 p-5 transition hover:border-slate-600"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {kpi.titulo}
                  </span>
                  <kpi.Icon className={`h-5 w-5 ${colors[kpi.Icon.displayName ?? 'DollarSign'] ?? 'text-slate-400'}`} />
                </div>
                <p className="text-2xl font-bold text-white">{kpi.valor}</p>
                <p className="mt-1 text-xs text-emerald-400">{kpi.variacao}</p>
              </div>
            )
          })}
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Faturamento por Curso</h2>
            <div className="space-y-3">
              {faturamentoPorCurso.map((item) => (
                <div key={item.curso}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{item.curso}</span>
                    <span className="text-slate-400">{formatCurrency(item.valor)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(item.valor / maxFaturamento) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Vendas Recentes</h2>
            <div className="space-y-3">
              {vendasRecentes.map((venda) => (
                <div
                  key={venda.id}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{venda.id}</span>
                      <span className="truncate font-medium text-white">{venda.aluno}</span>
                    </div>
                    <p className="truncate text-xs text-slate-400">{venda.curso}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(venda.valor)}
                    </p>
                    <p className="text-xs text-slate-500">{venda.data}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
