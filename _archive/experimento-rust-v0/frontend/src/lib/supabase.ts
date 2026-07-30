import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { cookies } from 'next/headers'

function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
  }

  return { url, anonKey }
}

export function createBrowserClient(): SupabaseClient {
  const { url, anonKey } = getEnvVars()
  return createSupabaseBrowserClient(url, anonKey)
}

export async function createServerComponentClient(cookieStore: ReturnType<typeof cookies>): Promise<SupabaseClient> {
  const { url, anonKey } = getEnvVars()
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: { path: string; maxAge: number; domain?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Can be ignored in server components
        }
      },
      remove(name: string, options: { path: string; domain?: string }) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Can be ignored in server components
        }
      },
    },
  })
}
