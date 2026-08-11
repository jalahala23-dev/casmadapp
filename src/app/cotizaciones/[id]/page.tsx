"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Receipt,
  Trash2,
  User,
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

type Detalle = {
  id: string
  producto_id: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  descuento: number
  subtotal: number
  especificaciones: string | null
}
type FacturaRelacionada = {
  id: string
  numero: number
  estado: string
  total: number
}

export default function CotizacionDetallePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const id = params.id as string

  const [cotizacion, setCotizacion] =
    useState<Cotizacion | null>(null)

  const [cliente, setCliente] =
    useState<Cliente | null>(null)

  const [detalles, setDetalles] =
    useState<Detalle[]>([])

  const [facturaRelacionada, setFacturaRelacionada] =
    useState<FacturaRelacionada | null>(null)

  const [cargando, setCargando] =
    useState(true)

  const [convirtiendo, setConvirtiendo] =
    useState(false)

  const [eliminando, setEliminando] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    if (id) {
      cargarCotizacion()
    }
  }, [id])

  async function cargarCotizacion() {
    setCargando(true)
    setError("")

    const {
      data: cotizacionData,
      error: cotizacionError,
    } = await supabase
      .from("cotizaciones")
      .select("*")
      .eq("id", id)
      .single()

    if (cotizacionError || !cotizacionData) {
      console.error(
        "ERROR COTIZACION:",
        cotizacionError
      )

      setError(
        "No se encontró la cotización."
      )

      setCargando(false)

      return
    }

    const [
      clienteResult,
      detallesResult,
      facturaResult,
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("*")
        .eq(
          "id",
          cotizacionData.cliente_id
        )
        .single(),

      supabase
        .from("cotizacion_detalles")
        .select("*")
        .eq(
          "cotizacion_id",
          id
        )
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("facturas")
        .select("id, numero, estado, total")
        .eq("cotizacion_id", id)
        .maybeSingle(),
    ])

    setCotizacion(
      cotizacionData as Cotizacion
    )

    setCliente(
      (clienteResult.data ??
        null) as Cliente | null
    )

    setDetalles(
      (detallesResult.data ??
        []) as Detalle[]
    )

    setFacturaRelacionada(
      (facturaResult.data ??
        null) as FacturaRelacionada | null
    )

    if (clienteResult.error) {
      console.error(
        "ERROR CLIENTE:",
        clienteResult.error
      )
    }

    if (detallesResult.error) {
      console.error(
        "ERROR DETALLES:",
        detallesResult.error
      )

      setError(
        "No se pudieron cargar los muebles de la cotización."
      )
    }

    if (facturaResult.error) {
      console.error(
        "ERROR FACTURA RELACIONADA:",
        facturaResult.error
      )
    }

    setCargando(false)
  }

  /*
   * ==========================================================
   * CONVERTIR COTIZACIÓN EN FACTURA
   * ==========================================================
   */

  async function convertirEnFactura() {
    if (!cotizacion) {
      return
    }

    if (cotizacion.estado !== "aprobada") {
      setError(
        "Solo una cotización aprobada puede convertirse en factura."
      )
      return
    }

    if (detalles.length === 0) {
      setError(
        "La cotización no tiene muebles para convertir en factura."
      )
      return
    }

    if (convirtiendo) {
      return
    }

    const confirmar =
      window.confirm(
        `¿Convertir COT-${String(
          cotizacion.numero
        ).padStart(
          6,
          "0"
        )} en factura?\n\nSe creará la factura y todos sus detalles.`
      )

    if (!confirmar) {
      return
    }

    setConvirtiendo(true)
    setError("")

    try {
      const response = await fetch(
        `/api/cotizaciones/${cotizacion.id}/convertir`,
        {
          method: "POST",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo convertir la cotización en factura."
        )
      }

      router.push(
        `/facturacion/${data.facturaId}`
      )
    } catch (err: any) {
      console.error(
        "ERROR AL CONVERTIR COTIZACIÓN:",
        err
      )

      setError(
        err?.message ||
          "No se pudo convertir la cotización en factura."
      )

      setConvirtiendo(false)
    }
  }

  /*
   * ==========================================================
   * ELIMINAR COTIZACIÓN
   * ==========================================================
   */

  async function eliminarCotizacion() {
    if (!cotizacion) {
      return
    }

    if (cotizacion.estado === "convertida") {
      setError(
        "No se puede eliminar una cotización que ya fue convertida en factura."
      )

      return
    }

    if (eliminando) {
      return
    }

    const numeroCotizacion =
      `COT-${String(
        cotizacion.numero
      ).padStart(6, "0")}`

    const confirmar =
      window.confirm(
        `¿Eliminar ${numeroCotizacion}?\n\nEsta acción eliminará la cotización y todos sus muebles cotizados.\n\nEsta acción no se puede deshacer.`
      )

    if (!confirmar) {
      return
    }

    setEliminando(true)
    setError("")

    try {
      /*
       * ------------------------------------------------------
       * 1. ELIMINAR DETALLES
       * ------------------------------------------------------
       */

      const {
        error: errorDetalles,
      } = await supabase
        .from("cotizacion_detalles")
        .delete()
        .eq(
          "cotizacion_id",
          cotizacion.id
        )

      if (errorDetalles) {
        console.error(
          "ERROR AL ELIMINAR DETALLES:",
          errorDetalles
        )

        throw new Error(
          errorDetalles.message ||
            "No se pudieron eliminar los detalles de la cotización."
        )
      }

      /*
       * ------------------------------------------------------
       * 2. ELIMINAR COTIZACIÓN
       * ------------------------------------------------------
       */

      const {
        error: errorCotizacion,
      } = await supabase
        .from("cotizaciones")
        .delete()
        .eq(
          "id",
          cotizacion.id
        )

      if (errorCotizacion) {
        console.error(
          "ERROR AL ELIMINAR COTIZACIÓN:",
          errorCotizacion
        )

        throw new Error(
          errorCotizacion.message ||
            "No se pudo eliminar la cotización."
        )
      }

      /*
       * ------------------------------------------------------
       * 3. VOLVER AL LISTADO
       * ------------------------------------------------------
       */

      router.push(
        "/cotizaciones"
      )

      router.refresh()
    } catch (err: any) {
      console.error(
        "ERROR AL ELIMINAR COTIZACIÓN:",
        err
      )

      setError(
        err?.message ||
          "No se pudo eliminar la cotización."
      )

      setEliminando(false)
    }
  }

  function nombreCliente() {
    if (!cliente) {
      return "Cliente"
    }

    return (
      cliente.razon_social ||
      cliente.nombre_comercial ||
      cliente.nombre_completo
    )
  }

  function formatoFecha(
    fecha: string | null
  ) {
    if (!fecha) {
      return "—"
    }

    const partes =
      fecha.split("-")

    if (partes.length !== 3) {
      return fecha
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  function formatoDinero(
    valor: number
  ) {
    return `$${Number(
      valor || 0
    ).toFixed(2)}`
  }

  function estadoTexto(
    estado: string
  ) {
    switch (estado) {
      case "borrador":
        return "Borrador"

      case "enviada":
        return "Enviada"

      case "aprobada":
        return "Aprobada"

      case "rechazada":
        return "Rechazada"

      case "vencida":
        return "Vencida"

      case "convertida":
        return "Convertida"

      default:
        return estado
    }
  }

  function claseEstado(
    estado: string
  ) {
    switch (estado) {
      case "aprobada":
        return "bg-green-50 text-green-700"

      case "convertida":
        return "bg-blue-50 text-blue-700"

      case "rechazada":
        return "bg-red-50 text-red-700"

      case "vencida":
        return "bg-orange-50 text-orange-700"

      case "enviada":
        return "bg-purple-50 text-purple-700"

      case "borrador":
      default:
        return "bg-[#f4eadf] text-[#6b4935]"
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="flex items-center gap-3 text-sm text-[#8a7562]">

          <Loader2
            size={24}
            className="animate-spin"
          />

          Cargando cotización...

        </div>

      </div>
    )
  }

  if (!cotizacion) {
    return (
      <div className="space-y-5">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/cotizaciones"
            )
          }
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
        >

          <ArrowLeft size={17} />

          Volver a cotizaciones

        </button>

        <Card className="border-red-200 bg-red-50">

          <CardContent className="p-6 text-sm text-red-700">

            {error ||
              "No se encontró la cotización."}

          </CardContent>

        </Card>

      </div>
    )
  }

  return (
    <>
      {/* =====================================================
          ESTILOS PARA IMPRESIÓN
          ===================================================== */}

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

          #cotizacion-imprimir,
          #cotizacion-imprimir * {
            visibility: visible !important;
          }

          #cotizacion-imprimir {
            position: absolute !important;

            top: 0 !important;
            left: 0 !important;

            width: 100% !important;

            min-height: 100vh !important;
            height: 100vh !important;

            max-width: none !important;

            margin: 0 !important;
            padding: 0 !important;

            background: #ffffff !important;
            color: #241914 !important;

            display: flex !important;
            flex-direction: column !important;
          }

          .no-imprimir {
            display: none !important;
          }

          .print-only {
            display: flex !important;

            flex-direction: column !important;

            width: 100% !important;

            min-height: 100vh !important;
            height: 100vh !important;
          }


          /* ================================================
             ENCABEZADO
             ================================================ */

          .print-header {

            height: 125px !important;
            min-height: 125px !important;

            margin: 0 0 24px !important;

            padding: 10px 0 20px !important;

            border-bottom:
              2px solid #5a2b1c !important;

            display: flex !important;

            align-items: center !important;
          }

          .print-logo {

            width: 82px !important;
            height: 82px !important;

            object-fit: contain !important;
          }


          /* ================================================
             CLIENTE / INFORMACIÓN
             ================================================ */

          .print-info {

            height: 145px !important;
            min-height: 145px !important;

            margin: 0 0 28px !important;

            padding: 12px 0 24px !important;

            border-bottom:
              1px solid #cfc5bd !important;
          }

          .print-section-title {

            margin-bottom: 17px !important;

            font-size: 11px !important;

            font-weight: 700 !important;

            text-transform: uppercase !important;

            letter-spacing:
              0.04em !important;

            color: #5a2b1c !important;
          }


          /* ================================================
             TABLA
             ================================================ */

          .print-table {

            width: 100% !important;

            margin-top: 12px !important;

            border-collapse:
              collapse !important;

            table-layout:
              fixed !important;
          }

          .print-table th {

            height: 40px !important;

            padding:
              9px 7px !important;

            border:
              1px solid #b8aaa0 !important;

            background:
              #f5f0eb !important;

            font-size:
              8.5px !important;

            font-weight:
              700 !important;

            color:
              #33251e !important;
          }

          .print-table td {

            min-height: 58px !important;

            height: 58px !important;

            padding:
              13px 7px !important;

            border:
              1px solid #cfc5bd !important;

            font-size:
              9px !important;

            vertical-align:
              middle !important;
          }

          .print-table tr {

            page-break-inside:
              avoid !important;

            break-inside:
              avoid !important;
          }


          /* ================================================
             TOTALES
             ================================================ */

          .print-totales {

            width: 48% !important;

            margin-left:
              auto !important;

            margin-top:
              48px !important;

            border-collapse:
              collapse !important;
          }

          .print-totales td {

            padding:
              8px 5px !important;

            font-size:
              9px !important;
          }

          .print-total-final {

            border-top:
              1.5px solid #5a2b1c !important;

            padding-top:
              13px !important;

            font-size:
              15px !important;

            font-weight:
              700 !important;

            color:
              #5a2b1c !important;
          }


          /* ================================================
             OBSERVACIONES
             ================================================ */

          .print-observaciones {

            margin-top:
              30px !important;

            padding-top:
              12px !important;

            border-top:
              1px solid #cfc5bd !important;
          }


          /* ================================================
             PIE DE PÁGINA
             ================================================ */

          .print-footer {

            margin-top:
              auto !important;

            min-height:
              72px !important;

            padding-top:
              16px !important;

            padding-bottom:
              6px !important;

            border-top:
              1px solid #cfc5bd !important;

            text-align:
              center !important;

            display:
              flex !important;

            flex-direction:
              column !important;

            justify-content:
              center !important;
          }

        }

        .print-only {
          display: none;
        }

      `}</style>


      <div
        id="cotizacion-imprimir"
        className="mx-auto max-w-5xl space-y-6"
      >


        {/* ===================================================
            VISTA NORMAL
            =================================================== */}

        <div className="no-imprimir">

          {/* VOLVER */}

          <button
            type="button"
            onClick={() =>
              router.push(
                "/cotizaciones"
              )
            }
            className="mb-4 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
          >

            <ArrowLeft size={17} />

            Volver a cotizaciones

          </button>


          {/* ENCABEZADO */}

          <div className="flex flex-col gap-4 border-b border-[#e4d8ca] pb-5 md:flex-row md:items-start md:justify-between">

            <div>

              <p className="text-sm text-[#8a7562]">
                Cotización
              </p>

              <h1 className="text-3xl font-bold text-[#3b2a20]">

                COT-
                {String(
                  cotizacion.numero
                ).padStart(
                  6,
                  "0"
                )}

              </h1>


              {/* BOTONES */}

              <div className="mt-4 flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/cotizaciones/${cotizacion.id}/editar`
                    )
                  }
                  disabled={eliminando}
                  className="rounded-lg bg-[#5c4030] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4b3326] disabled:opacity-60"
                >
                  ✏️ Editar
                </button>


                <button
                  type="button"
                  onClick={() =>
                    window.print()
                  }
                  disabled={eliminando}
                  className="rounded-lg border border-[#e4d8ca] bg-white px-4 py-2 text-sm font-semibold text-[#5c4030] hover:bg-[#f8f3ee] disabled:opacity-60"
                >
                  🖨️ Imprimir
                </button>


                {cotizacion.estado ===
                  "aprobada" && (

                  <button
                    type="button"
                    onClick={
                      convertirEnFactura
                    }
                    disabled={
                      convirtiendo ||
                      eliminando
                    }
                    className="flex items-center gap-2 rounded-lg bg-[#3f6b4a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#31563b] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {convirtiendo ? (
                      <>

                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        Convirtiendo...

                      </>
                    ) : (
                      <>

                        <Receipt
                          size={17}
                        />

                        Convertir en factura

                      </>
                    )}

                  </button>

                )}


                {/* ELIMINAR */}

                {cotizacion.estado !==
                  "convertida" && (

                  <button
                    type="button"
                    onClick={
                      eliminarCotizacion
                    }
                    disabled={
                      eliminando ||
                      convirtiendo
                    }
                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {eliminando ? (
                      <>

                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        Eliminando...

                      </>
                    ) : (
                      <>

                        <Trash2
                          size={17}
                        />

                        Eliminar

                      </>
                    )}

                  </button>

                )}

              </div>

            </div>


            {/* ESTADO */}

            <span
              className={`
                w-fit
                rounded-full
                px-3
                py-1.5
                text-sm
                font-semibold
                ${claseEstado(
                  cotizacion.estado
                )}
              `}
            >

              {estadoTexto(
                cotizacion.estado
              )}

            </span>

          </div>


          {/* ERROR */}

          {error && (

            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

              {error}

            </div>

          )}


          {/* CONVERTIDA */}

          {cotizacion.estado ===
            "convertida" && (

            <div className="mt-5 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">

              <CheckCircle2
                size={20}
              />

              <div>

                <p className="font-semibold">
                  Cotización convertida
                </p>

                <p className="mt-0.5">
                  Esta cotización ya fue convertida en factura y se conserva como historial.
                </p>

              </div>

            </div>

          )}


          {/* FACTURA RELACIONADA */}

          {facturaRelacionada && (
            <Card className="mt-5 border-blue-200 bg-blue-50/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Receipt size={19} />
                  Factura relacionada
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-blue-950">
                      FAC-
                      {String(
                        facturaRelacionada.numero
                      ).padStart(
                        6,
                        "0"
                      )}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
                        {facturaRelacionada.estado ===
                        "borrador"
                          ? "Borrador"
                          : facturaRelacionada.estado ===
                              "emitida"
                            ? "Emitida"
                            : facturaRelacionada.estado ===
                                "pagada"
                              ? "Pagada"
                              : facturaRelacionada.estado ===
                                  "anulada"
                                ? "Anulada"
                                : facturaRelacionada.estado}
                      </span>

                      <span className="text-sm font-semibold text-blue-900">
                        {formatoDinero(
                          facturaRelacionada.total
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/facturacion/${facturaRelacionada.id}`
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4b3326]"
                  >
                    <FileText size={17} />
                    Ver factura
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CLIENTE + INFORMACIÓN */}

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* CLIENTE */}

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


            {/* INFORMACIÓN */}

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
                      cotizacion.fecha
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm text-[#8a7562]">
                    Válida hasta
                  </span>

                  <span className="text-sm font-medium text-[#3b2a20]">
                    {formatoFecha(
                      cotizacion.fecha_vencimiento
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm text-[#8a7562]">
                    IVA
                  </span>

                  <span className="text-sm font-medium text-[#3b2a20]">

                    {cotizacion.tipo_iva ===
                    "incluido"
                      ? `Incluido (${cotizacion.porcentaje_iva}%)`
                      : `${cotizacion.porcentaje_iva}%`}

                  </span>

                </div>

              </CardContent>

            </Card>

          </div>


          {/* =================================================
              MUEBLES COTIZADOS
              ================================================= */}

          <Card className="mt-6 border-[#e4d8ca] bg-white">

            <CardHeader>

              <CardTitle className="flex items-center gap-2 text-[#3b2a20]">

                <FileText size={19} />

                Muebles cotizados

              </CardTitle>

            </CardHeader>

            <CardContent>

              {detalles.length === 0 ? (

                <div className="rounded-xl border border-dashed border-[#d8c8b9] bg-[#fcfaf8] p-8 text-center">

                  <p className="text-sm text-[#8a7562]">
                    Esta cotización no tiene muebles registrados.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full border-collapse">

                    <thead>

                      <tr className="border-b border-[#e4d8ca] bg-[#faf7f4]">

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                          #
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                          Mueble
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#6b5746]">
                          Cantidad
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
                        (
                          detalle,
                          index
                        ) => (

                          <tr
                            key={
                              detalle.id
                            }
                            className="border-b border-[#f0e8df] last:border-0"
                          >

                            <td className="px-4 py-4 text-sm text-[#6b5746]">
                              {index + 1}
                            </td>

                            <td className="px-4 py-4">

                              <p className="font-semibold text-[#3b2a20]">
                                {
                                  detalle.descripcion
                                }
                              </p>

                              {detalle.especificaciones && (

                                <p className="mt-1 max-w-md text-xs leading-5 text-[#8a7562]">
                                  {
                                    detalle.especificaciones
                                  }
                                </p>

                              )}

                            </td>

                            <td className="px-4 py-4 text-center text-sm text-[#3b2a20]">
                              {
                                detalle.cantidad
                              }
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-[#3b2a20]">
                              {formatoDinero(
                                detalle.precio_unitario
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm text-[#6b5746]">
                              {formatoDinero(
                                detalle.descuento
                              )}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-[#3b2a20]">
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

              )}

            </CardContent>

          </Card>


          {/* =================================================
              TOTALES
              ================================================= */}

          <Card className="border-[#e4d8ca] bg-white">

            <CardContent className="p-6">

              <div className="ml-auto max-w-sm space-y-3">

                <div className="flex justify-between text-sm text-[#6b5746]">

                  <span>
                    Subtotal
                  </span>

                  <span>
                    {formatoDinero(
                      cotizacion.subtotal
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-sm text-[#6b5746]">

                  <span>
                    Descuento
                  </span>

                  <span>
                    -
                    {formatoDinero(
                      cotizacion.descuento
                    )}
                  </span>

                </div>

                <div className="flex justify-between text-sm text-[#6b5746]">

                  <span>
                    {cotizacion.tipo_iva ===
                    "incluido"
                      ? `IVA incluido (${cotizacion.porcentaje_iva}%)`
                      : `IVA ${cotizacion.porcentaje_iva}%`}
                  </span>

                  <span>
                    {formatoDinero(
                      cotizacion.iva
                    )}
                  </span>

                </div>

                <div className="border-t border-[#e4d8ca] pt-4">

                  <div className="flex items-center justify-between text-xl font-bold text-[#3b2a20]">

                    <span>
                      Total
                    </span>

                    <span>
                      {formatoDinero(
                        cotizacion.total
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </CardContent>

          </Card>


          {/* =================================================
              OBSERVACIONES
              ================================================= */}

          {cotizacion.observaciones && (

            <Card className="border-[#e4d8ca] bg-white">

              <CardHeader>

                <CardTitle className="text-[#3b2a20]">
                  Observaciones
                </CardTitle>

              </CardHeader>

              <CardContent>

                <p className="whitespace-pre-wrap text-sm leading-6 text-[#5c4635]">
                  {
                    cotizacion.observaciones
                  }
                </p>

              </CardContent>

            </Card>

          )}

        </div>


        {/* ===================================================
            VERSIÓN DE IMPRESIÓN
            =================================================== */}

        <div className="print-only">


          {/* =================================================
              ENCABEZADO
              ================================================= */}

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
                  COTIZACIÓN
                </div>

                <div className="text-[23px] font-bold text-[#3b2a20]">

                  COT-
                  {String(
                    cotizacion.numero
                  ).padStart(
                    6,
                    "0"
                  )}

                </div>

                <div
                  className={`
                    mt-3
                    inline-block
                    rounded-full
                    px-3
                    py-1
                    text-[9px]
                    font-semibold
                    ${claseEstado(
                      cotizacion.estado
                    )}
                  `}
                >

                  {estadoTexto(
                    cotizacion.estado
                  )}

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              CLIENTE + INFORMACIÓN
              ================================================= */}

          <div className="print-info grid grid-cols-2">

            {/* CLIENTE */}

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
                        {
                          cliente.telefono
                        }
                      </td>

                    </tr>

                  )}

                  {cliente?.correo && (

                    <tr>

                      <td className="py-[4px] text-[9px] text-[#777]">
                        Correo:
                      </td>

                      <td className="py-[4px] text-[10px]">
                        {
                          cliente.correo
                        }
                      </td>

                    </tr>

                  )}

                  {cliente?.direccion && (

                    <tr>

                      <td className="py-[4px] text-[9px] text-[#777]">
                        Dirección:
                      </td>

                      <td className="py-[4px] text-[10px]">
                        {
                          cliente.direccion
                        }
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>


            {/* INFORMACIÓN */}

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
                        cotizacion.fecha
                      )}
                    </td>

                  </tr>

                  <tr>

                    <td className="py-[5px] text-[9px] text-[#777]">
                      Válida hasta:
                    </td>

                    <td className="py-[5px] text-right text-[10px]">
                      {formatoFecha(
                        cotizacion.fecha_vencimiento
                      )}
                    </td>

                  </tr>

                  <tr>

                    <td className="py-[5px] text-[9px] text-[#777]">
                      IVA:
                    </td>

                    <td className="py-[5px] text-right text-[10px]">

                      {cotizacion.tipo_iva ===
                      "incluido"
                        ? `Incluido ${cotizacion.porcentaje_iva}%`
                        : `${cotizacion.porcentaje_iva}%`}

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>


          {/* =================================================
              MUEBLES
              ================================================= */}

          <div>

            <div className="print-section-title">
              MUEBLES COTIZADOS
            </div>

            <table className="print-table">

              <thead>

                <tr>

                  <th style={{ width: "5%" }}>
                    #
                  </th>

                  <th style={{ width: "35%" }}>
                    Descripción
                  </th>

                  <th style={{ width: "10%" }}>
                    Cant.
                  </th>

                  <th style={{ width: "18%" }}>
                    Precio unitario
                  </th>

                  <th style={{ width: "14%" }}>
                    Descuento
                  </th>

                  <th style={{ width: "18%" }}>
                    Total
                  </th>

                </tr>

              </thead>

              <tbody>

                {detalles.map(
                  (
                    detalle,
                    index
                  ) => (

                    <tr
                      key={
                        detalle.id
                      }
                    >

                      <td className="text-center">
                        {index + 1}
                      </td>

                      <td className="font-semibold">

                        {
                          detalle.descripcion
                        }

                        {detalle.especificaciones && (

                          <div className="mt-2 text-[8px] font-normal leading-4 text-[#777]">
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


          {/* =================================================
              TOTALES
              ================================================= */}

          <table className="print-totales">

            <tbody>

              <tr>

                <td>
                  Subtotal
                </td>

                <td className="text-right">

                  {formatoDinero(
                    cotizacion.subtotal
                  )}

                </td>

              </tr>

              <tr>

                <td>
                  Descuento
                </td>

                <td className="text-right">

                  -
                  {formatoDinero(
                    cotizacion.descuento
                  )}

                </td>

              </tr>

              <tr>

                <td>
                  {cotizacion.tipo_iva ===
                  "incluido"
                    ? `IVA incluido (${cotizacion.porcentaje_iva}%)`
                    : `IVA ${cotizacion.porcentaje_iva}%`}
                </td>

                <td className="text-right">

                  {formatoDinero(
                    cotizacion.iva
                  )}

                </td>

              </tr>

              <tr>

                <td
                  colSpan={2}
                  className="print-total-final"
                >

                  <div className="flex justify-between">

                    <span>
                      TOTAL
                    </span>

                    <span>

                      {formatoDinero(
                        cotizacion.total
                      )}

                    </span>

                  </div>

                </td>

              </tr>

            </tbody>

          </table>


          {/* =================================================
              OBSERVACIONES
              ================================================= */}

          {cotizacion.observaciones && (

            <div className="print-observaciones">

              <div className="print-section-title">
                OBSERVACIONES
              </div>

              <div className="text-[9px] leading-4 text-[#555]">

                {
                  cotizacion.observaciones
                }

              </div>

            </div>

          )}


          {/* =================================================
              PIE DE PÁGINA
              ================================================= */}

          <div className="print-footer">

            <div className="text-[10px] font-bold text-[#5a2b1c]">
              Muebles Castillo
            </div>

            <div className="mt-1 text-[8px] text-[#777]">
              Gracias por su preferencia
            </div>

          </div>

        </div>

      </div>
    </>
  )
}