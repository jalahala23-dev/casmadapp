"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Armchair,
  Package,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  X,
  Loader2,
} from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Clientes",
    icon: Users,
    href: "/clientes",
  },
  {
    title: "Muebles",
    icon: Armchair,
    href: "/muebles",
  },
  {
    title: "Inventario",
    icon: Package,
    href: "/inventario",
  },
  {
    title: "Cotizaciones",
    icon: FileText,
    href: "/cotizaciones",
  },
  {
    title: "Facturacion",
    icon: Receipt,
    href: "/facturacion",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    href: "/reportes",
  },
  {
    title: "Configuracion",
    icon: Settings,
    href: "/configuracion",
  },
]

type SidebarProps = {
  movilAbierto: boolean
  cerrarMenuMovil: () => void
}

type PerfilActual = {
  nombre: string
  telefono: string | null
  rol: string
}

export function Sidebar({
  movilAbierto,
  cerrarMenuMovil,
}: SidebarProps) {
  const pathname = usePathname()

  const supabase = useMemo(
    () => createSupabaseBrowserClient(),
    []
  )

  const [perfil, setPerfil] =
    useState<PerfilActual | null>(null)

  const [cargandoPerfil, setCargandoPerfil] =
    useState(true)

  useEffect(() => {
    let activo = true

    async function cargarPerfil() {
      setCargandoPerfil(true)

      const {
        data: usuarioData,
        error: usuarioError,
      } = await supabase.auth.getUser()

      if (
        usuarioError ||
        !usuarioData.user
      ) {
        if (activo) {
          setPerfil(null)
          setCargandoPerfil(false)
        }

        return
      }

      const user = usuarioData.user

      const {
        data: perfilData,
        error: perfilError,
      } = await supabase
        .from("perfiles")
        .select("nombre, telefono, rol")
        .eq("id", user.id)
        .maybeSingle()

      if (perfilError) {
        console.error(
          "ERROR AL CARGAR PERFIL:",
          perfilError
        )
      }

      if (!activo) {
        return
      }

      const metadata =
        user.user_metadata || {}

      const nombre =
        perfilData?.nombre ||
        metadata.full_name ||
        metadata.name ||
        metadata.nombre ||
        user.email?.split("@")[0] ||
        "Usuario"

      const rol =
        perfilData?.rol ||
        "usuario"

      setPerfil({
        nombre,
        telefono:
          perfilData?.telefono || null,
        rol,
      })

      setCargandoPerfil(false)
    }

    void cargarPerfil()

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        () => {
          void cargarPerfil()
        }
      )

    return () => {
      activo = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const nombreUsuario =
    perfil?.nombre || "Usuario"

  const rolUsuario =
    perfil?.rol === "administrador"
      ? "Administrador"
      : perfil?.rol === "programador"
        ? "Programador"
        : perfil?.rol === "sistema"
          ? "Sistema"
          : "Usuario"

  /*
   * Solo Programador y Administrador
   * pueden acceder a Configuración.
   */
  const puedeAdministrar =
    perfil?.rol === "administrador" ||
    perfil?.rol === "programador"

  /*
   * Para usuarios normales ocultamos
   * Configuración del menú.
   */
  const menuItemsVisibles =
    menuItems.filter(
      (item) =>
        item.href !== "/configuracion" ||
        puedeAdministrar
    )

  const inicial =
    nombreUsuario
      .trim()
      .charAt(0)
      .toUpperCase() || "U"

  return (
    <>
      {movilAbierto && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={cerrarMenuMovil}
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 max-w-[85vw] flex-col
          border-r border-[#5c4635]
          bg-[#3b2a20] text-white
          shadow-2xl
          transition-transform duration-200
          md:static md:z-auto md:w-64
          md:translate-x-0
          md:shadow-none
          ${
            movilAbierto
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* ENCABEZADO */}

        <div className="border-b border-[#5c4635] px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <img
                src="/casmad-logo.png"
                alt="CASMAD"
                className="h-14 w-14 rounded-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                CASMAD
              </h1>

              <p className="mt-0.5 text-sm text-[#d8c2a8]">
                Muebles Castillo
              </p>

              <p className="text-xs text-[#a98f75]">
                Sistema Administrativo
              </p>
            </div>

            <button
              type="button"
              aria-label="Cerrar menu"
              onClick={cerrarMenuMovil}
              className="shrink-0 rounded-lg p-2 text-[#eadfd3] transition hover:bg-[#574132] md:hidden"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* MENU */}

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItemsVisibles.map((item) => {
            const Icon = item.icon

            const active =
              pathname === item.href ||
              (
                item.href !== "/" &&
                pathname.startsWith(item.href)
              )

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={cerrarMenuMovil}
                className={`
                  flex w-full items-center gap-3
                  rounded-lg px-3 py-3
                  text-sm font-medium
                  transition-colors
                  ${
                    active
                      ? "bg-[#a67c52] text-white shadow-sm"
                      : "text-[#eadfd3] hover:bg-[#574132] hover:text-white"
                  }
                `}
              >
                <Icon size={19} />

                <span>
                  {item.title}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* USUARIO */}

        <div className="border-t border-[#5c4635] p-4">
          {cargandoPerfil ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5c4030]">
                <Loader2
                  size={18}
                  className="animate-spin text-[#d8c2a8]"
                />
              </div>

              <div>
                <p className="text-sm text-[#eadfd3]">
                  Cargando...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171717] text-sm font-semibold text-white ring-1 ring-[#806b58]">
                {inicial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {nombreUsuario}
                </p>

                <p className="text-xs text-[#d8c2a8]">
                  {rolUsuario}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}