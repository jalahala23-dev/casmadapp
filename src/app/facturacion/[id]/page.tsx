"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Receipt,
  User,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type Factura = {
  id: string
  numero: number
  cliente_id: string
  fecha: string
  fecha_vencimiento: string | null
  estado: string
  tipo_iva: "incluido" | "separado"
  porcentaje_iva: number
  subtotal: number
  descuento: number
  iva: number
  total: number
  observaciones: string | null
}

type Cliente = {
  id: string
  nombre_completo: string
  razon_social: string | null
  nombre_comercial: string | null
  numero_documento: string | null
  telefono: string | null
  correo: string | null
  direccion: string | null
}

type DetalleFactura = {
  id: string
  factura_id: string
  producto_id: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  descuento: number
  subtotal: number
  especificaciones: string | null
}

type Pago = {
  id: string
  factura_id: string
  monto: number
  metodo_pago: string
  referencia: string | null
  fecha_pago: string
  observaciones: string | null
}

export default function FacturaDetallePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const id = params.id as string

  const [factura, setFactura] = useState<Factura | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [detalles, setDetalles] = useState<DetalleFactura[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState(false)
  const [montoPago, setMontoPago] = useState("")
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [referenciaPago, setReferenciaPago] = useState("")
  const [observacionesPago, setObservacionesPago] = useState("")
  const [registrandoPago, setRegistrandoPago] = useState(false)
  const [errorPago, setErrorPago] = useState("")
  const [mostrarFormularioAnulacion, setMostrarFormularioAnulacion] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")
  const [anulandoFactura, setAnulandoFactura] = useState(false)
  const [errorAnulacion, setErrorAnulacion] = useState("")

  useEffect(() => {
    if (id) {
      void cargarFactura()
    }
  }, [id])

  async function cargarFactura() {
    setCargando(true)
    setError("")

    const {
      data: facturaData,
      error: facturaError,
    } = await supabase
      .from("facturas")
      .select("*")
      .eq("id", id)
      .single()

    if (facturaError || !facturaData) {
      console.error("ERROR AL CARGAR FACTURA:", facturaError)

      setError(
        facturaError?.message ||
          "No se encontró la factura."
      )

      setCargando(false)
      return
    }

    const [
      clienteResult,
      detallesResult,
      pagosResult,
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("*")
        .eq("id", facturaData.cliente_id)
        .single(),

      supabase
        .from("factura_detalles")
        .select("*")
        .eq("factura_id", id)
        .order("id", {
          ascending: true,
        }),

      supabase
        .from("pagos")
        .select("*")
        .eq("factura_id", id)
        .order("fecha_pago", {
          ascending: false,
        }),
    ])

    if (clienteResult.error) {
      console.error(
        "ERROR AL CARGAR CLIENTE:",
        clienteResult.error
      )
    }

    if (detallesResult.error) {
      console.error(
        "ERROR AL CARGAR DETALLES:",
        detallesResult.error
      )

      setError(detallesResult.error.message)
    }

    if (pagosResult.error) {
      console.error(
        "ERROR AL CARGAR PAGOS:",
        pagosResult.error
      )

      setError(pagosResult.error.message)
    }

    setFactura(facturaData as Factura)

    setCliente(
      (clienteResult.data ?? null) as Cliente | null
    )

    setDetalles(
      (detallesResult.data ?? []) as DetalleFactura[]
    )

    setPagos(
      (pagosResult.data ?? []) as Pago[]
    )

    setCargando(false)
  }

  function nombreCliente() {
    if (!cliente) {
      return "Sin cliente"
    }

    return (
      cliente.razon_social ||
      cliente.nombre_comercial ||
      cliente.nombre_completo
    )
  }

  function formatoFecha(fecha: string | null) {
    if (!fecha) {
      return "—"
    }

    const partes = fecha.split("-")

    if (partes.length !== 3) {
      return fecha
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  function formatoFechaHora(fecha: string) {
    const valor = new Date(fecha)

    if (Number.isNaN(valor.getTime())) {
      return fecha
    }

    return valor.toLocaleString("es-SV", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  function formatoDinero(valor: number) {
    return `$${Number(valor || 0).toFixed(2)}`
  }

  function numeroFactura() {
    return `FAC-${String(
      factura?.numero || 0
    ).padStart(6, "0")}`
  }

  function etiquetaEstado(estado: string) {
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

  function claseEstado(estado: string) {
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

  const totalPagado = pagos.reduce(
    (total, pago) =>
      total + Number(pago.monto || 0),
    0
  )

  const saldoPendiente = Math.max(
    0,
    Number(factura?.total || 0) - totalPagado
  )

  const porcentajePago =
    factura && factura.total > 0
      ? Math.min(
          100,
          (totalPagado / Number(factura.total)) * 100
        )
      : 0

  const puedeRegistrarPago =
    factura?.estado === "emitida" &&
    saldoPendiente > 0.005

  const puedeAnularFactura =
    factura?.estado === "emitida" ||
    factura?.estado === "pagada"

  async function registrarPago() {
    if (!factura) {
      return
    }

    setErrorPago("")

    const monto = Number(montoPago)

    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorPago(
        "Ingresa un monto válido mayor que cero."
      )
      return
    }

    if (monto > saldoPendiente + 0.005) {
      setErrorPago(
        `El monto supera el saldo pendiente de ${formatoDinero(
          saldoPendiente
        )}.`
      )
      return
    }

    if (!metodoPago) {
      setErrorPago(
        "Selecciona un método de pago."
      )
      return
    }

    setRegistrandoPago(true)

    const {
      error: pagoError,
    } = await supabase.rpc(
      "registrar_pago_factura",
      {
        p_factura_id: factura.id,
        p_monto: monto,
        p_metodo_pago: metodoPago,
        p_referencia:
          referenciaPago.trim() || null,
        p_observaciones:
          observacionesPago.trim() || null,
      }
    )

    if (pagoError) {
      console.error(
        "ERROR AL REGISTRAR PAGO:",
        pagoError
      )

      setErrorPago(
        pagoError.message ||
          "No se pudo registrar el pago."
      )

      setRegistrandoPago(false)
      return
    }

    setMontoPago("")
    setMetodoPago("efectivo")
    setReferenciaPago("")
    setObservacionesPago("")
    setMostrarFormularioPago(false)
    setRegistrandoPago(false)

    await cargarFactura()
  }

  async function anularFactura() {
    if (!factura || !puedeAnularFactura) {
      return
    }

    setErrorAnulacion("")

    const motivo = motivoAnulacion.trim()

    if (!motivo) {
      setErrorAnulacion(
        "Ingresa el motivo de la anulación."
      )
      return
    }

    const confirmar = window.confirm(
      `¿Confirmas la anulación de ${numeroFactura()}? Esta acción devolverá al inventario las cantidades descontadas al emitir la factura.`
    )

    if (!confirmar) {
      return
    }

    setAnulandoFactura(true)

    const { error: anulacionError } = await supabase.rpc(
      "anular_factura_con_inventario",
      {
        p_factura_id: factura.id,
        p_observaciones: motivo,
      }
    )

    if (anulacionError) {
      console.error(
        "ERROR AL ANULAR FACTURA:",
        anulacionError
      )

      setErrorAnulacion(
        anulacionError.message ||
          "No se pudo anular la factura."
      )

      setAnulandoFactura(false)
      return
    }

    setMotivoAnulacion("")
    setMostrarFormularioAnulacion(false)
    setAnulandoFactura(false)

    await cargarFactura()
  }

  function abrirFormularioPago() {
    setErrorPago("")

    setMontoPago(
      saldoPendiente > 0
        ? saldoPendiente.toFixed(2)
        : ""
    )

    setMostrarFormularioPago(true)
  }

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#8a7562]">
          <Loader2
            size={24}
            className="animate-spin"
          />
          Cargando factura...
        </div>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <button
          type="button"
          onClick={() =>
            router.push("/facturacion")
          }
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
        >
          <ArrowLeft size={17} />
          Volver a facturación
        </button>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-sm text-red-700">
            {error ||
              "No se encontró la factura."}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: Letter;
            margin: 8mm 10mm;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body {
            font-size: 10px !important;
          }

          body * {
            visibility: hidden !important;
          }

          #factura-imprimir,
          #factura-imprimir * {
            visibility: visible !important;
          }

          #factura-imprimir {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #241914 !important;
            display: block !important;
          }

          .no-imprimir {
            display: none !important;
          }

          .print-only {
            display: block !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
          }

          .print-header {
            height: 125px !important;
            min-height: 125px !important;
            margin: 0 0 24px !important;
            padding: 10px 0 20px !important;
            border-bottom: 2px solid #5a2b1c !important;
            display: flex !important;
            align-items: center !important;
          }

          .print-logo {
            width: 82px !important;
            height: 82px !important;
            object-fit: contain !important;
          }

          .print-info {
            min-height: 125px !important;
            margin: 0 0 28px !important;
            padding: 12px 0 24px !important;
            border-bottom: 1px solid #cfc5bd !important;
          }

          .print-section-title {
            margin-bottom: 12px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.04em !important;
            color: #5a2b1c !important;
          }

          .print-table {
            width: 100% !important;
            margin-top: 12px !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }

          .print-table th {
            height: 40px !important;
            padding: 9px 7px !important;
            border: 1px solid #b8aaa0 !important;
            background: #f5f0eb !important;
            font-size: 8.5px !important;
            font-weight: 700 !important;
            color: #33251e !important;
          }

          .print-table td {
            min-height: 35px !important;
            padding: 10px 7px !important;
            border: 1px solid #cfc5bd !important;
            font-size: 9px !important;
            vertical-align: middle !important;
          }

          .print-payment-table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }

          .print-payment-table th {
            padding: 7px 6px !important;
            border: 1px solid #b8aaa0 !important;
            background: #f5f0eb !important;
            font-size: 8px !important;
            font-weight: 700 !important;
            color: #33251e !important;
          }

          .print-payment-table td {
            padding: 7px 6px !important;
            border: 1px solid #cfc5bd !important;
            font-size: 8px !important;
            vertical-align: middle !important;
          }

          .print-payment-total {
            background: #f5f0eb !important;
            font-weight: 700 !important;
          }

          .print-totales {
            width: 48% !important;
            margin-left: auto !important;
            margin-top: 35px !important;
            border-collapse: collapse !important;
          }

          .print-totales td {
            padding: 7px 5px !important;
            font-size: 9px !important;
          }

          .print-total-final {
            border-top: 1.5px solid #5a2b1c !important;
            padding-top: 11px !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            color: #5a2b1c !important;
          }

          .print-observaciones {
            margin-top: 25px !important;
            padding-top: 10px !important;
            border-top: 1px solid #cfc5bd !important;
          }

          .print-footer {
            margin-top: 25px !important;
            min-height: 60px !important;
            padding-top: 14px !important;
            border-top: 1px solid #cfc5bd !important;
            text-align: center !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }

          .print-footer-name {
            font-size: 10px !important;
            font-weight: 700 !important;
            color: #5a2b1c !important;
          }

          .print-footer-text {
            margin-top: 4px !important;
            font-size: 8px !important;
            color: #777777 !important;
          }

          .print-no-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        .print-only {
          display: none;
        }
      `}</style>

      <div
        id="factura-imprimir"
        className="mx-auto max-w-5xl"
      >
        <div className="no-imprimir">
          <button
            type="button"
            onClick={() =>
              router.push("/facturacion")
            }
            className="mb-5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
          >
            <ArrowLeft size={17} />
            Volver a facturación
          </button>

          <div className="flex flex-col gap-4 border-b border-[#e4d8ca] pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-[#8a7562]">
                Factura
              </p>

              <h1 className="text-3xl font-bold text-[#3b2a20]">
                {numeroFactura()}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.print()
                  }
                  className="rounded-lg border border-[#e4d8ca] bg-white px-4 py-2 text-sm font-semibold text-[#5c4030] hover:bg-[#f8f3ee]"
                >
                  🖨️ Imprimir
                </button>

                {puedeRegistrarPago && (
                  <button
                    type="button"
                    onClick={
                      abrirFormularioPago
                    }
                    className="flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2 text-sm font-semibold text-white hover:bg-[#493126]"
                  >
                    <DollarSign size={17} />
                    Registrar pago
                  </button>
                )}

                {puedeAnularFactura && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorAnulacion("")
                      setMostrarFormularioAnulacion(true)
                    }}
                    disabled={anulandoFactura}
                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <AlertTriangle size={17} />
                    Anular factura
                  </button>
                )}
              </div>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${claseEstado(
                factura.estado
              )}`}
            >
              {etiquetaEstado(
                factura.estado
              )}
            </span>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <Card className="mt-6 border-[#e4d8ca] bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3b2a20]">
                <Receipt size={19} />
                Estado de pago
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-[#faf7f4] p-5">
                  <p className="text-xs uppercase tracking-wide text-[#8a7562]">
                    Total factura
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
                    {formatoDinero(
                      factura.total
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-5">
                  <p className="text-xs uppercase tracking-wide text-green-700">
                    Total pagado
                  </p>

                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {formatoDinero(
                      totalPagado
                    )}
                  </p>
                </div>

                <div
                  className={`rounded-xl p-5 ${
                    saldoPendiente > 0
                      ? "bg-[#faf7f4]"
                      : "bg-green-50"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-[#8a7562]">
                    Saldo pendiente
                  </p>

                  <p
                    className={`mt-2 text-2xl font-bold ${
                      saldoPendiente > 0
                        ? "text-[#3b2a20]"
                        : "text-green-700"
                    }`}
                  >
                    {formatoDinero(
                      saldoPendiente
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs text-[#8a7562]">
                  <span>
                    Progreso de pago
                  </span>

                  <span>
                    {porcentajePago.toFixed(0)}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-[#eee5dd]">
                  <div
                    className="h-full rounded-full bg-green-600 transition-all"
                    style={{
                      width: `${porcentajePago}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {mostrarFormularioPago &&
            puedeRegistrarPago && (
              <Card className="mt-6 border-[#cdb59f] bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#3b2a20]">
                    <CreditCard size={19} />
                    Registrar pago
                  </CardTitle>

                  <p className="text-sm text-[#8a7562]">
                    Saldo disponible para abonar:{" "}
                    <strong>
                      {formatoDinero(
                        saldoPendiente
                      )}
                    </strong>
                  </p>
                </CardHeader>

                <CardContent>
                  {errorPago && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {errorPago}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Monto del pago
                      </label>

                      <input
                        type="number"
                        min="0.01"
                        max={saldoPendiente}
                        step="0.01"
                        value={montoPago}
                        onChange={(event) =>
                          setMontoPago(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#d9cabb] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8b6246] focus:ring-2 focus:ring-[#ead8c4]"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Método de pago
                      </label>

                      <select
                        value={metodoPago}
                        onChange={(event) =>
                          setMetodoPago(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#d9cabb] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8b6246] focus:ring-2 focus:ring-[#ead8c4]"
                      >
                        <option value="efectivo">
                          Efectivo
                        </option>

                        <option value="transferencia">
                          Transferencia
                        </option>

                        <option value="tarjeta">
                          Tarjeta
                        </option>

                        <option value="cheque">
                          Cheque
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Referencia
                      </label>

                      <input
                        type="text"
                        value={referenciaPago}
                        onChange={(event) =>
                          setReferenciaPago(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#d9cabb] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8b6246] focus:ring-2 focus:ring-[#ead8c4]"
                        placeholder="Opcional"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Observaciones
                      </label>

                      <input
                        type="text"
                        value={observacionesPago}
                        onChange={(event) =>
                          setObservacionesPago(
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#d9cabb] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8b6246] focus:ring-2 focus:ring-[#ead8c4]"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={
                        registrandoPago
                      }
                      onClick={() => {
                        setMostrarFormularioPago(
                          false
                        )
                        setErrorPago("")
                      }}
                      className="rounded-lg border border-[#e4d8ca] bg-white px-4 py-2.5 text-sm font-semibold text-[#5c4030] hover:bg-[#f8f3ee] disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={
                        registrandoPago
                      }
                      onClick={registrarPago}
                      className="flex items-center gap-2 rounded-lg bg-[#5c4030] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#493126] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {registrandoPago ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <DollarSign
                            size={17}
                          />
                          Guardar pago
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

          {mostrarFormularioAnulacion &&
            puedeAnularFactura && (
              <Card className="mt-6 border-red-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle size={19} />
                    Anular factura
                  </CardTitle>

                  <p className="text-sm text-[#8a7562]">
                    Esta acción cambiará la factura a anulada y devolverá al inventario las cantidades que fueron descontadas al emitirla.
                  </p>
                </CardHeader>

                <CardContent>
                  {errorAnulacion && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {errorAnulacion}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Motivo de la anulación
                    </label>

                    <textarea
                      value={motivoAnulacion}
                      onChange={(event) =>
                        setMotivoAnulacion(
                          event.target.value
                        )
                      }
                      rows={4}
                      disabled={anulandoFactura}
                      className="w-full resize-y rounded-lg border border-[#d9cabb] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-[#faf7f4]"
                      placeholder="Describe por qué se está anulando la factura..."
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={anulandoFactura}
                      onClick={() => {
                        setMostrarFormularioAnulacion(false)
                        setMotivoAnulacion("")
                        setErrorAnulacion("")
                      }}
                      className="rounded-lg border border-[#e4d8ca] bg-white px-4 py-2.5 text-sm font-semibold text-[#5c4030] hover:bg-[#f8f3ee] disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={
                        anulandoFactura ||
                        !motivoAnulacion.trim()
                      }
                      onClick={anularFactura}
                      className="flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {anulandoFactura ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Anulando...
                        </>
                      ) : (
                        <>
                          <AlertTriangle
                            size={17}
                          />
                          Confirmar anulación
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

          {pagos.length > 0 && (
            <Card className="mt-6 border-[#e4d8ca] bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#3b2a20]">
                  <Receipt size={19} />
                  Historial de pagos
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[#e4d8ca] bg-[#faf7f4]">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                          Fecha
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                          Método
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                          Referencia
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                          Observación
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                          Monto
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagos.map(
                        (pago) => (
                          <tr
                            key={pago.id}
                            className="border-b border-[#f0e8df] last:border-0"
                          >
                            <td className="px-4 py-4 text-sm text-[#5c4635]">
                              {formatoFechaHora(
                                pago.fecha_pago
                              )}
                            </td>

                            <td className="px-4 py-4 text-sm capitalize text-[#5c4635]">
                              {pago.metodo_pago}
                            </td>

                            <td className="px-4 py-4 text-sm text-[#5c4635]">
                              {pago.referencia ||
                                "—"}
                            </td>

                            <td className="px-4 py-4 text-sm text-[#5c4635]">
                              {pago.observaciones ||
                                "—"}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-green-700">
                              {formatoDinero(
                                pago.monto
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>

                    <tfoot>
                      <tr className="border-t border-[#e4d8ca] bg-[#faf7f4]">
                        <td
                          colSpan={4}
                          className="px-4 py-4 text-right text-sm font-semibold text-[#5c4635]"
                        >
                          Total pagado
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-bold text-green-700">
                          {formatoDinero(
                            totalPagado
                          )}
                        </td>
                      </tr>

                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-right text-sm font-semibold text-[#5c4635]"
                        >
                          Saldo pendiente
                        </td>

                        <td className="px-4 py-3 text-right text-sm font-bold text-[#3b2a20]">
                          {formatoDinero(
                            saldoPendiente
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Card className="border-[#e4d8ca] bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#3b2a20]">
                  <User size={19} />
                  Cliente
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-[#8a7562]">
                    Nombre
                  </p>

                  <p className="font-semibold text-[#3b2a20]">
                    {nombreCliente()}
                  </p>
                </div>

                {cliente?.telefono && (
                  <div>
                    <p className="text-xs text-[#8a7562]">
                      Teléfono
                    </p>

                    <p className="text-sm text-[#5c4635]">
                      {cliente.telefono}
                    </p>
                  </div>
                )}

                {cliente?.correo && (
                  <div>
                    <p className="text-xs text-[#8a7562]">
                      Correo
                    </p>

                    <p className="text-sm text-[#5c4635]">
                      {cliente.correo}
                    </p>
                  </div>
                )}

                {cliente?.direccion && (
                  <div>
                    <p className="text-xs text-[#8a7562]">
                      Dirección
                    </p>

                    <p className="text-sm text-[#5c4635]">
                      {cliente.direccion}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#e4d8ca] bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#3b2a20]">
                  <CalendarDays size={19} />
                  Información
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#8a7562]">
                    Fecha
                  </span>

                  <span className="text-sm font-medium text-[#3b2a20]">
                    {formatoFecha(
                      factura.fecha
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#8a7562]">
                    Vencimiento
                  </span>

                  <span className="text-sm font-medium text-[#3b2a20]">
                    {formatoFecha(
                      factura.fecha_vencimiento
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#8a7562]">
                    IVA
                  </span>

                  <span className="text-sm font-medium text-[#3b2a20]">
                    {factura.tipo_iva ===
                    "incluido"
                      ? `Incluido (${factura.porcentaje_iva}%)`
                      : `${factura.porcentaje_iva}%`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-[#e4d8ca] bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#3b2a20]">
                <FileText size={19} />
                Productos / muebles
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e4d8ca] bg-[#faf7f4]">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                        Descripción
                      </th>

                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                        Cant.
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                        Precio unitario
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                        Descuento
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {detalles.map(
                      (detalle) => (
                        <tr
                          key={detalle.id}
                          className="border-b border-[#f0e8df] last:border-0"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-[#3b2a20]">
                              {
                                detalle.descripcion
                              }
                            </p>

                            {detalle.especificaciones && (
                              <p className="mt-1 text-xs text-[#8a7562]">
                                {
                                  detalle.especificaciones
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-center text-sm">
                            {
                              detalle.cantidad
                            }
                          </td>

                          <td className="px-4 py-4 text-right text-sm">
                            {formatoDinero(
                              detalle.precio_unitario
                            )}
                          </td>

                          <td className="px-4 py-4 text-right text-sm">
                            {formatoDinero(
                              detalle.descuento
                            )}
                          </td>

                          <td className="px-4 py-4 text-right text-sm font-bold">
                            {formatoDinero(
                              detalle.subtotal
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border-[#e4d8ca] bg-white">
            <CardContent className="p-6">
              <div className="ml-auto max-w-sm space-y-3">
                <div className="flex justify-between text-sm text-[#6b5746]">
                  <span>Subtotal</span>

                  <span>
                    {formatoDinero(
                      factura.subtotal
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-[#6b5746]">
                  <span>Descuento</span>

                  <span>
                    -{formatoDinero(
                      factura.descuento
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-[#6b5746]">
                  <span>IVA incluido</span>

                  <span>
                    {formatoDinero(
                      factura.iva
                    )}
                  </span>
                </div>

                <div className="border-t border-[#e4d8ca] pt-4">
                  <div className="flex items-center justify-between text-xl font-bold text-[#3b2a20]">
                    <span>Total</span>

                    <span>
                      {formatoDinero(
                        factura.total
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {factura.observaciones && (
            <Card className="mt-6 border-[#e4d8ca] bg-white">
              <CardHeader>
                <CardTitle className="text-[#3b2a20]">
                  Observaciones
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#5c4635]">
                  {factura.observaciones}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="print-only">
          <div className="print-header">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-5">
                <img
                  src="/muebles-castillo-logo.png"
                  alt="Muebles Castillo"
                  className="print-logo"
                />

                <div>
                  <div className="text-[23px] font-bold tracking-wide text-[#5a2b1c]">
                    MUEBLES CASTILLO
                  </div>

                  <div className="mt-1 text-[9px] text-[#666]">
                    Sistema Administrativo CASMAD
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-[#777]">
                  FACTURA
                </div>

                <div className="text-[23px] font-bold text-[#3b2a20]">
                  {numeroFactura()}
                </div>

                <div
                  className={`mt-3 inline-block rounded-full px-3 py-1 text-[9px] font-semibold ${claseEstado(
                    factura.estado
                  )}`}
                >
                  {etiquetaEstado(
                    factura.estado
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="print-info grid grid-cols-2">
            <div className="border-r border-[#cfc5bd] pr-12">
              <div className="print-section-title">
                CLIENTE
              </div>

              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td
                      colSpan={2}
                      className="pb-4 text-[12px] font-bold text-[#222]"
                    >
                      {nombreCliente()}
                    </td>
                  </tr>

                  {cliente?.numero_documento && (
                    <tr>
                      <td className="w-[85px] py-[4px] text-[9px] text-[#777]">
                        Documento:
                      </td>

                      <td className="py-[4px] text-[10px]">
                        {
                          cliente.numero_documento
                        }
                      </td>
                    </tr>
                  )}

                  {cliente?.telefono && (
                    <tr>
                      <td className="py-[4px] text-[9px] text-[#777]">
                        Teléfono:
                      </td>

                      <td className="py-[4px] text-[10px]">
                        {cliente.telefono}
                      </td>
                    </tr>
                  )}

                  {cliente?.correo && (
                    <tr>
                      <td className="py-[4px] text-[9px] text-[#777]">
                        Correo:
                      </td>

                      <td className="py-[4px] text-[10px]">
                        {cliente.correo}
                      </td>
                    </tr>
                  )}

                  {cliente?.direccion && (
                    <tr>
                      <td className="py-[4px] text-[9px] text-[#777]">
                        Dirección:
                      </td>

                      <td className="py-[4px] text-[10px]">
                        {cliente.direccion}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pl-12">
              <div className="print-section-title">
                INFORMACIÓN
              </div>

              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="w-[110px] py-[5px] text-[9px] text-[#777]">
                      Fecha:
                    </td>

                    <td className="py-[5px] text-right text-[10px]">
                      {formatoFecha(
                        factura.fecha
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-[5px] text-[9px] text-[#777]">
                      Vencimiento:
                    </td>

                    <td className="py-[5px] text-right text-[10px]">
                      {formatoFecha(
                        factura.fecha_vencimiento
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-[5px] text-[9px] text-[#777]">
                      IVA:
                    </td>

                    <td className="py-[5px] text-right text-[10px]">
                      {factura.tipo_iva ===
                      "incluido"
                        ? `Incluido ${factura.porcentaje_iva}%`
                        : `${factura.porcentaje_iva}%`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="print-no-break">
            <div className="print-section-title">
              PRODUCTOS / MUEBLES
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>
                    Descripción
                  </th>

                  <th style={{ width: "9%" }}>
                    Cant.
                  </th>

                  <th style={{ width: "19%" }}>
                    Precio unitario
                  </th>

                  <th style={{ width: "17%" }}>
                    Descuento
                  </th>

                  <th style={{ width: "20%" }}>
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {detalles.map(
                  (detalle) => (
                    <tr
                      key={detalle.id}
                    >
                      <td className="font-semibold">
                        {
                          detalle.descripcion
                        }

                        {detalle.especificaciones && (
                          <div className="mt-1 text-[8px] font-normal text-[#777]">
                            {
                              detalle.especificaciones
                            }
                          </div>
                        )}
                      </td>

                      <td className="text-center">
                        {
                          detalle.cantidad
                        }
                      </td>

                      <td className="text-right">
                        {formatoDinero(
                          detalle.precio_unitario
                        )}
                      </td>

                      <td className="text-right">
                        {formatoDinero(
                          detalle.descuento
                        )}
                      </td>

                      <td className="text-right font-bold">
                        {formatoDinero(
                          detalle.subtotal
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <table className="print-totales print-no-break">
            <tbody>
              <tr>
                <td>Subtotal</td>

                <td className="text-right">
                  {formatoDinero(
                    factura.subtotal
                  )}
                </td>
              </tr>

              <tr>
                <td>Descuento</td>

                <td className="text-right">
                  -{formatoDinero(
                    factura.descuento
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  IVA incluido (
                  {factura.porcentaje_iva}
                  %)
                </td>

                <td className="text-right">
                  {formatoDinero(
                    factura.iva
                  )}
                </td>
              </tr>

              <tr>
                <td
                  colSpan={2}
                  className="print-total-final"
                >
                  <div className="flex justify-between">
                    <span>TOTAL</span>

                    <span>
                      {formatoDinero(
                        factura.total
                      )}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="print-observaciones print-no-break">
            <div className="print-section-title">
              ESTADO DE PAGO
            </div>

            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="text-[9px]">
                    Total factura:
                  </td>

                  <td className="text-right text-[10px]">
                    {formatoDinero(
                      factura.total
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="text-[9px]">
                    Total pagado:
                  </td>

                  <td className="text-right text-[10px] text-green-700">
                    {formatoDinero(
                      totalPagado
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="text-[9px]">
                    Saldo pendiente:
                  </td>

                  <td className="text-right text-[10px] font-bold">
                    {formatoDinero(
                      saldoPendiente
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {pagos.length > 0 && (
            <div className="print-observaciones print-no-break">
              <div className="print-section-title">
                HISTORIAL DE PAGOS
              </div>

              <table className="print-payment-table">
                <thead>
                  <tr>
                    <th style={{ width: "22%" }}>
                      Fecha
                    </th>

                    <th style={{ width: "16%" }}>
                      Método
                    </th>

                    <th style={{ width: "20%" }}>
                      Referencia
                    </th>

                    <th style={{ width: "27%" }}>
                      Observación
                    </th>

                    <th style={{ width: "15%" }}>
                      Monto
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pagos.map(
                    (pago) => (
                      <tr key={pago.id}>
                        <td>
                          {formatoFechaHora(
                            pago.fecha_pago
                          )}
                        </td>

                        <td className="capitalize">
                          {pago.metodo_pago}
                        </td>

                        <td>
                          {pago.referencia ||
                            "—"}
                        </td>

                        <td>
                          {pago.observaciones ||
                            "—"}
                        </td>

                        <td className="text-right font-semibold">
                          {formatoDinero(
                            pago.monto
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

                <tfoot>
                  <tr className="print-payment-total">
                    <td
                      colSpan={4}
                      className="text-right"
                    >
                      Total pagado
                    </td>

                    <td className="text-right">
                      {formatoDinero(
                        totalPagado
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td
                      colSpan={4}
                      className="text-right font-semibold"
                    >
                      Saldo pendiente
                    </td>

                    <td className="text-right font-bold">
                      {formatoDinero(
                        saldoPendiente
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {factura.observaciones && (
            <div className="print-observaciones print-no-break">
              <div className="print-section-title">
                OBSERVACIONES
              </div>

              <div className="text-[9px] leading-4 text-[#555]">
                {factura.observaciones}
              </div>
            </div>
          )}

          <div className="print-footer">
            <div className="print-footer-name">
              Muebles Castillo
            </div>

            <div className="print-footer-text">
              Gracias por su preferencia
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
