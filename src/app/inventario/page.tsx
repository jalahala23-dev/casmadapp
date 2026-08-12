"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"

import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type Producto = {
  id: string
  codigo: string
  nombre: string
  categoria: string | null
  tipo_producto: "precio_fijo" | "a_medida"
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
}

export default function InventarioPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [productos, setProductos] =
    useState<Producto[]>([])

  const [cargando, setCargando] =
    useState(true)

  const [busqueda, setBusqueda] =
    useState("")

  const [eliminando, setEliminando] =
    useState<string | null>(null)

  const [error, setError] =
    useState("")

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    setCargando(true)
    setError("")

    const {
      data,
      error,
    } = await supabase
      .from("productos")
      .select(`
        id,
        codigo,
        nombre,
        categoria,
        tipo_producto,
        descripcion,
        precio,
        costo,
        unidad,
        material,
        color,
        ancho,
        alto,
        profundidad,
        stock,
        estado,
        imagen_url,
        observaciones
      `)
      .order("nombre", {
        ascending: true,
      })

    if (error) {
      console.error(
        "ERROR AL CARGAR INVENTARIO:",
        error
      )

      setError(
        error.message ||
          "No se pudo cargar el inventario."
      )

      setProductos([])
      setCargando(false)

      return
    }

    setProductos(
      (data ?? []) as Producto[]
    )

    setCargando(false)
  }

  async function eliminarProducto(
    producto: Producto
  ) {
    if (eliminando) {
      return
    }

    const confirmar =
      window.confirm(
        `¿Eliminar "${producto.nombre}"?\n\nEsta acción no se puede deshacer.`
      )

    if (!confirmar) {
      return
    }

    setEliminando(producto.id)
    setError("")

    try {
      const {
        error,
      } = await supabase
        .from("productos")
        .delete()
        .eq(
          "id",
          producto.id
        )

      if (error) {
        throw new Error(
          error.message
        )
      }

      setProductos(
        (actuales) =>
          actuales.filter(
            (item) =>
              item.id !==
              producto.id
          )
      )
    } catch (err: unknown) {
      console.error(
        "ERROR AL ELIMINAR PRODUCTO:",
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el producto."
      )
    } finally {
      setEliminando(null)
    }
  }

  function formatoDinero(
    valor: number
  ) {
    return `$${Number(
      valor || 0
    ).toFixed(2)}`
  }

  const productosFiltrados =
    productos.filter(
      (producto) => {
        const texto =
          busqueda
            .toLowerCase()
            .trim()

        if (!texto) {
          return true
        }

        return (
          producto.nombre
            ?.toLowerCase()
            .includes(texto) ||
          producto.codigo
            ?.toLowerCase()
            .includes(texto) ||
          producto.categoria
            ?.toLowerCase()
            .includes(texto) ||
          producto.material
            ?.toLowerCase()
            .includes(texto) ||
          producto.color
            ?.toLowerCase()
            .includes(texto) ||
          producto.descripcion
            ?.toLowerCase()
            .includes(texto)
        )
      }
    )

  const totalProductos =
    productos.length

  const productosConStock =
    productos.filter(
      (producto) =>
        producto.tipo_producto !==
          "a_medida" &&
        Number(
          producto.stock || 0
        ) > 0
    ).length

  const productosAgotados =
    productos.filter(
      (producto) =>
        producto.tipo_producto !==
          "a_medida" &&
        Number(
          producto.stock || 0
        ) <= 0
    ).length

  const productosStockBajo =
    productos.filter(
      (producto) =>
        producto.tipo_producto !==
          "a_medida" &&
        Number(
          producto.stock || 0
        ) > 0 &&
        Number(
          producto.stock || 0
        ) <= 5
    )

  return (
    <div className="space-y-6">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">

              <Package size={24} />

            </div>

            <div>

              <p className="text-sm text-[#8a7562]">
                Administración
              </p>

              <h1 className="text-3xl font-bold text-[#3b2a20]">
                Inventario
              </h1>

            </div>

          </div>

          <p className="mt-2 text-sm text-[#8a7562]">
            Control de muebles y productos de Muebles Castillo.
          </p>

        </div>


        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={
              cargarProductos
            }
            disabled={cargando}
            className="flex items-center gap-2 rounded-lg border border-[#e4d8ca] bg-white px-4 py-2.5 text-sm font-semibold text-[#5c4030] transition hover:bg-[#f8f3ee] disabled:opacity-60"
          >

            <RefreshCw
              size={17}
              className={
                cargando
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar

          </button>


          <button
            type="button"
            onClick={() =>
              router.push(
                "/muebles"
              )
            }
            className="flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4b3326]"
          >

            <Plus size={18} />

            Nuevo producto

          </button>

        </div>

      </div>


      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-3">

        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="p-5">

            <p className="text-sm text-[#8a7562]">
              Productos registrados
            </p>

            <p className="mt-2 text-2xl font-bold text-[#3b2a20]">
              {totalProductos}
            </p>

          </CardContent>

        </Card>


        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="p-5">

            <p className="text-sm text-[#8a7562]">
              Con existencia
            </p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {productosConStock}
            </p>

          </CardContent>

        </Card>


        <Card className="border-[#e4d8ca] bg-white">

          <CardContent className="p-5">

            <p className="text-sm text-[#8a7562]">
              Agotados
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {productosAgotados}
            </p>

          </CardContent>

        </Card>

      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          {error}

        </div>

      )}


      {/* =====================================================
          PRODUCTOS
          ===================================================== */}

      <Card className="border-[#e4d8ca] bg-white">

        <CardHeader>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <CardTitle className="text-[#3b2a20]">
                Inventario de productos
              </CardTitle>

              <p className="mt-1 text-sm text-[#8a7562]">
                Consulta y administra las existencias.
              </p>

            </div>


            {/* BUSCADOR */}

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
                placeholder="Buscar producto..."
                className="w-full rounded-lg border border-[#e4d8ca] bg-white py-2.5 pl-10 pr-4 text-sm text-[#3b2a20] outline-none transition placeholder:text-[#a18e7b] focus:border-[#a67c52] focus:ring-2 focus:ring-[#ead8c4]"
              />

            </div>

          </div>

        </CardHeader>


        <CardContent>

          {cargando ? (

            <div className="flex min-h-60 items-center justify-center">

              <div className="flex items-center gap-3 text-sm text-[#8a7562]">

                <RefreshCw
                  size={22}
                  className="animate-spin"
                />

                Cargando inventario...

              </div>

            </div>

          ) : productosFiltrados.length === 0 ? (

            <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed border-[#d8c8b9] bg-[#fcfaf8] p-8 text-center">

              <Package
                size={42}
                className="mb-3 text-[#b79a7d]"
              />

              <p className="font-semibold text-[#5c4635]">

                {busqueda
                  ? "No encontramos productos"
                  : "No hay productos registrados"}

              </p>

              <p className="mt-1 text-sm text-[#9a8775]">

                {busqueda
                  ? "Prueba con otro nombre, código o categoría."
                  : "Agrega tu primer producto para comenzar a controlar el inventario."}

              </p>


              {!busqueda && (

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/muebles"
                    )
                  }
                  className="mt-5 flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3326]"
                >

                  <Plus size={17} />

                  Nuevo producto

                </button>

              )}

            </div>

          ) : (

            <>
              {/* Vista escritorio */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e4d8ca] bg-[#faf7f4]">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b5746]">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6b5746]">Precio</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#6b5746]">Stock</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#6b5746]">Estado</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6b5746]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map((producto) => {
                      const stock = Number(producto.stock || 0)
                      const esMedida = producto.tipo_producto === "a_medida"
                      const agotado = !esMedida && stock <= 0
                      const stockBajo = !esMedida && stock > 0 && stock <= 5

                      return (
                        <tr key={producto.id} className="border-b border-[#f0e8df] transition hover:bg-[#fcfaf8]">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {producto.imagen_url ? (
                                <img src={producto.imagen_url} alt={producto.nombre} className="h-12 w-12 rounded-lg border border-[#e4d8ca] object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f1e7dc] text-[#8a7562]">
                                  <Package size={21} />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-[#3b2a20]">{producto.nombre}</p>
                                <p className="mt-0.5 text-xs text-[#8a7562]">
                                  {producto.codigo}{producto.categoria ? ` · ${producto.categoria}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {esMedida ? (
                              <span className="inline-flex rounded-full bg-[#f4eadf] px-3 py-1 text-xs font-semibold text-[#6b4935]">A medida</span>
                            ) : (
                              <span className="inline-flex rounded-full bg-[#eee9e4] px-3 py-1 text-xs font-semibold text-[#6b5746]">Precio fijo</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-semibold text-[#3b2a20]">
                            {esMedida ? "Por cotizar" : formatoDinero(producto.precio)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {esMedida ? (
                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">N/A</span>
                            ) : (
                              <span className={`inline-flex min-w-16 justify-center rounded-full px-3 py-1 text-sm font-semibold ${agotado ? "bg-red-50 text-red-700" : stockBajo ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}>
                                {stock}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${producto.estado === "activo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {producto.estado === "activo" ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => router.push(`/muebles?editar=${producto.id}`)} className="rounded-lg border border-[#e4d8ca] bg-white p-2 text-[#6b4935] transition hover:bg-[#f5eee7]" title="Editar producto">
                                <Pencil size={17} />
                              </button>
                              <button type="button" onClick={() => eliminarProducto(producto)} disabled={eliminando === producto.id} className="rounded-lg border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50" title="Eliminar producto">
                                {eliminando === producto.id ? <RefreshCw size={17} className="animate-spin" /> : <Trash2 size={17} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista movil */}
              <div className="space-y-3 p-3 md:hidden">
                {productosFiltrados.map((producto) => {
                  const stock = Number(producto.stock || 0)
                  const esMedida = producto.tipo_producto === "a_medida"
                  const agotado = !esMedida && stock <= 0
                  const stockBajo = !esMedida && stock > 0 && stock <= 5

                  return (
                    <div key={producto.id} className="w-full rounded-xl border border-[#e4d8ca] bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        {producto.imagen_url ? (
                          <img src={producto.imagen_url} alt={producto.nombre} className="h-14 w-14 shrink-0 rounded-lg border border-[#e4d8ca] object-cover" />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#f1e7dc] text-[#8a7562]">
                            <Package size={24} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold text-[#3b2a20]">{producto.nombre}</p>
                          <p className="mt-0.5 break-words text-xs text-[#8a7562]">
                            {producto.codigo}{producto.categoria ? ` · ${producto.categoria}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f0e8df] pt-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">Tipo</p>
                          <p className="mt-1 text-sm text-[#3b2a20]">{esMedida ? "A medida" : "Precio fijo"}</p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">Precio</p>
                          <p className="mt-1 text-sm font-semibold text-[#3b2a20]">{esMedida ? "Por cotizar" : formatoDinero(producto.precio)}</p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">Stock</p>
                          <div className="mt-1">
                            {esMedida ? (
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">N/A</span>
                            ) : (
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${agotado ? "bg-red-50 text-red-700" : stockBajo ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}>
                                {stock}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">Estado</p>
                          <div className="mt-1">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${producto.estado === "activo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {producto.estado === "activo" ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#f0e8df] pt-4">
                        <button type="button" onClick={() => router.push(`/muebles?editar=${producto.id}`)} className="flex items-center justify-center gap-2 rounded-lg bg-[#f4eadf] px-3 py-2.5 text-sm font-semibold text-[#6b4935] hover:bg-[#eadccd]">
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button type="button" onClick={() => eliminarProducto(producto)} disabled={eliminando === producto.id} className="flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                          {eliminando === producto.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          {eliminando === producto.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>

          )}

        </CardContent>

      </Card>


      {/* =====================================================
          AVISO DE STOCK BAJO
          ===================================================== */}

      {productosStockBajo.length >
        0 && (

        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">

          <AlertTriangle
            size={21}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-semibold">
              Productos con stock bajo
            </p>

            <p className="mt-0.5">
              Hay{" "}
              {productosStockBajo.length}{" "}
              producto
              {productosStockBajo.length ===
              1
                ? ""
                : "s"} con 5 unidades o menos disponibles.
            </p>

          </div>

        </div>

      )}

    </div>
  )
}