"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  FileText,
  Printer,
  Settings,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

type Configuracion = {
  id: string
  nombre_empresa: string
  nombre_comercial: string | null
  nit: string | null
  nrc: string | null
  telefono: string | null
  correo: string | null
  direccion: string | null
  logo_url: string | null

  iva_predeterminado: number
  iva_incluido: boolean
  dias_vencimiento: number
  prefijo_factura: string

  mostrar_logo: boolean
  mostrar_telefono: boolean
  mostrar_correo: boolean
  mostrar_direccion: boolean

  pie_factura: string | null

  moneda: string
  formato_fecha: string
}

export default function ConfiguracionPage() {
  const supabase =
    createSupabaseBrowserClient()

  const [configuracion, setConfiguracion] =
    useState<Configuracion | null>(null)

  const [cargando, setCargando] =
    useState(true)

  const [guardando, setGuardando] =
    useState(false)

  const [mensaje, setMensaje] =
    useState("")

  const [error, setError] =
    useState("")

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  async function cargarConfiguracion() {
    setCargando(true)
    setError("")

    const {
      data,
      error,
    } = await supabase
      .from("configuracion")
      .select("*")
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(
        "ERROR AL CARGAR CONFIGURACION:",
        error
      )

      setError(
        `No se pudo cargar la configuración: ${error.message}`
      )

      setCargando(false)
      return
    }

    if (!data) {
      setError(
        "No existe ninguna configuración registrada."
      )

      setCargando(false)
      return
    }

    setConfiguracion(
      data as Configuracion
    )

    setCargando(false)
  }

  function actualizarCampo<
    K extends keyof Configuracion
  >(
    campo: K,
    valor: Configuracion[K]
  ) {
    setConfiguracion(
      (actual) => {
        if (!actual) {
          return actual
        }

        return {
          ...actual,
          [campo]: valor,
        }
      }
    )
  }

  async function guardarConfiguracion() {
    if (!configuracion) {
      return
    }

    setGuardando(true)
    setMensaje("")
    setError("")

    const {
      error,
    } = await supabase
      .from("configuracion")
      .update({
        nombre_empresa:
          configuracion.nombre_empresa,

        nombre_comercial:
          configuracion.nombre_comercial,

        nit:
          configuracion.nit,

        nrc:
          configuracion.nrc,

        telefono:
          configuracion.telefono,

        correo:
          configuracion.correo,

        direccion:
          configuracion.direccion,

        logo_url:
          configuracion.logo_url,

        iva_predeterminado:
          Number(
            configuracion.iva_predeterminado
          ),

        iva_incluido:
          configuracion.iva_incluido,

        dias_vencimiento:
          Number(
            configuracion.dias_vencimiento
          ),

        prefijo_factura:
          configuracion.prefijo_factura,

        mostrar_logo:
          configuracion.mostrar_logo,

        mostrar_telefono:
          configuracion.mostrar_telefono,

        mostrar_correo:
          configuracion.mostrar_correo,

        mostrar_direccion:
          configuracion.mostrar_direccion,

        pie_factura:
          configuracion.pie_factura,

        moneda:
          configuracion.moneda,

        formato_fecha:
          configuracion.formato_fecha,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        configuracion.id
      )

    if (error) {
      console.error(
        "ERROR AL GUARDAR CONFIGURACION:",
        error
      )

      setError(
        `No se pudo guardar: ${error.message}`
      )

      setGuardando(false)
      return
    }

    setMensaje(
      "Configuración guardada correctamente."
    )

    setGuardando(false)

    setTimeout(() => {
      setMensaje("")
    }, 3500)
  }

  if (cargando) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">

        <div className="flex items-center gap-3 text-sm text-[#8a7562]">

          <Loader2
            size={22}
            className="animate-spin"
          />

          Cargando configuración...

        </div>

      </div>
    )
  }

  if (!configuracion) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">

        {error ||
          "No se encontró la configuración."}

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

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e4d7] text-[#5c4030]">

              <Settings
                size={22}
              />

            </div>

            <div>

              <h1 className="text-3xl font-bold text-[#3b2a20]">
                Configuración
              </h1>

              <p className="text-sm text-[#8a7562]">
                Configura los datos generales de CASMAD
              </p>

            </div>

          </div>

        </div>

        <button
          type="button"
          onClick={
            guardarConfiguracion
          }
          disabled={guardando}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#5c4030] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {guardando ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save
              size={18}
            />
          )}

          {guardando
            ? "Guardando..."
            : "Guardar cambios"}

        </button>

      </div>

      {/* =====================================================
          MENSAJES
          ===================================================== */}

      {mensaje && (

        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">

          <CheckCircle2
            size={18}
          />

          {mensaje}

        </div>

      )}

      {error && (

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}

      {/* =====================================================
          EMPRESA
          ===================================================== */}

      <section className="rounded-xl border border-[#e4d8ca] bg-white">

        <div className="border-b border-[#eee4db] px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5eadf] text-[#79583f]">

              <Building2
                size={20}
              />

            </div>

            <div>

              <h2 className="font-semibold text-[#3b2a20]">
                Datos de la empresa
              </h2>

              <p className="text-xs text-[#8a7562]">
                Información que aparecerá en documentos y facturas.
              </p>

            </div>

          </div>

        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">

          <CampoTexto
            label="Nombre de la empresa"
            value={
              configuracion.nombre_empresa
            }
            onChange={(value) =>
              actualizarCampo(
                "nombre_empresa",
                value
              )
            }
            requerido
          />

          <CampoTexto
            label="Nombre comercial"
            value={
              configuracion.nombre_comercial ||
              ""
            }
            onChange={(value) =>
              actualizarCampo(
                "nombre_comercial",
                value
              )
            }
          />

          <CampoTexto
            label="NIT"
            value={
              configuracion.nit ||
              ""
            }
            onChange={(value) =>
              actualizarCampo(
                "nit",
                value
              )
            }
          />

          <CampoTexto
            label="NRC"
            value={
              configuracion.nrc ||
              ""
            }
            onChange={(value) =>
              actualizarCampo(
                "nrc",
                value
              )
            }
          />

          <CampoTexto
            label="Teléfono"
            value={
              configuracion.telefono ||
              ""
            }
            onChange={(value) =>
              actualizarCampo(
                "telefono",
                value
              )
            }
          />

          <CampoTexto
            label="Correo electrónico"
            type="email"
            value={
              configuracion.correo ||
              ""
            }
            onChange={(value) =>
              actualizarCampo(
                "correo",
                value
              )
            }
          />

          <div className="md:col-span-2">

            <label className="mb-2 block text-sm font-medium text-[#5c4030]">
              Dirección
            </label>

            <textarea
              value={
                configuracion.direccion ||
                ""
              }
              onChange={(e) =>
                actualizarCampo(
                  "direccion",
                  e.target.value
                )
              }
              rows={3}
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
              placeholder="Dirección de la empresa..."
            />

          </div>

          <div className="md:col-span-2">

            <CampoTexto
              label="URL del logo"
              value={
                configuracion.logo_url ||
                ""
              }
              onChange={(value) =>
                actualizarCampo(
                  "logo_url",
                  value
                )
              }
              placeholder="https://..."
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          FACTURACION
          ===================================================== */}

      <section className="rounded-xl border border-[#e4d8ca] bg-white">

        <div className="border-b border-[#eee4db] px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5eadf] text-[#79583f]">

              <FileText
                size={20}
              />

            </div>

            <div>

              <h2 className="font-semibold text-[#3b2a20]">
                Facturación
              </h2>

              <p className="text-xs text-[#8a7562]">
                Valores predeterminados para las facturas.
              </p>

            </div>

          </div>

        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">

          <CampoNumero
            label="IVA predeterminado (%)"
            value={
              configuracion.iva_predeterminado
            }
            onChange={(value) =>
              actualizarCampo(
                "iva_predeterminado",
                value
              )
            }
            min={0}
            max={100}
            step={0.01}
          />

          <div>

            <label className="mb-2 block text-sm font-medium text-[#5c4030]">
              IVA
            </label>

            <select
              value={
                configuracion.iva_incluido
                  ? "incluido"
                  : "excluido"
              }
              onChange={(e) =>
                actualizarCampo(
                  "iva_incluido",
                  e.target.value ===
                    "incluido"
                )
              }
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
            >

              <option value="incluido">
                IVA incluido
              </option>

              <option value="excluido">
                IVA excluido
              </option>

            </select>

          </div>

          <CampoNumero
            label="Días de vencimiento"
            value={
              configuracion.dias_vencimiento
            }
            onChange={(value) =>
              actualizarCampo(
                "dias_vencimiento",
                value
              )
            }
            min={0}
            step={1}
          />

          <CampoTexto
            label="Prefijo de factura"
            value={
              configuracion.prefijo_factura
            }
            onChange={(value) =>
              actualizarCampo(
                "prefijo_factura",
                value
              )
            }
          />

        </div>

      </section>

      {/* =====================================================
          IMPRESION
          ===================================================== */}

      <section className="rounded-xl border border-[#e4d8ca] bg-white">

        <div className="border-b border-[#eee4db] px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5eadf] text-[#79583f]">

              <Printer
                size={20}
              />

            </div>

            <div>

              <h2 className="font-semibold text-[#3b2a20]">
                Impresión
              </h2>

              <p className="text-xs text-[#8a7562]">
                Decide qué información aparecerá en las facturas impresas.
              </p>

            </div>

          </div>

        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">

          <SwitchCampo
            label="Mostrar logo"
            checked={
              configuracion.mostrar_logo
            }
            onChange={(value) =>
              actualizarCampo(
                "mostrar_logo",
                value
              )
            }
          />

          <SwitchCampo
            label="Mostrar teléfono"
            checked={
              configuracion.mostrar_telefono
            }
            onChange={(value) =>
              actualizarCampo(
                "mostrar_telefono",
                value
              )
            }
          />

          <SwitchCampo
            label="Mostrar correo"
            checked={
              configuracion.mostrar_correo
            }
            onChange={(value) =>
              actualizarCampo(
                "mostrar_correo",
                value
              )
            }
          />

          <SwitchCampo
            label="Mostrar dirección"
            checked={
              configuracion.mostrar_direccion
            }
            onChange={(value) =>
              actualizarCampo(
                "mostrar_direccion",
                value
              )
            }
          />

          <div className="md:col-span-2">

            <label className="mb-2 block text-sm font-medium text-[#5c4030]">
              Pie de factura
            </label>

            <textarea
              value={
                configuracion.pie_factura ||
                ""
              }
              onChange={(e) =>
                actualizarCampo(
                  "pie_factura",
                  e.target.value
                )
              }
              rows={3}
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
              placeholder="Gracias por su compra..."
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          SISTEMA
          ===================================================== */}

      <section className="rounded-xl border border-[#e4d8ca] bg-white">

        <div className="border-b border-[#eee4db] px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f5eadf] text-[#79583f]">

              <Settings
                size={20}
              />

            </div>

            <div>

              <h2 className="font-semibold text-[#3b2a20]">
                Sistema
              </h2>

              <p className="text-xs text-[#8a7562]">
                Configuración general del sistema.
              </p>

            </div>

          </div>

        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-medium text-[#5c4030]">
              Moneda
            </label>

            <select
              value={
                configuracion.moneda
              }
              onChange={(e) =>
                actualizarCampo(
                  "moneda",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
            >

              <option value="USD">
                USD - Dólar estadounidense
              </option>

            </select>

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium text-[#5c4030]">
              Formato de fecha
            </label>

            <select
              value={
                configuracion.formato_fecha
              }
              onChange={(e) =>
                actualizarCampo(
                  "formato_fecha",
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
            >

              <option value="DD/MM/YYYY">
                DD/MM/YYYY
              </option>

              <option value="MM/DD/YYYY">
                MM/DD/YYYY
              </option>

              <option value="YYYY-MM-DD">
                YYYY-MM-DD
              </option>

            </select>

          </div>

        </div>

      </section>

      {/* =====================================================
          GUARDAR
          ===================================================== */}

      <div className="flex justify-end pb-6">

        <button
          type="button"
          onClick={
            guardarConfiguracion
          }
          disabled={guardando}
          className="flex items-center gap-2 rounded-lg bg-[#5c4030] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4b3326] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {guardando ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save
              size={18}
            />
          )}

          {guardando
            ? "Guardando..."
            : "Guardar cambios"}

        </button>

      </div>

    </div>
  )
}

// ==========================================================
// COMPONENTE CAMPO TEXTO
// ==========================================================

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  requerido = false,
}: {
  label: string
  value: string
  onChange: (
    value: string
  ) => void
  type?: string
  placeholder?: string
  requerido?: boolean
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-[#5c4030]">

        {label}

        {requerido && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
      />

    </div>
  )
}

// ==========================================================
// COMPONENTE CAMPO NUMERO
// ==========================================================

function CampoNumero({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (
    value: number
  ) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-[#5c4030]">
        {label}
      </label>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) =>
          onChange(
            Number(
              e.target.value
            )
          )
        }
        className="w-full rounded-lg border border-[#e4d8ca] bg-white px-3 py-2.5 text-sm text-[#3b2a20] outline-none focus:border-[#8a6046]"
      />

    </div>
  )
}

// ==========================================================
// COMPONENTE SWITCH
// ==========================================================

function SwitchCampo({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (
    value: boolean
  ) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[#e4d8ca] px-4 py-3">

      <span className="text-sm font-medium text-[#5c4030]">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(
            e.target.checked
          )
        }
        className="h-5 w-5 accent-[#5c4030]"
      />

    </label>
  )
}