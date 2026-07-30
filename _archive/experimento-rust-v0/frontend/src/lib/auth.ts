import { createBrowserClient } from './supabase'
import type { User } from '@supabase/supabase-js'

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUser(): Promise<User | null> {
  const supabase = createBrowserClient()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function getProfile(): Promise<string | null> {
  const supabase = createBrowserClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.app_metadata?.app_role as string | null
}
