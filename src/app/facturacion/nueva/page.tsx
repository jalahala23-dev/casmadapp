"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type Cliente = {
  id: string
  nombre_completo: string
  razon_social: string | null
  nombre_comercial: string | null
}

type Producto = {
  id: string
  nombre: string
  tipo_producto: string | null
  descripcion: string | null
  precio: number | null
}

type DetalleFactura = {
  producto_id: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  descuento: number
  especificaciones: string
}

export default function NuevaFacturaPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  const [clienteId, setClienteId] = useState("")

  const [fecha, setFecha] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split("T")[0]
  })

  const [fechaVencimiento, setFechaVencimiento] =
    useState("")

  const [tipoIva, setTipoIva] =
    useState<"incluido" | "separado">("incluido")

  const [porcentajeIva, setPorcentajeIva] =
    useState(13)

  const [observaciones, setObservaciones] =
    useState("")

  const [detalles, setDetalles] =
    useState<DetalleFactura[]>([
      {
        producto_id: null,
        descripcion: "",
        cantidad: 1,
        precio_unitario: 0,
        descuento: 0,
        especificaciones: "",
      },
    ])

  const [cargando, setCargando] =
    useState(true)

  const [guardando, setGuardando] =
    useState(false)

  const [emitiendo, setEmitiendo] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    setError("")

    const clientesResult =
      await supabase
        .from("clientes")
        .select(
          `
            id,
            nombre_completo,
            razon_social,
            nombre_comercial
          `
        )
        .order("nombre_completo", {
          ascending: true,
        })

    if (clientesResult.error) {
      console.error(
        "ERROR AL CARGAR CLIENTES:",
        clientesResult.error
      )

      setError(
        `No se pudieron cargar los clientes: ${clientesResult.error.message}`
      )
    }

    const productosResult =
      await supabase
        .from("productos")
        .select(
          `
            id,
            nombre,
            tipo_producto,
            descripcion,
            precio
          `
        )
        .eq("estado", "activo")
        .order("nombre", {
          ascending: true,
        })

    if (productosResult.error) {
      console.error(
        "ERROR AL CARGAR PRODUCTOS:",
        productosResult.error
      )

      setError(
        `No se pudieron cargar los muebles: ${productosResult.error.message}`
      )
    }

    setClientes(
      (clientesResult.data || []) as Cliente[]
    )

    setProductos(
      (productosResult.data || []) as Producto[]
    )

    setCargando(false)
  }

  function actualizarDetalle(
    index: number,
    campo: keyof DetalleFactura,
    valor: string | number | null
  ) {
    setDetalles((actuales) =>
      actuales.map((detalle, i) => {
        if (i !== index) {
          return detalle
        }

        return {
          ...detalle,
          [campo]: valor,
        }
      })
    )
  }

  function agregarDetalle() {
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

  function eliminarDetalle(index: number) {
    setDetalles((actuales) =>
      actuales.filter((_, i) => i !== index)
    )
  }

  function seleccionarProducto(
    index: number,
    productoId: string
  ) {
    if (!productoId) {
      setDetalles((actuales) =>
        actuales.map((detalle, i) => {
          if (i !== index) {
            return detalle
          }

          return {
            ...detalle,
            producto_id: null,
            descripcion: "",
            precio_unitario: 0,
          }
        })
      )

      return
    }

    const producto = productos.find(
      (item) => item.id === productoId
    )

    if (!producto) {
      return
    }

    setDetalles((actuales) =>
      actuales.map((detalle, i) => {
        if (i !== index) {
          return detalle
        }

        return {
          ...detalle,
          producto_id: producto.id,
          descripcion: producto.nombre,
          precio_unitario: Number(
            producto.precio || 0
          ),
          especificaciones:
            detalle.especificaciones ||
            producto.descripcion ||
            "",
        }
      })
    )
  }

  function subtotalDetalle(
    detalle: DetalleFactura
  ) {
    const cantidad =
      Number(detalle.cantidad) || 0

    const precio =
      Number(detalle.precio_unitario) || 0

    const descuento =
      Number(detalle.descuento) || 0

    return Math.max(
      0,
      cantidad * precio - descuento
    )
  }

  const subtotal = detalles.reduce(
    (totalActual, detalle) =>
      totalActual +
      subtotalDetalle(detalle),
    0
  )

  const descuentoTotal = detalles.reduce(
    (totalActual, detalle) =>
      totalActual +
      (Number(detalle.descuento) || 0),
    0
  )

  let iva = 0
  let total = subtotal

  if (tipoIva === "incluido") {
    iva =
      subtotal -
      subtotal /
        (1 + porcentajeIva / 100)

    total = subtotal
  } else {
    iva =
      subtotal *
      (porcentajeIva / 100)

    total = subtotal + iva
  }

  function formatoDinero(valor: number) {
    return `$${Number(valor || 0).toFixed(2)}`
  }

  function validarFactura() {
    if (!clienteId) {
      setError(
        "Selecciona un cliente antes de guardar la factura."
      )
      return false
    }

    if (!fecha) {
      setError(
        "Selecciona la fecha de la factura."
      )
      return false
    }

    if (detalles.length === 0) {
      setError(
        "Agrega al menos un producto o mueble."
      )
      return false
    }

    const detalleInvalido =
      detalles.some(
        (detalle) =>
          !detalle.descripcion.trim() ||
          Number(detalle.cantidad) <= 0 ||
          Number(detalle.precio_unitario) < 0
      )

    if (detalleInvalido) {
      setError(
        "Revisa los muebles. Todos deben tener descripción, cantidad y precio válidos."
      )
      return false
    }

    return true
  }

  async function crearFactura(
    emitir: boolean
  ) {
    setError("")

    if (!validarFactura()) {
      return
    }

    if (emitir) {
      setEmitiendo(true)
    } else {
      setGuardando(true)
    }

    let facturaId: string | null = null

    try {
      // =====================================================
      // 1. CREAR FACTURA
      // =====================================================

      const {
        data: factura,
        error: facturaError,
      } = await supabase
        .from("facturas")
        .insert({
          cliente_id: clienteId,
          fecha,
          fecha_vencimiento:
            fechaVencimiento || null,
          estado: "borrador",
          tipo_iva: tipoIva,
          porcentaje_iva:
            porcentajeIva,
          subtotal,
          descuento:
            descuentoTotal,
          iva,
          total,
          observaciones:
            observaciones.trim() ||
            null,
        })
        .select()
        .single()

      if (facturaError) {
        console.error(
          "ERROR AL CREAR FACTURA:",
          facturaError
        )

        throw facturaError
      }

      facturaId = factura.id

      // =====================================================
      // 2. CREAR DETALLES
      // =====================================================

      const detallesParaGuardar =
        detalles.map((detalle) => ({
          factura_id:
            factura.id,

          producto_id:
            detalle.producto_id ||
            null,

          descripcion:
            detalle.descripcion.trim(),

          cantidad:
            Number(detalle.cantidad),

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
        }))

      const {
        error: detallesError,
      } = await supabase
        .from("factura_detalles")
        .insert(
          detallesParaGuardar
        )

      if (detallesError) {
        console.error(
          "ERROR AL CREAR DETALLES:",
          detallesError
        )

        await supabase
          .from("facturas")
          .delete()
          .eq(
            "id",
            factura.id
          )

        throw detallesError
      }

      // =====================================================
      // 3. SI ES BORRADOR, NO TOCAMOS INVENTARIO
      // =====================================================

      if (!emitir) {
        router.push(
          `/facturacion/${factura.id}`
        )

        router.refresh()

        return
      }

      // =====================================================
      // 4. EMITIR FACTURA + DESCONTAR INVENTARIO
      // =====================================================

      const {
        data: resultado,
        error: emitirError,
      } = await supabase.rpc(
        "emitir_factura_con_inventario",
        {
          p_factura_id:
            factura.id,
        }
      )

      if (emitirError) {
        console.error(
          "ERROR AL EMITIR FACTURA:",
          emitirError
        )

        throw emitirError
      }

      console.log(
        "FACTURA EMITIDA:",
        resultado
      )

      // =====================================================
      // 5. IR A LA FACTURA
      // =====================================================

      router.push(
        `/facturacion/${factura.id}`
      )

      router.refresh()
    } catch (err: any) {
      console.error(
        "ERROR AL PROCESAR FACTURA:",
        err
      )

      // Si la factura fue creada pero ocurrió un error
      // al emitirla, la dejamos como borrador.
      //
      // Esto permite revisar/corregir el problema
      // sin perder la factura.

      if (
        emitir &&
        facturaId
      ) {
        await supabase
          .from("facturas")
          .update({
            estado: "borrador",
          })
          .eq(
            "id",
            facturaId
          )
      }

      setError(
        err?.message ||
          err?.details ||
          "No se pudo procesar la factura."
      )
    } finally {
      setGuardando(false)
      setEmitiendo(false)
    }
  }

  async function guardarFactura() {
    await crearFactura(false)
  }

  async function emitirFactura() {
    const confirmar =
      window.confirm(
        "¿Deseas emitir esta factura?\n\nAl emitirla, se descontará automáticamente del inventario la existencia de los productos relacionados."
      )

    if (!confirmar) {
      return
    }

    await crearFactura(true)
  }

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#8a7562]">

          <Loader2
            size={24}
            className="animate-spin"
          />

          Cargando clientes y muebles...

        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/facturacion"
              )
            }
            className="mb-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
          >

            <ArrowLeft size={17} />

            Volver a facturación

          </button>

          <p className="text-sm text-[#8a7562]">
            Nueva factura
          </p>

          <h1 className="text-3xl font-bold text-[#3b2a20]">
            Crear factura
          </h1>

        </div>


        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={
              guardarFactura
            }
            disabled={
              guardando ||
              emitiendo
            }
            className="flex items-center justify-center gap-2 rounded-lg border border-[#d8c8b9] bg-white px-5 py-3 text-sm font-semibold text-[#5c4030] transition hover:bg-[#f8f3ee] disabled:cursor-not-allowed disabled:opacity-60"
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

                Guardar borrador

              </>

            )}

          </button>


          <button
            type="button"
            onClick={
              emitirFactura
            }
            disabled={
              guardando ||
              emitiendo
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {emitiendo ? (

              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Emitiendo...

              </>

            ) : (

              <>
                <Send size={18} />

                Emitir factura

              </>

            )}

          </button>

        </div>

      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}


      {/* =====================================================
          INFORMACIÓN DE FACTURA
          ===================================================== */}

      <div className="rounded-xl border border-[#e4d8ca] bg-white">

        <div className="border-b border-[#eee4da] px-5 py-4">

          <h2 className="font-semibold text-[#3b2a20]">
            Información de la factura
          </h2>

        </div>


        <div className="grid gap-5 p-5 md:grid-cols-2 lg:grid-cols-4">

          <div className="lg:col-span-2">

            <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
              Cliente
            </label>

            <select
              value={clienteId}
              onChange={(e) =>
                setClienteId(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
            >

              <option value="">
                Seleccionar cliente...
              </option>

              {clientes.map(
                (cliente) => (

                  <option
                    key={cliente.id}
                    value={cliente.id}
                  >

                    {cliente.razon_social ||
                      cliente.nombre_comercial ||
                      cliente.nombre_completo}

                  </option>

                )
              )}

            </select>

            {clientes.length === 0 && (

              <p className="mt-1 text-xs text-red-600">
                No hay clientes disponibles.
              </p>

            )}

          </div>


          <div>

            <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
              Fecha
            </label>

            <input
              type="date"
              value={fecha}
              onChange={(e) =>
                setFecha(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
            />

          </div>


          <div>

            <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
              Vencimiento
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


          <div>

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

        </div>

      </div>


      {/* =====================================================
          PRODUCTOS / MUEBLES
          ===================================================== */}

      <div className="rounded-xl border border-[#e4d8ca] bg-white">

        <div className="flex items-center justify-between border-b border-[#eee4da] px-5 py-4">

          <h2 className="font-semibold text-[#3b2a20]">
            Productos / muebles
          </h2>

          <button
            type="button"
            onClick={
              agregarDetalle
            }
            className="flex items-center gap-2 rounded-lg border border-[#d8c8b9] px-3 py-2 text-sm font-semibold text-[#5c4030] hover:bg-[#f8f3ee]"
          >

            <Plus size={17} />

            Agregar

          </button>

        </div>


        <div className="space-y-5 p-5">

          {detalles.map(
            (detalle, index) => (

              <div
                key={index}
                className="rounded-xl border border-[#e4d8ca] bg-[#fcfaf8] p-5"
              >

                <div className="mb-4 flex items-center justify-between">

                  <p className="text-sm font-semibold text-[#3b2a20]">
                    Línea {index + 1}
                  </p>

                  {detalles.length > 1 && (

                    <button
                      type="button"
                      onClick={() =>
                        eliminarDetalle(
                          index
                        )
                      }
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >

                      <Trash2
                        size={18}
                      />

                    </button>

                  )}

                </div>


                <div className="grid gap-4 md:grid-cols-12">

                  <div className="md:col-span-4">

                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Producto / mueble
                    </label>

                    <select
                      value={
                        detalle.producto_id ||
                        ""
                      }
                      onChange={(e) =>
                        seleccionarProducto(
                          index,
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
                    >

                      <option value="">
                        Seleccionar mueble...
                      </option>

                      {productos.map(
                        (producto) => (

                          <option
                            key={
                              producto.id
                            }
                            value={
                              producto.id
                            }
                          >

                            {producto.nombre}

                            {producto.tipo_producto
                              ? ` • ${producto.tipo_producto}`
                              : ""}

                          </option>

                        )
                      )}

                    </select>

                    {productos.length === 0 && (

                      <p className="mt-1 text-xs text-red-600">
                        No hay muebles disponibles.
                      </p>

                    )}

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


                  <div className="md:col-span-2">

                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Total
                    </label>

                    <div className="flex h-[42px] items-center rounded-lg bg-[#f1e7dc] px-3 text-sm font-bold text-[#5c4030]">

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
                    rows={2}
                    placeholder="Medidas, color, material, acabado..."
                    className="w-full resize-y rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
                  />

                </div>

              </div>

            )
          )}

        </div>

      </div>


      {/* =====================================================
          OBSERVACIONES
          ===================================================== */}

      <div className="rounded-xl border border-[#e4d8ca] bg-white p-5">

        <h2 className="mb-4 font-semibold text-[#3b2a20]">
          Observaciones
        </h2>

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
          placeholder="Condiciones, forma de pago, tiempo de entrega, etc."
          className="w-full resize-y rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
        />

      </div>


      {/* =====================================================
          RESUMEN
          ===================================================== */}

      <div className="rounded-xl border border-[#e4d8ca] bg-white p-5">

        <h2 className="mb-5 font-semibold text-[#3b2a20]">
          Resumen de factura
        </h2>

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
              -{formatoDinero(
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

      </div>


      {/* =====================================================
          BOTONES FINALES
          ===================================================== */}

      <div className="flex flex-col justify-end gap-3 border-t border-[#e4d8ca] pb-10 pt-5 sm:flex-row">

        <button
          type="button"
          onClick={
            guardarFactura
          }
          disabled={
            guardando ||
            emitiendo
          }
          className="flex items-center justify-center gap-2 rounded-lg border border-[#d8c8b9] bg-white px-6 py-3 text-sm font-semibold text-[#5c4030] transition hover:bg-[#f8f3ee] disabled:cursor-not-allowed disabled:opacity-60"
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

              Guardar borrador

            </>

          )}

        </button>


        <button
          type="button"
          onClick={
            emitirFactura
          }
          disabled={
            guardando ||
            emitiendo
          }
          className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {emitiendo ? (

            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Emitiendo...

            </>

          ) : (

            <>
              <Send size={18} />

              Emitir factura

            </>

          )}

        </button>

      </div>

    </div>
  )
}