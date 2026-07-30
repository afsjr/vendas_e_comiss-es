'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Check, X, FileText, User } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'
import type { AppRole } from '@/types'

type DocKey = 'rg' | 'cpf' | 'comprovante_residencia' | 'historico_escolar'

interface DocItem {
  key: DocKey
  label: string
  file: File | null
  status: 'Pendente' | 'Entregue'
}

const DOCS: DocItem[] = [
  { key: 'rg', label: 'RG', file: null, status: 'Pendente' },
  { key: 'cpf', label: 'CPF', file: null, status: 'Pendente' },
  { key: 'comprovante_residencia', label: 'Comprovante de Residência', file: null, status: 'Pendente' },
  { key: 'historico_escolar', label: 'Histórico Escolar', file: null, status: 'Pendente' },
]

function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) return false
  const calc = (digits: string, factors: number[]) =>
    digits.split('').reduce((sum, d, i) => sum + parseInt(d) * factors[i], 0)
  const d1 = calc(cleaned.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const r1 = (d1 * 10) % 11; if (r1 === 10) r1 = 0
  if (r1 !== parseInt(cleaned[9])) return false
  const d2 = calc(cleaned.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  const r2 = (d2 * 10) % 11; if (r2 === 10) r2 = 0
  return r2 === parseInt(cleaned[10])
}

export default function NovoAlunoPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [rg, setRg] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [docs, setDocs] = useState<DocItem[]>(DOCS)
  const [contratoUrl, setContratoUrl] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [cpfError, setCpfError] = useState<string | null>(null)

  function handleCpfChange(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 11)
    setCpf(cleaned)
    if (cleaned.length === 11) {
      setCpfError(isValidCPF(cleaned) ? null : 'CPF inválido')
    } else {
      setCpfError(null)
    }
  }

  function handleDocUpload(key: DocKey, file: File) {
    setDocs((prev) =>
      prev.map((d) =>
        d.key === key ? { ...d, file, status: 'Entregue' as const } : d
      )
    )
  }

  function handleDocRemove(key: DocKey) {
    setDocs((prev) =>
      prev.map((d) =>
        d.key === key ? { ...d, file: null, status: 'Pendente' as const } : d
      )
    )
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const supabase = createBrowserClient()
    await new Promise((r) => setTimeout(r, 800))
    // mock – salvo localmente no state
    const mockAluno = {
      id: crypto.randomUUID(),
      nome,
      cpf,
      rg,
      email,
      telefone,
      documentos: docs.map((d) => ({ nome: d.key, status: d.status })),
      criado_em: new Date().toISOString(),
    }
    console.log('Aluno salvo (mock):', mockAluno)
    setSalvando(false)
  }

  async function handleGerarContrato() {
    setGerando(true)
    await new Promise((r) => setTimeout(r, 1200))
    const mockUrl = `https://contratos.example.com/aluno/${crypto.randomUUID().slice(0, 8)}.pdf`
    setContratoUrl(mockUrl)
    setGerando(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <User className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Cadastro de Aluno</h1>
        </div>

        <form onSubmit={handleSalvar} className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Dados Pessoais</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="nome" className="block text-sm font-medium text-slate-300">
                  Nome completo <span className="text-red-400">*</span>
                </label>
                <input
                  id="nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Nome completo do aluno"
                />
              </div>
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-slate-300">
                  CPF <span className="text-red-400">*</span>
                </label>
                <input
                  id="cpf"
                  type="text"
                  required
                  maxLength={11}
                  value={cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 ${
                    cpfError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500'
                  } bg-slate-800`}
                  placeholder="Apenas números"
                />
                {cpfError && <p className="mt-1 text-xs text-red-400">{cpfError}</p>}
              </div>
              <div>
                <label htmlFor="rg" className="block text-sm font-medium text-slate-300">
                  RG
                </label>
                <input
                  id="rg"
                  type="text"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="RG"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="email@provedor.com"
                />
              </div>
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-slate-300">
                  Telefone
                </label>
                <input
                  id="telefone"
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Documentos</h2>
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-200">{doc.label}</span>
                    {doc.status === 'Entregue' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        <Check className="h-3 w-3" />
                        Entregue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                        <X className="h-3 w-3" />
                        Pendente
                      </span>
                    )}
                    {doc.file && (
                      <span className="max-w-[160px] truncate text-xs text-slate-500">
                        {doc.file.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'Entregue' ? (
                      <button
                        type="button"
                        onClick={() => handleDocRemove(doc.key)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-red-400"
                        title="Remover arquivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <label className="cursor-pointer rounded-lg bg-slate-700 p-2 text-slate-300 transition hover:bg-slate-600">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleDocUpload(doc.key, file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={salvando || !!cpfError}
              className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {salvando ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Salvando…
                </span>
              ) : (
                'Salvar Cadastro'
              )}
            </button>

            <button
              type="button"
              onClick={handleGerarContrato}
              disabled={gerando}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-6 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {gerando ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                  Gerando…
                </span>
              ) : (
                'Gerar Contrato'
              )}
            </button>
          </div>

          {contratoUrl && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-sm text-emerald-300">
                Contrato gerado com sucesso!{' '}
                <a
                  href={contratoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-emerald-200"
                >
                  Abrir contrato
                </a>
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
