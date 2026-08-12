"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Edit,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type TipoCliente = "consumidor_final" | "contribuyente" | "empresa"

type Cliente = {
  id: string
  tipo_cliente: TipoCliente
  nombre_completo: string
  razon_social: string | null
  nombre_comercial: string | null
  tipo_documento: string | null
  numero_documento: string | null
  nrc: string | null
  actividad_economica: string | null
  telefono: string | null
  whatsapp: string | null
  correo: string | null
  departamento: string | null
  municipio: string | null
  direccion: string | null
  condicion_pago: "contado" | "credito"
  limite_credito: number
  dias_credito: number
  estado: "activo" | "inactivo"
  observaciones: string | null
  created_at: string
  updated_at: string
}

const departamentos = [
  "Ahuachapan",
  "Cabanas",
  "Chalatenango",
  "Cuscatlan",
  "La Libertad",
  "La Paz",
  "La Union",
  "Morazan",
  "San Miguel",
  "San Salvador",
  "San Vicente",
  "Santa Ana",
  "Sonsonate",
  "Usulutan",
]

export default function ClientesPage() {
  const supabase = createSupabaseBrowserClient()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const [tipoCliente, setTipoCliente] =
    useState<TipoCliente>("consumidor_final")

  const [nombre, setNombre] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [nombreComercial, setNombreComercial] = useState("")

  const [tipoDocumento, setTipoDocumento] = useState("")
  const [numeroDocumento, setNumeroDocumento] = useState("")
  const [nrc, setNrc] = useState("")
  const [actividadEconomica, setActividadEconomica] = useState("")

  const [telefono, setTelefono] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [correo, setCorreo] = useState("")

  const [departamento, setDepartamento] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [direccion, setDireccion] = useState("")

  const [condicionPago, setCondicionPago] =
    useState<"contado" | "credito">("contado")

  const [limiteCredito, setLimiteCredito] = useState("0")
  const [diasCredito, setDiasCredito] = useState("0")
  const [observaciones, setObservaciones] = useState("")

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    setCargando(true)

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setClientes([])
    } else {
      setClientes((data || []) as Cliente[])
    }

    setCargando(false)
  }

  function limpiarFormulario() {
    setTipoCliente("consumidor_final")

    setNombre("")
    setRazonSocial("")
    setNombreComercial("")

    setTipoDocumento("")
    setNumeroDocumento("")
    setNrc("")
    setActividadEconomica("")

    setTelefono("")
    setWhatsapp("")
    setCorreo("")

    setDepartamento("")
    setMunicipio("")
    setDireccion("")

    setCondicionPago("contado")
    setLimiteCredito("0")
    setDiasCredito("0")
    setObservaciones("")

    setError("")
  }

  function abrirModal() {
    limpiarFormulario()
    setModalAbierto(true)
  }

  function cerrarModal() {
    if (guardando) return

    setModalAbierto(false)
    setError("")
  }

  async function guardarCliente() {
    if (!nombre.trim()) {
      setError(
        tipoCliente === "empresa"
          ? "Ingresa la razon social."
          : "Ingresa el nombre del cliente."
      )
      return
    }

    if (
      tipoCliente !== "consumidor_final" &&
      !numeroDocumento.trim()
    ) {
      setError("Ingresa el numero de documento.")
      return
    }

    setGuardando(true)
    setError("")

    const { error } = await supabase
      .from("clientes")
      .insert({
        tipo_cliente: tipoCliente,

        nombre_completo: nombre.trim(),
        razon_social: razonSocial.trim() || null,
        nombre_comercial: nombreComercial.trim() || null,

        tipo_documento: tipoDocumento || null,
        numero_documento:
          numeroDocumento.trim() || null,
        nrc: nrc.trim() || null,
        actividad_economica:
          actividadEconomica.trim() || null,

        telefono: telefono.trim() || null,
        whatsapp: whatsapp.trim() || null,
        correo: correo.trim() || null,

        departamento: departamento || null,
        municipio: municipio.trim() || null,
        direccion: direccion.trim() || null,

        condicion_pago: condicionPago,

        limite_credito:
          condicionPago === "credito"
            ? Number(limiteCredito) || 0
            : 0,

        dias_credito:
          condicionPago === "credito"
            ? Number(diasCredito) || 0
            : 0,

        observaciones:
          observaciones.trim() || null,

        estado: "activo",
      })

    if (error) {
      console.error(error)
      setError("No se pudo guardar el cliente.")
      setGuardando(false)
      return
    }

    setGuardando(false)
    setModalAbierto(false)
    limpiarFormulario()

    await cargarClientes()
  }

  async function eliminarCliente(id: string) {
    const confirmar = window.confirm(
      "Deseas eliminar este cliente?"
    )

    if (!confirmar) return

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(error)

      window.alert(
        "No se pudo eliminar el cliente."
      )

      return
    }

    await cargarClientes()
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase().trim()

    if (!texto) return true

    return (
      cliente.nombre_completo
        ?.toLowerCase()
        .includes(texto) ||
      cliente.razon_social
        ?.toLowerCase()
        .includes(texto) ||
      cliente.nombre_comercial
        ?.toLowerCase()
        .includes(texto) ||
      cliente.numero_documento
        ?.toLowerCase()
        .includes(texto) ||
      cliente.nrc
        ?.toLowerCase()
        .includes(texto) ||
      cliente.telefono
        ?.toLowerCase()
        .includes(texto) ||
      cliente.correo
        ?.toLowerCase()
        .includes(texto)
    )
  })

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#3b2a20] md:text-3xl">
            Clientes
          </h1>

          <p className="mt-1 text-sm text-[#8a7562]">
            Administra la informacion de tus clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4b3326]"
        >
          <UserPlus size={18} />
          Nuevo cliente
        </button>
      </div>

      {/* Busqueda */}
      <Card className="border-[#e4d8ca] shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
            />

            <input
              type="search"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por nombre, documento, telefono o correo..."
              className="w-full rounded-lg border border-[#e4d8ca] bg-white py-2.5 pl-10 pr-3 text-sm text-[#3b2a20] outline-none placeholder:text-[#aa9887] focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla / tarjetas */}
      <Card className="overflow-hidden border-[#e4d8ca] shadow-sm">
        <CardHeader className="border-b border-[#e4d8ca]">
          <CardTitle className="text-base text-[#3b2a20]">
            Clientes registrados
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {cargando ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-[#8a7562]">
                <Loader2
                  size={21}
                  className="animate-spin"
                />
                Cargando clientes...
              </div>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-full bg-[#f4eadf] p-4 text-[#6b4935]">
                <Users size={28} />
              </div>

              <h3 className="text-base font-semibold text-[#3b2a20]">
                {busqueda
                  ? "No encontramos clientes"
                  : "Aun no hay clientes"}
              </h3>

              <p className="mt-1 max-w-md text-sm text-[#8a7562]">
                {busqueda
                  ? "Prueba con otro nombre, documento, telefono o correo."
                  : "Registra tu primer cliente para comenzar."}
              </p>

              {!busqueda && (
                <button
                  type="button"
                  onClick={abrirModal}
                  className="mt-5 flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3326]"
                >
                  <Plus size={17} />
                  Crear cliente
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ========================= */}
              {/* VISTA ESCRITORIO */}
              {/* ========================= */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-[#fcfaf8]">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                        Cliente
                      </th>

                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                        Documento
                      </th>

                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                        Telefono
                      </th>

                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                        Correo
                      </th>

                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f0e8df]">
                    {clientesFiltrados.map((cliente) => (
                      <tr
                        key={cliente.id}
                        className="transition hover:bg-[#fcfaf8]"
                      >
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ead8c4] font-semibold text-[#5c4030]">
                              {cliente.nombre_completo
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="font-medium text-[#3b2a20]">
                                {cliente.nombre_completo}
                              </p>

                              <p className="text-xs text-[#9a8775]">
                                {cliente.tipo_cliente ===
                                "empresa"
                                  ? "Empresa"
                                  : cliente.tipo_cliente ===
                                      "contribuyente"
                                    ? "Contribuyente"
                                    : "Consumidor final"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 text-sm text-[#6b5746]">
                          {cliente.numero_documento ||
                            "Sin documento"}
                        </td>

                        <td className="px-3 py-4 text-sm text-[#6b5746]">
                          {cliente.telefono ||
                            "Sin telefono"}
                        </td>

                        <td className="px-3 py-4 text-sm text-[#6b5746]">
                          {cliente.correo ||
                            "Sin correo"}
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/clientes/${cliente.id}`}
                              className="rounded-lg p-2 text-[#5c4030] hover:bg-[#f4eadf]"
                              title="Ver cliente"
                            >
                              <Eye size={17} />
                            </Link>

                            <Link
                              href={`/clientes/${cliente.id}?editar=1`}
                              className="rounded-lg p-2 text-[#6b4935] hover:bg-[#f4eadf]"
                              title="Editar cliente"
                            >
                              <Edit size={17} />
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                eliminarCliente(
                                  cliente.id
                                )
                              }
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Eliminar cliente"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ========================= */}
              {/* VISTA MOVIL */}
              {/* ========================= */}
              <div className="space-y-3 p-3 md:hidden">
                {clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="w-full rounded-xl border border-[#e4d8ca] bg-white p-4 shadow-sm"
                  >
                    {/* Cabecera */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ead8c4] font-semibold text-[#5c4030]">
                        {cliente.nombre_completo
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold text-[#3b2a20]">
                          {cliente.nombre_completo}
                        </p>

                        <p className="mt-0.5 text-xs text-[#9a8775]">
                          {cliente.tipo_cliente ===
                          "empresa"
                            ? "Empresa"
                            : cliente.tipo_cliente ===
                                "contribuyente"
                              ? "Contribuyente"
                              : "Consumidor final"}
                        </p>
                      </div>
                    </div>

                    {/* Datos */}
                    <div className="mt-4 space-y-3 border-t border-[#f0e8df] pt-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                          Documento
                        </p>

                        <p className="mt-0.5 break-words text-sm text-[#3b2a20]">
                          {cliente.numero_documento ||
                            "Sin documento"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                          Telefono
                        </p>

                        <p className="mt-0.5 break-words text-sm text-[#3b2a20]">
                          {cliente.telefono ||
                            "Sin telefono"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a8775]">
                          Correo
                        </p>

                        <p className="mt-0.5 break-all text-sm text-[#3b2a20]">
                          {cliente.correo ||
                            "Sin correo"}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#f0e8df] pt-4">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="flex min-w-0 items-center justify-center gap-1 rounded-lg bg-[#f4eadf] px-1.5 py-2.5 text-xs font-semibold text-[#5c4030]"
                      >
                        <Eye size={15} />
                        <span>Ver</span>
                      </Link>

                      <Link
                        href={`/clientes/${cliente.id}?editar=1`}
                        className="flex min-w-0 items-center justify-center gap-1 rounded-lg bg-[#f4eadf] px-1.5 py-2.5 text-xs font-semibold text-[#6b4935]"
                      >
                        <Edit size={15} />
                        <span>Editar</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarCliente(
                            cliente.id
                          )
                        }
                        className="flex min-w-0 items-center justify-center gap-1 rounded-lg bg-red-50 px-1.5 py-2.5 text-xs font-semibold text-red-600"
                      >
                        <Trash2 size={15} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal nuevo cliente */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#e4d8ca] px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#3b2a20]">
                  Nuevo cliente
                </h2>

                <p className="mt-1 text-sm text-[#8a7562]">
                  Registra la informacion del cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-lg px-3 py-2 text-sm text-[#6b5746] hover:bg-[#f8f3ee]"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              {/* Tipo */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                  Tipo de cliente
                </h3>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "consumidor_final",
                      label: "Consumidor final",
                    },
                    {
                      value: "contribuyente",
                      label: "Contribuyente",
                    },
                    {
                      value: "empresa",
                      label: "Empresa",
                    },
                  ].map((tipo) => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() =>
                        setTipoCliente(
                          tipo.value as TipoCliente
                        )
                      }
                      className={`rounded-xl border p-3 text-left text-sm font-medium transition ${
                        tipoCliente === tipo.value
                          ? "border-[#a67c52] bg-[#f4eadf] text-[#5c4030]"
                          : "border-[#e4d8ca] text-[#6b5746] hover:bg-[#fcfaf8]"
                      }`}
                    >
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Identificacion */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                  Identificacion
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      {tipoCliente === "empresa"
                        ? "Razon social *"
                        : "Nombre completo *"}
                    </label>

                    <input
                      value={nombre}
                      onChange={(e) =>
                        setNombre(e.target.value)
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Nombre comercial
                    </label>

                    <input
                      value={nombreComercial}
                      onChange={(e) =>
                        setNombreComercial(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Tipo de documento
                    </label>

                    <select
                      value={tipoDocumento}
                      onChange={(e) =>
                        setTipoDocumento(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                    >
                      <option value="">
                        Seleccionar
                      </option>

                      <option value="DUI">
                        DUI
                      </option>

                      <option value="NIT">
                        NIT
                      </option>

                      <option value="PASAPORTE">
                        Pasaporte
                      </option>

                      <option value="OTRO">
                        Otro
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Numero de documento
                    </label>

                    <input
                      value={numeroDocumento}
                      onChange={(e) =>
                        setNumeroDocumento(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                    />
                  </div>

                  {(tipoCliente ===
                    "contribuyente" ||
                    tipoCliente === "empresa") && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                          NRC
                        </label>

                        <input
                          value={nrc}
                          onChange={(e) =>
                            setNrc(e.target.value)
                          }
                          className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                          Actividad economica
                        </label>

                        <input
                          value={actividadEconomica}
                          onChange={(e) =>
                            setActividadEconomica(
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Contacto */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                  Contacto
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Telefono
                    </label>

                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
                      />

                      <input
                        value={telefono}
                        onChange={(e) =>
                          setTelefono(
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#a67c52]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      WhatsApp
                    </label>

                    <input
                      value={whatsapp}
                      onChange={(e) =>
                        setWhatsapp(e.target.value)
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Correo
                    </label>

                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
                      />

                      <input
                        type="email"
                        value={correo}
                        onChange={(e) =>
                          setCorreo(
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#a67c52]"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Direccion */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                  Direccion
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Departamento
                    </label>

                    <select
                      value={departamento}
                      onChange={(e) =>
                        setDepartamento(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                    >
                      <option value="">
                        Seleccionar departamento
                      </option>

                      {departamentos.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Municipio
                    </label>

                    <input
                      value={municipio}
                      onChange={(e) =>
                        setMunicipio(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Direccion completa
                    </label>

                    <div className="relative">
                      <MapPin
                        size={17}
                        className="absolute left-3 top-3 text-[#9a8775]"
                      />

                      <textarea
                        value={direccion}
                        onChange={(e) =>
                          setDireccion(
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full resize-none rounded-lg border border-[#e4d8ca] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#a67c52]"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Credito */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                  Condicion de pago
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                      Condicion
                    </label>

                    <select
                      value={condicionPago}
                      onChange={(e) =>
                        setCondicionPago(
                          e.target.value as
                            | "contado"
                            | "credito"
                        )
                      }
                      className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                    >
                      <option value="contado">
                        Contado
                      </option>

                      <option value="credito">
                        Credito
                      </option>
                    </select>
                  </div>

                  {condicionPago ===
                    "credito" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                          Limite de credito
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            limiteCredito
                          }
                          onChange={(e) =>
                            setLimiteCredito(
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                          Dias de credito
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={diasCredito}
                          onChange={(e) =>
                            setDiasCredito(
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Observaciones */}
              <section>
                <label className="mb-1.5 block text-sm font-semibold text-[#5c4035]">
                  Observaciones
                </label>

                <textarea
                  value={observaciones}
                  onChange={(e) =>
                    setObservaciones(
                      e.target.value
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                />
              </section>
            </div>

            {/* Acciones modal */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#e4d8ca] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={guardando}
                onClick={cerrarModal}
                className="rounded-lg border border-[#e4d8ca] px-4 py-2.5 text-sm font-semibold text-[#6b5746] hover:bg-[#f8f3ee]"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={guardando}
                onClick={guardarCliente}
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
                    Guardar cliente
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