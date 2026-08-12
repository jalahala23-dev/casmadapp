"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileText,
  Plus,
  Search,
  Eye,
  Loader2,
  DollarSign,
  CircleDollarSign,
  WalletCards,
} from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type Cliente = {
  id: string
  nombre_completo: string
  razon_social: string | null
  nombre_comercial: string | null
}

type Factura = {
  id: string
  numero: number
  cliente_id: string
  fecha: string
  estado: string
  total: number
  cliente: Cliente | null
  totalPagado: number
  saldoPendiente: number
}

type Pago = {
  id: string
  factura_id: string
  monto: number
  metodo_pago: string
  referencia: string | null
  observaciones: string | null
  fecha_pago: string
  created_at: string
}

const estados = [
  {
    value: "todos",
    label: "Todos",
  },
  {
    value: "borrador",
    label: "Borrador",
  },
  {
    value: "emitida",
    label: "Emitida",
  },
  {
    value: "pagada",
    label: "Pagada",
  },
  {
    value: "anulada",
    label: "Anulada",
  },
]

// ==========================================================
// NOMBRE DEL CLIENTE
// ==========================================================

function nombreCliente(
  cliente: Cliente | null
) {
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

// ==========================================================
// FORMATO DINERO
// ==========================================================

function formatoDinero(
  valor: number
) {
  return `$${Number(
    valor || 0
  ).toFixed(2)}`
}

// ==========================================================
// FORMATO FECHA
// ==========================================================

function formatoFecha(
  fecha: string
) {
  if (!fecha) {
    return ""
  }

  const partes =
    fecha.split("-")

  if (partes.length !== 3) {
    return fecha
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

// ==========================================================
// TEXTO DEL ESTADO
// ==========================================================

function etiquetaEstado(
  estado: string
) {
  switch (estado) {
    case "borrador":
      return "Borrador"

    case "emitida":
      return "Emitida"

    case "pagada":
      return "Pagada"

    case "anulada":
      return "Anulada"

    default:
      return estado
  }
}

// ==========================================================
// CLASE DEL ESTADO
// ==========================================================

function claseEstado(
  estado: string
) {
  switch (estado) {
    case "emitida":
      return "bg-blue-50 text-blue-700"

    case "pagada":
      return "bg-green-50 text-green-700"

    case "anulada":
      return "bg-red-50 text-red-700"

    case "borrador":
    default:
      return "bg-[#f5eadf] text-[#79583f]"
  }
}

// ==========================================================
// ESTADO EFECTIVO
// ==========================================================

function estadoEfectivo(
  factura: {
    estado: string
    total: number
    totalPagado: number
  }
) {
  /*
   * Si la factura tiene pagos suficientes para cubrir
   * el total, la mostramos como PAGADA aunque por
   * cualquier motivo el campo estado de la BD todavia
   * no se haya actualizado.
   */

  if (
    factura.estado !== "anulada" &&
    factura.estado !== "borrador" &&
    factura.total > 0 &&
    factura.totalPagado >=
      factura.total - 0.01
  ) {
    return "pagada"
  }

  return factura.estado
}

// ==========================================================
// PAGINA
// ==========================================================

export default function FacturacionPage() {
  const router = useRouter()

  const supabase =
    createSupabaseBrowserClient()

  const [facturas, setFacturas] =
    useState<Factura[]>([])

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState("")

  const [busqueda, setBusqueda] =
    useState("")

  const [estadoFiltro, setEstadoFiltro] =
    useState("todos")

  // ========================================================
  // CARGAR AL ENTRAR
  // ========================================================

  useEffect(() => {
    cargarFacturas()
  }, [])

  // ========================================================
  // CARGAR FACTURAS + CLIENTES + PAGOS
  // ========================================================

  async function cargarFacturas() {
    setCargando(true)
    setError("")

    // ------------------------------------------------------
    // 1. CARGAR FACTURAS
    // ------------------------------------------------------

    const {
      data: facturasData,
      error: facturasError,
    } = await supabase
      .from("facturas")
      .select(
        `
          id,
          numero,
          cliente_id,
          fecha,
          estado,
          total
        `
      )
      .order("numero", {
        ascending: false,
      })

    if (facturasError) {
      console.error(
        "ERROR AL CARGAR FACTURAS:",
        facturasError
      )

      setError(
        `No se pudieron cargar las facturas: ${facturasError.message}`
      )

      setFacturas([])
      setCargando(false)

      return
    }

    const facturasBase =
      facturasData || []

    // ------------------------------------------------------
    // 2. OBTENER IDS DE CLIENTES
    // ------------------------------------------------------

    const clienteIds = Array.from(
      new Set(
        facturasBase
          .map(
            (factura) =>
              factura.cliente_id
          )
          .filter(Boolean)
      )
    )

    // ------------------------------------------------------
    // 3. CARGAR CLIENTES
    // ------------------------------------------------------

    let clientes: Cliente[] = []

    if (
      clienteIds.length > 0
    ) {
      const {
        data: clientesData,
        error: clientesError,
      } = await supabase
        .from("clientes")
        .select(
          `
            id,
            nombre_completo,
            razon_social,
            nombre_comercial
          `
        )
        .in(
          "id",
          clienteIds
        )

      if (clientesError) {
        console.error(
          "ERROR AL CARGAR CLIENTES DE FACTURAS:",
          clientesError
        )

        setError(
          `No se pudieron cargar los clientes: ${clientesError.message}`
        )

        setCargando(false)

        return
      }

      clientes =
        (clientesData ||
          []) as Cliente[]
    }

    // ------------------------------------------------------
    // 4. OBTENER IDS DE FACTURAS
    // ------------------------------------------------------

    const facturaIds =
      facturasBase
        .map(
          (factura) =>
            factura.id
        )
        .filter(Boolean)

    // ------------------------------------------------------
    // 5. CARGAR PAGOS
    // ------------------------------------------------------

    let pagos: Pago[] = []

    if (
      facturaIds.length > 0
    ) {
      const {
        data: pagosData,
        error: pagosError,
      } = await supabase
        .from("pagos")
        .select(
          `
            id,
            factura_id,
            monto,
            metodo_pago,
            referencia,
            observaciones,
            fecha_pago,
            created_at
          `
        )
        .in(
          "factura_id",
          facturaIds
        )

      if (pagosError) {
        console.error(
          "ERROR AL CARGAR PAGOS:",
          pagosError
        )

        setError(
          `No se pudieron cargar los pagos: ${pagosError.message}`
        )

        setCargando(false)

        return
      }

      pagos =
        (pagosData ||
          []) as Pago[]
    }

    // ------------------------------------------------------
    // 6. MAPA DE CLIENTES
    // ------------------------------------------------------

    const clientesMap =
      new Map<
        string,
        Cliente
      >()

    clientes.forEach(
      (cliente) => {
        clientesMap.set(
          cliente.id,
          cliente
        )
      }
    )

    // ------------------------------------------------------
    // 7. MAPA DE PAGOS
    // ------------------------------------------------------

    const pagosMap =
      new Map<
        string,
        number
      >()

    pagos.forEach(
      (pago) => {
        const anterior =
          pagosMap.get(
            pago.factura_id
          ) || 0

        pagosMap.set(
          pago.factura_id,
          anterior +
            Number(
              pago.monto || 0
            )
        )
      }
    )

    // ------------------------------------------------------
    // 8. UNIR TODO
    // ------------------------------------------------------

    const facturasConDatos =
      facturasBase.map(
        (factura) => {
          const total =
            Number(
              factura.total || 0
            )

          const totalPagado =
            Number(
              pagosMap.get(
                factura.id
              ) || 0
            )

          const saldoPendiente =
            Math.max(
              0,
              total -
                totalPagado
            )

          return {
            id:
              factura.id,

            numero:
              Number(
                factura.numero
              ),

            cliente_id:
              factura.cliente_id,

            fecha:
              factura.fecha,

            estado:
              factura.estado,

            total,

            cliente:
              clientesMap.get(
                factura.cliente_id
              ) || null,

            totalPagado,

            saldoPendiente,
          }
        }
      )

    setFacturas(
      facturasConDatos
    )

    setCargando(false)
  }

  // ========================================================
  // FACTURAS FILTRADAS
  // ========================================================

  const facturasFiltradas =
    facturas.filter(
      (factura) => {
        const clienteNombre =
          nombreCliente(
            factura.cliente
          ).toLowerCase()

        const numeroFactura =
          `FAC-${String(
            factura.numero
          ).padStart(
            6,
            "0"
          )}`.toLowerCase()

        const texto =
          busqueda
            .trim()
            .toLowerCase()

        const coincideBusqueda =
          !texto ||
          clienteNombre.includes(
            texto
          ) ||
          numeroFactura.includes(
            texto
          )

        const estado =
          estadoEfectivo(
            factura
          )

        const coincideEstado =
          estadoFiltro ===
            "todos" ||
          estado ===
            estadoFiltro

        return (
          coincideBusqueda &&
          coincideEstado
        )
      }
    )

  // ========================================================
  // RESUMEN
  // ========================================================

  /*
   * Los borradores y anuladas NO cuentan como venta.
   *
   * Se consideran ventas:
   * - emitidas
   * - pagadas
   */

  const facturasVentas =
    facturas.filter(
      (factura) =>
        factura.estado ===
          "emitida" ||
        factura.estado ===
          "pagada" ||
        (
          factura.estado !==
            "borrador" &&
          factura.estado !==
            "anulada" &&
          factura.totalPagado >=
            factura.total -
              0.01
        )
    )

  const totalVendido =
    facturasVentas.reduce(
      (
        total,
        factura
      ) =>
        total +
        Number(
          factura.total || 0
        ),
      0
    )

  const totalCobrado =
    facturasVentas.reduce(
      (
        total,
        factura
      ) =>
        total +
        Math.min(
          Number(
            factura.totalPagado ||
              0
          ),
          Number(
            factura.total || 0
          )
        ),
      0
    )

  const totalPendiente =
    facturasVentas.reduce(
      (
        total,
        factura
      ) =>
        total +
        Math.max(
          0,
          Number(
            factura.total || 0
          ) -
            Number(
              factura.totalPagado ||
                0
            )
        ),
      0
    )

  // ========================================================
  // CANTIDADES
  // ========================================================

  const cantidadFacturas =
    facturasVentas.length

  const cantidadPendientes =
    facturasVentas.filter(
      (factura) =>
        factura.saldoPendiente >
        0.009
    ).length

  const cantidadPagadas =
    facturasVentas.filter(
      (factura) =>
        factura.saldoPendiente <=
        0.009
    ).length

  // ========================================================
  // PANTALLA
  // ========================================================

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ====================================================
          ENCABEZADO
          ==================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e4d7] text-[#5c4030]">

              <FileText
                size={22}
              />

            </div>

            <div>

              <h1 className="text-3xl font-bold text-[#3b2a20]">
                Facturacion
              </h1>

              <p className="text-sm text-[#8a7562]">
                Administra tus facturas y ventas
              </p>

            </div>

          </div>

        </div>

        <Link
          href="/facturacion/nueva"
          className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326]"
        >

          <Plus
            size={18}
          />

          Nueva factura

        </Link>

      </div>

      {/* ====================================================
          RESUMEN FINANCIERO
          ==================================================== */}

      {!cargando &&
        facturas.length >
          0 && (

          <div className="grid gap-4 md:grid-cols-3">

            {/* TOTAL VENDIDO */}

            <div className="rounded-xl border border-[#e4d8ca] bg-white p-5">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                    Total vendido
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">

                    {formatoDinero(
                      totalVendido
                    )}

                  </p>

                  <p className="mt-1 text-xs text-[#8a7562]">

                    {cantidadFacturas}{" "}
                    {cantidadFacturas ===
                    1
                      ? "factura"
                      : "facturas"}

                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e4d7] text-[#5c4030]">

                  <CircleDollarSign
                    size={22}
                  />

                </div>

              </div>

            </div>

            {/* TOTAL COBRADO */}

            <div className="rounded-xl border border-[#d9eadf] bg-white p-5">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                    Total cobrado
                  </p>

                  <p className="mt-2 text-2xl font-bold text-green-700">

                    {formatoDinero(
                      totalCobrado
                    )}

                  </p>

                  <p className="mt-1 text-xs text-[#8a7562]">

                    {cantidadPagadas}{" "}
                    {cantidadPagadas ===
                    1
                      ? "factura pagada"
                      : "facturas pagadas"}

                  </p>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">

                  <DollarSign
                    size={22}
                  />

                </div>

              </div>

            </div>

            {/* PENDIENTE */}

            <div
              className={`
                rounded-xl
                border
                p-5
                ${
                  totalPendiente >
                  0
                    ? "border-[#ead9c7] bg-[#fffaf5]"
                    : "border-[#d9eadf] bg-white"
                }
              `}
            >

              <div className="flex items-start justify-between">

                <div>

                  <p
                    className={`
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      ${
                        totalPendiente >
                        0
                          ? "text-[#8a6046]"
                          : "text-green-700"
                      }
                    `}
                  >
                    Pendiente por cobrar
                  </p>

                  <p
                    className={`
                      mt-2
                      text-2xl
                      font-bold
                      ${
                        totalPendiente >
                        0
                          ? "text-[#5c4030]"
                          : "text-green-700"
                      }
                    `}
                  >

                    {formatoDinero(
                      totalPendiente
                    )}

                  </p>

                  <p className="mt-1 text-xs text-[#8a7562]">

                    {cantidadPendientes}{" "}
                    {cantidadPendientes ===
                    1
                      ? "factura pendiente"
                      : "facturas pendientes"}

                  </p>

                </div>

                <div
                  className={`
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    ${
                      totalPendiente >
                      0
                        ? "bg-[#f5eadf] text-[#8a6046]"
                        : "bg-green-50 text-green-700"
                    }
                  `}
                >

                  <WalletCards
                    size={22}
                  />

                </div>

              </div>

            </div>

          </div>

        )}

      {/* ====================================================
          ERROR
          ==================================================== */}

      {error && (

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}

      {/* ====================================================
          FILTROS
          ==================================================== */}

      <div className="rounded-xl border border-[#e4d8ca] bg-white p-4">

        <div className="flex flex-col gap-4 md:flex-row">

          {/* BUSCAR */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8776]"
            />

            <input
              type="text"
              value={
                busqueda
              }
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
              placeholder="Buscar por numero o cliente..."
              className="w-full rounded-lg border border-[#e4d8ca] bg-white py-2.5 pl-10 pr-3 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
            />

          </div>

          {/* ESTADO */}

          <select
            value={
              estadoFiltro
            }
            onChange={(e) =>
              setEstadoFiltro(
                e.target.value
              )
            }
            className="rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
          >

            {estados.map(
              (estado) => (

                <option
                  key={
                    estado.value
                  }
                  value={
                    estado.value
                  }
                >

                  {estado.label}

                </option>

              )
            )}

          </select>

        </div>

      </div>

      {/* ====================================================
          TABLA
          ==================================================== */}

      <div className="overflow-hidden rounded-xl border border-[#e4d8ca] bg-white">

        {cargando ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="flex items-center gap-3 text-sm text-[#8a7562]">

              <Loader2
                size={22}
                className="animate-spin"
              />

              Cargando facturas...

            </div>

          </div>

        ) : facturasFiltradas.length ===
          0 ? (

          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5eadf] text-[#79583f]">

              <FileText
                size={28}
              />

            </div>

            <h2 className="text-lg font-semibold text-[#3b2a20]">
              No hay facturas
            </h2>

            <p className="mt-1 max-w-md text-sm text-[#8a7562]">

              {busqueda ||
              estadoFiltro !==
                "todos"
                ? "No encontramos facturas que coincidan con los filtros."
                : "Todavia no se ha creado ninguna factura."}

            </p>

            {!busqueda &&
              estadoFiltro ===
                "todos" && (

                <Link
                  href="/facturacion/nueva"
                  className="mt-5 flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white"
                >

                  <Plus
                    size={17}
                  />

                  Crear primera factura

                </Link>

              )}

          </div>

        ) : (

          <div>
            {/* Vista escritorio */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e4d8ca] bg-[#faf7f4]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">
                      Factura
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">
                      Cliente
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">
                      Fecha
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#79583f]">
                      Estado
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#79583f]">
                      Total
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#79583f]">
                      Pagado
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#79583f]">
                      Saldo
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#79583f]">
                      Accion
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {facturasFiltradas.map((factura) => {
                    const numero =
                      `FAC-${String(factura.numero).padStart(6, "0")}`

                    const estado = estadoEfectivo(factura)

                    const esPendiente =
                      estado === "emitida" &&
                      factura.saldoPendiente > 0.009

                    const saldoMostrar =
                      estado === "borrador" ||
                      estado === "anulada"
                        ? null
                        : factura.saldoPendiente

                    return (
                      <tr
                        key={factura.id}
                        role="link"
                        tabIndex={0}
                        aria-label={`Ver ${numero}`}
                        onClick={() =>
                          router.push(
                            `/facturacion/${factura.id}`
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault()
                            router.push(
                              `/facturacion/${factura.id}`
                            )
                          }
                        }}
                        className="cursor-pointer border-b border-[#f0e8df] last:border-0 hover:bg-[#fcfaf8] focus:bg-[#fcfaf8] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8a6046]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#3b2a20]">
                            {numero}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-[#4d392b]">
                            {nombreCliente(factura.cliente)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#6b5746]">
                          {formatoFecha(factura.fecha)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                              estado
                            )}`}
                          >
                            {etiquetaEstado(estado)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-[#3b2a20]">
                          {formatoDinero(factura.total)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {estado === "borrador" ||
                          estado === "anulada" ? (
                            <span className="text-sm text-[#a79586]">
                              -
                            </span>
                          ) : (
                            <span className="font-semibold text-green-700">
                              {formatoDinero(
                                factura.totalPagado
                              )}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {saldoMostrar === null ? (
                            <span className="text-sm text-[#a79586]">
                              -
                            </span>
                          ) : saldoMostrar <= 0.009 ? (
                            <span className="font-semibold text-green-700">
                              $0.00
                            </span>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span
                                className={`font-bold ${
                                  esPendiente
                                    ? "text-[#8a6046]"
                                    : "text-[#3b2a20]"
                                }`}
                              >
                                {formatoDinero(saldoMostrar)}
                              </span>

                              {esPendiente && (
                                <span className="text-[11px] font-medium text-[#a17c5e]">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td
                          className="px-5 py-4 text-right"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          <Link
                            href={`/facturacion/${factura.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#dccbbb] px-3 py-2 text-sm font-medium text-[#5c4030] transition hover:bg-[#f5ede5]"
                          >
                            <Eye size={16} />
                            Ver
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista movil */}
            <div className="space-y-3 p-3 md:hidden">
              {facturasFiltradas.map((factura) => {
                const numero =
                  `FAC-${String(factura.numero).padStart(6, "0")}`

                const estado = estadoEfectivo(factura)

                const esPendiente =
                  estado === "emitida" &&
                  factura.saldoPendiente > 0.009

                const saldoMostrar =
                  estado === "borrador" ||
                  estado === "anulada"
                    ? null
                    : factura.saldoPendiente

                return (
                  <div
                    key={factura.id}
                    onClick={() =>
                      router.push(
                        `/facturacion/${factura.id}`
                      )
                    }
                    className="w-full cursor-pointer rounded-xl border border-[#e4d8ca] bg-white p-4 shadow-sm transition active:bg-[#fcfaf8]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-[#3b2a20]">
                          {numero}
                        </p>

                        <p className="mt-1 break-words font-medium text-[#4d392b]">
                          {nombreCliente(factura.cliente)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${claseEstado(
                          estado
                        )}`}
                      >
                        {etiquetaEstado(estado)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f0e8df] pt-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                          Fecha
                        </p>
                        <p className="mt-1 text-sm text-[#3b2a20]">
                          {formatoFecha(factura.fecha)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                          Total
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#3b2a20]">
                          {formatoDinero(factura.total)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                          Pagado
                        </p>

                        <p className="mt-1 text-sm">
                          {estado === "borrador" ||
                          estado === "anulada" ? (
                            <span className="text-[#a79586]">
                              -
                            </span>
                          ) : (
                            <span className="font-semibold text-green-700">
                              {formatoDinero(
                                factura.totalPagado
                              )}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                          Saldo
                        </p>

                        <p className="mt-1 text-sm">
                          {saldoMostrar === null ? (
                            <span className="text-[#a79586]">
                              -
                            </span>
                          ) : saldoMostrar <= 0.009 ? (
                            <span className="font-semibold text-green-700">
                              $0.00
                            </span>
                          ) : (
                            <span
                              className={`font-bold ${
                                esPendiente
                                  ? "text-[#8a6046]"
                                  : "text-[#3b2a20]"
                              }`}
                            >
                              {formatoDinero(saldoMostrar)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {esPendiente && (
                      <p className="mt-1 text-right text-[11px] font-medium text-[#a17c5e]">
                        Pendiente por cobrar
                      </p>
                    )}

                    <div
                      className="mt-4 border-t border-[#f0e8df] pt-4"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <Link
                        href={`/facturacion/${factura.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f4eadf] px-3 py-2.5 text-sm font-semibold text-[#5c4030]"
                      >
                        <Eye size={16} />
                        Ver factura
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        )}

      </div>

      {/* ====================================================
          CONTADOR
          ==================================================== */}

      {!cargando &&
        facturas.length >
          0 && (

          <div className="flex flex-col gap-1 text-sm text-[#8a7562] md:flex-row md:items-center md:justify-between">

            <p>

              Mostrando{" "}

              <strong>
                {
                  facturasFiltradas.length
                }
              </strong>

              {" "}de{" "}

              <strong>
                {facturas.length}
              </strong>

              {" "}facturas.

            </p>

            {cantidadPendientes >
              0 && (

              <p className="font-medium text-[#8a6046]">

                Pendiente por cobrar:{" "}

                <strong>
                  {formatoDinero(
                    totalPendiente
                  )}
                </strong>

              </p>

            )}

          </div>

        )}

    </div>
  )
}