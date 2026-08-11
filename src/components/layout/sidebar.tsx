"use client"

import Link from "next/link"
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
} from "lucide-react"

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
    title: "Facturación",
    icon: Receipt,
    href: "/facturacion",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    href: "/reportes",
  },
  {
    title: "Configuración",
    icon: Settings,
    href: "/configuracion",
  },
]

type SidebarProps = {
  movilAbierto: boolean
  cerrarMenuMovil: () => void
}

export function Sidebar({
  movilAbierto,
  cerrarMenuMovil,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {movilAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
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
        <div className="flex items-start justify-between border-b border-[#5c4635] px-5 py-5 md:block md:px-6 md:py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              CASMAD
            </h1>

            <p className="mt-1 text-sm text-[#d8c2a8]">
              Muebles Castillo
            </p>

            <p className="text-xs text-[#a98f75]">
              Sistema Administrativo
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={cerrarMenuMovil}
            className="rounded-lg p-2 text-[#eadfd3] hover:bg-[#574132] md:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => {
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
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[#5c4635] p-4">
          <p className="text-xs text-[#a98f75]">
            CASMAD ERP
          </p>

          <p className="text-xs text-[#d8c2a8]">
            Muebles Castillo
          </p>
        </div>
      </aside>
    </>
  )
}