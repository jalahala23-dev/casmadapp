"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  Calculator,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type Cliente = {
  id: string
  nombre_completo: string
  razon_social: string | null
  nombre_comercial: string | null
  numero_documento: string | null
}

type Producto = {
  id: string
  codigo: string
  nombre: string
  tipo_producto: "precio_fijo" | "a_medida"
  precio: number
}

type Detalle = {
  id: string
  producto_id: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
  descuento: number
  especificaciones: string
}

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
  clientes?: {
    nombre_completo: string
    razon_social: string | null
    nombre_comercial: string | null
  }
}

export default function CotizacionesPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [cotizaciones, setCotizaciones] =
    useState<Cotizacion[]>([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] =
    useState<string | null>(null)

  const [error, setError] = useState("")

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

  const [busqueda, setBusqueda] = useState("")

  const [clienteId, setClienteId] = useState("")

  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  )

  const [fechaVencimiento, setFechaVencimiento] =
    useState("")

  const [tipoIva, setTipoIva] =
    useState<"incluido" | "separado">("separado")

  const [porcentajeIva, setPorcentajeIva] =
    useState("13")

  const [descuentoGeneral, setDescuentoGeneral] =
    useState("0")

  const [observaciones, setObservaciones] =
    useState("")

  const [detalles, setDetalles] =
    useState<Detalle[]>([])

  const [
    mostrarSelectorProducto,
    setMostrarSelectorProducto,
  ] = useState(false)

  const [busquedaProducto, setBusquedaProducto] =
    useState("")


  /* ==========================================================
     CARGAR DATOS
     ========================================================== */

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    setError("")

    const [
      clientesResult,
      productosResult,
      cotizacionesResult,
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select(
          "id,nombre_completo,razon_social,nombre_comercial,numero_documento"
        )
        .eq("estado", "activo")
        .order("nombre_completo"),

      supabase
        .from("productos")
        .select(
          "id,codigo,nombre,tipo_producto,precio"
        )
        .eq("estado", "activo")
        .order("nombre"),

      supabase
        .from("cotizaciones")
        .select(
          `
          *,
          clientes (
            nombre_completo,
            razon_social,
            nombre_comercial
          )
        `
        )
        .order("created_at", {
          ascending: false,
        }),
    ])

    if (clientesResult.error) {
      console.error(
        clientesResult.error
      )

      setError(
        "No se pudieron cargar los clientes."
      )
    }

    if (productosResult.error) {
      console.error(
        productosResult.error
      )

      setError(
        "No se pudieron cargar los muebles."
      )
    }

    if (cotizacionesResult.error) {
      console.error(
        cotizacionesResult.error
      )

      setError(
        "No se pudieron cargar las cotizaciones."
      )
    }

    setClientes(
      (clientesResult.data ??
        []) as Cliente[]
    )

    setProductos(
      (productosResult.data ??
        []) as Producto[]
    )

    setCotizaciones(
      (cotizacionesResult.data ??
        []) as Cotizacion[]
    )

    setCargando(false)
  }


  /* ==========================================================
     LIMPIAR FORMULARIO
     ========================================================== */

  function limpiarFormulario() {
    setClienteId("")

    setFecha(
      new Date().toISOString().split("T")[0]
    )

    setFechaVencimiento("")

    setTipoIva("separado")

    setPorcentajeIva("13")

    setDescuentoGeneral("0")

    setObservaciones("")

    setDetalles([])

    setBusquedaProducto("")

    setMostrarSelectorProducto(false)

    setError("")
  }


  /* ==========================================================
     PRODUCTOS
     ========================================================== */

  function agregarProducto(
    producto: Producto
  ) {
    const existente = detalles.find(
      (detalle) =>
        detalle.producto_id === producto.id
    )

    if (existente) {
      setDetalles((actuales) =>
        actuales.map((detalle) =>
          detalle.id === existente.id
            ? {
                ...detalle,
                cantidad:
                  detalle.cantidad + 1,
              }
            : detalle
        )
      )
    } else {
      setDetalles((actuales) => [
        ...actuales,
        {
          id: crypto.randomUUID(),
          producto_id: producto.id,
          descripcion: producto.nombre,
          cantidad: 1,
          precio_unitario:
            Number(producto.precio) || 0,
          descuento: 0,
          especificaciones: "",
        },
      ])
    }

    setMostrarSelectorProducto(false)

    setBusquedaProducto("")
  }


  function agregarLineaPersonalizada() {
    setDetalles((actuales) => [
      ...actuales,
      {
        id: crypto.randomUUID(),
        producto_id: null,
        descripcion: "",
        cantidad: 1,
        precio_unitario: 0,
        descuento: 0,
        especificaciones: "",
      },
    ])

    setMostrarSelectorProducto(false)
  }


  function actualizarDetalle(
    id: string,
    campo: keyof Detalle,
    valor: string | number
  ) {
    setDetalles((actuales) =>
      actuales.map((detalle) =>
        detalle.id === id
          ? {
              ...detalle,
              [campo]: valor,
            }
          : detalle
      )
    )
  }


  function eliminarDetalle(
    id: string
  ) {
    setDetalles((actuales) =>
      actuales.filter(
        (detalle) =>
          detalle.id !== id
      )
    )
  }


  /* ==========================================================
     CÁLCULOS
     ========================================================== */

  const subtotalCalculado =
    useMemo(() => {
      return detalles.reduce(
        (total, detalle) => {
          const bruto =
            Number(
              detalle.cantidad || 0
            ) *
            Number(
              detalle.precio_unitario || 0
            )

          const descuento =
            Number(
              detalle.descuento || 0
            )

          return (
            total +
            Math.max(
              bruto - descuento,
              0
            )
          )
        },
        0
      )
    }, [detalles])


  const descuentoCalculado =
    Math.max(
      Number(descuentoGeneral) || 0,
      0
    )


  const baseImponible =
    Math.max(
      subtotalCalculado -
        descuentoCalculado,
      0
    )


  const ivaCalculado =
    useMemo(() => {
      const porcentaje =
        Number(porcentajeIva) || 0

      if (
        tipoIva ===
        "separado"
      ) {
        return (
          baseImponible *
          (porcentaje / 100)
        )
      }

      return (
        baseImponible -
        baseImponible /
          (1 + porcentaje / 100)
      )
    }, [
      baseImponible,
      porcentajeIva,
      tipoIva,
    ])


  const totalCalculado =
    tipoIva === "separado"
      ? baseImponible +
        ivaCalculado
      : baseImponible


  /* ==========================================================
     GUARDAR COTIZACIÓN
     ========================================================== */

  async function guardarCotizacion() {
    if (!clienteId) {
      setError(
        "Selecciona un cliente."
      )

      return
    }

    if (detalles.length === 0) {
      setError(
        "Agrega al menos un mueble a la cotización."
      )

      return
    }

    for (const detalle of detalles) {
      if (
        !detalle.descripcion.trim()
      ) {
        setError(
          "Todas las líneas deben tener una descripción."
        )

        return
      }

      if (
        detalle.cantidad <= 0
      ) {
        setError(
          "La cantidad debe ser mayor que cero."
        )

        return
      }
    }

    setGuardando(true)

    setError("")

    const {
      data: cotizacion,
      error: errorCotizacion,
    } = await supabase
      .from("cotizaciones")
      .insert({
        cliente_id: clienteId,

        fecha,

        fecha_vencimiento:
          fechaVencimiento ||
          null,

        estado: "borrador",

        tipo_iva: tipoIva,

        porcentaje_iva:
          Number(
            porcentajeIva
          ) || 0,

        subtotal:
          subtotalCalculado,

        descuento:
          descuentoCalculado,

        iva:
          ivaCalculado,

        total:
          totalCalculado,

        observaciones:
          observaciones.trim() ||
          null,
      })
      .select()
      .single()

    if (
      errorCotizacion ||
      !cotizacion
    ) {
      console.error(
        errorCotizacion
      )

      setError(
        errorCotizacion?.message ||
          "No se pudo guardar la cotización."
      )

      setGuardando(false)

      return
    }

    const detallesParaGuardar =
      detalles.map(
        (detalle) => ({
          cotizacion_id:
            cotizacion.id,

          producto_id:
            detalle.producto_id,

          descripcion:
            detalle.descripcion.trim(),

          cantidad:
            detalle.cantidad,

          precio_unitario:
            detalle.precio_unitario,

          descuento:
            detalle.descuento,

          subtotal:
            Math.max(
              detalle.cantidad *
                detalle.precio_unitario -
                detalle.descuento,
              0
            ),

          especificaciones:
            detalle.especificaciones.trim() ||
            null,
        })
      )

    const {
      error: errorDetalles,
    } = await supabase
      .from("cotizacion_detalles")
      .insert(
        detallesParaGuardar
      )

    if (errorDetalles) {
      console.error(
        errorDetalles
      )

      await supabase
        .from("cotizaciones")
        .delete()
        .eq(
          "id",
          cotizacion.id
        )

      setError(
        "La cotización no pudo guardar sus detalles."
      )

      setGuardando(false)

      return
    }

    limpiarFormulario()

    setMostrarFormulario(false)

    await cargarDatos()

    setGuardando(false)
  }


  /* ==========================================================
     ELIMINAR COTIZACIÓN DESDE EL LISTADO
     ========================================================== */

  async function eliminarCotizacion(
    cotizacion: Cotizacion
  ) {
    if (
      cotizacion.estado ===
      "convertida"
    ) {
      setError(
        "No se puede eliminar una cotización que ya fue convertida en factura."
      )

      return
    }

    if (
      eliminandoId !== null
    ) {
      return
    }

    const numero =
      `COT-${String(
        cotizacion.numero
      ).padStart(6, "0")}`

    const cliente =
      cotizacion.clientes

    const nombre =
      cliente?.razon_social ||
      cliente?.nombre_comercial ||
      cliente?.nombre_completo ||
      "este cliente"

    const confirmar =
      window.confirm(
        `¿Eliminar ${numero}?\n\nCliente: ${nombre}\nTotal: $${Number(
          cotizacion.total
        ).toFixed(
          2
        )}\n\nSe eliminarán también todos los muebles de esta cotización.\n\nEsta acción no se puede deshacer.`
      )

    if (!confirmar) {
      return
    }

    setEliminandoId(
      cotizacion.id
    )

    setError("")

    try {
      /*
       * Primero eliminamos los detalles.
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
            "No se pudieron eliminar los muebles de la cotización."
        )
      }

      /*
       * Después eliminamos la cotización.
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
       * Actualizamos la lista inmediatamente.
       */

      setCotizaciones(
        (actuales) =>
          actuales.filter(
            (item) =>
              item.id !==
              cotizacion.id
          )
      )
    } catch (err: any) {
      console.error(
        "ERROR AL ELIMINAR COTIZACIÓN:",
        err
      )

      setError(
        err?.message ||
          "No se pudo eliminar la cotización."
      )
    } finally {
      setEliminandoId(null)
    }
  }


  /* ==========================================================
     FILTROS
     ========================================================== */

  const cotizacionesFiltradas =
    cotizaciones.filter(
      (cotizacion) => {
        const cliente =
          cotizacion.clientes

        const nombre =
          cliente?.razon_social ||
          cliente?.nombre_comercial ||
          cliente?.nombre_completo ||
          ""

        const texto = `
          ${cotizacion.numero}
          ${nombre}
          ${cotizacion.estado}
        `.toLowerCase()

        return texto.includes(
          busqueda.toLowerCase()
        )
      }
    )


  const productosFiltrados =
    productos.filter(
      (producto) => {
        const texto = `
          ${producto.codigo}
          ${producto.nombre}
        `.toLowerCase()

        return texto.includes(
          busquedaProducto.toLowerCase()
        )
      }
    )


  function nombreCliente(
    cliente: Cliente
  ) {
    return (
      cliente.razon_social ||
      cliente.nombre_comercial ||
      cliente.nombre_completo
    )
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="space-y-6">

      {/* ======================================================
          ENCABEZADO
          ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-2xl font-bold tracking-tight text-[#3b2a20] md:text-3xl">
            Cotizaciones
          </h1>

          <p className="mt-1 text-sm text-[#8a7562]">
            Crea y administra cotizaciones para tus clientes
          </p>

        </div>

        <button
          type="button"
          onClick={() => {
            limpiarFormulario()

            setMostrarFormulario(
              true
            )
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4b3326]"
        >

          <Plus size={18} />

          Nueva cotización

        </button>

      </div>


      {/* ERROR */}

      {error &&
        !mostrarFormulario && (

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            {error}

          </div>

        )}


      {/* ======================================================
          RESUMEN
          ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">

        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="flex items-center gap-4 p-5">

            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

              <FileText size={22} />

            </div>

            <div>

              <p className="text-sm text-[#8a7562]">
                Cotizaciones
              </p>

              <p className="text-2xl font-bold text-[#3b2a20]">
                {cotizaciones.length}
              </p>

            </div>

          </CardContent>

        </Card>


        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="flex items-center gap-4 p-5">

            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

              <Calculator size={22} />

            </div>

            <div>

              <p className="text-sm text-[#8a7562]">
                En borrador
              </p>

              <p className="text-2xl font-bold text-[#3b2a20]">

                {
                  cotizaciones.filter(
                    (c) =>
                      c.estado ===
                      "borrador"
                  ).length
                }

              </p>

            </div>

          </CardContent>

        </Card>


        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="flex items-center gap-4 p-5">

            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

              <User size={22} />

            </div>

            <div>

              <p className="text-sm text-[#8a7562]">
                Clientes
              </p>

              <p className="text-2xl font-bold text-[#3b2a20]">
                {clientes.length}
              </p>

            </div>

          </CardContent>

        </Card>

      </div>


      {/* ======================================================
          LISTADO
          ====================================================== */}

      <Card className="border-[#e4d8ca] bg-white">

        <CardHeader>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <CardTitle className="text-[#3b2a20]">
                Historial de cotizaciones
              </CardTitle>

              <p className="mt-1 text-sm text-[#8a7562]">
                Cotizaciones guardadas en CASMAD
              </p>

            </div>


            <div className="relative w-full md:w-80">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
              />

              <input
                type="text"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Buscar cotización..."
                className="w-full rounded-lg border border-[#e4d8ca] bg-[#fcfaf8] py-2.5 pl-10 pr-4 text-sm text-[#3b2a20] outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
              />

            </div>

          </div>

        </CardHeader>


        <CardContent>

          {cargando ? (

            <div className="flex min-h-56 items-center justify-center">

              <div className="flex items-center gap-3 text-sm text-[#8a7562]">

                <Loader2
                  size={22}
                  className="animate-spin"
                />

                Cargando cotizaciones...

              </div>

            </div>

          ) : cotizacionesFiltradas.length === 0 ? (

            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#dccbbb] bg-[#fcfaf8] p-6 text-center">

              <FileText
                size={40}
                className="mb-3 text-[#b79a7d]"
              />

              <p className="font-semibold text-[#5c4635]">
                No hay cotizaciones
              </p>

              <p className="mt-1 max-w-md text-sm text-[#9a8775]">
                Crea tu primera cotización para comenzar.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px]">

                <thead>

                  <tr className="border-b border-[#e4d8ca] text-left">

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Número
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Cliente
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Fecha
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Estado
                    </th>

                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Total
                    </th>

                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Acciones
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {cotizacionesFiltradas.map(
                    (cotizacion) => {

                      const cliente =
                        cotizacion.clientes

                      const nombre =
                        cliente?.razon_social ||
                        cliente?.nombre_comercial ||
                        cliente?.nombre_completo ||
                        "Cliente"

                      const estaEliminando =
                        eliminandoId ===
                        cotizacion.id

                      const estaConvertida =
                        cotizacion.estado ===
                        "convertida"

                      return (

                        <tr
                          key={
                            cotizacion.id
                          }
                          onClick={() =>
                            router.push(
                              `/cotizaciones/${cotizacion.id}`
                            )
                          }
                          className="cursor-pointer border-b border-[#f0e8df] last:border-0 transition hover:bg-[#fcfaf8]"
                        >

                          {/* NÚMERO */}

                          <td className="px-3 py-4 font-semibold text-[#5c4030]">

                            COT-
                            {String(
                              cotizacion.numero
                            ).padStart(
                              6,
                              "0"
                            )}

                          </td>


                          {/* CLIENTE */}

                          <td className="px-3 py-4">

                            <p className="font-medium text-[#3b2a20]">
                              {nombre}
                            </p>

                          </td>


                          {/* FECHA */}

                          <td className="px-3 py-4 text-sm text-[#6b5746]">

                            {cotizacion.fecha}

                          </td>


                          {/* ESTADO */}

                          <td className="px-3 py-4">

                            <span
                              className={`
                                rounded-full
                                px-2.5
                                py-1
                                text-xs
                                font-medium
                                capitalize
                                ${
                                  cotizacion.estado ===
                                  "convertida"
                                    ? "bg-blue-50 text-blue-700"
                                    : cotizacion.estado ===
                                      "aprobada"
                                    ? "bg-green-50 text-green-700"
                                    : cotizacion.estado ===
                                      "rechazada"
                                    ? "bg-red-50 text-red-700"
                                    : cotizacion.estado ===
                                      "enviada"
                                    ? "bg-purple-50 text-purple-700"
                                    : cotizacion.estado ===
                                      "vencida"
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-[#f4eadf] text-[#6b4935]"
                                }
                              `}
                            >

                              {cotizacion.estado}

                            </span>

                          </td>


                          {/* TOTAL */}

                          <td className="px-3 py-4 text-right font-semibold text-[#5c4030]">

                            $
                            {Number(
                              cotizacion.total
                            ).toFixed(2)}

                          </td>


                          {/* ACCIONES */}

                          <td
                            className="px-3 py-4"
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                          >

                            <div className="flex items-center justify-center gap-1.5">

                              {/* VER */}

                              <button
                                type="button"
                                title="Ver cotización"
                                onClick={() =>
                                  router.push(
                                    `/cotizaciones/${cotizacion.id}`
                                  )
                                }
                                className="rounded-lg border border-[#e4d8ca] bg-white p-2 text-[#6b4935] transition hover:bg-[#f4eadf]"
                              >

                                <Eye
                                  size={17}
                                />

                              </button>


                              {/* EDITAR */}

                              <button
                                type="button"
                                title="Editar cotización"
                                onClick={() =>
                                  router.push(
                                    `/cotizaciones/${cotizacion.id}/editar`
                                  )
                                }
                                className="rounded-lg border border-[#e4d8ca] bg-white p-2 text-[#6b4935] transition hover:bg-[#f4eadf]"
                              >

                                <Pencil
                                  size={17}
                                />

                              </button>


                              {/* ELIMINAR */}

                              <button
                                type="button"
                                title={
                                  estaConvertida
                                    ? "Una cotización convertida no se puede eliminar"
                                    : "Eliminar cotización"
                                }
                                disabled={
                                  estaEliminando ||
                                  estaConvertida
                                }
                                onClick={() =>
                                  eliminarCotizacion(
                                    cotizacion
                                  )
                                }
                                className={`
                                  rounded-lg
                                  border
                                  p-2
                                  transition
                                  ${
                                    estaConvertida
                                      ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
                                      : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                                  }
                                  ${
                                    estaEliminando
                                      ? "cursor-wait opacity-60"
                                      : ""
                                  }
                                `}
                              >

                                {estaEliminando ? (

                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />

                                ) : (

                                  <Trash2
                                    size={17}
                                  />

                                )}

                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </CardContent>

      </Card>


      {/* ======================================================
          MODAL NUEVA COTIZACIÓN
          ====================================================== */}

      {mostrarFormulario && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">

          <div className="my-8 w-full max-w-5xl rounded-2xl bg-white shadow-2xl">


            {/* CABECERA MODAL */}

            <div className="flex items-center justify-between border-b border-[#e4d8ca] px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#3b2a20]">
                  Nueva cotización
                </h2>

                <p className="mt-1 text-sm text-[#8a7562]">
                  Selecciona el cliente y agrega los muebles.
                </p>

              </div>


              <button
                type="button"
                onClick={() => {
                  limpiarFormulario()

                  setMostrarFormulario(
                    false
                  )
                }}
                className="rounded-lg p-2 text-[#8a7562] hover:bg-[#f4eadf]"
              >

                <X size={20} />

              </button>

            </div>


            {/* CONTENIDO MODAL */}

            <div className="max-h-[75vh] overflow-y-auto px-6 py-6">

              <div className="space-y-6">


                {/* CLIENTE */}

                <section>

                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Cliente
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">

                    <div className="md:col-span-2">

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Cliente *
                      </label>

                      <select
                        value={clienteId}
                        onChange={(e) =>
                          setClienteId(
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      >

                        <option value="">
                          Seleccionar cliente
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

                              {nombreCliente(
                                cliente
                              )}

                              {cliente.numero_documento
                                ? ` · ${cliente.numero_documento}`
                                : ""}

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
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
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
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>

                  </div>

                </section>


                {/* PRODUCTOS */}

                <section>

                  <div className="mb-3 flex items-center justify-between">

                    <h3 className="text-sm font-semibold text-[#5c4035]">
                      Muebles
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarSelectorProducto(
                          true
                        )
                      }
                      className="flex items-center gap-2 rounded-lg bg-[#5c4030] px-3 py-2 text-sm font-semibold text-white hover:bg-[#4b3326]"
                    >

                      <Plus size={16} />

                      Agregar mueble

                    </button>

                  </div>


                  {detalles.length ===
                  0 ? (

                    <div className="rounded-xl border border-dashed border-[#dccbbb] bg-[#fcfaf8] p-8 text-center">

                      <PackageIcon />

                      <p className="mt-2 font-medium text-[#5c4635]">
                        No hay muebles agregados
                      </p>

                      <p className="mt-1 text-sm text-[#9a8775]">
                        Agrega un mueble del catálogo o una línea personalizada.
                      </p>

                    </div>

                  ) : (

                    <div className="space-y-3">

                      {detalles.map(
                        (detalle) => (

                          <div
                            key={
                              detalle.id
                            }
                            className="rounded-xl border border-[#e4d8ca] bg-[#fcfaf8] p-4"
                          >

                            <div className="grid gap-4 md:grid-cols-12">


                              <div className="md:col-span-4">

                                <label className="mb-1.5 block text-xs font-medium text-[#8a7562]">
                                  Descripción
                                </label>

                                <input
                                  value={
                                    detalle.descripcion
                                  }
                                  onChange={(e) =>
                                    actualizarDetalle(
                                      detalle.id,
                                      "descripcion",
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2 text-sm outline-none focus:border-[#a67c52]"
                                />

                              </div>


                              <div className="md:col-span-2">

                                <label className="mb-1.5 block text-xs font-medium text-[#8a7562]">
                                  Cantidad
                                </label>

                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={
                                    detalle.cantidad
                                  }
                                  onChange={(e) =>
                                    actualizarDetalle(
                                      detalle.id,
                                      "cantidad",
                                      Number(
                                        e.target.value
                                      )
                                    )
                                  }
                                  className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2 text-sm outline-none focus:border-[#a67c52]"
                                />

                              </div>


                              <div className="md:col-span-2">

                                <label className="mb-1.5 block text-xs font-medium text-[#8a7562]">
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
                                      detalle.id,
                                      "precio_unitario",
                                      Number(
                                        e.target.value
                                      )
                                    )
                                  }
                                  className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2 text-sm outline-none focus:border-[#a67c52]"
                                />

                              </div>


                              <div className="md:col-span-2">

                                <label className="mb-1.5 block text-xs font-medium text-[#8a7562]">
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
                                      detalle.id,
                                      "descuento",
                                      Number(
                                        e.target.value
                                      )
                                    )
                                  }
                                  className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2 text-sm outline-none focus:border-[#a67c52]"
                                />

                              </div>


                              <div className="flex items-end justify-end md:col-span-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    eliminarDetalle(
                                      detalle.id
                                    )
                                  }
                                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                  title="Eliminar línea"
                                >

                                  <Trash2
                                    size={18}
                                  />

                                </button>

                              </div>


                              <div className="md:col-span-12">

                                <label className="mb-1.5 block text-xs font-medium text-[#8a7562]">
                                  Especificaciones
                                </label>

                                <textarea
                                  value={
                                    detalle.especificaciones
                                  }
                                  onChange={(e) =>
                                    actualizarDetalle(
                                      detalle.id,
                                      "especificaciones",
                                      e.target.value
                                    )
                                  }
                                  rows={2}
                                  placeholder="Medidas, color, material, modificaciones..."
                                  className="w-full resize-none rounded-lg border border-[#e4d8ca] bg-white px-3 py-2 text-sm outline-none focus:border-[#a67c52]"
                                />

                              </div>


                              <div className="md:col-span-12 text-right text-sm font-semibold text-[#5c4030]">

                                Línea: $
                                {Math.max(
                                  detalle.cantidad *
                                    detalle.precio_unitario -
                                    detalle.descuento,
                                  0
                                ).toFixed(2)}

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </section>


                {/* IVA */}

                <section>

                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Impuestos
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Modalidad IVA
                      </label>

                      <select
                        value={
                          tipoIva
                        }
                        onChange={(e) =>
                          setTipoIva(
                            e.target.value as
                              | "incluido"
                              | "separado"
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      >

                        <option value="separado">
                          IVA separado
                        </option>

                        <option value="incluido">
                          IVA incluido
                        </option>

                      </select>

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        IVA %
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
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Descuento general
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          descuentoGeneral
                        }
                        onChange={(e) =>
                          setDescuentoGeneral(
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>

                  </div>

                </section>


                {/* OBSERVACIONES */}

                <section>

                  <label className="mb-1.5 block text-sm font-semibold text-[#5c4035]">
                    Observaciones
                  </label>

                  <textarea
                    value={
                      observaciones
                    }
                    onChange={(e) =>
                      setObservaciones(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Condiciones, tiempos de entrega, notas..."
                    className="w-full resize-none rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                  />

                </section>


                {/* TOTALES */}

                <section className="rounded-xl bg-[#f7f1eb] p-5">

                  <div className="ml-auto max-w-sm space-y-2 text-sm">

                    <div className="flex justify-between text-[#6b5746]">

                      <span>
                        Subtotal
                      </span>

                      <span>
                        $
                        {subtotalCalculado.toFixed(
                          2
                        )}
                      </span>

                    </div>


                    <div className="flex justify-between text-[#6b5746]">

                      <span>
                        Descuento
                      </span>

                      <span>
                        -$
                        {descuentoCalculado.toFixed(
                          2
                        )}
                      </span>

                    </div>


                    {tipoIva ===
                    "separado" ? (

                      <div className="flex justify-between text-[#6b5746]">

                        <span>
                          IVA{" "}
                          {porcentajeIva}%
                        </span>

                        <span>
                          $
                          {ivaCalculado.toFixed(
                            2
                          )}
                        </span>

                      </div>

                    ) : (

                      <div className="flex justify-between text-[#6b5746]">

                        <span>
                          IVA incluido
                        </span>

                        <span>
                          $
                          {ivaCalculado.toFixed(
                            2
                          )}
                        </span>

                      </div>

                    )}


                    <div className="border-t border-[#ddcdbd] pt-3">

                      <div className="flex justify-between text-lg font-bold text-[#3b2a20]">

                        <span>
                          Total
                        </span>

                        <span>
                          $
                          {totalCalculado.toFixed(
                            2
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                </section>


                {error && (

                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                    {error}

                  </div>

                )}

              </div>

            </div>


            {/* BOTONES */}

            <div className="flex flex-col-reverse gap-3 border-t border-[#e4d8ca] px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={
                  guardando
                }
                onClick={() => {
                  limpiarFormulario()

                  setMostrarFormulario(
                    false
                  )
                }}
                className="rounded-lg border border-[#e4d8ca] px-4 py-2.5 text-sm font-semibold text-[#6b5746] hover:bg-[#f8f3ee]"
              >

                Cancelar

              </button>


              <button
                type="button"
                disabled={
                  guardando
                }
                onClick={
                  guardarCotizacion
                }
                className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {guardando ? (

                  <>

                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Guardando...

                  </>

                ) : (

                  <>

                    <FileText
                      size={17}
                    />

                    Guardar cotización

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          SELECTOR DE PRODUCTO
          ====================================================== */}

      {mostrarSelectorProducto && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">


            <div className="flex items-center justify-between border-b border-[#e4d8ca] px-5 py-4">

              <div>

                <h3 className="font-bold text-[#3b2a20]">
                  Agregar mueble
                </h3>

                <p className="text-xs text-[#8a7562]">
                  Selecciona un producto del catálogo.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setMostrarSelectorProducto(
                    false
                  )
                }
                className="rounded-lg p-2 text-[#8a7562] hover:bg-[#f4eadf]"
              >

                <X size={18} />

              </button>

            </div>


            <div className="p-5">

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
                />

                <input
                  value={
                    busquedaProducto
                  }
                  onChange={(e) =>
                    setBusquedaProducto(
                      e.target.value
                    )
                  }
                  placeholder="Buscar por código o nombre..."
                  className="w-full rounded-lg border border-[#e4d8ca] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#a67c52]"
                />

              </div>


              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">

                {productosFiltrados.map(
                  (producto) => (

                    <button
                      key={
                        producto.id
                      }
                      type="button"
                      onClick={() =>
                        agregarProducto(
                          producto
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-[#e4d8ca] p-3 text-left hover:bg-[#fcfaf8]"
                    >

                      <div>

                        <p className="font-semibold text-[#3b2a20]">
                          {producto.nombre}
                        </p>

                        <p className="text-xs text-[#8a7562]">

                          {producto.codigo}

                          {" · "}

                          {producto.tipo_producto ===
                          "a_medida"
                            ? "A medida"
                            : `$${Number(
                                producto.precio
                              ).toFixed(
                                2
                              )}`}

                        </p>

                      </div>


                      <Plus
                        size={18}
                        className="text-[#6b4935]"
                      />

                    </button>

                  )
                )}


                {productosFiltrados.length ===
                  0 && (

                  <p className="py-8 text-center text-sm text-[#8a7562]">
                    No se encontraron muebles.
                  </p>

                )}

              </div>


              <button
                type="button"
                onClick={
                  agregarLineaPersonalizada
                }
                className="mt-4 w-full rounded-lg border border-dashed border-[#bda58d] px-4 py-3 text-sm font-semibold text-[#6b4935] hover:bg-[#f8f3ee]"
              >

                + Agregar línea personalizada

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}


/* ============================================================
   ICONO PARA CUANDO NO HAY PRODUCTOS
   ============================================================ */

function PackageIcon() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1e7dc] text-[#6b4935]">

      <FileText size={25} />

    </div>
  )
}