"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react"
import Link from "next/link"

type RolUsuario =
  | "programador"
  | "administrador"
  | "usuario"
  | "sistema"

type Usuario = {
  id: string
  email: string
  nombre: string
  telefono: string | null
  rol: RolUsuario
  activo: boolean
  protegido?: boolean
  created_at: string
}

type UsuarioActual = {
  id: string
  rol: "programador" | "administrador"
}

type RolCreable = "administrador" | "usuario"

function nombreRol(rol: RolUsuario) {
  switch (rol) {
    case "programador":
      return "Programador"
    case "administrador":
      return "Administrador"
    case "usuario":
      return "Usuario"
    case "sistema":
      return "Sistema"
    default:
      return rol
  }
}

function claseRol(rol: RolUsuario) {
  switch (rol) {
    case "programador":
      return "bg-purple-50 text-purple-700"
    case "administrador":
      return "bg-[#f5eadf] text-[#79583f]"
    case "usuario":
      return "bg-blue-50 text-blue-700"
    case "sistema":
      return "bg-slate-100 text-slate-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuarioActual, setUsuarioActual] =
    useState<UsuarioActual | null>(null)

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [rol, setRol] =
    useState<RolCreable>("usuario")

  const [usuarioEditando, setUsuarioEditando] =
    useState<Usuario | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [editTelefono, setEditTelefono] = useState("")
  const [editRol, setEditRol] =
    useState<RolCreable>("usuario")
  const [guardandoEdicion, setGuardandoEdicion] =
    useState(false)
  const [password, setPassword] =
    useState("Casmad26")

  const [cargando, setCargando] = useState(true)
  const [creando, setCreando] = useState(false)

  const [eliminando, setEliminando] =
    useState<string | null>(null)

  const [actualizando, setActualizando] =
    useState<string | null>(null)

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
      const response = await fetch("/api/usuarios", {
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudieron cargar los usuarios."
        )
      }

      setUsuarios(data.usuarios ?? [])
      setUsuarioActual(data.usuarioActual ?? null)
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
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          rol,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo crear el usuario."
        )
      }

      setMensaje(
        `Usuario creado correctamente como ${nombreRol(
          rol
        )}.`
      )

      setNombre("")
      setEmail("")
      setTelefono("")
      setRol("usuario")
      setPassword("Casmad26")
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

  function abrirEdicion(usuario: Usuario) {
    if (usuario.protegido) {
      return
    }

    setUsuarioEditando(usuario)
    setEditNombre(usuario.nombre || "")
    setEditTelefono(usuario.telefono || "")
    setEditRol(
      usuario.rol === "administrador"
        ? "administrador"
        : "usuario"
    )
    setMensaje("")
    setError("")
  }

  function cerrarEdicion() {
    if (guardandoEdicion) {
      return
    }

    setUsuarioEditando(null)
    setEditNombre("")
    setEditTelefono("")
    setEditRol("usuario")
  }

  async function guardarEdicion(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!usuarioEditando) {
      return
    }

    setGuardandoEdicion(true)
    setActualizando(usuarioEditando.id)
    setMensaje("")
    setError("")

    try {
      const response = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: usuarioEditando.id,
          nombre: editNombre,
          telefono: editTelefono,
          rol: editRol,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo actualizar el usuario."
        )
      }

      setMensaje(
        `Usuario ${editNombre || usuarioEditando.email} actualizado correctamente.`
      )

      cerrarEdicion()
      await cargarUsuarios()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el usuario."
      )
    } finally {
      setGuardandoEdicion(false)
      setActualizando(null)
    }
  }

  async function cambiarRol(
    usuario: Usuario,
    nuevoRol: RolCreable
  ) {
    if (usuario.protegido) {
      return
    }

    setActualizando(usuario.id)
    setMensaje("")
    setError("")

    try {
      const response = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: usuario.id,
          rol: nuevoRol,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo cambiar el rol."
        )
      }

      setMensaje(
        `Rol de ${
          usuario.nombre || usuario.email
        } actualizado correctamente.`
      )

      await cargarUsuarios()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el rol."
      )
    } finally {
      setActualizando(null)
    }
  }

  async function cambiarEstado(
    usuario: Usuario
  ) {
    if (usuario.protegido) {
      return
    }

    const nuevoEstado = !usuario.activo

    const textoEstado = nuevoEstado
      ? "activar"
      : "desactivar"

    const confirmado = window.confirm(
      `¿Deseas ${textoEstado} a ${
        usuario.nombre || usuario.email
      }?`
    )

    if (!confirmado) {
      return
    }

    setActualizando(usuario.id)
    setMensaje("")
    setError("")

    try {
      const response = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: usuario.id,
          activo: nuevoEstado,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo cambiar el estado del usuario."
        )
      }

      setMensaje(
        `Usuario ${
          nuevoEstado ? "activado" : "desactivado"
        } correctamente.`
      )

      await cargarUsuarios()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado."
      )
    } finally {
      setActualizando(null)
    }
  }

  async function eliminarUsuario(
    usuario: Usuario
  ) {
    if (usuario.protegido) {
      setError(
        "El usuario del sistema está protegido."
      )
      return
    }

    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar a ${
        usuario.nombre || usuario.email
      }?\n\n` +
        "Esta acción eliminará su acceso a CASMAD."
    )

    if (!confirmado) {
      return
    }

    setEliminando(usuario.id)
    setMensaje("")
    setError("")

    try {
      const response = await fetch("/api/usuarios", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: usuario.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo eliminar el usuario."
        )
      }

      setMensaje(
        `Usuario ${
          usuario.nombre || usuario.email
        } eliminado correctamente.`
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

  const esProgramador =
    usuarioActual?.rol === "programador"

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ENCABEZADO */}

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
                Administra usuarios, roles y acceso a
                CASMAD.
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

      {/* TIPO DE CUENTA ACTUAL */}

      {usuarioActual && (
        <div className="flex items-center gap-3 rounded-xl border border-[#e4d8ca] bg-[#faf7f4] px-4 py-3">
          {esProgramador ? (
            <UserCog
              size={20}
              className="text-purple-700"
            />
          ) : (
            <ShieldCheck
              size={20}
              className="text-[#5c4030]"
            />
          )}

          <div>
            <p className="text-sm font-semibold text-[#3b2a20]">
              Sesión administrativa
            </p>

            <p className="text-xs text-[#8a7562]">
              Nivel de acceso:{" "}
              <strong>
                {nombreRol(usuarioActual.rol)}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* MENSAJES */}

      {mensaje && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* FORMULARIO */}

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
                Crea una cuenta y selecciona su nivel
                de acceso.
              </p>
            </div>
          </div>

          <form
            onSubmit={crearUsuario}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-[#5c4030]">
                Nombre
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(event) =>
                  setNombre(event.target.value)
                }
                placeholder="Nombre del usuario"
                required
                className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#5c4030]">
                Telefono
              </label>

              <input
                type="tel"
                value={telefono}
                onChange={(event) =>
                  setTelefono(event.target.value)
                }
                placeholder="Numero de telefono"
                className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
              />
            </div>

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
                    setEmail(event.target.value)
                  }
                  placeholder="usuario@ejemplo.com"
                  required
                  className="w-full rounded-lg border border-[#e4d8ca] bg-white py-3 pl-10 pr-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#5c4030]">
                Rol
              </label>

              <select
                value={rol}
                onChange={(event) =>
                  setRol(
                    event.target.value as RolCreable
                  )
                }
                className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
              >
                <option value="usuario">
                  Usuario
                </option>

                <option value="administrador">
                  Administrador
                </option>
              </select>

              <p className="mt-2 text-xs text-[#8a7562]">
                El rol Programador está reservado para
                el sistema y no puede crearse desde
                esta pantalla.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#5c4030]">
                Contraseña inicial
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
                />

                <input
                  type="text"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-[#e4d8ca] bg-white py-3 pl-10 pr-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                />
              </div>

              <p className="mt-2 text-xs text-[#8a7562]">
                Mínimo 8 caracteres. El usuario podrá
                cambiarla posteriormente.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false)
                  setNombre("")
                  setEmail("")
                  setTelefono("")
                  setRol("usuario")
                  setPassword("Casmad26")
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

      {/* EDITAR USUARIO */}

      {usuarioEditando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#e4d8ca] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eee4da] px-5 py-4">
              <div>
                <h2 className="font-bold text-[#3b2a20]">
                  Editar usuario
                </h2>

                <p className="mt-1 text-xs text-[#8a7562]">
                  Actualiza los datos del perfil.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarEdicion}
                disabled={guardandoEdicion}
                className="rounded-lg p-2 text-[#6b4935] hover:bg-[#f4eadf] disabled:opacity-50"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={guardarEdicion}
              className="space-y-4 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-[#5c4030]">
                  Nombre
                </label>

                <input
                  type="text"
                  value={editNombre}
                  onChange={(event) =>
                    setEditNombre(event.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#5c4030]">
                  Telefono
                </label>

                <input
                  type="tel"
                  value={editTelefono}
                  onChange={(event) =>
                    setEditTelefono(event.target.value)
                  }
                  placeholder="Numero de telefono"
                  className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#5c4030]">
                  Rol
                </label>

                <select
                  value={editRol}
                  onChange={(event) =>
                    setEditRol(
                      event.target.value as RolCreable
                    )
                  }
                  className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-3 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                >
                  <option value="usuario">
                    Usuario
                  </option>

                  <option value="administrador">
                    Administrador
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarEdicion}
                  disabled={guardandoEdicion}
                  className="rounded-lg border border-[#dccbbb] px-4 py-2.5 text-sm font-medium text-[#6b4935] hover:bg-[#faf7f4] disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardandoEdicion ||
                    !editNombre.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardandoEdicion ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTA */}

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
            {usuarios.map((usuario) => {
              const protegido =
                usuario.protegido === true

              const esSistema =
                usuario.rol === "sistema"

              const trabajando =
                actualizando === usuario.id ||
                eliminando === usuario.id

              return (
                <div
                  key={usuario.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  {/* DATOS */}

                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ead8c4] font-bold text-[#5c4030]">
                      {esSistema ? (
                        <LockKeyhole size={18} />
                      ) : (
                        (usuario.nombre ||
                          usuario.email)
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#3b2a20]">
                          {usuario.nombre ||
                            usuario.email.split(
                              "@"
                            )[0]}
                        </p>

                        {protegido && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            <LockKeyhole size={11} />
                            Protegido
                          </span>
                        )}
                      </div>

                      <p className="truncate text-sm text-[#8a7562]">
                        {esSistema
                          ? "Cuenta interna del sistema"
                          : usuario.email}
                      </p>

                      {!esSistema && (
                        <p className="text-sm text-[#8a7562]">
                          Tel: {usuario.telefono || "Sin telefono"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ROL / ESTADO / ACCIONES */}

                  <div className="flex flex-wrap items-center gap-2">
                    {protegido ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${claseRol(
                          usuario.rol
                        )}`}
                      >
                        {nombreRol(usuario.rol)}
                      </span>
                    ) : (
                      <select
                        value={
                          usuario.rol ===
                          "administrador"
                            ? "administrador"
                            : "usuario"
                        }
                        disabled={trabajando}
                        onChange={(event) =>
                          void cambiarRol(
                            usuario,
                            event.target
                              .value as RolCreable
                          )
                        }
                        className="rounded-lg border border-[#e4d8ca] bg-white px-3 py-2 text-xs font-semibold text-[#5c4030] outline-none disabled:opacity-60"
                      >
                        <option value="usuario">
                          Usuario
                        </option>

                        <option value="administrador">
                          Administrador
                        </option>
                      </select>
                    )}

                    <button
                      type="button"
                      disabled={
                        protegido || trabajando
                      }
                      onClick={() =>
                        void cambiarEstado(usuario)
                      }
                      className={
                        usuario.activo
                          ? "rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                          : "rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      }
                      title={
                        protegido
                          ? "Usuario protegido"
                          : usuario.activo
                            ? "Desactivar usuario"
                            : "Activar usuario"
                      }
                    >
                      {actualizando ===
                      usuario.id ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : usuario.activo ? (
                        "Activo"
                      ) : (
                        "Inactivo"
                      )}
                    </button>

                    {!protegido && (
                      <button
                        type="button"
                        onClick={() =>
                          abrirEdicion(usuario)
                        }
                        disabled={trabajando}
                        title="Editar usuario"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4d8ca] text-[#6b4935] transition hover:bg-[#f4eadf] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil size={17} />
                      </button>
                    )}

                    {!protegido && (
                      <button
                        type="button"
                        onClick={() =>
                          void eliminarUsuario(
                            usuario
                          )
                        }
                        disabled={trabajando}
                        title="Eliminar usuario"
                        className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {eliminando ===
                        usuario.id ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    )}

                    {protegido &&
                      esProgramador &&
                      usuario.rol ===
                        "programador" && (
                        <div
                          title="Cuenta de Programador protegida"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-700"
                        >
                          <Save size={16} />
                        </div>
                      )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#e4d8ca] bg-[#faf7f4] p-4 text-xs leading-5 text-[#7a6655]">
        <strong>Permisos de usuarios:</strong>{" "}
        Programador es una cuenta interna protegida.
        Los administradores pueden administrar cuentas
        normales. Los permisos específicos del rol
        Usuario se configurarán en la siguiente etapa.
      </div>
    </div>
  )
}