"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"

import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [menuMovilAbierto, setMenuMovilAbierto] =
    useState(false)

  if (pathname === "/login") {
    return children
  }

  return (
    <div className="flex min-h-screen bg-[#f8f5f1]">
      <Sidebar
        movilAbierto={menuMovilAbierto}
        cerrarMenuMovil={() =>
          setMenuMovilAbierto(false)
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          abrirMenuMovil={() =>
            setMenuMovilAbierto(true)
          }
        />

        <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}