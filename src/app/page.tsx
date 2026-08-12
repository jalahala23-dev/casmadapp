"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  FileText,
  Package,
  Plus,
  ShoppingCart,
  Users,
  Loader2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type Cotizacion = {
  id: string
  numero?: number | null
  fecha: string
  estado: string
  total: number
  cliente_id: string | null
}

type Cliente = {
  id: string
  nombre_completo: string
  razon_social: string | null
  nombre_comercial: string | null
}

type DashboardStats = {
  ventasDia: number
  cotizacionesMes: number
  clientes: number
  productos: number
}

export default function Home() {
  const supabase = createSupabaseBrowserClient()

  const [stats, setStats] = useState<DashboardStats>({
    ventasDia: 0,
    cotizacionesMes: 0,
    clientes: 0,
    productos: 0,
  })

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [clientes, setClientes] = useState<Record<string, Cliente>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    cargarDashboard()
  }, [])

  async function cargarDashboard() {
    setCargando(true)
    setError("")

    try {
      const ahora = new Date()

      const inicioDia = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
      )

      const finDia = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() + 1,
      )

      const inicioMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1,
      )

      const finMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + 1,
        1,
      )

      const inicioDiaISO = inicioDia.toISOString()
      const finDiaISO = finDia.toISOString()
      const inicioMesISO = inicioMes.toISOString()
      const finMesISO = finMes.toISOString()

      const [
        ventasResult,
        cotizacionesCountResult,
        clientesCountResult,
        productosCountResult,
        cotizacionesResult,
      ] = await Promise.all([
        // VENTAS DEL DÍA
        // Los borradores no cuentan como venta.
        supabase
          .from("facturas")
          .select("total")
          .gte("created_at", inicioDiaISO)
          .lt("created_at", finDiaISO)
          .in("estado", ["emitida", "pagada"]),

        // COTIZACIONES DEL MES
        supabase
          .from("cotizaciones")
          .select("id", { count: "exact", head: true })
          .gte("created_at", inicioMesISO)
          .lt("created_at", finMesISO),

        // CLIENTES
        supabase
          .from("clientes")
          .select("id", { count: "exact", head: true }),

        // PRODUCTOS / INVENTARIO
        supabase
          .from("productos")
          .select("id", { count: "exact", head: true })
          .neq("estado", "inactivo"),

        // COTIZACIONES RECIENTES
        supabase
          .from("cotizaciones")
          .select(
            "id, numero, fecha, estado, total, cliente_id",
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(5),
      ])

      if (ventasResult.error) {
        console.error(
          "ERROR VENTAS DASHBOARD:",
          ventasResult.error,
        )
        throw ventasResult.error
      }

      if (cotizacionesCountResult.error) {
        console.error(
          "ERROR COTIZACIONES DASHBOARD:",
          cotizacionesCountResult.error,
        )
        throw cotizacionesCountResult.error
      }

      if (clientesCountResult.error) {
        console.error(
          "ERROR CLIENTES DASHBOARD:",
          clientesCountResult.error,
        )
        throw clientesCountResult.error
      }

      if (productosCountResult.error) {
        console.error(
          "ERROR PRODUCTOS DASHBOARD:",
          productosCountResult.error,
        )
        throw productosCountResult.error
      }

      if (cotizacionesResult.error) {
        console.error(
          "ERROR COTIZACIONES RECIENTES:",
          cotizacionesResult.error,
        )
        throw cotizacionesResult.error
      }

      const ventasDia = (
        ventasResult.data || []
      ).reduce(
        (suma, factura) =>
          suma + Number(factura.total || 0),
        0,
      )

      const cotizacionesData =
        (cotizacionesResult.data ||
          []) as Cotizacion[]

      setStats({
        ventasDia,
        cotizacionesMes:
          cotizacionesCountResult.count || 0,
        clientes:
          clientesCountResult.count || 0,
        productos:
          productosCountResult.count || 0,
      })

      setCotizaciones(cotizacionesData)

      // Cargar los clientes de las cotizaciones recientes.
      const idsClientes = Array.from(
        new Set(
          cotizacionesData
            .map(
              (cotizacion) =>
                cotizacion.cliente_id,
            )
            .filter(
              (id): id is string =>
                Boolean(id),
            ),
        ),
      )

      if (idsClientes.length > 0) {
        const {
          data: clientesData,
          error: clientesError,
        } = await supabase
          .from("clientes")
          .select(
            "id, nombre_completo, razon_social, nombre_comercial",
          )
          .in("id", idsClientes)

        if (clientesError) {
          console.error(
            "ERROR CLIENTES COTIZACIONES:",
            clientesError,
          )
        } else {
          const mapa: Record<
            string,
            Cliente
          > = {}

          for (const cliente of
            clientesData || []) {
            mapa[cliente.id] = cliente
          }

          setClientes(mapa)
        }
      } else {
        setClientes({})
      }
    } catch (err: any) {
      console.error(
        "ERROR AL CARGAR DASHBOARD:",
        err,
      )

      setError(
        err?.message ||
          "No se pudo cargar la información del Dashboard.",
      )
    } finally {
      setCargando(false)
    }
  }

  function formatoDinero(valor: number) {
    return `$${Number(valor || 0).toFixed(2)}`
  }

  function formatoFecha(fecha: string) {
    if (!fecha) return "—"

    const partes = fecha.split("-")

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }

    return fecha
  }

  function nombreCliente(clienteId: string | null) {
    if (!clienteId) return "Sin cliente"

    const cliente = clientes[clienteId]

    if (!cliente) return "Sin cliente"

    return (
      cliente.razon_social ||
      cliente.nombre_comercial ||
      cliente.nombre_completo
    )
  }

  function numeroCotizacion(
    cotizacion: Cotizacion,
  ) {
    if (
      cotizacion.numero !== null &&
      cotizacion.numero !== undefined
    ) {
      return `COT-${String(
        cotizacion.numero,
      ).padStart(6, "0")}`
    }

    return `COT-${cotizacion.id
      .slice(0, 8)
      .toUpperCase()}`
  }

  function estadoCotizacion(estado: string) {
    switch (estado) {
      case "borrador":
        return "Borrador"
      case "enviada":
        return "Enviada"
      case "aceptada":
        return "Aceptada"
      case "rechazada":
        return "Rechazada"
      case "convertida":
        return "Convertida"
      default:
        return estado
    }
  }

  function claseEstadoCotizacion(
    estado: string,
  ) {
    switch (estado) {
      case "aceptada":
        return "bg-green-50 text-green-700"
      case "convertida":
        return "bg-blue-50 text-blue-700"
      case "rechazada":
        return "bg-red-50 text-red-700"
      case "enviada":
        return "bg-amber-50 text-amber-700"
      default:
        return "bg-[#f5eadf] text-[#79583f]"
    }
  }

  const statCards = [
    {
      title: "Ventas del día",
      value: formatoDinero(stats.ventasDia),
      description:
        stats.ventasDia > 0
          ? "Ventas emitidas o pagadas hoy"
          : "Sin ventas registradas hoy",
      icon: ShoppingCart,
    },
    {
      title: "Cotizaciones",
      value: String(stats.cotizacionesMes),
      description: "Cotizaciones este mes",
      icon: FileText,
    },
    {
      title: "Clientes",
      value: String(stats.clientes),
      description: "Clientes registrados",
      icon: Users,
    },
    {
      title: "Inventario",
      value: String(stats.productos),
      description: "Productos activos",
      icon: Package,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-[#3b2a20]">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-[#8a7562]">
          Resumen general de Muebles Castillo
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon

          return (
            <Card
              key={stat.title}
              className="border-[#e4d8ca] bg-white shadow-sm"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#8a7562]">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                      {cargando ? (
                        <Loader2
                          size={23}
                          className="animate-spin text-[#8a6046]"
                        />
                      ) : (
                        stat.value
                      )}
                    </p>

                    <p className="mt-1 text-xs text-[#a18e7b]">
                      {stat.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">
                    <Icon size={21} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Contenido inferior */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cotizaciones */}
        <Card className="border-[#e4d8ca] bg-white lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#3b2a20]">
                  Cotizaciones recientes
                </CardTitle>

                <p className="mt-1 text-sm text-[#8a7562]">
                  Últimas cotizaciones creadas
                </p>
              </div>

              <FileText
                className="text-[#a67c52]"
                size={21}
              />
            </div>
          </CardHeader>

          <CardContent>
            {cargando ? (
              <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-[#dccbbb] bg-[#fcfaf8]">
                <div className="flex items-center gap-2 text-sm text-[#8a7562]">
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Cargando cotizaciones...
                </div>
              </div>
            ) : cotizaciones.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#dccbbb] bg-[#fcfaf8] p-6 text-center">
                <FileText
                  className="mb-3 text-[#b79a7d]"
                  size={32}
                />

                <p className="font-medium text-[#5c4635]">
                  No hay cotizaciones todavía
                </p>

                <p className="mt-1 text-sm text-[#9a8775]">
                  Las cotizaciones nuevas aparecerán aquí.
                </p>
              </div>
            ) : (
              <div>
                {/* Vista escritorio */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#eee4db] bg-[#faf7f4] text-left">
                        <th className="px-4 py-3 font-semibold text-[#6b4935]">
                          Cotizacion
                        </th>
                        <th className="px-4 py-3 font-semibold text-[#6b4935]">
                          Cliente
                        </th>
                        <th className="px-4 py-3 font-semibold text-[#6b4935]">
                          Fecha
                        </th>
                        <th className="px-4 py-3 font-semibold text-[#6b4935]">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-[#6b4935]">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-[#6b4935]">
                          Accion
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cotizaciones.map((cotizacion) => (
                        <tr
                          key={cotizacion.id}
                          className="border-b border-[#f0e7df] last:border-0"
                        >
                          <td className="px-4 py-3 font-semibold text-[#3b2a20]">
                            {numeroCotizacion(cotizacion)}
                          </td>
                          <td className="px-4 py-3 text-[#5c4030]">
                            {nombreCliente(cotizacion.cliente_id)}
                          </td>
                          <td className="px-4 py-3 text-[#7b6758]">
                            {formatoFecha(cotizacion.fecha)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${claseEstadoCotizacion(
                                cotizacion.estado,
                              )}`}
                            >
                              {estadoCotizacion(cotizacion.estado)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[#3b2a20]">
                            {formatoDinero(cotizacion.total)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/cotizaciones/${cotizacion.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#d9c8b8] px-3 py-1.5 text-xs font-semibold text-[#5c4030] hover:bg-[#f8f1eb]"
                            >
                              Ver
                              <ArrowUpRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista movil */}
                <div className="space-y-3 md:hidden">
                  {cotizaciones.map((cotizacion) => (
                    <div
                      key={cotizacion.id}
                      className="w-full rounded-xl border border-[#e4d8ca] bg-[#fcfaf8] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-[#3b2a20]">
                            {numeroCotizacion(cotizacion)}
                          </p>
                          <p className="mt-1 break-words text-sm font-medium text-[#5c4030]">
                            {nombreCliente(cotizacion.cliente_id)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${claseEstadoCotizacion(
                            cotizacion.estado,
                          )}`}
                        >
                          {estadoCotizacion(cotizacion.estado)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#eee4db] pt-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                            Fecha
                          </p>
                          <p className="mt-1 text-sm text-[#5c4635]">
                            {formatoFecha(cotizacion.fecha)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#3b2a20]">
                            {formatoDinero(cotizacion.total)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[#eee4db] pt-4">
                        <Link
                          href={`/cotizaciones/${cotizacion.id}`}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d9c8b8] bg-white px-3 py-2.5 text-xs font-semibold text-[#5c4030] hover:bg-[#f8f1eb]"
                        >
                          Ver cotizacion
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card className="border-[#e4d8ca] bg-white">
          <CardHeader>
            <CardTitle className="text-[#3b2a20]">
              Acciones rápidas
            </CardTitle>

            <p className="text-sm text-[#8a7562]">
              Accesos frecuentes
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            <Link
              href="/cotizaciones"
              className="flex w-full items-center justify-between rounded-xl border border-[#e4d8ca] bg-[#fcfaf8] p-4 text-left transition hover:border-[#b79a7d] hover:bg-[#f5eee7]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#5c4030] p-2 text-white">
                  <Plus size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#3b2a20]">
                    Nueva cotización
                  </p>

                  <p className="text-xs text-[#9a8775]">
                    Crear una cotización
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={17}
                className="text-[#9a8775]"
              />
            </Link>

            <Link
              href="/clientes"
              className="flex w-full items-center justify-between rounded-xl border border-[#e4d8ca] bg-[#fcfaf8] p-4 text-left transition hover:border-[#b79a7d] hover:bg-[#f5eee7]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#ead8c4] p-2 text-[#5c4030]">
                  <Users size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#3b2a20]">
                    Nuevo cliente
                  </p>

                  <p className="text-xs text-[#9a8775]">
                    Registrar un cliente
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={17}
                className="text-[#9a8775]"
              />
            </Link>

            <Link
              href="/inventario"
              className="flex w-full items-center justify-between rounded-xl border border-[#e4d8ca] bg-[#fcfaf8] p-4 text-left transition hover:border-[#b79a7d] hover:bg-[#f5eee7]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#ead8c4] p-2 text-[#5c4030]">
                  <Package size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#3b2a20]">
                    Nuevo producto
                  </p>

                  <p className="text-xs text-[#9a8775]">
                    Agregar al inventario
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={17}
                className="text-[#9a8775]"
              />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}