'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Sistema de
          <span className="block text-emerald-400">Comissionamento e Vendas</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-slate-400">
          Gerencie comissões, vendas e acompanhe seus resultados em tempo real.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {user ? (
            <a
              href="/dashboard"
              className="rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Ir para o Dashboard
            </a>
          ) : (
            <a
              href="/auth/login"
              className="rounded-lg bg-emerald-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Acessar o Sistema
            </a>
          )}
        </div>
      </div>
    </main>
  )
}
