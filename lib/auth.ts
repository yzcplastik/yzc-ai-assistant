
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
export async function isManager(): Promise<boolean> {
  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) return false

  const { data, error } = await supabase
    .from("kullanici_rolleri")
    .select("rol")
    .eq("user_id", userData.user.id)
    .single()

  if (error) return false

  return data?.rol === "yonetici"
}
