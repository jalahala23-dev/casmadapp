import { supabase } from "./supabase"

export async function probarSupabase() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .limit(1)

  if (error) {
    console.error("Error de Supabase:", error)
    return
  }

  console.log("Supabase conectado:", data)
}