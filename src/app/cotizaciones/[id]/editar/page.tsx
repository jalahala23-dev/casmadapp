"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type EstadoCotizacion =
  | "borrador"
  | "enviada"
  | "aprobada"
  | "rechazada"
  | "vencida"

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

type DetalleEditable = {
  id?: string
  producto_id: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  descuento: number
  especificaciones: string
}

export default function EditarCotizacionPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const id = params.id as string

  const [cotizacion, setCotizacion] =
    useState<Cotizacion | null>(null)

  const [cliente, setCliente] =
    useState<Cliente | null>(null)

  const [detalles, setDetalles] =
    useState<DetalleEditable[]>([])

  const [fechaVencimiento, setFechaVencimiento] =
    useState("")

  const [observaciones, setObservaciones] =
    useState("")

  const [porcentajeIva, setPorcentajeIva] =
    useState(13)

  const [tipoIva, setTipoIva] =
    useState<"incluido" | "separado">("incluido")

  const [estado, setEstado] =
    useState<EstadoCotizacion>("borrador")

  const [guardando, setGuardando] =
    useState(false)

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState("")

  const [mensaje, setMensaje] =
    useState("")

  useEffect(() => {
    if (id) {
      cargarDatos()
    }
  }, [id])

  async function cargarDatos() {
    setCargando(true)
    setError("")
    setMensaje("")

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

      setCargando(false)
      return
    }

    const [
      clienteResult,
      detallesResult,
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
    }

    setCotizacion(
      cotizacionData as Cotizacion
    )

    setCliente(
      (clienteResult.data ??
        null) as Cliente | null
    )

    setFechaVencimiento(
      cotizacionData.fecha_vencimiento ||
        ""
    )

    setObservaciones(
      cotizacionData.observaciones ||
        ""
    )

    setPorcentajeIva(
      Number(
        cotizacionData.porcentaje_iva ||
          13
      )
    )

    setTipoIva(
      cotizacionData.tipo_iva ===
        "separado"
        ? "separado"
        : "incluido"
    )

    const estadoGuardado =
      String(
        cotizacionData.estado ||
          "borrador"
      ).toLowerCase()

    const estadosValidos: EstadoCotizacion[] =
      [
        "borrador",
        "enviada",
        "aprobada",
        "rechazada",
        "vencida",
      ]

    setEstado(
      estadosValidos.includes(
        estadoGuardado as EstadoCotizacion
      )
        ? (estadoGuardado as EstadoCotizacion)
        : "borrador"
    )

    const detallesCargados =
      (detallesResult.data ??
        []) as Detalle[]

    setDetalles(
      detallesCargados.map(
        (detalle) => ({
          id: detalle.id,
          producto_id:
            detalle.producto_id,
          descripcion:
            detalle.descripcion || "",
          cantidad:
            Number(
              detalle.cantidad || 1
            ),
          precio_unitario:
            Number(
              detalle.precio_unitario ||
                0
            ),
          descuento:
            Number(
              detalle.descuento || 0
            ),
          especificaciones:
            detalle.especificaciones ||
            "",
        })
      )
    )

    setCargando(false)
  }

  function actualizarDetalle(
    index: number,
    campo: keyof DetalleEditable,
    valor:
      | string
      | number
      | null
  ) {
    setDetalles((actuales) =>
      actuales.map(
        (detalle, i) => {
          if (i !== index) {
            return detalle
          }

          return {
            ...detalle,
            [campo]: valor,
          }
        }
      )
    )
  }

  function agregarMueble() {
    setDetalles((actuales) => [
      ...actuales,
      {
        producto_id: null,
        descripcion: "",
        cantidad: 1,
        precio_unitario: 0,
        descuento: 0,
        especificaciones: "",
      },
    ])
  }

  function eliminarMueble(
    index: number
  ) {
    setDetalles((actuales) =>
      actuales.filter(
        (_, i) => i !== index
      )
    )
  }

  function subtotalDetalle(
    detalle: DetalleEditable
  ) {
    const cantidad =
      Number(detalle.cantidad) || 0

    const precio =
      Number(
        detalle.precio_unitario
      ) || 0

    const descuento =
      Number(
        detalle.descuento
      ) || 0

    return Math.max(
      0,
      cantidad * precio -
        descuento
    )
  }

  const subtotal = detalles.reduce(
    (totalActual, detalle) =>
      totalActual +
      subtotalDetalle(detalle),
    0
  )

  const descuentoTotal =
    detalles.reduce(
      (totalActual, detalle) =>
        totalActual +
        (Number(
          detalle.descuento
        ) || 0),
      0
    )

  let iva = 0
  let total = subtotal

  if (tipoIva === "incluido") {
    iva =
      subtotal -
      subtotal /
        (1 +
          porcentajeIva /
            100)

    total = subtotal
  } else {
    iva =
      subtotal *
      (porcentajeIva / 100)

    total =
      subtotal + iva
  }

  function formatoDinero(
    valor: number
  ) {
    return `$${Number(
      valor || 0
    ).toFixed(2)}`
  }

  function formatoFecha(
    fecha: string | null
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

  async function guardarCambios() {
    if (!cotizacion) {
      return
    }

    setGuardando(true)
    setError("")
    setMensaje("")

    try {
      if (detalles.length === 0) {
        setError(
          "La cotización debe tener al menos un mueble."
        )

        setGuardando(false)
        return
      }

      const detallesInvalidos =
        detalles.some(
          (detalle) =>
            !detalle.descripcion.trim() ||
            Number(
              detalle.cantidad
            ) <= 0 ||
            Number(
              detalle.precio_unitario
            ) < 0
        )

      if (detallesInvalidos) {
        setError(
          "Revisa los muebles. Todos deben tener descripción, cantidad y precio válidos."
        )

        setGuardando(false)
        return
      }

      /*
       * ACTUALIZAR COTIZACIÓN
       */

      const {
        error: updateError,
      } = await supabase
        .from("cotizaciones")
        .update({
          fecha_vencimiento:
            fechaVencimiento ||
            null,

          observaciones:
            observaciones.trim() ||
            null,

          tipo_iva: tipoIva,

          porcentaje_iva:
            porcentajeIva,

          estado,

          subtotal,

          descuento:
            descuentoTotal,

          iva,

          total,
        })
        .eq(
          "id",
          cotizacion.id
        )

      if (updateError) {
        console.error(
          "ERROR UPDATE COTIZACIONES:",
          updateError
        )

        throw updateError
      }

      /*
       * ELIMINAR DETALLES ANTERIORES
       */

      const {
        error: deleteError,
      } = await supabase
        .from("cotizacion_detalles")
        .delete()
        .eq(
          "cotizacion_id",
          cotizacion.id
        )

      if (deleteError) {
        console.error(
          "ERROR DELETE DETALLES:",
          deleteError
        )

        throw deleteError
      }

      /*
       * INSERTAR DETALLES ACTUALIZADOS
       */

      const detallesParaGuardar =
        detalles.map(
          (detalle) => ({
            cotizacion_id:
              cotizacion.id,

            producto_id:
              detalle.producto_id ||
              null,

            descripcion:
              detalle.descripcion.trim(),

            cantidad:
              Number(
                detalle.cantidad
              ),

            precio_unitario:
              Number(
                detalle.precio_unitario
              ),

            descuento:
              Number(
                detalle.descuento
              ) || 0,

            subtotal:
              subtotalDetalle(
                detalle
              ),

            especificaciones:
              detalle.especificaciones.trim() ||
              null,
          })
        )

      const {
        error: insertError,
      } = await supabase
        .from("cotizacion_detalles")
        .insert(
          detallesParaGuardar
        )

      if (insertError) {
        console.error(
          "ERROR INSERT DETALLES:",
          insertError
        )

        throw insertError
      }

      setMensaje(
        "Cotización actualizada correctamente."
      )

      setTimeout(() => {
        router.push(
          `/cotizaciones/${cotizacion.id}`
        )

        router.refresh()
      }, 700)
    } catch (err: any) {
      console.error(
        "ERROR AL ACTUALIZAR COTIZACIÓN:",
        err
      )

      /*
       * MOSTRAR EL ERROR REAL DE SUPABASE
       * mientras terminamos de probar.
       */

      const mensajeError =
        err?.message ||
        err?.details ||
        err?.hint ||
        "No se pudo actualizar la cotización."

      setError(
        `No se pudo actualizar la cotización: ${mensajeError}`
      )
    } finally {
      setGuardando(false)
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
      <div className="p-6">

        <p className="text-red-600">
          {error ||
            "No se encontró la cotización."}
        </p>

      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ENCABEZADO */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/cotizaciones/${cotizacion.id}`
              )
            }
            className="mb-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
          >

            <ArrowLeft size={17} />

            Volver a cotización

          </button>

          <p className="text-sm text-[#8a7562]">
            Editando cotización
          </p>

          <h1 className="text-3xl font-bold text-[#3b2a20]">

            COT-
            {String(
              cotizacion.numero
            ).padStart(6, "0")}

          </h1>

          {cliente && (
            <p className="mt-1 text-sm text-[#6b5746]">

              Cliente:{" "}

              <strong>
                {cliente.razon_social ||
                  cliente.nombre_comercial ||
                  cliente.nombre_completo}
              </strong>

            </p>
          )}

        </div>

        <button
          type="button"
          onClick={
            guardarCambios
          }
          disabled={guardando}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {guardando ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />

              Guardar cambios
            </>
          )}

        </button>

      </div>

      {/* MENSAJES */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>
      )}

      {mensaje && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          {mensaje}

        </div>
      )}

      {/* ESTADO */}

      <Card className="border-[#e4d8ca] bg-white">

        <CardHeader>

          <CardTitle className="text-[#3b2a20]">
            Estado de la cotización
          </CardTitle>

        </CardHeader>

        <CardContent>

          <div className="max-w-md">

            <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
              Estado
            </label>

            <select
              value={estado}
              onChange={(e) =>
                setEstado(
                  e.target.value as EstadoCotizacion
                )
              }
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm font-medium text-[#3b2a20] outline-none focus:border-[#8a6046]"
            >

              <option value="borrador">
                Borrador
              </option>

              <option value="enviada">
                Enviada
              </option>

              <option value="aprobada">
                Aprobada
              </option>

              <option value="rechazada">
                Rechazada
              </option>

              <option value="vencida">
                Vencida
              </option>

            </select>

            <p className="mt-2 text-xs text-[#8a7562]">

              El estado se guardará junto con los demás cambios.

            </p>

          </div>

        </CardContent>

      </Card>

      {/* INFORMACIÓN */}

      <Card className="border-[#e4d8ca] bg-white">

        <CardHeader>

          <CardTitle className="text-[#3b2a20]">
            Información de la cotización
          </CardTitle>

        </CardHeader>

        <CardContent>

          <div className="grid gap-5 md:grid-cols-3">

            <div>

              <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                Fecha
              </label>

              <input
                type="text"
                value={formatoFecha(
                  cotizacion.fecha
                )}
                disabled
                className="w-full rounded-lg border border-[#e4d8ca] bg-[#f8f5f2] px-3 py-2.5 text-sm text-[#777]"
              />

            </div>

            <div>

              <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                Válida hasta
              </label>

              <input
                type="date"
                value={
                  fechaVencimiento
                }
                onChange={(e) =>
                  setFechaVencimiento(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
              />

            </div>

            <div>

              <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                IVA
              </label>

              <select
                value={tipoIva}
                onChange={(e) =>
                  setTipoIva(
                    e.target.value as
                      | "incluido"
                      | "separado"
                  )
                }
                className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
              >

                <option value="incluido">
                  IVA incluido
                </option>

                <option value="separado">
                  IVA separado
                </option>

              </select>

            </div>

          </div>

          <div className="mt-5 max-w-xs">

            <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
              Porcentaje de IVA
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                porcentajeIva
              }
              onChange={(e) =>
                setPorcentajeIva(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
            />

          </div>

        </CardContent>

      </Card>

      {/* MUEBLES */}

      <Card className="border-[#e4d8ca] bg-white">

        <CardHeader className="flex flex-row items-center justify-between">

          <CardTitle className="text-[#3b2a20]">
            Muebles de la cotización
          </CardTitle>

          <button
            type="button"
            onClick={
              agregarMueble
            }
            className="flex items-center gap-2 rounded-lg border border-[#d8c8b9] px-3 py-2 text-sm font-semibold text-[#5c4030] transition hover:bg-[#f8f3ee]"
          >

            <Plus size={17} />

            Agregar mueble

          </button>

        </CardHeader>

        <CardContent className="space-y-5">

          {detalles.length === 0 ? (

            <div className="rounded-xl border border-dashed border-[#d8c8b9] bg-[#fcfaf8] p-8 text-center">

              <p className="text-sm text-[#8a7562]">
                No hay muebles en esta cotización.
              </p>

              <button
                type="button"
                onClick={
                  agregarMueble
                }
                className="mt-3 rounded-lg bg-[#5c4030] px-4 py-2 text-sm font-semibold text-white"
              >
                Agregar primer mueble
              </button>

            </div>

          ) : (

            detalles.map(
              (
                detalle,
                index
              ) => (

                <div
                  key={
                    detalle.id ||
                    `nuevo-${index}`
                  }
                  className="rounded-xl border border-[#e4d8ca] bg-[#fcfaf8] p-5"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <p className="text-xs text-[#8a7562]">
                        Mueble{" "}
                        {index + 1}
                      </p>

                      <p className="font-semibold text-[#3b2a20]">
                        {detalle.descripcion ||
                          "Nuevo mueble"}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarMueble(
                          index
                        )
                      }
                      className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                      title="Eliminar mueble"
                    >

                      <Trash2
                        size={18}
                      />

                    </button>

                  </div>

                  <div className="grid gap-4 md:grid-cols-12">

                    <div className="md:col-span-5">

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Mueble
                      </label>

                      <input
                        type="text"
                        value={
                          detalle.descripcion
                        }
                        onChange={(e) =>
                          actualizarDetalle(
                            index,
                            "descripcion",
                            e.target.value
                          )
                        }
                        placeholder="Ej. Sala Roma"
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
                      />

                    </div>

                    <div className="md:col-span-2">

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Cantidad
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          detalle.cantidad
                        }
                        onChange={(e) =>
                          actualizarDetalle(
                            index,
                            "cantidad",
                            Number(
                              e.target.value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
                      />

                    </div>

                    <div className="md:col-span-2">

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Precio unitario
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          detalle.precio_unitario
                        }
                        onChange={(e) =>
                          actualizarDetalle(
                            index,
                            "precio_unitario",
                            Number(
                              e.target.value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
                      />

                    </div>

                    <div className="md:col-span-2">

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Descuento
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          detalle.descuento
                        }
                        onChange={(e) =>
                          actualizarDetalle(
                            index,
                            "descuento",
                            Number(
                              e.target.value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
                      />

                    </div>

                    <div className="md:col-span-1">

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Total
                      </label>

                      <div className="flex h-[42px] items-center rounded-lg bg-[#f1e7dc] px-2 text-sm font-bold text-[#5c4030]">

                        {formatoDinero(
                          subtotalDetalle(
                            detalle
                          )
                        )}

                      </div>

                    </div>

                  </div>

                  <div className="mt-4">

                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Especificaciones
                    </label>

                    <textarea
                      value={
                        detalle.especificaciones
                      }
                      onChange={(e) =>
                        actualizarDetalle(
                          index,
                          "especificaciones",
                          e.target.value
                        )
                      }
                      rows={3}
                      placeholder="Medidas, color, material, acabado u otras características..."
                      className="w-full resize-y rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
                    />

                  </div>

                </div>

              )
            )

          )}

        </CardContent>

      </Card>

      {/* OBSERVACIONES */}

      <Card className="border-[#e4d8ca] bg-white">

        <CardHeader>

          <CardTitle className="text-[#3b2a20]">
            Observaciones
          </CardTitle>

        </CardHeader>

        <CardContent>

          <textarea
            value={
              observaciones
            }
            onChange={(e) =>
              setObservaciones(
                e.target.value
              )
            }
            rows={4}
            placeholder="Condiciones, tiempo de entrega, forma de pago, etc."
            className="w-full resize-y rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
          />

        </CardContent>

      </Card>

      {/* RESUMEN */}

      <Card className="border-[#e4d8ca] bg-white">

        <CardHeader>

          <CardTitle className="text-[#3b2a20]">
            Resumen
          </CardTitle>

        </CardHeader>

        <CardContent>

          <div className="ml-auto max-w-md space-y-3">

            <div className="flex justify-between text-sm text-[#6b5746]">

              <span>
                Subtotal
              </span>

              <span>
                {formatoDinero(
                  subtotal
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
                  descuentoTotal
                )}
              </span>

            </div>

            <div className="flex justify-between text-sm text-[#6b5746]">

              <span>
                {tipoIva ===
                "incluido"
                  ? `IVA incluido (${porcentajeIva}%)`
                  : `IVA (${porcentajeIva}%)`}
              </span>

              <span>
                {formatoDinero(
                  iva
                )}
              </span>

            </div>

            <div className="border-t border-[#e4d8ca] pt-4">

              <div className="flex justify-between text-xl font-bold text-[#3b2a20]">

                <span>
                  Total
                </span>

                <span>
                  {formatoDinero(
                    total
                  )}
                </span>

              </div>

            </div>

          </div>

        </CardContent>

      </Card>

      {/* BOTÓN FINAL */}

      <div className="flex justify-end pb-8">

        <button
          type="button"
          onClick={
            guardarCambios
          }
          disabled={guardando}
          className="flex items-center gap-2 rounded-lg bg-[#5c4030] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {guardando ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />

              Guardar cambios
            </>
          )}

        </button>

      </div>

    </div>
  )
}