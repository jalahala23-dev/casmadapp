"use client"

import { FormEvent, useState } from "react"
import { LockKeyhole, Mail, Loader2, LogIn } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError("")

    const supabase = createSupabaseBrowserClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Correo o contraseña incorrectos.")
      setLoading(false)
      return
    }

    window.location.href = "/"
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5f1] p-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-[#e4d8ca] bg-white shadow-xl">
          <div className="bg-[#3b2a20] px-6 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#a67c52] text-2xl font-bold">
              C
            </div>

            <h1 className="text-3xl font-bold">
              CASMAD
            </h1>

            <p className="mt-1 text-sm text-[#d8c2a8]">
              Muebles Castillo
            </p>

            <p className="mt-4 text-xs text-[#bda48d]">
              Sistema Administrativo
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#3b2a20]">
                Iniciar sesión
              </h2>

              <p className="mt-1 text-sm text-[#8a7562]">
                Ingresa tus credenciales para continuar.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#5c4635]">
                  Correo electrónico
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="usuario@casmad.com"
                    required
                    className="w-full rounded-lg border border-[#e4d8ca] bg-white py-3 pl-10 pr-3 text-sm text-[#3b2a20] outline-none transition focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#5c4635]">
                  Contraseña
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border border-[#e4d8ca] bg-white py-3 pl-10 pr-3 text-sm text-[#3b2a20] outline-none transition focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#9a8775]">
              CASMAD ERP · Muebles Castillo
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}