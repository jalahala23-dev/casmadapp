"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type TipoCliente =
  | "consumidor_final"
  | "contribuyente"
  | "empresa"

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

export default function ClienteDetallePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  const clienteId = params.id as string

  const [cliente, setCliente] = useState<Cliente | null>(null)

  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
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
    cargarCliente()
  }, [clienteId])

  useEffect(() => {
    setEditando(searchParams.get("editar") === "1")
  }, [searchParams])

  async function cargarCliente() {
    setCargando(true)
    setError("")

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", clienteId)
      .single()

    if (error) {
      console.error(error)
      setError("No se pudo cargar el cliente.")
      setCargando(false)
      return
    }

    const clienteData = data as Cliente

    setCliente(clienteData)

    cargarFormulario(clienteData)

    setCargando(false)
  }

  function cargarFormulario(data: Cliente) {
    setTipoCliente(data.tipo_cliente)

    setNombre(data.nombre_completo || "")
    setRazonSocial(data.razon_social || "")
    setNombreComercial(data.nombre_comercial || "")

    setTipoDocumento(data.tipo_documento || "")
    setNumeroDocumento(data.numero_documento || "")
    setNrc(data.nrc || "")
    setActividadEconomica(data.actividad_economica || "")

    setTelefono(data.telefono || "")
    setWhatsapp(data.whatsapp || "")
    setCorreo(data.correo || "")

    setDepartamento(data.departamento || "")
    setMunicipio(data.municipio || "")
    setDireccion(data.direccion || "")

    setCondicionPago(data.condicion_pago || "contado")

    setLimiteCredito(
      String(data.limite_credito ?? 0)
    )

    setDiasCredito(
      String(data.dias_credito ?? 0)
    )

    setObservaciones(data.observaciones || "")
  }

  function cancelarEdicion() {
    if (cliente) {
      cargarFormulario(cliente)
    }

    setError("")
    setEditando(false)
  }

  async function guardarCambios() {
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

    const { data, error } = await supabase
      .from("clientes")
      .update({
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
      })
      .eq("id", clienteId)
      .select()
      .single()

    if (error) {
      console.error(error)
      setError(
        "No se pudo actualizar el cliente."
      )
      setGuardando(false)
      return
    }

    if (data) {
      const actualizado = data as Cliente

      setCliente(actualizado)
      cargarFormulario(actualizado)
    }

    setEditando(false)
    setGuardando(false)
  }

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#8a7562]">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Cargando cliente...
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="space-y-6">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6b4935] hover:text-[#3b2a20]"
        >
          <ArrowLeft size={17} />
          Volver a clientes
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error || "Cliente no encontrado."}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/clientes"
            className="mt-1 rounded-lg p-2 text-[#6b5746] hover:bg-[#f4eadf]"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#3b2a20] md:text-3xl">
              {cliente.nombre_completo}
            </h1>

            <p className="mt-1 text-sm text-[#8a7562]">
              {cliente.tipo_cliente === "empresa"
                ? "Empresa"
                : cliente.tipo_cliente ===
                    "contribuyente"
                  ? "Contribuyente"
                  : "Consumidor final"}
            </p>
          </div>
        </div>

        {!editando && (
          <button
            type="button"
            onClick={() => {
              setError("")
              setEditando(true)
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4b3326]"
          >
            <Edit size={17} />
            Editar cliente
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {editando ? (
        <div className="rounded-2xl border border-[#e4d8ca] bg-white shadow-sm">
          <div className="border-b border-[#e4d8ca] px-6 py-5">
            <h2 className="text-lg font-bold text-[#3b2a20]">
              Editar cliente
            </h2>

            <p className="mt-1 text-sm text-[#8a7562]">
              Actualiza la informacion del cliente.
            </p>
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
                        setTelefono(e.target.value)
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
                        setCorreo(e.target.value)
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
                        setDireccion(e.target.value)
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

                {condicionPago === "credito" && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#5c4635]">
                        Limite de credito
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
                  setObservaciones(e.target.value)
                }
                rows={3}
                className="w-full resize-none rounded-lg border border-[#e4d8ca] px-3 py-2.5 text-sm outline-none focus:border-[#a67c52]"
              />
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e4d8ca] px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={guardando}
              onClick={cancelarEdicion}
              className="rounded-lg border border-[#e4d8ca] px-4 py-2.5 text-sm font-semibold text-[#6b5746] hover:bg-[#f8f3ee]"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={guardando}
              onClick={guardarCambios}
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
                  <Save size={17} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Identificacion */}
          <section className="rounded-2xl border border-[#e4d8ca] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">
                <User size={21} />
              </div>

              <div>
                <h2 className="font-bold text-[#3b2a20]">
                  Identificacion
                </h2>

                <p className="text-sm text-[#8a7562]">
                  Datos principales
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Dato
                label="Tipo de cliente"
                value={
                  cliente.tipo_cliente === "empresa"
                    ? "Empresa"
                    : cliente.tipo_cliente ===
                        "contribuyente"
                      ? "Contribuyente"
                      : "Consumidor final"
                }
              />

              <Dato
                label="Nombre"
                value={cliente.nombre_completo}
              />

              <Dato
                label="Razon social"
                value={cliente.razon_social}
              />

              <Dato
                label="Nombre comercial"
                value={cliente.nombre_comercial}
              />

              <Dato
                label="Tipo de documento"
                value={cliente.tipo_documento}
              />

              <Dato
                label="Numero de documento"
                value={cliente.numero_documento}
              />

              <Dato
                label="NRC"
                value={cliente.nrc}
              />

              <Dato
                label="Actividad economica"
                value={cliente.actividad_economica}
              />
            </div>
          </section>

          {/* Contacto */}
          <section className="rounded-2xl border border-[#e4d8ca] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[#f1e7dc] p-3 text-[#6b4935]">
                <Phone size={21} />
              </div>

              <div>
                <h2 className="font-bold text-[#3b2a20]">
                  Contacto
                </h2>

                <p className="text-sm text-[#8a7562]">
                  Formas de contacto
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Dato
                label="Telefono"
                value={cliente.telefono}
              />

              <Dato
                label="WhatsApp"
                value={cliente.whatsapp}
              />

              <Dato
                label="Correo"
                value={cliente.correo}
              />

              <Dato
                label="Departamento"
                value={cliente.departamento}
              />

              <Dato
                label="Municipio"
                value={cliente.municipio}
              />

              <Dato
                label="Direccion"
                value={cliente.direccion}
              />
            </div>
          </section>

          {/* Credito */}
          <section className="rounded-2xl border border-[#e4d8ca] bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-[#3b2a20]">
              Condicion de pago
            </h2>

            <div className="space-y-4">
              <Dato
                label="Condicion"
                value={
                  cliente.condicion_pago === "credito"
                    ? "Credito"
                    : "Contado"
                }
              />

              <Dato
                label="Limite de credito"
                value={
                  cliente.condicion_pago === "credito"
                    ? `$${Number(
                        cliente.limite_credito
                      ).toFixed(2)}`
                    : "$0.00"
                }
              />

              <Dato
                label="Dias de credito"
                value={
                  cliente.condicion_pago === "credito"
                    ? `${cliente.dias_credito} dias`
                    : "No aplica"
                }
              />

              <Dato
                label="Estado"
                value={
                  cliente.estado === "activo"
                    ? "Activo"
                    : "Inactivo"
                }
              />
            </div>
          </section>

          {/* Observaciones */}
          <section className="rounded-2xl border border-[#e4d8ca] bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-[#3b2a20]">
              Observaciones
            </h2>

            <p className="whitespace-pre-wrap text-sm leading-6 text-[#6b5746]">
              {cliente.observaciones ||
                "Sin observaciones."}
            </p>
          </section>
        </div>
      )}
    </div>
  )
}

function Dato({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="border-b border-[#f0e8df] pb-3 last:border-0 last:pb-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9a8775]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-[#3b2a20]">
        {value || "Sin informacion"}
      </p>
    </div>
  )
}