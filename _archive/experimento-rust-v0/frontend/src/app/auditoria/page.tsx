'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { VendaDetalhada, AppRole } from '@/types'

type Tab = 'pendentes' | 'resolvidas'

const pendentesMock: VendaDetalhada[] = [
  { id: 'v1', aluno_id: 'a1', curso_id: 'c1', aluno_nome: 'João Silva', curso_nome: 'Formação em Vendas Avançado', valor_entrada: 1500, status_venda: 'PENDENTE_VALIDACAO', criado_em: '2026-07-20T10:30:00' },
  { id: 'v2', aluno_id: 'a2', curso_id: 'c2', aluno_nome: 'Maria Santos', curso_nome: 'MBA em Gestão Comercial', valor_entrada: 3000, status_venda: 'PENDENTE_VALIDACAO', criado_em: '2026-07-19T14:00:00' },
  { id: 'v3', aluno_id: 'a3', curso_id: 'c3', aluno_nome: 'Pedro Oliveira', curso_nome: 'Pacote Office Completo', valor_entrada: 800, status_venda: 'PENDENTE_VALIDACAO', criado_em: '2026-07-18T09:15:00' },
  { id: 'v4', aluno_id: 'a4', curso_id: 'c4', aluno_nome: 'Ana Costa', curso_nome: 'Programação Web Full Stack', valor_entrada: 2500, status_venda: 'PENDENTE_VALIDACAO', criado_em: '2026-07-17T16:45:00' },
]

const resolvidasMock: VendaDetalhada[] = [
  { id: 'v5', aluno_id: 'a5', curso_id: 'c5', aluno_nome: 'Carlos Souza', curso_nome: 'Design Gráfico', valor_entrada: 1200, status_venda: 'APROVADA', criado_em: '2026-07-15T11:00:00' },
  { id: 'v6', aluno_id: 'a6', curso_id: 'c6', aluno_nome: 'Fernanda Lima', curso_nome: 'Marketing Digital', valor_entrada: 1800, status_venda: 'APROVADA', criado_em: '2026-07-14T08:30:00' },
  { id: 'v7', aluno_id: 'a7', curso_id: 'c7', aluno_nome: 'Rafael Almeida', curso_nome: 'Excel Avançado', valor_entrada: 600, status_venda: 'DEVOLVIDA_AJUSTE', criado_em: '2026-07-13T13:20:00' },
]

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(iso))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function AuditoriaPage() {
  const router = useRouter()
  const [role, setRole] = useState<AppRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pendentes')
  const [search, setSearch] = useState('')
  const [evidenceSale, setEvidenceSale] = useState<VendaDetalhada | null>(null)
  const [devolverSale, setDevolverSale] = useState<VendaDetalhada | null>(null)
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((p) => {
      setRole((p ?? null) as AppRole | null)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!loading && role !== 'AUDITOR') {
      router.push('/dashboard')
    }
  }, [loading, role, router])

  const filterList = useCallback(
    (items: VendaDetalhada[]) => {
      if (!search.trim()) return items
      const q = search.toLowerCase()
      return items.filter(
        (i) =>
          i.aluno_nome.toLowerCase().includes(q) ||
          i.curso_nome.toLowerCase().includes(q),
      )
    },
    [search],
  )

  async function handleAprovar(id: string) {
    setActionLoading(id)
    await fetch(`/api/v1/auditoria/${id}/aprovar`, { method: 'POST' })
    setActionLoading(null)
  }

  function handleDevolverOpen(sale: VendaDetalhada) {
    setDevolverSale(sale)
    setMotivo('')
    setErrorMotivo('')
  }

  async function handleDevolverConfirm() {
    if (motivo.trim().length < 10) {
      setErrorMotivo('O motivo deve ter pelo menos 10 caracteres.')
      return
    }
    if (!devolverSale) return
    setActionLoading(devolverSale.id)
    await fetch(`/api/v1/auditoria/${devolverSale.id}/devolver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo_devolucao: motivo.trim() }),
    })
    setActionLoading(null)
    setDevolverSale(null)
    setMotivo('')
    setErrorMotivo('')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (role !== 'AUDITOR') return null

  const pendentes = filterList(pendentesMock)
  const resolvidas = filterList(resolvidasMock)

  return (
    <main className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Auditoria de Apontamentos
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            Em construção — dados mockados
          </span>
        </div>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por aluno ou curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="mb-6 flex gap-1 rounded-lg border border-slate-700 bg-slate-800 p-1">
          {(['pendentes', 'resolvidas'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                tab === t
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'pendentes' ? 'Pendentes' : 'Resolvidas'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {(tab === 'pendentes' ? pendentes : resolvidas).map((sale) => (
            <div
              key={sale.id}
              className="rounded-lg border border-slate-700 bg-slate-800 p-4 transition hover:border-slate-600"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-white">{sale.aluno_nome}</p>
                  <p className="text-sm text-slate-400">{sale.curso_nome}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{formatCurrency(sale.valor_entrada)}</span>
                    <span>{formatDate(sale.criado_em)}</span>
                    {sale.status_venda === 'DEVOLVIDA_AJUSTE' && (
                      <span className="text-red-400">Devolvida para ajuste</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEvidenceSale(sale)}
                    className="rounded-lg border border-slate-600 p-2 text-slate-400 transition hover:border-slate-500 hover:text-white"
                    title="Ver comprovante"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {sale.status_venda === 'PENDENTE_VALIDACAO' && (
                    <>
                      <button
                        onClick={() => handleAprovar(sale.id)}
                        disabled={actionLoading === sale.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {actionLoading === sale.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleDevolverOpen(sale)}
                        disabled={actionLoading === sale.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Devolver
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(tab === 'pendentes' ? pendentes : resolvidas).length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              Nenhum resultado encontrado.
            </p>
          )}
        </div>
      </div>

      {evidenceSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEvidenceSale(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Comprovante</h2>
              <button
                onClick={() => setEvidenceSale(null)}
                className="text-slate-400 transition hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 space-y-1 text-sm text-slate-400">
              <p>
                <span className="text-slate-300">Aluno:</span>{' '}
                {evidenceSale.aluno_nome}
              </p>
              <p>
                <span className="text-slate-300">Curso:</span>{' '}
                {evidenceSale.curso_nome}
              </p>
              <p>
                <span className="text-slate-300">Valor:</span>{' '}
                {formatCurrency(evidenceSale.valor_entrada)}
              </p>
            </div>
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-700/50">
              <div className="text-center text-slate-500">
                <Eye className="mx-auto mb-2 h-8 w-8" />
                <p className="text-sm">Comprovante mockado</p>
                <p className="text-xs">(placeholder para imagem real)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {devolverSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDevolverSale(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-white">
              Devolver Apontamento
            </h2>
            <p className="mb-4 text-sm text-slate-400">
              Apontamento de <strong className="text-white">{devolverSale.aluno_nome}</strong> —{' '}
              {devolverSale.curso_nome}
            </p>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Motivo da devolução
            </label>
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value)
                if (e.target.value.trim().length >= 10) setErrorMotivo('')
              }}
              rows={4}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Descreva o motivo da devolução (mín. 10 caracteres)"
            />
            {errorMotivo && (
              <p className="mt-1 text-xs text-red-400">{errorMotivo}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDevolverSale(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleDevolverConfirm}
                disabled={actionLoading === devolverSale.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {actionLoading === devolverSale.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirmar Devolução
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
