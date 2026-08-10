"use client"

import { useEffect, useState } from "react"
import {
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
  "Ahuachapán",
  "Cabañas",
  "Chalatenango",
  "Cuscatlán",
  "La Libertad",
  "La Paz",
  "La Unión",
  "Morazán",
  "San Miguel",
  "San Salvador",
  "San Vicente",
  "Santa Ana",
  "Sonsonate",
  "Usulután",
]

export default function ClientesPage() {
  const supabase = createSupabaseBrowserClient()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [cargando, setCargando] = useState(true)
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
    setError("")

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setError("No se pudieron cargar los clientes.")
      setCargando(false)
      return
    }

    setClientes((data ?? []) as Cliente[])
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

  async function guardarCliente() {
    if (!nombre.trim()) {
      setError(
        tipoCliente === "empresa"
          ? "Ingresa la razón social."
          : "Ingresa el nombre del cliente."
      )
      return
    }

    if (
      tipoCliente !== "consumidor_final" &&
      !numeroDocumento.trim()
    ) {
      setError("Ingresa el número de documento.")
      return
    }

    setGuardando(true)
    setError("")

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        tipo_cliente: tipoCliente,

        nombre_completo: nombre.trim(),
        razon_social: razonSocial.trim() || null,
        nombre_comercial: nombreComercial.trim() || null,

        tipo_documento: tipoDocumento || null,
        numero_documento: numeroDocumento.trim() || null,
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

        estado: "activo",
        observaciones: observaciones.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setError(
        "No se pudo guardar el cliente. Revisa los datos e inténtalo nuevamente."
      )
      setGuardando(false)
      return
    }

    if (data) {
      setClientes((actuales) => [
        data as Cliente,
        ...actuales,
      ])
    }

    limpiarFormulario()
    setMostrarFormulario(false)
    setGuardando(false)
  }

  async function eliminarCliente(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este cliente?"
    )

    if (!confirmar) return

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(error)
      setError("No se pudo eliminar el cliente.")
      return
    }

    setClientes((actuales) =>
      actuales.filter((cliente) => cliente.id !== id)
    )
  }

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = `
      ${cliente.nombre_completo}
      ${cliente.razon_social ?? ""}
      ${cliente.nombre_comercial ?? ""}
      ${cliente.numero_documento ?? ""}
      ${cliente.telefono ?? ""}
      ${cliente.correo ?? ""}
    `.toLowerCase()

    return texto.includes(busqueda.toLowerCase())
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
            Administra los clientes de Muebles Castillo
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            limpiarFormulario()
            setMostrarFormulario(true)
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4b3326]"
        >
          <Plus size={18} />
          Nuevo cliente
        </button>
      </div>

      {/* Error general */}
      {error && !mostrarFormulario && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-[#e4d8ca] bg-white">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">
              <Users size={22} />
            </div>

            <div>
              <p className="text-sm text-[#8a7562]">
                Total de clientes
              </p>

              <p className="text-2xl font-bold text-[#3b2a20]">
                {clientes.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e4d8ca] bg-white">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">
              <UserPlus size={22} />
            </div>

            <div>
              <p className="text-sm text-[#8a7562]">
                Clientes activos
              </p>

              <p className="text-2xl font-bold text-[#3b2a20]">
                {
                  clientes.filter(
                    (cliente) => cliente.estado === "activo"
                  ).length
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <Card className="border-[#e4d8ca] bg-white">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-[#3b2a20]">
                Lista de clientes
              </CardTitle>

              <p className="mt-1 text-sm text-[#8a7562]">
                Clientes almacenados en CASMAD
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
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar cliente..."
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
                Cargando clientes...
              </div>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#dccbbb] bg-[#fcfaf8] p-6 text-center">
              <Users
                size={40}
                className="mb-3 text-[#b79a7d]"
              />

              <p className="font-semibold text-[#5c4635]">
                {busqueda
                  ? "No encontramos clientes"
                  : "Todavía no hay clientes"}
              </p>

              <p className="mt-1 max-w-md text-sm text-[#9a8775]">
                {busqueda
                  ? "Prueba con otro nombre, documento, teléfono o correo."
                  : "Agrega tu primer cliente para comenzar con cotizaciones y facturación."}
              </p>

              {!busqueda && (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormulario()
                    setMostrarFormulario(true)
                  }}
                  className="mt-5 flex items-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4b3326]"
                >
                  <Plus size={17} />
                  Agregar primer cliente
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#e4d8ca] text-left">
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Cliente
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Documento
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Teléfono
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Correo
                    </th>

                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#8a7562]">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b border-[#f0e8df] last:border-0"
                    >
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ead8c4] font-semibold text-[#5c4030]">
                            {cliente.nombre_completo
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
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
                        {cliente.numero_documento || "Sin documento"}
                      </td>

                      <td className="px-3 py-4 text-sm text-[#6b5746]">
                        {cliente.telefono || "Sin teléfono"}
                      </td>

                      <td className="px-3 py-4 text-sm text-[#6b5746]">
                        {cliente.correo || "Sin correo"}
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              eliminarCliente(cliente.id)
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
          )}
        </CardContent>
      </Card>

      {/* Modal nuevo cliente */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-[#e4d8ca] px-6 py-5">
              <h2 className="text-xl font-bold text-[#3b2a20]">
                Nuevo cliente
              </h2>

              <p className="mt-1 text-sm text-[#8a7562]">
                Registra la información del cliente.
              </p>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              <div className="space-y-6">
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

                {/* Identificación */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Identificación
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        {tipoCliente === "empresa"
                          ? "Razón social *"
                          : "Nombre completo *"}
                      </label>

                      <input
                        value={nombre}
                        onChange={(e) =>
                          setNombre(e.target.value)
                        }
                        placeholder={
                          tipoCliente === "empresa"
                            ? "Ej. Muebles Castillo S.A. de C.V."
                            : "Ej. Juan Pérez"
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
                          setNombreComercial(e.target.value)
                        }
                        placeholder="Nombre comercial"
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
                          setTipoDocumento(e.target.value)
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      >
                        <option value="">
                          Seleccionar
                        </option>
                        <option value="DUI">DUI</option>
                        <option value="NIT">NIT</option>
                        <option value="PASAPORTE">
                          Pasaporte
                        </option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Número de documento
                      </label>

                      <input
                        value={numeroDocumento}
                        onChange={(e) =>
                          setNumeroDocumento(e.target.value)
                        }
                        placeholder="Número de documento"
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                      />
                    </div>

                    {(tipoCliente === "contribuyente" ||
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
                            placeholder="NRC"
                            className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                            Actividad económica
                          </label>

                          <input
                            value={actividadEconomica}
                            onChange={(e) =>
                              setActividadEconomica(
                                e.target.value
                              )
                            }
                            placeholder="Actividad económica"
                            className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52] focus:ring-2 focus:ring-[#a67c52]/20"
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
                        Teléfono
                      </label>

                      <div className="relative">
                        <Phone
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8775]"
                        />

                        <input
                          value={telefono}
                          onChange={(e) =>
                            setTelefono(e.target.value)
                          }
                          placeholder="7000-0000"
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
                        placeholder="7000-0000"
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
                            setCorreo(e.target.value)
                          }
                          placeholder="correo@ejemplo.com"
                          className="w-full rounded-lg border border-[#e4d8ca] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#a67c52]"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Dirección */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Dirección
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Departamento
                      </label>

                      <select
                        value={departamento}
                        onChange={(e) =>
                          setDepartamento(e.target.value)
                        }
                        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      >
                        <option value="">
                          Seleccionar departamento
                        </option>

                        {departamentos.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Municipio
                      </label>

                      <input
                        value={municipio}
                        onChange={(e) =>
                          setMunicipio(e.target.value)
                        }
                        placeholder="Municipio"
                        className="w-full rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Dirección
                      </label>

                      <div className="relative">
                        <MapPin
                          size={17}
                          className="absolute left-3 top-3 text-[#9a8775]"
                        />

                        <textarea
                          value={direccion}
                          onChange={(e) =>
                            setDireccion(e.target.value)
                          }
                          placeholder="Dirección completa"
                          rows={3}
                          className="w-full resize-none rounded-lg border border-[#e4d8ca] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#a67c52]"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Crédito */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-[#5c4035]">
                    Condición de pago
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Condición
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
                          Crédito
                        </option>
                      </select>
                    </div>

                    {condicionPago === "credito" && (
                      <>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                            Límite de crédito
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={limiteCredito}
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
                            Días de crédito
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={diasCredito}
                            onChange={(e) =>
                              setDiasCredito(e.target.value)
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
                      setObservaciones(e.target.value)
                    }
                    rows={3}
                    placeholder="Notas adicionales del cliente..."
                    className="w-full resize-none rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
                  />
                </section>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#e4d8ca] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={guardando}
                onClick={() => {
                  limpiarFormulario()
                  setMostrarFormulario(false)
                }}
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