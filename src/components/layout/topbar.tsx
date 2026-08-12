"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  ChevronDown,
  FileText,
  Loader2,
  LogOut,
  Menu,
  Package,
  Settings,
  User,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type UsuarioActual = {
  email: string
  nombre: string
  telefono: string | null
  rol: string
}

type Notificacion = {
  id: string
  titulo: string
  descripcion: string
  href: string
  icono: "factura" | "inventario" | "cotizacion"
}

type TopbarProps = {
  abrirMenuMovil: () => void
}

export function Topbar({
  abrirMenuMovil,
}: TopbarProps) {
  const router = useRouter()

  const supabase = useMemo(
    () => createSupabaseBrowserClient(),
    []
  )

  const [usuario, setUsuario] =
    useState<UsuarioActual | null>(null)

  const [notificaciones, setNotificaciones] =
    useState<Notificacion[]>([])

  const [
    notificacionesVistas,
    setNotificacionesVistas,
  ] = useState(false)

  const [
    cargandoNotificaciones,
    setCargandoNotificaciones,
  ] = useState(true)

  const [cerrandoSesion, setCerrandoSesion] =
    useState(false)

  useEffect(() => {
    let activo = true

    async function cargarUsuario() {
      const { data, error } =
        await supabase.auth.getUser()

      if (error) {
        console.error(
          "ERROR AL OBTENER USUARIO:",
          error
        )

        if (activo) {
          setUsuario(null)
        }

        return
      }

      const user = data.user

      if (!user?.email) {
        if (activo) {
          setUsuario(null)
        }

        return
      }

      const metadata =
        user.user_metadata || {}

      const { data: perfilData, error: perfilError } =
        await supabase
          .from("perfiles")
          .select("nombre, telefono, rol")
          .eq("id", user.id)
          .maybeSingle()

      if (perfilError) {
        console.error(
          "ERROR AL OBTENER PERFIL:",
          perfilError
        )
      }

      const nombre =
        perfilData?.nombre ||
        metadata.full_name ||
        metadata.name ||
        metadata.nombre ||
        user.email.split("@")[0] ||
        "Usuario"

      if (activo) {
        setUsuario({
          email: user.email,
          nombre,
          telefono: perfilData?.telefono || null,
          rol: perfilData?.rol || "usuario",
        })
      }
    }

    async function cargarNotificaciones() {
      if (activo) {
        setCargandoNotificaciones(true)
      }

      const avisos: Notificacion[] = []

      const [
        productosResult,
        facturasResult,
        cotizacionesResult,
      ] = await Promise.all([
        supabase
          .from("productos")
          .select("id, nombre, stock")
          .eq("estado", "activo")
          .lte("stock", 5)
          .order("stock", {
            ascending: true,
          })
          .limit(3),

        supabase
          .from("facturas")
          .select("id, numero, estado")
          .eq("estado", "emitida")
          .order("numero", {
            ascending: false,
          })
          .limit(3),

        supabase
          .from("cotizaciones")
          .select("id, numero, estado")
          .eq("estado", "aprobada")
          .order("created_at", {
            ascending: false,
          })
          .limit(3),
      ])

      if (!productosResult.error) {
        for (
          const producto of
          productosResult.data || []
        ) {
          avisos.push({
            id: `producto-${producto.id}`,
            titulo: "Stock bajo",
            descripcion:
              `${producto.nombre} tiene ${
                producto.stock ?? 0
              } unidades en inventario.`,
            href: "/inventario",
            icono: "inventario",
          })
        }
      } else {
        console.error(
          "ERROR AL CARGAR STOCK BAJO:",
          productosResult.error
        )
      }

      if (!facturasResult.error) {
        for (
          const factura of
          facturasResult.data || []
        ) {
          avisos.push({
            id: `factura-${factura.id}`,
            titulo: "Factura pendiente",
            descripcion:
              `La factura ${numeroDocumento(
                "FAC",
                factura.numero
              )} está pendiente de pago.`,
            href:
              `/facturacion/${factura.id}`,
            icono: "factura",
          })
        }
      } else {
        console.error(
          "ERROR AL CARGAR FACTURAS:",
          facturasResult.error
        )
      }

      if (!cotizacionesResult.error) {
        for (
          const cotizacion of
          cotizacionesResult.data || []
        ) {
          avisos.push({
            id:
              `cotizacion-${cotizacion.id}`,
            titulo:
              "Cotización aprobada",
            descripcion:
              `${numeroDocumento(
                "COT",
                cotizacion.numero
              )} está lista para facturar.`,
            href:
              `/cotizaciones/${cotizacion.id}`,
            icono: "cotizacion",
          })
        }
      } else {
        console.error(
          "ERROR AL CARGAR COTIZACIONES:",
          cotizacionesResult.error
        )
      }

      const avisosLimitados =
        avisos.slice(0, 6)

      const claveAvisos =
        obtenerClaveNotificaciones(
          avisosLimitados
        )

      if (activo) {
        setNotificaciones(
          avisosLimitados
        )

        setNotificacionesVistas(
          claveAvisos ===
            obtenerClaveNotificacionesVistas()
        )

        setCargandoNotificaciones(
          false
        )
      }
    }

    void cargarUsuario()
    void cargarNotificaciones()

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          evento,
          sesion
        ) => {
          if (!activo) {
            return
          }

          if (
            evento === "SIGNED_OUT"
          ) {
            setUsuario(null)
            return
          }

          if (
            sesion?.user?.email
          ) {
            const metadata =
              sesion.user.user_metadata || {}

            const { data: perfilData } =
              await supabase
                .from("perfiles")
                .select("nombre, telefono, rol")
                .eq("id", sesion.user.id)
                .maybeSingle()

            const nombre =
              perfilData?.nombre ||
              metadata.full_name ||
              metadata.name ||
              metadata.nombre ||
              sesion.user.email.split(
                "@"
              )[0] ||
              "Usuario"

            setUsuario({
              email: sesion.user.email,
              nombre,
              telefono:
                perfilData?.telefono || null,
              rol:
                perfilData?.rol || "usuario",
            })
          }
        }
      )

    return () => {
      activo = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  async function cerrarSesion() {
    if (cerrandoSesion) {
      return
    }

    setCerrandoSesion(true)

    try {
      const {
        error,
      } =
        await supabase.auth.signOut()

      if (error) {
        console.error(
          "ERROR AL CERRAR SESIÓN:",
          error
        )

        setCerrandoSesion(false)
        return
      }

      router.replace("/login")
      router.refresh()
    } catch (error) {
      console.error(
        "ERROR AL CERRAR SESIÓN:",
        error
      )

      setCerrandoSesion(false)
    }
  }

  function marcarNotificacionesComoVistas() {
    if (
      notificaciones.length === 0
    ) {
      return
    }

    guardarNotificacionesVistas(
      notificaciones
    )

    setNotificacionesVistas(true)
  }

  const nombreUsuario =
    usuario?.nombre ||
    "Administrador"

  const correoUsuario =
    usuario?.email ||
    "Sesion activa"

  const rolUsuario =
    usuario?.rol === "administrador"
      ? "Administrador"
      : usuario?.rol === "programador"
        ? "Programador"
        : usuario?.rol === "sistema"
          ? "Sistema"
          : "Usuario"

  const mostrarPuntoNotificaciones =
    notificaciones.length > 0 &&
    !notificacionesVistas

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-2 border-b border-[#e4d8ca] bg-white px-3 sm:px-4 md:px-6">

      {/* MENÚ MÓVIL */}

      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={abrirMenuMovil}
          aria-label="Abrir menú"
          className="shrink-0 rounded-lg p-2 text-[#5c4030] transition hover:bg-[#f3ece5] md:hidden"
        >
          <Menu size={23} />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#6b5746]">
            Sistema administrativo
          </p>

          <p className="truncate text-xs text-[#9a8775]">
            Muebles Castillo
          </p>
        </div>
      </div>

      {/* CONTROLES */}

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">

        {/* NOTIFICACIONES */}

        <DropdownMenu
          onOpenChange={(abierto) => {
            if (
              abierto &&
              notificaciones.length > 0
            ) {
              marcarNotificacionesComoVistas()
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative rounded-lg p-2 text-[#6b5746] transition hover:bg-[#f3ece5]"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <Bell size={20} />

              {mostrarPuntoNotificaciones && (
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#a67c52]"
                  aria-hidden="true"
                />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-[min(20rem,calc(100vw-1.5rem))] border border-[#e4d8ca] bg-white p-0 text-[#3b2a20]"
          >
            <div className="border-b border-[#eee4db] px-4 py-3">
              <p className="text-sm font-semibold">
                Notificaciones
              </p>

              <p className="text-xs text-[#9a8775]">
                Avisos recientes del sistema
              </p>
            </div>

            {cargandoNotificaciones ? (
              <div className="flex items-center gap-2 px-4 py-5 text-sm text-[#8a7562]">
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Cargando avisos...
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Bell
                  size={26}
                  className="mx-auto mb-2 text-[#b79a7d]"
                />

                <p className="text-sm font-medium text-[#5c4635]">
                  No hay notificaciones nuevas
                </p>

                <p className="mt-1 text-xs text-[#9a8775]">
                  El sistema no tiene avisos pendientes.
                </p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto p-1">
                {notificaciones.map(
                  (notificacion) => {
                    const Icon =
                      notificacion.icono ===
                      "inventario"
                        ? Package
                        : FileText

                    return (
                      <DropdownMenuItem
                        key={
                          notificacion.id
                        }
                        asChild
                        className="cursor-pointer rounded-lg p-0 focus:bg-[#f7efe8]"
                      >
                        <Link
                          href={
                            notificacion.href
                          }
                          className="flex w-full gap-3 px-3 py-3"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1e4d7] text-[#5c4030]">
                            <Icon size={17} />
                          </span>

                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[#3b2a20]">
                              {
                                notificacion.titulo
                              }
                            </span>

                            <span className="mt-0.5 block text-xs leading-5 text-[#8a7562]">
                              {
                                notificacion.descripcion
                              }
                            </span>
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  }
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden h-8 w-px bg-[#e4d8ca] sm:block" />

        {/* USUARIO */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-[#f3ece5] sm:px-2"
              aria-label="Menú de usuario"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5c4030] text-white">
                <User size={18} />
              </div>

              <div className="hidden max-w-40 text-left sm:block">
                <p className="truncate text-sm font-semibold text-[#3b2a20]">
                  {nombreUsuario}
                </p>

                <p className="text-xs text-[#9a8775]">
                  {rolUsuario}
                </p>
              </div>

              <ChevronDown
                size={16}
                className="hidden text-[#8a7562] sm:block"
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-[min(16rem,calc(100vw-1.5rem))] border border-[#e4d8ca] bg-white text-[#3b2a20]"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <span className="block truncate text-sm font-semibold text-[#3b2a20]">
                {nombreUsuario}
              </span>

              <span className="block truncate text-xs font-normal text-[#9a8775]">
                {correoUsuario}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-[#eee4db]" />

            <DropdownMenuItem
              asChild
              className="cursor-pointer gap-2 px-3 py-2 focus:bg-[#f7efe8]"
            >
              <Link href="/configuracion">
                <Settings size={16} />
                Configuración
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[#eee4db]" />

            <DropdownMenuItem
              className="cursor-pointer gap-2 px-3 py-2 text-red-700 focus:bg-red-50 focus:text-red-700"
              disabled={cerrandoSesion}
              onSelect={(evento) => {
                evento.preventDefault()
                void cerrarSesion()
              }}
            >
              {cerrandoSesion ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={16} />
              )}

              {cerrandoSesion
                ? "Cerrando sesión..."
                : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function numeroDocumento(
  prefijo: string,
  numero: number | null
) {
  if (
    numero !== null &&
    numero !== undefined
  ) {
    return `${prefijo}-${String(
      numero
    ).padStart(6, "0")}`
  }

  return `${prefijo}-sin número`
}

function obtenerClaveNotificaciones(
  notificaciones: Notificacion[]
) {
  return notificaciones
    .map(
      (notificacion) =>
        notificacion.id
    )
    .sort()
    .join("|")
}

function obtenerClaveNotificacionesVistas() {
  if (
    typeof window === "undefined"
  ) {
    return ""
  }

  return (
    window.localStorage.getItem(
      "casmad:notificaciones-vistas"
    ) || ""
  )
}

function guardarNotificacionesVistas(
  notificaciones: Notificacion[]
) {
  if (
    typeof window === "undefined"
  ) {
    return
  }

  window.localStorage.setItem(
    "casmad:notificaciones-vistas",
    obtenerClaveNotificaciones(
      notificaciones
    )
  )
}