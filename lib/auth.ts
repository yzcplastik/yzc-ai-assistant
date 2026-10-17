
import { supabase } from "./supabase"

export type UserRole = "admin" | "employee"

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) return null

  return data.user
}
