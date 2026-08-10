"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  Ruler,
  Package,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type TipoProducto = "precio_fijo" | "a_medida"

type Producto = {
  id: string
  codigo: string
  nombre: string
  categoria: string | null
  tipo_producto: TipoProducto
  descripcion: string | null
  precio: number
  costo: number
  unidad: string
  material: string | null
  color: string | null
  ancho: number | null
  alto: number | null
  profundidad: number | null
  stock: number
  estado: "activo" | "inactivo"
  imagen_url: string | null
  observaciones: string | null
  created_at: string
  updated_at: string
}

export default function MueblesPage() {
  const supabase = createSupabaseBrowserClient()

  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

  const [editandoId, setEditandoId] =
    useState<string | null>(null)

  const [cargando, setCargando] =
    useState(true)

  const [guardando, setGuardando] =
    useState(false)

  const [error, setError] =
    useState("")

  const [codigo, setCodigo] =
    useState("")

  const [nombre, setNombre] =
    useState("")

  const [categoria, setCategoria] =
    useState("")

  const [tipoProducto, setTipoProducto] =
    useState<TipoProducto>("precio_fijo")

  const [descripcion, setDescripcion] =
    useState("")

  const [precio, setPrecio] =
    useState("0")

  const [costo, setCosto] =
    useState("0")

  const [unidad, setUnidad] =
    useState("unidad")

  const [material, setMaterial] =
    useState("")

  const [color, setColor] =
    useState("")

  const [ancho, setAncho] =
    useState("")

  const [alto, setAlto] =
    useState("")

  const [profundidad, setProfundidad] =
    useState("")

  const [stock, setStock] =
    useState("0")

  const [observaciones, setObservaciones] =
    useState("")


  // =========================================================
  // CARGAR PRODUCTOS
  // =========================================================

  useEffect(() => {
    cargarProductos()
  }, [])


  // =========================================================
  // ABRIR AUTOMÁTICAMENTE UN PRODUCTO PARA EDITAR
  // CUANDO VENIMOS DESDE INVENTARIO
  // =========================================================

  useEffect(() => {
    if (
      productos.length === 0 ||
      mostrarFormulario
    ) {
      return
    }

    const parametros =
      new URLSearchParams(
        window.location.search
      )

    const editarId =
      parametros.get("editar")

    if (!editarId) {
      return
    }

    const producto =
      productos.find(
        (item) =>
          item.id === editarId
      )

    if (!producto) {
      return
    }

    editarProducto(producto)

    // Limpiamos ?editar=ID de la dirección
    // para que al actualizar no vuelva a abrir
    // automáticamente el formulario.

    window.history.replaceState(
      {},
      "",
      "/muebles"
    )
  }, [
    productos,
    mostrarFormulario,
  ])


  async function cargarProductos() {
    setCargando(true)
    setError("")

    const {
      data,
      error,
    } = await supabase
      .from("productos")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        }
      )

    if (error) {
      console.error(
        "ERROR AL CARGAR PRODUCTOS:",
        error
      )

      setError(
        "No se pudieron cargar los muebles."
      )

      setCargando(false)

      return
    }

    setProductos(
      (data ?? []) as Producto[]
    )

    setCargando(false)
  }


  // =========================================================
  // LIMPIAR FORMULARIO
  // =========================================================

  function limpiarFormulario() {
    setCodigo("")
    setNombre("")
    setCategoria("")
    setTipoProducto(
      "precio_fijo"
    )
    setDescripcion("")
    setPrecio("0")
    setCosto("0")
    setUnidad("unidad")
    setMaterial("")
    setColor("")
    setAncho("")
    setAlto("")
    setProfundidad("")
    setStock("0")
    setObservaciones("")
    setError("")
    setEditandoId(null)
  }


  // =========================================================
  // EDITAR PRODUCTO
  // =========================================================

  function editarProducto(
    producto: Producto
  ) {
    setEditandoId(
      producto.id
    )

    setCodigo(
      producto.codigo
    )

    setNombre(
      producto.nombre
    )

    setCategoria(
      producto.categoria ?? ""
    )

    setTipoProducto(
      producto.tipo_producto
    )

    setDescripcion(
      producto.descripcion ?? ""
    )

    setPrecio(
      String(
        producto.precio ?? 0
      )
    )

    setCosto(
      String(
        producto.costo ?? 0
      )
    )

    setUnidad(
      producto.unidad ??
        "unidad"
    )

    setMaterial(
      producto.material ?? ""
    )

    setColor(
      producto.color ?? ""
    )

    setAncho(
      producto.ancho !== null
        ? String(producto.ancho)
        : ""
    )

    setAlto(
      producto.alto !== null
        ? String(producto.alto)
        : ""
    )

    setProfundidad(
      producto.profundidad !== null
        ? String(
            producto.profundidad
          )
        : ""
    )

    setStock(
      String(
        producto.stock ?? 0
      )
    )

    setObservaciones(
      producto.observaciones ??
        ""
    )

    setError("")
    setMostrarFormulario(true)
  }


  // =========================================================
  // GUARDAR PRODUCTO
  // =========================================================

  async function guardarProducto() {
    if (!codigo.trim()) {
      setError(
        "Ingresa el código del mueble."
      )

      return
    }

    if (!nombre.trim()) {
      setError(
        "Ingresa el nombre del mueble."
      )

      return
    }

    setGuardando(true)
    setError("")

    const datos = {
      codigo:
        codigo.trim(),

      nombre:
        nombre.trim(),

      categoria:
        categoria.trim() ||
        null,

      tipo_producto:
        tipoProducto,

      descripcion:
        descripcion.trim() ||
        null,

      precio:
        Number(precio) || 0,

      costo:
        Number(costo) || 0,

      unidad:
        unidad.trim() ||
        "unidad",

      material:
        material.trim() ||
        null,

      color:
        color.trim() ||
        null,

      ancho:
        ancho
          ? Number(ancho)
          : null,

      alto:
        alto
          ? Number(alto)
          : null,

      profundidad:
        profundidad
          ? Number(
              profundidad
            )
          : null,

      stock:
        Number(stock) || 0,

      observaciones:
        observaciones.trim() ||
        null,

      estado:
        "activo",
    }


    // =======================================================
    // ACTUALIZAR
    // =======================================================

    if (editandoId) {
      const {
        data,
        error,
      } = await supabase
        .from("productos")
        .update(datos)
        .eq(
          "id",
          editandoId
        )
        .select()
        .single()

      if (error) {
        console.error(
          "ERROR AL ACTUALIZAR:",
          error
        )

        setError(
          "No se pudo actualizar el mueble. Verifica el código y los datos."
        )

        setGuardando(false)

        return
      }

      if (data) {
        setProductos(
          (actuales) =>
            actuales.map(
              (producto) =>
                producto.id ===
                editandoId
                  ? (data as Producto)
                  : producto
            )
        )
      }

    } else {

      // =====================================================
      // INSERTAR
      // =====================================================

      const {
        data,
        error,
      } = await supabase
        .from("productos")
        .insert(datos)
        .select()
        .single()

      if (error) {
        console.error(
          "ERROR AL INSERTAR:",
          error
        )

        setError(
          "No se pudo guardar el mueble. Verifica el código y los datos."
        )

        setGuardando(false)

        return
      }

      if (data) {
        setProductos(
          (actuales) => [
            data as Producto,
            ...actuales,
          ]
        )
      }
    }


    limpiarFormulario()

    setMostrarFormulario(false)

    setGuardando(false)
  }


  // =========================================================
  // ELIMINAR PRODUCTO
  // =========================================================

  async function eliminarProducto(
    id: string
  ) {
    const confirmar =
      window.confirm(
        "¿Seguro que deseas eliminar este mueble?\n\nEsta acción no se puede deshacer."
      )

    if (!confirmar) {
      return
    }

    const {
      error,
    } = await supabase
      .from("productos")
      .delete()
      .eq(
        "id",
        id
      )

    if (error) {
      console.error(
        "ERROR AL ELIMINAR:",
        error
      )

      setError(
        "No se pudo eliminar el mueble."
      )

      return
    }

    setProductos(
      (actuales) =>
        actuales.filter(
          (producto) =>
            producto.id !== id
        )
    )
  }


  // =========================================================
  // BUSCADOR
  // =========================================================

  const productosFiltrados =
    productos.filter(
      (producto) => {
        const texto = `
          ${producto.codigo}
          ${producto.nombre}
          ${producto.categoria ?? ""}
          ${producto.material ?? ""}
          ${producto.color ?? ""}
        `.toLowerCase()

        return texto.includes(
          busqueda.toLowerCase()
        )
      }
    )


  const productosFijos =
    productos.filter(
      (producto) =>
        producto.tipo_producto ===
        "precio_fijo"
    ).length


  const productosMedida =
    productos.filter(
      (producto) =>
        producto.tipo_producto ===
        "a_medida"
    ).length


  return (
    <div className="space-y-6">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-2xl font-bold tracking-tight text-[#3b2a20] md:text-3xl">
            Muebles
          </h1>

          <p className="mt-1 text-sm text-[#8a7562]">
            Administra el catálogo de muebles de CASMAD
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

          Nuevo mueble

        </button>

      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error &&
        !mostrarFormulario && (

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            {error}

          </div>

        )}


      {/* =====================================================
          RESUMEN
          ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">

        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="flex items-center gap-4 p-5">

            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

              <Package size={22} />

            </div>

            <div>

              <p className="text-sm text-[#8a7562]">
                Total de muebles
              </p>

              <p className="text-2xl font-bold text-[#3b2a20]">
                {productos.length}
              </p>

            </div>

          </CardContent>

        </Card>


        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="flex items-center gap-4 p-5">

            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

              <Box size={22} />

            </div>

            <div>

              <p className="text-sm text-[#8a7562]">
                Precio fijo
              </p>

              <p className="text-2xl font-bold text-[#3b2a20]">
                {productosFijos}
              </p>

            </div>

          </CardContent>

        </Card>


        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="flex items-center gap-4 p-5">

            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

              <Ruler size={22} />

            </div>

            <div>

              <p className="text-sm text-[#8a7562]">
                A medida
              </p>

              <p className="text-2xl font-bold text-[#3b2a20]">
                {productosMedida}
              </p>

            </div>

          </CardContent>

        </Card>

      </div>


      {/* =====================================================
          LISTA
          ===================================================== */}

      <Card className="border-[#e4d8ca] bg-white">

        <CardHeader>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <CardTitle className="text-[#3b2a20]">
                Catálogo
              </CardTitle>

              <p className="mt-1 text-sm text-[#8a7562]">
                Productos registrados en CASMAD
              </p>

            </div>


            <div className="relative w-full md:w-80">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
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
                placeholder="Buscar mueble..."
                className="w-full rounded-lg border border-[#e4d8ca] bg-[#fcfaf8] py-2.5 pl-10 pr-4 text-sm text-[#3b2a20] outline-none transition focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
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

                Cargando muebles...

              </div>

            </div>

          ) : productosFiltrados.length === 0 ? (

            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#dccbbb] bg-[#fcfaf8] p-6 text-center">

              <Package
                size={40}
                className="mb-3 text-[#b79a7d]"
              />

              <p className="font-semibold text-[#5c4635]">

                {busqueda
                  ? "No encontramos muebles"
                  : "Todavía no hay muebles"}

              </p>

              <p className="mt-1 max-w-md text-sm text-[#9a8775]">

                {busqueda
                  ? "Prueba con otro código, nombre, categoría o material."
                  : "Agrega el primer mueble al catálogo de CASMAD."}

              </p>

              {!busqueda && (

                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario()

                    setMostrarFormulario(
                      true
                    )
                  }}
                  className="mt-5 flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3326]"
                >

                  <Plus size={17} />

                  Agregar primer mueble

                </button>

              )}

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead>

                  <tr className="border-b border-[#e4d8ca] text-left">

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Mueble
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Tipo
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Precio
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Stock
                    </th>

                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Acciones
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {productosFiltrados.map(
                    (producto) => (

                      <tr
                        key={
                          producto.id
                        }
                        className="border-b border-[#f0e8df] last:border-0"
                      >

                        <td className="px-3 py-4">

                          <div>

                            <p className="font-semibold text-[#3b2a20]">
                              {
                                producto.nombre
                              }
                            </p>

                            <p className="text-xs text-[#9a8775]">

                              {
                                producto.codigo
                              }

                              {producto.categoria
                                ? ` · ${producto.categoria}`
                                : ""}

                            </p>

                          </div>

                        </td>


                        <td className="px-3 py-4">

                          {producto.tipo_producto ===
                          "a_medida" ? (

                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f4eadf] px-2.5 py-1 text-xs font-medium text-[#6b4935]">

                              <Ruler size={13} />

                              A medida

                            </span>

                          ) : (

                            <span className="rounded-full bg-[#eee9e4] px-2.5 py-1 text-xs font-medium text-[#6b5746]">

                              Precio fijo

                            </span>

                          )}

                        </td>


                        <td className="px-3 py-4 text-sm font-semibold text-[#5c4030]">

                          {producto.tipo_producto ===
                          "a_medida"
                            ? "Por cotizar"
                            : `$${Number(
                                producto.precio
                              ).toFixed(2)}`}

                        </td>


                        <td className="px-3 py-4 text-sm text-[#6b5746]">

                          {producto.tipo_producto ===
                          "a_medida"
                            ? "N/A"
                            : `${producto.stock} ${producto.unidad}`}

                        </td>


                        <td className="px-3 py-4">

                          <div className="flex justify-end gap-1">

                            <button
                              type="button"
                              onClick={() =>
                                editarProducto(
                                  producto
                                )
                              }
                              className="rounded-lg p-2 text-[#6b4935] hover:bg-[#f4eadf]"
                              title="Editar"
                            >

                              <Edit size={17} />

                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                eliminarProducto(
                                  producto.id
                                )
                              }
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Eliminar"
                            >

                              <Trash2 size={17} />

                            </button>

                          </div>

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


      {/* =====================================================
          MODAL
          ===================================================== */}

      {mostrarFormulario && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">

          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">


            {/* CABECERA */}

            <div className="border-b border-[#e4d8ca] px-6 py-5">

              <h2 className="text-xl font-bold text-[#3b2a20]">

                {editandoId
                  ? "Editar mueble"
                  : "Nuevo mueble"}

              </h2>

              <p className="mt-1 text-sm text-[#8a7562]">
                Registra la información del mueble.
              </p>

            </div>


            {/* CONTENIDO */}

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">

              <div className="space-y-6">


                {/* TIPO */}

                <section>

                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Tipo de producto
                  </h3>


                  <div className="grid gap-3 sm:grid-cols-2">

                    <button
                      type="button"
                      onClick={() =>
                        setTipoProducto(
                          "precio_fijo"
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        tipoProducto ===
                        "precio_fijo"
                          ? "border-[#a67c52] bg-[#f4eadf]"
                          : "border-[#e4d8ca]"
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <Box size={20} />

                        <div>

                          <p className="font-semibold text-[#3b2a20]">
                            Precio fijo
                          </p>

                          <p className="text-xs text-[#8a7562]">
                            Mueble con precio establecido
                          </p>

                        </div>

                      </div>

                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        setTipoProducto(
                          "a_medida"
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        tipoProducto ===
                        "a_medida"
                          ? "border-[#a67c52] bg-[#f4eadf]"
                          : "border-[#e4d8ca]"
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <Ruler size={20} />

                        <div>

                          <p className="font-semibold text-[#3b2a20]">
                            A medida
                          </p>

                          <p className="text-xs text-[#8a7562]">
                            Se cotiza según especificaciones
                          </p>

                        </div>

                      </div>

                    </button>

                  </div>

                </section>


                {/* INFORMACIÓN GENERAL */}

                <section>

                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Información general
                  </h3>


                  <div className="grid gap-4 md:grid-cols-2">

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Código *
                      </label>

                      <input
                        value={codigo}
                        onChange={(e) =>
                          setCodigo(
                            e.target.value
                          )
                        }
                        placeholder="Ej. SAL-001"
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Nombre *
                      </label>

                      <input
                        value={nombre}
                        onChange={(e) =>
                          setNombre(
                            e.target.value
                          )
                        }
                        placeholder="Ej. Sala Roma"
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Categoría
                      </label>

                      <input
                        value={categoria}
                        onChange={(e) =>
                          setCategoria(
                            e.target.value
                          )
                        }
                        placeholder="Sala, comedor, dormitorio..."
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Unidad
                      </label>

                      <select
                        value={unidad}
                        onChange={(e) =>
                          setUnidad(
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      >

                        <option value="unidad">
                          Unidad
                        </option>

                        <option value="juego">
                          Juego
                        </option>

                        <option value="par">
                          Par
                        </option>

                        <option value="metro">
                          Metro
                        </option>

                        <option value="pie">
                          Pie
                        </option>

                      </select>

                    </div>

                  </div>

                </section>


                {/* INFORMACIÓN COMERCIAL */}

                <section>

                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Información comercial
                  </h3>


                  <div className="grid gap-4 md:grid-cols-3">

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Precio de venta
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={precio}
                        onChange={(e) =>
                          setPrecio(
                            e.target.value
                          )
                        }
                        disabled={
                          tipoProducto ===
                          "a_medida"
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none disabled:bg-[#f5f1ed] focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Costo
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={costo}
                        onChange={(e) =>
                          setCosto(
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Stock
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={stock}
                        onChange={(e) =>
                          setStock(
                            e.target.value
                          )
                        }
                        disabled={
                          tipoProducto ===
                          "a_medida"
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none disabled:bg-[#f5f1ed] focus:border-[#a67c52]"
                      />

                    </div>

                  </div>

                </section>


                {/* CARACTERÍSTICAS */}

                <section>

                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Características
                  </h3>


                  <div className="grid gap-4 md:grid-cols-2">

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Material
                      </label>

                      <input
                        value={material}
                        onChange={(e) =>
                          setMaterial(
                            e.target.value
                          )
                        }
                        placeholder="Melamina, madera, MDF..."
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Color
                      </label>

                      <input
                        value={color}
                        onChange={(e) =>
                          setColor(
                            e.target.value
                          )
                        }
                        placeholder="Roble, blanco, nogal..."
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>

                  </div>

                </section>


                {/* MEDIDAS */}

                <section>

                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5c4035]">

                    <Ruler size={17} />

                    Medidas

                  </h3>


                  <div className="grid gap-4 md:grid-cols-3">

                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Ancho
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ancho}
                        onChange={(e) =>
                          setAncho(
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Alto
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={alto}
                        onChange={(e) =>
                          setAlto(
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>


                    <div>

                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Profundidad
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          profundidad
                        }
                        onChange={(e) =>
                          setProfundidad(
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />

                    </div>

                  </div>


                  <p className="mt-2 text-xs text-[#9a8775]">
                    Puedes registrar las medidas en metros.
                  </p>

                </section>


                {/* DESCRIPCIÓN */}

                <section>

                  <label className="mb-1.5 block text-sm font-semibold text-[#5c4035]">
                    Descripción
                  </label>

                  <textarea
                    value={descripcion}
                    onChange={(e) =>
                      setDescripcion(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Descripción del mueble..."
                    className="w-full resize-none rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                  />

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
                    placeholder="Notas adicionales..."
                    className="w-full resize-none rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                  />

                </section>


                {/* ERROR DEL FORMULARIO */}

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
                  guardarProducto
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

                    <Plus size={17} />

                    {editandoId
                      ? "Guardar cambios"
                      : "Guardar mueble"}

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}