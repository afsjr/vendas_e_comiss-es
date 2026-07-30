'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Check, AlertCircle, ArrowLeft, ArrowRight, Search, X } from 'lucide-react'

type Step = 1 | 2 | 3

interface MockAluno {
  id: string
  nome: string
  email: string
  telefone: string
}

interface MockCurso {
  id: string
  nome: string
  valor_curso: number
  categoria: string
}

const MOCK_ALUNOS: MockAluno[] = [
  { id: '1', nome: 'Ana Beatriz Silva', email: 'ana@email.com', telefone: '(11) 99999-0001' },
  { id: '2', nome: 'Carlos Eduardo Santos', email: 'carlos@email.com', telefone: '(11) 99999-0002' },
  { id: '3', nome: 'Fernanda Oliveira Lima', email: 'fernanda@email.com', telefone: '(11) 99999-0003' },
  { id: '4', nome: 'Gabriel Souza Costa', email: 'gabriel@email.com', telefone: '(11) 99999-0004' },
  { id: '5', nome: 'Juliana Pereira Martins', email: 'juliana@email.com', telefone: '(11) 99999-0005' },
  { id: '6', nome: 'Lucas Almeida Rocha', email: 'lucas@email.com', telefone: '(11) 99999-0006' },
  { id: '7', nome: 'Mariana Dias Barbosa', email: 'mariana@email.com', telefone: '(11) 99999-0007' },
  { id: '8', nome: 'Rafael Carvalho Neto', email: 'rafael@email.com', telefone: '(11) 99999-0008' },
]

const MOCK_CURSOS: MockCurso[] = [
  { id: 'c1', nome: 'MBA em Gestão Empresarial', valor_curso: 14990, categoria: 'Pós-Graduação' },
  { id: 'c2', nome: 'MBA em Finanças Corporativas', valor_curso: 12990, categoria: 'Pós-Graduação' },
  { id: 'c3', nome: 'Especialização em Data Science', valor_curso: 9990, categoria: 'Pós-Graduação' },
  { id: 'c4', nome: 'Curso de Liderança e Coaching', valor_curso: 5990, categoria: 'Extensão' },
  { id: 'c5', nome: 'Curso de Marketing Digital', valor_curso: 3990, categoria: 'Extensão' },
  { id: 'c6', nome: 'Curso de Gestão de Projetos (PMP)', valor_curso: 4990, categoria: 'Extensão' },
  { id: 'c7', nome: 'Graduação em Administração (EAD)', valor_curso: 24990, categoria: 'Graduação' },
  { id: 'c8', nome: 'Graduação em Ciências Contábeis (EAD)', valor_curso: 22990, categoria: 'Graduação' },
]

const DOCUMENTOS = [
  { id: 'rg', label: 'RG / CNH' },
  { id: 'cpf', label: 'CPF' },
  { id: 'comprovante_endereco', label: 'Comprovante de Endereço' },
  { id: 'historico_escolar', label: 'Histórico Escolar' },
  { id: 'diploma', label: 'Diploma (Curso Anterior)' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function NovoApontamentoPage() {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAluno, setSelectedAluno] = useState<MockAluno | null>(null)
  const [selectedCurso, setSelectedCurso] = useState<MockCurso | null>(null)
  const [valorEntrada, setValorEntrada] = useState('')
  const [documentosCheck, setDocumentosCheck] = useState<Record<string, boolean>>({})
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const filteredAlunos = searchTerm.trim()
    ? MOCK_ALUNOS.filter((a) =>
        a.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : MOCK_ALUNOS

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    const objectUrl = URL.createObjectURL(f)
    setPreview(objectUrl)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  function canGoNext(): boolean {
    if (step === 1) return !!selectedAluno
    if (step === 2) return !!selectedCurso
    return false
  }

  function handleNext() {
    if (step < 3 && canGoNext()) {
      const next = (step + 1) as Step
      setStep(next)
      setErrorMsg(null)
    }
  }

  function handleBack() {
    if (step > 1) {
      const prev = (step - 1) as Step
      setStep(prev)
      setErrorMsg(null)
    }
  }

  function removeFile() {
    setFile(null)
    setPreview(null)
  }

  async function handleSubmit() {
    if (!selectedAluno || !selectedCurso) return

    const entrada = parseFloat(valorEntrada.replace(/\./g, '').replace(',', '.'))
    if (isNaN(entrada) || entrada <= 0) {
      setErrorMsg('Informe um valor de entrada válido.')
      return
    }

    if (!file) {
      setErrorMsg('Selecione o comprovante de pagamento.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const body = {
        aluno_id: selectedAluno.id,
        curso_id: selectedCurso.id,
        valor_entrada: entrada,
        documentos: Object.entries(documentosCheck)
          .filter(([, v]) => v)
          .map(([k]) => k),
      }

      const res = await fetch('/api/v1/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 409) {
        throw new Error('Comprovante já registrado para este aluno. Venda duplicada.')
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `Erro ao registrar venda (${res.status}).`)
      }

      const data = await res.json()
      setSuccessId(data.id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  if (successId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-800/60 p-8 text-center backdrop-blur">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Venda Registrada!</h2>
          <p className="mt-2 text-sm text-slate-400">
            O apontamento foi criado com sucesso.
          </p>
          <p className="mt-4 font-mono text-lg font-semibold text-emerald-400">
            #{successId}
          </p>
          <a
            href="/vendas"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Voltar para Vendas
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700/50 text-slate-300 transition hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-white">Novo Apontamento de Venda</h1>
            <p className="text-xs text-slate-400">Passo {step} de 3</p>
          </div>
        </div>

        <div className="mb-6 flex gap-1.5">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 backdrop-blur">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Aluno
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar aluno por nome..."
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="max-h-64 space-y-1 overflow-y-auto">
                {filteredAlunos.map((aluno) => (
                  <button
                    key={aluno.id}
                    type="button"
                    onClick={() => {
                      setSelectedAluno(aluno)
                      setSearchTerm('')
                    }}
                    className={`w-full rounded-lg px-4 py-3 text-left text-sm transition ${
                      selectedAluno?.id === aluno.id
                        ? 'bg-emerald-500/20 border border-emerald-500/40'
                        : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="block font-medium text-white">{aluno.nome}</span>
                    <span className="block text-xs text-slate-400">{aluno.email}</span>
                  </button>
                ))}
                {filteredAlunos.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-500">
                    Nenhum aluno encontrado.
                  </p>
                )}
              </div>

              {selectedAluno && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{selectedAluno.nome}</span>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Curso
              </h2>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {MOCK_CURSOS.map((curso) => (
                  <button
                    key={curso.id}
                    type="button"
                    onClick={() => setSelectedCurso(curso)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                      selectedCurso?.id === curso.id
                        ? 'border-emerald-500/40 bg-emerald-500/20'
                        : 'border-slate-700/50 bg-slate-700/20 hover:bg-slate-700/40'
                    }`}
                  >
                    <span className="block text-sm font-medium text-white">{curso.nome}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                        {curso.categoria}
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(curso.valor_curso)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {selectedCurso && (
                <div className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
                  <span className="font-medium">{selectedCurso.nome}</span>
                  <span className="ml-2 text-emerald-400">
                    — {formatCurrency(selectedCurso.valor_curso)}
                  </span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Pagamento e Documentos
              </h2>

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Valor da Entrada
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorEntrada}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d,]/g, '')
                      setValorEntrada(raw)
                    }}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">
                  Comprovante de Pagamento
                </label>
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
                      isDragActive
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-600 bg-slate-900/30 hover:border-slate-500'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-8 w-8 text-slate-500" />
                    <p className="mt-2 text-sm text-slate-400">
                      Arraste o comprovante ou clique para selecionar
                    </p>
                    <p className="mt-1 text-xs text-slate-500">PNG, JPG ou JPEG (máx. 5 MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-lg border border-slate-600 bg-slate-900/30 p-2">
                    {preview && (
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-40 w-full rounded object-contain"
                      />
                    )}
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="truncate text-xs text-slate-400">{file.name}</span>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/30"
                      >
                        <X className="h-3 w-3" />
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Documentos do Aluno
                </label>
                <div className="space-y-2">
                  {DOCUMENTOS.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-700/20 px-3 py-2.5 transition hover:bg-slate-700/40"
                    >
                      <input
                        type="checkbox"
                        checked={!!documentosCheck[doc.id]}
                        onChange={(e) =>
                          setDocumentosCheck((prev) => ({
                            ...prev,
                            [doc.id]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-300">{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-5">
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-40"
            >
              Avançar
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Registrar Venda
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
