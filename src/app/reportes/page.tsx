"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  ShoppingCart,
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  Ban,
} from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type Cliente = {
  id: string
  nombre_completo: string | null
  razon_social: string | null
  nombre_comercial: string | null
}

type Factura = {
  id: string
  numero: number
  cliente_id: string | null
  fecha: string
  estado: string
  total: number
}

type Cotizacion = {
  id: string
  numero: number
  cliente_id: string | null
  fecha: string
  estado: string
  total: number
}

type ClienteVenta = {
  id: string
  nombre: string
  total: number
  facturas: number
}

function dinero(valor: number) {
  return `$${Number(valor || 0).toFixed(2)}`
}

function fechaTexto(fecha: string) {
  if (!fecha) return ""

  const partes = fecha.split("-")

  if (partes.length !== 3) {
    return fecha
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function nombreCliente(cliente?: Cliente) {
  if (!cliente) {
    return "Sin cliente"
  }

  return (
    cliente.razon_social ||
    cliente.nombre_comercial ||
    cliente.nombre_completo ||
    "Sin nombre"
  )
}

function nombreMes(mes: string) {
  const [anio, numero] = mes.split("-")

  const fecha = new Date(
    Number(anio),
    Number(numero) - 1,
    1
  )

  return fecha.toLocaleDateString("es-SV", {
    month: "long",
    year: "numeric",
  })
}

function etiquetaFactura(estado: string) {
  switch (estado) {
    case "borrador":
      return "Borradores"

    case "emitida":
      return "Emitidas"

    case "pagada":
      return "Pagadas"

    case "anulada":
      return "Anuladas"

    default:
      return estado
  }
}

function etiquetaCotizacion(estado: string) {
  switch (estado) {
    case "borrador":
      return "Borradores"

    case "enviada":
      return "Enviadas"

    case "aprobada":
      return "Aprobadas"

    case "rechazada":
      return "Rechazadas"

    case "vencida":
      return "Vencidas"

    case "convertida":
      return "Convertidas"

    default:
      return estado
  }
}

export default function ReportesPage() {
  const supabase = createSupabaseBrowserClient()

  const [facturas, setFacturas] = useState<Factura[]>([])
  const [cotizaciones, setCotizaciones] =
    useState<Cotizacion[]>([])
  const [clientes, setClientes] =
    useState<Cliente[]>([])

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState("")

  // Este mes por defecto
  const [periodo, setPeriodo] =
    useState("mes")

  async function cargarReportes() {
    setCargando(true)
    setError("")

    try {
      const [
        facturasResult,
        cotizacionesResult,
        clientesResult,
      ] = await Promise.all([
        supabase
          .from("facturas")
          .select(
            "id,numero,cliente_id,fecha,estado,total"
          )
          .order("fecha", {
            ascending: false,
          }),

        supabase
          .from("cotizaciones")
          .select(
            "id,numero,cliente_id,fecha,estado,total"
          )
          .order("fecha", {
            ascending: false,
          }),

        supabase
          .from("clientes")
          .select(
            "id,nombre_completo,razon_social,nombre_comercial"
          )
          .order("nombre_completo"),
      ])

      if (facturasResult.error) {
        throw new Error(
          `Error cargando facturas: ${facturasResult.error.message}`
        )
      }

      if (cotizacionesResult.error) {
        throw new Error(
          `Error cargando cotizaciones: ${cotizacionesResult.error.message}`
        )
      }

      if (clientesResult.error) {
        throw new Error(
          `Error cargando clientes: ${clientesResult.error.message}`
        )
      }

      setFacturas(
        (facturasResult.data ||
          []) as Factura[]
      )

      setCotizaciones(
        (cotizacionesResult.data ||
          []) as Cotizacion[]
      )

      setClientes(
        (clientesResult.data ||
          []) as Cliente[]
      )
    } catch (err: any) {
      console.error(
        "ERROR AL CARGAR REPORTES:",
        err
      )

      setError(
        err?.message ||
          "No se pudieron cargar los reportes."
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarReportes()
  }, [])

  const mapaClientes = useMemo(() => {
    const mapa = new Map<
      string,
      Cliente
    >()

    clientes.forEach((cliente) => {
      mapa.set(cliente.id, cliente)
    })

    return mapa
  }, [clientes])

  /*
   * ==========================================================
   * FECHA INICIAL DEL PERÍODO
   * ==========================================================
   */

  const inicioPeriodo = useMemo(() => {
    const fecha = new Date()

    if (periodo === "hoy") {
      fecha.setHours(0, 0, 0, 0)

      return fecha
    }

    if (periodo === "semana") {
      const dia = fecha.getDay()

      const diferencia =
        dia === 0 ? 6 : dia - 1

      fecha.setDate(
        fecha.getDate() - diferencia
      )

      fecha.setHours(0, 0, 0, 0)

      return fecha
    }

    if (periodo === "mes") {
      return new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        1
      )
    }

    if (periodo === "anio") {
      return new Date(
        fecha.getFullYear(),
        0,
        1
      )
    }

    return new Date(
      2000,
      0,
      1
    )
  }, [periodo])

  /*
   * ==========================================================
   * FILTRAR POR PERÍODO
   * ==========================================================
   */

  const facturasPeriodo = useMemo(() => {
    return facturas.filter(
      (factura) => {
        const fecha = new Date(
          `${factura.fecha}T00:00:00`
        )

        return fecha >= inicioPeriodo
      }
    )
  }, [
    facturas,
    inicioPeriodo,
  ])

  const cotizacionesPeriodo =
    useMemo(() => {
      return cotizaciones.filter(
        (cotizacion) => {
          const fecha = new Date(
            `${cotizacion.fecha}T00:00:00`
          )

          return fecha >= inicioPeriodo
        }
      )
    }, [
      cotizaciones,
      inicioPeriodo,
    ])

  /*
   * ==========================================================
   * VENTAS REALES
   * ==========================================================
   */

  const facturasValidas =
    useMemo(() => {
      return facturasPeriodo.filter(
        (factura) =>
          factura.estado ===
            "emitida" ||
          factura.estado ===
            "pagada"
      )
    }, [facturasPeriodo])

  const totalVentas = useMemo(() => {
    return facturasValidas.reduce(
      (total, factura) =>
        total +
        Number(
          factura.total || 0
        ),
      0
    )
  }, [facturasValidas])

  /*
   * ==========================================================
   * TOTAL COTIZADO
   * ==========================================================
   */

  const totalCotizado =
    useMemo(() => {
      return cotizacionesPeriodo.reduce(
        (total, cotizacion) =>
          total +
          Number(
            cotizacion.total || 0
          ),
        0
      )
    }, [
      cotizacionesPeriodo,
    ])

  /*
   * ==========================================================
   * CONVERSIÓN
   * ==========================================================
   */

  const cotizacionesConvertidas =
    useMemo(() => {
      return cotizacionesPeriodo.filter(
        (cotizacion) =>
          cotizacion.estado ===
          "convertida"
      ).length
    }, [
      cotizacionesPeriodo,
    ])

  const porcentajeConversion =
    useMemo(() => {
      if (
        cotizacionesPeriodo.length ===
        0
      ) {
        return 0
      }

      return (
        cotizacionesConvertidas /
        cotizacionesPeriodo.length
      ) *
        100
    }, [
      cotizacionesPeriodo,
      cotizacionesConvertidas,
    ])

  /*
   * ==========================================================
   * ESTADOS DE FACTURAS
   * ==========================================================
   */

  const estadosFacturas =
    useMemo(() => {
      return {
        borrador:
          facturasPeriodo.filter(
            (f) =>
              f.estado ===
              "borrador"
          ).length,

        emitida:
          facturasPeriodo.filter(
            (f) =>
              f.estado ===
              "emitida"
          ).length,

        pagada:
          facturasPeriodo.filter(
            (f) =>
              f.estado ===
              "pagada"
          ).length,

        anulada:
          facturasPeriodo.filter(
            (f) =>
              f.estado ===
              "anulada"
          ).length,
      }
    }, [facturasPeriodo])

  /*
   * ==========================================================
   * ESTADOS DE COTIZACIONES
   * ==========================================================
   */

  const estadosCotizaciones =
    useMemo(() => {
      return {
        borrador:
          cotizacionesPeriodo.filter(
            (c) =>
              c.estado ===
              "borrador"
          ).length,

        enviada:
          cotizacionesPeriodo.filter(
            (c) =>
              c.estado ===
              "enviada"
          ).length,

        aprobada:
          cotizacionesPeriodo.filter(
            (c) =>
              c.estado ===
              "aprobada"
          ).length,

        rechazada:
          cotizacionesPeriodo.filter(
            (c) =>
              c.estado ===
              "rechazada"
          ).length,

        vencida:
          cotizacionesPeriodo.filter(
            (c) =>
              c.estado ===
              "vencida"
          ).length,

        convertida:
          cotizacionesPeriodo.filter(
            (c) =>
              c.estado ===
              "convertida"
          ).length,
      }
    }, [
      cotizacionesPeriodo,
    ])

  /*
   * ==========================================================
   * VENTAS POR MES
   * ==========================================================
   */

  const ventasMensuales =
    useMemo(() => {
      const agrupadas =
        new Map<
          string,
          number
        >()

      facturasValidas.forEach(
        (factura) => {
          const mes =
            factura.fecha.substring(
              0,
              7
            )

          agrupadas.set(
            mes,
            (agrupadas.get(mes) ||
              0) +
              Number(
                factura.total || 0
              )
          )
        }
      )

      return Array.from(
        agrupadas.entries()
      )
        .sort((a, b) =>
          a[0].localeCompare(
            b[0]
          )
        )
        .map(
          ([mes, total]) => ({
            mes,
            total,
          })
        )
    }, [facturasValidas])

  const maxVentaMensual =
    ventasMensuales.length
      ? Math.max(
          ...ventasMensuales.map(
            (item) =>
              item.total
          )
        )
      : 0

  /*
   * ==========================================================
   * CLIENTES CON MAYOR FACTURACIÓN
   * ==========================================================
   */

  const clientesVentas =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          ClienteVenta
        >()

      facturasValidas.forEach(
        (factura) => {
          const clienteId =
            factura.cliente_id ||
            "sin-cliente"

          const cliente =
            factura.cliente_id
              ? mapaClientes.get(
                  factura.cliente_id
                )
              : undefined

          const existente =
            mapa.get(clienteId)

          if (existente) {
            existente.total +=
              Number(
                factura.total ||
                  0
              )

            existente.facturas +=
              1
          } else {
            mapa.set(
              clienteId,
              {
                id: clienteId,
                nombre:
                  nombreCliente(
                    cliente
                  ),
                total:
                  Number(
                    factura.total ||
                      0
                  ),
                facturas: 1,
              }
            )
          }
        }
      )

      return Array.from(
        mapa.values()
      )
        .sort(
          (a, b) =>
            b.total -
            a.total
        )
        .slice(0, 5)
    }, [
      facturasValidas,
      mapaClientes,
    ])

  function imprimirReporte() {
    window.print()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ======================================================
          ENCABEZADO
          ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e4d7] text-[#5c4030]">

              <BarChart3 size={22} />

            </div>

            <div>

              <h1 className="text-3xl font-bold text-[#3b2a20]">
                Reportes
              </h1>

              <p className="text-sm text-[#8a7562]">
                Resumen general de Muebles Castillo
              </p>

            </div>

          </div>

        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={cargarReportes}
            className="flex items-center gap-2 rounded-lg border border-[#dccbbb] bg-white px-4 py-2.5 text-sm font-semibold text-[#5c4030] hover:bg-[#faf5f0]"
          >

            <RefreshCw size={17} />

            Actualizar

          </button>

          <button
            type="button"
            onClick={imprimirReporte}
            className="flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3326]"
          >

            <Printer size={17} />

            Imprimir

          </button>

        </div>

      </div>


      {/* ======================================================
          FILTRO
          ====================================================== */}

      <div className="flex flex-col gap-3 rounded-xl border border-[#e4d8ca] bg-white p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">

        <div>

          <p className="font-semibold text-[#3b2a20]">
            Período del reporte
          </p>

          <p className="text-sm text-[#8a7562]">
            Selecciona el período que deseas analizar.
          </p>

        </div>

        <select
          value={periodo}
          onChange={(e) =>
            setPeriodo(
              e.target.value
            )
          }
          className="rounded-lg border border-[#e4d8ca] bg-white px-4 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
        >

          <option value="hoy">
            Hoy
          </option>

          <option value="semana">
            Esta semana
          </option>

          <option value="mes">
            Este mes
          </option>

          <option value="anio">
            Este año
          </option>

          <option value="todo">
            Todo
          </option>

        </select>

      </div>


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}


      {cargando ? (

        <div className="flex min-h-[400px] items-center justify-center">

          <div className="flex items-center gap-3 text-[#8a7562]">

            <Loader2
              size={24}
              className="animate-spin"
            />

            Cargando reportes...

          </div>

        </div>

      ) : (

        <>

          {/* ==================================================
              RESUMEN PRINCIPAL
              ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* VENTAS */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white p-5">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm text-[#8a7562]">
                    Ventas reales
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {dinero(
                      totalVentas
                    )}
                  </p>

                  <p className="mt-1 text-xs text-[#a18e7b]">
                    Emitidas + pagadas
                  </p>

                </div>

                <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

                  <ShoppingCart
                    size={21}
                  />

                </div>

              </div>

            </div>


            {/* FACTURAS */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white p-5">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm text-[#8a7562]">
                    Facturas
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      facturasPeriodo.length
                    }
                  </p>

                  <p className="mt-1 text-xs text-[#a18e7b]">
                    {
                      facturasValidas.length
                    }{" "}
                    ventas reales
                  </p>

                </div>

                <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

                  <FileText
                    size={21}
                  />

                </div>

              </div>

            </div>


            {/* COTIZADO */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white p-5">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm text-[#8a7562]">
                    Total cotizado
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {dinero(
                      totalCotizado
                    )}
                  </p>

                  <p className="mt-1 text-xs text-[#a18e7b]">
                    {
                      cotizacionesPeriodo.length
                    }{" "}
                    cotizaciones
                  </p>

                </div>

                <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

                  <BarChart3
                    size={21}
                  />

                </div>

              </div>

            </div>


            {/* CONVERSIÓN */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white p-5">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-sm text-[#8a7562]">
                    Conversión
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {porcentajeConversion.toFixed(
                      1
                    )}
                    %
                  </p>

                  <p className="mt-1 text-xs text-[#a18e7b]">
                    {
                      cotizacionesConvertidas
                    }{" "}
                    convertidas
                  </p>

                </div>

                <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

                  <CheckCircle2
                    size={21}
                  />

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              ESTADOS
              ================================================== */}

          <div className="grid gap-6 lg:grid-cols-2">

            {/* ESTADOS FACTURAS */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white">

              <div className="border-b border-[#eee3d8] p-5">

                <h2 className="font-semibold text-[#3b2a20]">
                  Estado de facturación
                </h2>

                <p className="mt-1 text-sm text-[#8a7562]">
                  Resumen de facturas del período
                </p>

              </div>

              <div className="grid grid-cols-2 gap-3 p-5">

                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <div className="flex items-center gap-2 text-[#8a7562]">

                    <Clock3
                      size={17}
                    />

                    <span className="text-xs">
                      Borradores
                    </span>

                  </div>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosFacturas.borrador
                    }
                  </p>

                </div>


                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <div className="flex items-center gap-2 text-[#8a7562]">

                    <FileText
                      size={17}
                    />

                    <span className="text-xs">
                      Emitidas
                    </span>

                  </div>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosFacturas.emitida
                    }
                  </p>

                </div>


                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <div className="flex items-center gap-2 text-[#8a7562]">

                    <CheckCircle2
                      size={17}
                    />

                    <span className="text-xs">
                      Pagadas
                    </span>

                  </div>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosFacturas.pagada
                    }
                  </p>

                </div>


                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <div className="flex items-center gap-2 text-[#8a7562]">

                    <Ban
                      size={17}
                    />

                    <span className="text-xs">
                      Anuladas
                    </span>

                  </div>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosFacturas.anulada
                    }
                  </p>

                </div>

              </div>

            </div>


            {/* ESTADOS COTIZACIONES */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white">

              <div className="border-b border-[#eee3d8] p-5">

                <h2 className="font-semibold text-[#3b2a20]">
                  Estado de cotizaciones
                </h2>

                <p className="mt-1 text-sm text-[#8a7562]">
                  Resumen de cotizaciones del período
                </p>

              </div>

              <div className="grid grid-cols-2 gap-3 p-5">

                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <p className="text-xs text-[#8a7562]">
                    Borradores
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosCotizaciones.borrador
                    }
                  </p>

                </div>


                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <p className="text-xs text-[#8a7562]">
                    Enviadas
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosCotizaciones.enviada
                    }
                  </p>

                </div>


                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <p className="text-xs text-[#8a7562]">
                    Aprobadas
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosCotizaciones.aprobada
                    }
                  </p>

                </div>


                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <p className="text-xs text-[#8a7562]">
                    Rechazadas
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosCotizaciones.rechazada
                    }
                  </p>

                </div>


                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <p className="text-xs text-[#8a7562]">
                    Vencidas
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosCotizaciones.vencida
                    }
                  </p>

                </div>


                <div className="rounded-xl bg-[#faf7f4] p-4">

                  <p className="text-xs text-[#8a7562]">
                    Convertidas
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {
                      estadosCotizaciones.convertida
                    }
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              GRÁFICAS
              ================================================== */}

          <div className="grid gap-6 lg:grid-cols-2">

            {/* VENTAS POR MES */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white">

              <div className="border-b border-[#eee3d8] p-5">

                <h2 className="font-semibold text-[#3b2a20]">
                  Ventas por mes
                </h2>

                <p className="mt-1 text-sm text-[#8a7562]">
                  Solo facturas emitidas y pagadas
                </p>

              </div>

              <div className="p-5">

                {ventasMensuales.length ===
                0 ? (

                  <div className="flex min-h-[250px] items-center justify-center text-center">

                    <div>

                      <BarChart3
                        size={35}
                        className="mx-auto mb-3 text-[#b79a7d]"
                      />

                      <p className="font-medium text-[#5c4635]">
                        No hay ventas en este período
                      </p>

                      <p className="mt-1 text-sm text-[#9a8775]">
                        Las ventas aparecerán aquí cuando haya facturas emitidas o pagadas.
                      </p>

                    </div>

                  </div>

                ) : (

                  <div className="space-y-5">

                    {ventasMensuales.map(
                      (venta) => {

                        const porcentaje =
                          maxVentaMensual >
                          0
                            ? (venta.total /
                                maxVentaMensual) *
                              100
                            : 0

                        return (

                          <div
                            key={
                              venta.mes
                            }
                          >

                            <div className="mb-2 flex justify-between text-sm">

                              <span className="capitalize text-[#6b5746]">
                                {nombreMes(
                                  venta.mes
                                )}
                              </span>

                              <strong className="text-[#3b2a20]">
                                {dinero(
                                  venta.total
                                )}
                              </strong>

                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-[#f1e7dc]">

                              <div
                                className="h-full rounded-full bg-[#8a6046]"
                                style={{
                                  width: `${porcentaje}%`,
                                }}
                              />

                            </div>

                          </div>

                        )
                      }
                    )}

                  </div>

                )}

              </div>

            </div>


            {/* CLIENTES */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white">

              <div className="border-b border-[#eee3d8] p-5">

                <h2 className="font-semibold text-[#3b2a20]">
                  Clientes con mayor facturación
                </h2>

                <p className="mt-1 text-sm text-[#8a7562]">
                  Principales clientes del período
                </p>

              </div>

              <div className="p-5">

                {clientesVentas.length ===
                0 ? (

                  <div className="flex min-h-[250px] items-center justify-center text-center">

                    <div>

                      <Users
                        size={35}
                        className="mx-auto mb-3 text-[#b79a7d]"
                      />

                      <p className="font-medium text-[#5c4635]">
                        No hay ventas por cliente
                      </p>

                    </div>

                  </div>

                ) : (

                  <div className="space-y-4">

                    {clientesVentas.map(
                      (
                        cliente,
                        index
                      ) => (

                        <div
                          key={
                            cliente.id
                          }
                          className="flex items-center justify-between rounded-lg border border-[#eee3d8] bg-[#fcfaf8] p-4"
                        >

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ead8c4] text-sm font-bold text-[#5c4030]">

                              {index + 1}

                            </div>

                            <div>

                              <p className="font-semibold text-[#3b2a20]">
                                {cliente.nombre}
                              </p>

                              <p className="text-xs text-[#8a7562]">
                                {cliente.facturas}{" "}
                                factura
                                {cliente.facturas ===
                                1
                                  ? ""
                                  : "s"}
                              </p>

                            </div>

                          </div>

                          <strong className="text-[#3b2a20]">
                            {dinero(
                              cliente.total
                            )}
                          </strong>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

          </div>


          {/* ==================================================
              FACTURAS
              ================================================== */}

          <div className="rounded-xl border border-[#e4d8ca] bg-white">

            <div className="border-b border-[#eee3d8] p-5">

              <h2 className="font-semibold text-[#3b2a20]">
                Facturas del período
              </h2>

              <p className="mt-1 text-sm text-[#8a7562]">
                Últimas operaciones registradas
              </p>

            </div>

            <div>
              {/* Vista escritorio */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e4d8ca] bg-[#faf7f4]">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">Factura</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">Cliente</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">Fecha</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">Estado</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#79583f]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturasPeriodo.slice(0, 20).map((factura) => {
                      const cliente = factura.cliente_id
                        ? mapaClientes.get(factura.cliente_id)
                        : undefined

                      return (
                        <tr
                          key={factura.id}
                          className="border-b border-[#f0e8df] last:border-0"
                        >
                          <td className="px-5 py-4 font-semibold text-[#3b2a20]">
                            FAC-{String(factura.numero).padStart(6, "0")}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#5c4635]">
                            {nombreCliente(cliente)}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#6b5746]">
                            {fechaTexto(factura.fecha)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-[#f5eadf] px-3 py-1 text-xs font-semibold text-[#79583f]">
                              {etiquetaFactura(factura.estado)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-[#3b2a20]">
                            {dinero(factura.total)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista movil */}
              <div className="space-y-3 p-3 md:hidden">
                {facturasPeriodo.slice(0, 20).map((factura) => {
                  const cliente = factura.cliente_id
                    ? mapaClientes.get(factura.cliente_id)
                    : undefined

                  return (
                    <div
                      key={factura.id}
                      className="w-full rounded-xl border border-[#e4d8ca] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-[#3b2a20]">
                            FAC-{String(factura.numero).padStart(6, "0")}
                          </p>
                          <p className="mt-1 break-words text-sm font-medium text-[#5c4635]">
                            {nombreCliente(cliente)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-[#f5eadf] px-2.5 py-1 text-xs font-semibold text-[#79583f]">
                          {etiquetaFactura(factura.estado)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f0e8df] pt-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                            Fecha
                          </p>
                          <p className="mt-1 text-sm text-[#3b2a20]">
                            {fechaTexto(factura.fecha)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#3b2a20]">
                            {dinero(factura.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>


          {/* ==================================================
              COTIZACIONES
              ================================================== */}

          <div className="rounded-xl border border-[#e4d8ca] bg-white">

            <div className="border-b border-[#eee3d8] p-5">

              <h2 className="font-semibold text-[#3b2a20]">
                Cotizaciones del período
              </h2>

              <p className="mt-1 text-sm text-[#8a7562]">
                Resumen de cotizaciones creadas
              </p>

            </div>

            <div>
              {/* Vista escritorio */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e4d8ca] bg-[#faf7f4]">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">Cotizacion</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">Cliente</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">Fecha</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">Estado</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#79583f]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizacionesPeriodo.slice(0, 20).map((cotizacion) => {
                      const cliente = cotizacion.cliente_id
                        ? mapaClientes.get(cotizacion.cliente_id)
                        : undefined

                      return (
                        <tr
                          key={cotizacion.id}
                          className="border-b border-[#f0e8df] last:border-0"
                        >
                          <td className="px-5 py-4 font-semibold text-[#3b2a20]">
                            COT-{String(cotizacion.numero).padStart(6, "0")}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#5c4635]">
                            {nombreCliente(cliente)}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#6b5746]">
                            {fechaTexto(cotizacion.fecha)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-[#f5eadf] px-3 py-1 text-xs font-semibold text-[#79583f]">
                              {etiquetaCotizacion(cotizacion.estado)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-[#3b2a20]">
                            {dinero(cotizacion.total)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista movil */}
              <div className="space-y-3 p-3 md:hidden">
                {cotizacionesPeriodo.slice(0, 20).map((cotizacion) => {
                  const cliente = cotizacion.cliente_id
                    ? mapaClientes.get(cotizacion.cliente_id)
                    : undefined

                  return (
                    <div
                      key={cotizacion.id}
                      className="w-full rounded-xl border border-[#e4d8ca] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-[#3b2a20]">
                            COT-{String(cotizacion.numero).padStart(6, "0")}
                          </p>
                          <p className="mt-1 break-words text-sm font-medium text-[#5c4635]">
                            {nombreCliente(cliente)}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-[#f5eadf] px-2.5 py-1 text-xs font-semibold text-[#79583f]">
                          {etiquetaCotizacion(cotizacion.estado)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f0e8df] pt-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                            Fecha
                          </p>
                          <p className="mt-1 text-sm text-[#3b2a20]">
                            {fechaTexto(cotizacion.fecha)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-bold text-[#3b2a20]">
                            {dinero(cotizacion.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>


          {/* ==================================================
              PIE DE REPORTE
              ================================================== */}

          <div className="hidden border-t border-[#e4d8ca] pt-5 text-center text-sm text-[#8a7562] print:block">

            <p className="font-semibold text-[#3b2a20]">
              Muebles Castillo
            </p>

            <p>
              Sistema Administrativo CASMAD
            </p>

            <p className="mt-2">
              Reporte generado el{" "}
              {new Date().toLocaleDateString(
                "es-SV"
              )}
            </p>

          </div>

        </>

      )}

    </div>
  )
}