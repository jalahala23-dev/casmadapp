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

type DetalleFactura = {
  id?: string
  producto_id: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  descuento: number
  especificaciones: string
}

type EstadoFactura =
  | "borrador"
  | "emitida"
  | "pagada"
  | "anulada"

export default function EditarFacturaPage() {
  const params = useParams()
  const router = useRouter()
  const supabase =
    createSupabaseBrowserClient()

  const facturaId =
    typeof params.id === "string"
      ? params.id
      : ""

  const [factura, setFactura] =
    useState<Factura | null>(null)

  const [clientes, setClientes] =
    useState<Cliente[]>([])

  const [productos, setProductos] =
    useState<Producto[]>([])

  const [clienteId, setClienteId] =
    useState("")

  const [fecha, setFecha] =
    useState("")

  const [fechaVencimiento, setFechaVencimiento] =
    useState("")

  const [estado, setEstado] =
    useState<EstadoFactura>("borrador")

  const [tipoIva, setTipoIva] =
    useState<"incluido" | "separado">(
      "incluido"
    )

  const [porcentajeIva, setPorcentajeIva] =
    useState(13)

  const [observaciones, setObservaciones] =
    useState("")

  const [detalles, setDetalles] =
    useState<DetalleFactura[]>([])

  const [cargando, setCargando] =
    useState(true)

  const [guardando, setGuardando] =
    useState(false)

  const [error, setError] =
    useState("")

  const [mensaje, setMensaje] =
    useState("")

  useEffect(() => {
    if (facturaId) {
      cargarDatos()
    }
  }, [facturaId])

  async function cargarDatos() {
    setCargando(true)
    setError("")

    try {
      const [
        facturaResult,
        clientesResult,
        productosResult,
      ] = await Promise.all([
        supabase
          .from("facturas")
          .select(
            `
              id,
              numero,
              cliente_id,
              fecha,
              fecha_vencimiento,
              estado,
              tipo_iva,
              porcentaje_iva,
              subtotal,
              descuento,
              iva,
              total,
              observaciones
            `
          )
          .eq("id", facturaId)
          .single(),

        supabase
          .from("clientes")
          .select(
            `
              id,
              nombre_completo,
              razon_social,
              nombre_comercial
            `
          )
          .order(
            "nombre_completo",
            {
              ascending: true,
            }
          ),

        supabase
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
          .order("nombre", {
            ascending: true,
          }),
      ])

      if (facturaResult.error) {
        throw facturaResult.error
      }

      if (clientesResult.error) {
        throw clientesResult.error
      }

      if (productosResult.error) {
        throw productosResult.error
      }

      const facturaData =
        facturaResult.data as Factura

      setFactura(facturaData)

      setClientes(
        (clientesResult.data ||
          []) as Cliente[]
      )

      setProductos(
        (productosResult.data ||
          []) as Producto[]
      )

      setClienteId(
        facturaData.cliente_id
      )

      setFecha(
        facturaData.fecha
      )

      setFechaVencimiento(
        facturaData.fecha_vencimiento ||
          ""
      )

      const estadosValidos:
        EstadoFactura[] = [
        "borrador",
        "emitida",
        "pagada",
        "anulada",
      ]

      const estadoActual =
        String(
          facturaData.estado ||
            "borrador"
        ).toLowerCase()

      setEstado(
        estadosValidos.includes(
          estadoActual as EstadoFactura
        )
          ? (estadoActual as EstadoFactura)
          : "borrador"
      )

      setTipoIva(
        facturaData.tipo_iva ===
          "separado"
          ? "separado"
          : "incluido"
      )

      setPorcentajeIva(
        Number(
          facturaData.porcentaje_iva ||
            13
        )
      )

      setObservaciones(
        facturaData.observaciones ||
          ""
      )

      const {
        data: detallesData,
        error: detallesError,
      } = await supabase
        .from("factura_detalles")
        .select(
          `
            id,
            producto_id,
            descripcion,
            cantidad,
            precio_unitario,
            descuento,
            subtotal,
            especificaciones
          `
        )
        .eq(
          "factura_id",
          facturaId
        )
        .order("created_at", {
          ascending: true,
        })

      if (detallesError) {
        throw detallesError
      }

      setDetalles(
        (detallesData || []).map(
          (detalle: any) => ({
            id: detalle.id,
            producto_id:
              detalle.producto_id ||
              null,
            descripcion:
              detalle.descripcion ||
              "",
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
    } catch (err: any) {
      console.error(
        "ERROR AL CARGAR FACTURA PARA EDITAR:",
        err
      )

      setError(
        err?.message ||
          "No se pudo cargar la factura."
      )
    } finally {
      setCargando(false)
    }
  }

  function actualizarDetalle(
    index: number,
    campo: keyof DetalleFactura,
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

  function eliminarDetalle(
    index: number
  ) {
    setDetalles((actuales) =>
      actuales.filter(
        (_, i) => i !== index
      )
    )
  }

  function seleccionarProducto(
    index: number,
    productoId: string
  ) {
    if (!productoId) {
      setDetalles((actuales) =>
        actuales.map(
          (detalle, i) => {
            if (i !== index) {
              return detalle
            }

            return {
              ...detalle,
              producto_id: null,
              descripcion: "",
              precio_unitario: 0,
            }
          }
        )
      )

      return
    }

    const producto =
      productos.find(
        (item) =>
          item.id === productoId
      )

    if (!producto) {
      return
    }

    setDetalles((actuales) =>
      actuales.map(
        (detalle, i) => {
          if (i !== index) {
            return detalle
          }

          return {
            ...detalle,
            producto_id:
              producto.id,
            descripcion:
              producto.nombre,
            precio_unitario:
              Number(
                producto.precio || 0
              ),
            especificaciones:
              detalle.especificaciones ||
              producto.descripcion ||
              "",
          }
        }
      )
    )
  }

  function subtotalDetalle(
    detalle: DetalleFactura
  ) {
    const cantidad =
      Number(
        detalle.cantidad
      ) || 0

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
      (porcentajeIva /
        100)

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

  async function guardarCambios() {
    if (!factura) {
      return
    }

    setError("")
    setMensaje("")

    if (!clienteId) {
      setError(
        "Selecciona un cliente."
      )
      return
    }

    if (!fecha) {
      setError(
        "Selecciona la fecha de la factura."
      )
      return
    }

    if (detalles.length === 0) {
      setError(
        "La factura debe tener al menos un producto o mueble."
      )
      return
    }

    const detalleInvalido =
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

    if (detalleInvalido) {
      setError(
        "Revisa los productos. Todos deben tener descripción, cantidad y precio válidos."
      )
      return
    }

    setGuardando(true)

    try {
      /*
       * ACTUALIZAR FACTURA
       */

      const {
        error: updateError,
      } = await supabase
        .from("facturas")
        .update({
          cliente_id:
            clienteId,

          fecha,

          fecha_vencimiento:
            fechaVencimiento ||
            null,

          estado,

          tipo_iva:
            tipoIva,

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

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          factura.id
        )

      if (updateError) {
        console.error(
          "ERROR AL ACTUALIZAR FACTURA:",
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
        .from("factura_detalles")
        .delete()
        .eq(
          "factura_id",
          factura.id
        )

      if (deleteError) {
        console.error(
          "ERROR AL ELIMINAR DETALLES:",
          deleteError
        )

        throw deleteError
      }

      /*
       * INSERTAR DETALLES NUEVOS
       */

      const detallesParaGuardar =
        detalles.map(
          (detalle) => ({
            factura_id:
              factura.id,

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
        .from("factura_detalles")
        .insert(
          detallesParaGuardar
        )

      if (insertError) {
        console.error(
          "ERROR AL INSERTAR DETALLES:",
          insertError
        )

        throw insertError
      }

      setMensaje(
        "Factura actualizada correctamente."
      )

      setTimeout(() => {
        router.push(
          `/facturacion/${factura.id}`
        )

        router.refresh()
      }, 700)
    } catch (err: any) {
      console.error(
        "ERROR AL GUARDAR CAMBIOS DE FACTURA:",
        err
      )

      setError(
        `No se pudo actualizar la factura: ${
          err?.message ||
          err?.details ||
          "Error desconocido"
        }`
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

          Cargando factura...

        </div>

      </div>
    )
  }

  if (!factura) {
    return (
      <div className="mx-auto max-w-5xl p-6">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/facturacion"
            )
          }
          className="flex items-center gap-2 text-sm font-medium text-[#6b4935]"
        >

          <ArrowLeft
            size={17}
          />

          Volver a facturación

        </button>

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">

          {error ||
            "No se encontró la factura."}

        </div>

      </div>
    )
  }

  const numeroFactura =
    `FAC-${String(
      factura.numero
    ).padStart(
      6,
      "0"
    )}`

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ENCABEZADO */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/facturacion/${factura.id}`
              )
            }
            className="mb-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#6b4935] hover:bg-[#f4eadf]"
          >

            <ArrowLeft
              size={17}
            />

            Volver a factura

          </button>

          <p className="text-sm text-[#8a7562]">
            Editando factura
          </p>

          <h1 className="text-3xl font-bold text-[#3b2a20]">
            {numeroFactura}
          </h1>

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

      {/* INFORMACIÓN */}

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
                    key={
                      cliente.id
                    }
                    value={
                      cliente.id
                    }
                  >
                    {cliente.razon_social ||
                      cliente.nombre_comercial ||
                      cliente.nombre_completo}
                  </option>
                )
              )}

            </select>

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
              Estado
            </label>

            <select
              value={estado}
              onChange={(e) =>
                setEstado(
                  e.target.value as EstadoFactura
                )
              }
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
            >

              <option value="borrador">
                Borrador
              </option>

              <option value="emitida">
                Emitida
              </option>

              <option value="pagada">
                Pagada
              </option>

              <option value="anulada">
                Anulada
              </option>

            </select>

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

      {/* DETALLES */}

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

          {detalles.length ===
          0 ? (

            <div className="rounded-xl border border-dashed border-[#d8c8b9] bg-[#fcfaf8] p-8 text-center">

              <p className="text-sm text-[#8a7562]">
                No hay productos en esta factura.
              </p>

              <button
                type="button"
                onClick={
                  agregarDetalle
                }
                className="mt-3 rounded-lg bg-[#5c4030] px-4 py-2 text-sm font-semibold text-white"
              >

                Agregar producto

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

                    <p className="text-sm font-semibold text-[#3b2a20]">
                      Línea{" "}
                      {index + 1}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarDetalle(
                          index
                        )
                      }
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      title="Eliminar"
                    >

                      <Trash2
                        size={18}
                      />

                    </button>

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
                              {
                                producto.nombre
                              }
                              {producto.tipo_producto
                                ? ` • ${producto.tipo_producto}`
                                : ""}
                            </option>
                          )
                        )}

                      </select>

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
                        placeholder="Descripción"
                        className="mt-2 w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#8a6046]"
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
            )

          )}

        </div>

      </div>

      {/* OBSERVACIONES */}

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

      {/* RESUMEN */}

      <div className="rounded-xl border border-[#e4d8ca] bg-white p-5">

        <h2 className="mb-5 font-semibold text-[#3b2a20]">
          Resumen
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

      </div>

      {/* BOTÓN FINAL */}

      <div className="flex justify-end pb-10">

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