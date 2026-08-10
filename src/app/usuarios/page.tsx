"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import Link from "next/link"

type Usuario = {
  id: string
  email: string
  nombre: string
  rol: string
  activo: boolean
  created_at: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [email, setEmail] = useState("")
  const [cargando, setCargando] = useState(true)
  const [creando, setCreando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    void cargarUsuarios()
  }, [])

  async function cargarUsuarios() {
    setCargando(true)
    setError("")

    try {
      const response = await fetch("/api/usuarios")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudieron cargar los usuarios."
        )
      }

      setUsuarios(data.usuarios ?? [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los usuarios."
      )
    } finally {
      setCargando(false)
    }
  }

  async function crearUsuario(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setCreando(true)
    setMensaje("")
    setError("")

    try {
      const response = await fetch(
        "/api/usuarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo crear el usuario."
        )
      }

      setMensaje(
        "Usuario creado correctamente. La contraseña inicial es Casmad26."
      )

      setEmail("")
      setMostrarFormulario(false)

      await cargarUsuarios()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el usuario."
      )
    } finally {
      setCreando(false)
    }
  }

  async function eliminarUsuario(
    usuario: Usuario
  ) {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar a ${
        usuario.nombre ||
        usuario.email
      }?\n\n` +
        "El usuario ya no podrá iniciar sesión en CASMAD."
    )

    if (!confirmado) {
      return
    }

    setEliminando(usuario.id)
    setMensaje("")
    setError("")

    try {
      const response = await fetch(
        "/api/usuarios",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: usuario.id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo eliminar el usuario."
        )
      }

      setMensaje(
        `Usuario ${usuario.email} eliminado correctamente.`
      )

      await cargarUsuarios()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el usuario."
      )
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <Link
            href="/configuracion"
            className="mb-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
          >
            <ArrowLeft size={17} />
            Volver a configuración
          </Link>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-[#ead8c4] p-3 text-[#5c4030]">
              <Users size={24} />
            </div>

            <div>

              <h1 className="text-2xl font-bold text-[#3b2a20]">
                Usuarios
              </h1>

              <p className="mt-1 text-sm text-[#8a7562]">
                Administra los usuarios que pueden entrar a CASMAD.
              </p>

            </div>

          </div>

        </div>

        <button
          type="button"
          onClick={() => {
            setMostrarFormulario(
              (valor) => !valor
            )
            setMensaje("")
            setError("")
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4b3326]"
        >
          <Plus size={18} />
          Agregar usuario
        </button>

      </div>

      {/* =====================================================
          MENSAJE DE ÉXITO
          ===================================================== */}

      {mensaje && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {mensaje}
        </div>
      )}

      {/* =====================================================
          MENSAJE DE ERROR
          ===================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          FORMULARIO AGREGAR USUARIO
          ===================================================== */}

      {mostrarFormulario && (

        <div className="rounded-xl border border-[#e4d8ca] bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">

            <div className="rounded-lg bg-[#f5eadf] p-2 text-[#5c4030]">
              <UserPlus size={20} />
            </div>

            <div>

              <h2 className="font-bold text-[#3b2a20]">
                Agregar usuario
              </h2>

              <p className="text-sm text-[#8a7562]">
                El usuario será administrador.
              </p>

            </div>

          </div>

          <form
            onSubmit={crearUsuario}
            className="space-y-4"
          >

            <div>

              <label className="mb-2 block text-sm font-medium text-[#5c4030]">
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
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="usuario@ejemplo.com"
                  required
                  className="w-full rounded-lg border border-[#e4d8ca] bg-white py-3 pl-10 pr-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                />

              </div>

            </div>

            <div className="rounded-lg bg-[#faf7f4] p-4 text-sm text-[#6b5746]">

              <strong>
                Contraseña inicial:
              </strong>{" "}
              Casmad26

              <br />

              <span className="text-xs text-[#8a7562]">
                El nuevo usuario podrá cambiarla posteriormente.
              </span>

            </div>

            <div className="flex justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false)
                  setEmail("")
                }}
                className="rounded-lg border border-[#dccbbb] px-4 py-2.5 text-sm font-medium text-[#6b4935] hover:bg-[#faf7f4]"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={creando}
                className="inline-flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {creando ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Crear usuario
                  </>
                )}

              </button>

            </div>

          </form>

        </div>

      )}

      {/* =====================================================
          LISTA DE USUARIOS
          ===================================================== */}

      <div className="rounded-xl border border-[#e4d8ca] bg-white shadow-sm">

        <div className="border-b border-[#eee4da] p-5">

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={20}
              className="text-[#5c4030]"
            />

            <h2 className="font-bold text-[#3b2a20]">
              Usuarios registrados
            </h2>

          </div>

        </div>

        {cargando ? (

          <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-[#8a7562]">

            <Loader2
              size={22}
              className="animate-spin"
            />

            Cargando usuarios...

          </div>

        ) : usuarios.length === 0 ? (

          <div className="p-8 text-center text-sm text-[#8a7562]">
            No hay usuarios registrados.
          </div>

        ) : (

          <div className="divide-y divide-[#eee4da]">

            {usuarios.map(
              (usuario) => (

                <div
                  key={usuario.id}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                >

                  {/* DATOS DEL USUARIO */}

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ead8c4] font-bold text-[#5c4030]">

                      {(usuario.nombre ||
                        usuario.email)
                        .charAt(0)
                        .toUpperCase()}

                    </div>

                    <div>

                      <p className="font-semibold text-[#3b2a20]">
                        {usuario.nombre ||
                          usuario.email.split(
                            "@"
                          )[0]}
                      </p>

                      <p className="text-sm text-[#8a7562]">
                        {usuario.email}
                      </p>

                    </div>

                  </div>

                  {/* ESTADO Y ACCIONES */}

                  <div className="flex items-center gap-2">

                    <span className="rounded-full bg-[#f5eadf] px-3 py-1 text-xs font-semibold text-[#79583f]">
                      Administrador
                    </span>

                    <span
                      className={
                        usuario.activo
                          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                          : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                      }
                    >
                      {usuario.activo
                        ? "Activo"
                        : "Inactivo"}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarUsuario(
                          usuario
                        )
                      }
                      disabled={
                        eliminando ===
                        usuario.id
                      }
                      title="Eliminar usuario"
                      className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      {eliminando ===
                      usuario.id ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={17}
                        />
                      )}

                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  )
}