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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-[#5c4635] bg-[#3b2a20] text-white md:flex">
      <div className="border-b border-[#5c4635] px-6 py-6">
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

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#a67c52] text-white shadow-sm"
                  : "text-[#eadfd3] hover:bg-[#574132] hover:text-white"
              }`}
            >
              <Icon size={19} />
              {item.title}
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
  )
}