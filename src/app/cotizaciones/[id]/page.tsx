"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  FileText,
  Loader2,
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
  numero: number | null
  cliente_id: string | null
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
  created_at?: string
}

type Cliente = {
  id: string
  nombre_completo: string
  razon_social: string | null
  nombre_comercial: string | null
  telefono: string | null
  correo: string | null
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

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    if (id) {
      cargarDatos()
    }
  }, [id])

  async function cargarDatos() {
    setCargando(true)
    setError("")

    try {
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
          "ERROR AL CARGAR COTIZACIÓN:",
          cotizacionError
        )

        setError(
          "No se pudo cargar la cotización."
        )

        return
      }

      const [
        clienteResult,
        detallesResult,
      ] = await Promise.all([
        cotizacionData.cliente_id
          ? supabase
              .from("clientes")
              .select("*")
              .eq(
                "id",
                cotizacionData.cliente_id
              )
              .single()
          : Promise.resolve({
              data: null,
              error: null,
            }),

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

        setError(
          "No se pudieron cargar los muebles de la cotización."
        )

        return
      }

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
    } catch (err: any) {
      console.error(
        "ERROR AL CARGAR COTIZACIÓN:",
        err
      )

      setError(
        err?.message ||
          "No se pudo cargar la cotización."
      )
    } finally {
      setCargando(false)
    }
  }

  function formatoDinero(
    valor: number | null | undefined
  ) {
    return `$${Number(
      valor || 0
    ).toFixed(2)}`
  }

  function formatoFecha(
    fecha: string | null | undefined
  ) {
    if (!fecha) {
      return "—"
    }

    const partes =
      fecha.split("-")

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }

    return fecha
  }

  function numeroCotizacion() {
    if (
      cotizacion?.numero !== null &&
      cotizacion?.numero !== undefined
    ) {
      return `COT-${String(
        cotizacion.numero
      ).padStart(6, "0")}`
    }

    return `COT-${id
      .slice(0, 8)
      .toUpperCase()}`
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

  function estadoTexto(
    estado: string
  ) {
    switch (
      estado.toLowerCase()
    ) {
      case "borrador":
        return "Borrador"

      case "enviada":
        return "Enviada"

      case "aprobada":
        return "Aprobada"

      case "aceptada":
        return "Aceptada"

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
    switch (
      estado.toLowerCase()
    ) {
      case "aprobada":
      case "aceptada":
        return "bg-green-50 text-green-700"

      case "enviada":
        return "bg-amber-50 text-amber-700"

      case "rechazada":
        return "bg-red-50 text-red-700"

      case "vencida":
        return "bg-gray-100 text-gray-700"

      case "convertida":
        return "bg-blue-50 text-blue-700"

      default:
        return "bg-[#f5eadf] text-[#79583f]"
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
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ||
            "No se encontró la cotización."}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/cotizaciones"
            )
          }
          className="mt-4 flex items-center gap-2 rounded-lg border border-[#d9c8b8] px-4 py-2 text-sm font-semibold text-[#5c4030] hover:bg-[#f8f1eb]"
        >
          <ArrowLeft size={17} />
          Volver a cotizaciones
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ENCABEZADO */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <Link
            href="/cotizaciones"
            className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
          >
            <ArrowLeft size={17} />
            Volver a cotizaciones
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">
              <FileText size={25} />
            </div>

            <div>
              <p className="text-sm text-[#8a7562]">
                Cotización
              </p>

              <h1 className="text-3xl font-bold text-[#3b2a20]">
                {numeroCotizacion()}
              </h1>
            </div>
          </div>
        </div>

        <Link
          href={`/cotizaciones/${cotizacion.id}/editar`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326]"
        >
          <Edit size={18} />
          Editar cotización
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* INFORMACIÓN GENERAL */}

      <Card className="border-[#e4d8ca] bg-white">
        <CardHeader>
          <CardTitle className="text-[#3b2a20]">
            Información de la cotización
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                Fecha
              </p>

              <p className="mt-1 font-semibold text-[#3b2a20]">
                {formatoFecha(
                  cotizacion.fecha
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                Válida hasta
              </p>

              <p className="mt-1 font-semibold text-[#3b2a20]">
                {formatoFecha(
                  cotizacion.fecha_vencimiento
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                Estado
              </p>

              <div className="mt-1">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                    cotizacion.estado
                  )}`}
                >
                  {estadoTexto(
                    cotizacion.estado
                  )}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                IVA
              </p>

              <p className="mt-1 font-semibold text-[#3b2a20]">
                {cotizacion.tipo_iva ===
                "separado"
                  ? `Separado (${cotizacion.porcentaje_iva}%)`
                  : `Incluido (${cotizacion.porcentaje_iva}%)`}
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* CLIENTE */}

      <Card className="border-[#e4d8ca] bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#3b2a20]">
            <User
              size={20}
              className="text-[#a67c52]"
            />
            Cliente
          </CardTitle>
        </CardHeader>

        <CardContent>
          {cliente ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div className="lg:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                  Nombre
                </p>

                <p className="mt-1 font-semibold text-[#3b2a20]">
                  {nombreCliente()}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                  Teléfono
                </p>

                <p className="mt-1 text-sm text-[#5c4030]">
                  {cliente.telefono ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                  Correo
                </p>

                <p className="mt-1 break-all text-sm text-[#5c4030]">
                  {cliente.correo ||
                    "—"}
                </p>
              </div>

            </div>
          ) : (
            <p className="text-sm text-[#8a7562]">
              Esta cotización no tiene un cliente asociado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* MUEBLES */}

      <Card className="border-[#e4d8ca] bg-white">
        <CardHeader>
          <CardTitle className="text-[#3b2a20]">
            Muebles de la cotización
          </CardTitle>

          <p className="text-sm text-[#8a7562]">
            {detalles.length}{" "}
            {detalles.length === 1
              ? "mueble"
              : "muebles"}
          </p>
        </CardHeader>

        <CardContent>
          {detalles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#dccbbb] bg-[#fcfaf8] p-8 text-center">
              <FileText
                className="mx-auto mb-3 text-[#b79a7d]"
                size={32}
              />

              <p className="font-medium text-[#5c4635]">
                No hay muebles registrados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {detalles.map(
                (
                  detalle,
                  index
                ) => (
                  <div
                    key={detalle.id}
                    className="rounded-xl border border-[#e4d8ca] bg-[#fcfaf8] p-5"
                  >

                    <div className="mb-4 flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs text-[#9a8775]">
                          Mueble{" "}
                          {index + 1}
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-[#3b2a20]">
                          {detalle.descripcion ||
                            "Sin descripción"}
                        </h3>
                      </div>

                      <p className="whitespace-nowrap text-lg font-bold text-[#3b2a20]">
                        {formatoDinero(
                          detalle.subtotal
                        )}
                      </p>

                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                          Cantidad
                        </p>

                        <p className="mt-1 font-semibold text-[#5c4030]">
                          {Number(
                            detalle.cantidad
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                          Precio unitario
                        </p>

                        <p className="mt-1 font-semibold text-[#5c4030]">
                          {formatoDinero(
                            detalle.precio_unitario
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                          Descuento
                        </p>

                        <p className="mt-1 font-semibold text-[#5c4030]">
                          {formatoDinero(
                            detalle.descuento
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9a8775]">
                          Subtotal
                        </p>

                        <p className="mt-1 font-semibold text-[#3b2a20]">
                          {formatoDinero(
                            detalle.subtotal
                          )}
                        </p>
                      </div>

                    </div>

                    {detalle.especificaciones && (
                      <div className="mt-4 rounded-lg border border-[#e8ddd3] bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#9a8775]">
                          Especificaciones
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-[#5c4030]">
                          {detalle.especificaciones}
                        </p>
                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}
        </CardContent>
      </Card>

      {/* RESUMEN */}

      <div className="grid gap-6 lg:grid-cols-3">

        <Card className="border-[#e4d8ca] bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#3b2a20]">
              Observaciones
            </CardTitle>
          </CardHeader>

          <CardContent>
            {cotizacion.observaciones ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-[#5c4030]">
                {cotizacion.observaciones}
              </p>
            ) : (
              <p className="text-sm text-[#9a8775]">
                No hay observaciones para esta cotización.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#e4d8ca] bg-white">
          <CardHeader>
            <CardTitle className="text-[#3b2a20]">
              Resumen
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#8a7562]">
                Subtotal
              </span>

              <span className="font-medium text-[#3b2a20]">
                {formatoDinero(
                  cotizacion.subtotal
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#8a7562]">
                Descuento
              </span>

              <span className="font-medium text-[#3b2a20]">
                {formatoDinero(
                  cotizacion.descuento
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#8a7562]">
                IVA{" "}
                {cotizacion.porcentaje_iva}%
              </span>

              <span className="font-medium text-[#3b2a20]">
                {formatoDinero(
                  cotizacion.iva
                )}
              </span>
            </div>

            <div className="border-t border-[#e4d8ca] pt-4">
              <div className="flex items-end justify-between gap-4">
                <span className="font-semibold text-[#5c4030]">
                  Total
                </span>

                <span className="text-2xl font-bold text-[#3b2a20]">
                  {formatoDinero(
                    cotizacion.total
                  )}
                </span>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* BOTONES INFERIORES */}

      <div className="flex flex-col-reverse gap-3 border-t border-[#e4d8ca] pt-6 sm:flex-row sm:justify-between">

        <Link
          href="/cotizaciones"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9c8b8] px-5 py-3 text-sm font-semibold text-[#5c4030] hover:bg-[#f8f1eb]"
        >
          <ArrowLeft size={17} />
          Volver a cotizaciones
        </Link>

        <Link
          href={`/cotizaciones/${cotizacion.id}/editar`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4b3326]"
        >
          <Edit size={17} />
          Editar cotización
        </Link>

      </div>

    </div>
  )
}