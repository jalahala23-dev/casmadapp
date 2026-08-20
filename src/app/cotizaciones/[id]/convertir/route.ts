import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY

function adminClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Falta configurar SUPABASE_SECRET_KEY."
    )
  }

  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

async function verificarAdministrador() {
  const supabase =
    await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      autorizado: false as const,
      status: 401,
      mensaje:
        "No hay una sesión válida.",
    }
  }

  const admin = adminClient()

  const {
    data: perfil,
    error: perfilError,
  } = await admin
    .from("perfiles")
    .select("id, rol, activo")
    .eq("id", user.id)
    .maybeSingle()

  if (
    perfilError ||
    !perfil ||
    !perfil.activo ||
    (
      perfil.rol !== "administrador" &&
      perfil.rol !== "programador"
    )
  ) {
    return {
      autorizado: false as const,
      status: 403,
      mensaje:
        "No tienes permisos para convertir cotizaciones en facturas.",
    }
  }

  return {
    autorizado: true as const,
    admin,
  }
}

export async function POST(
  _request: Request,
  context: {
    params: Promise<{
      id: string
    }>
  }
) {
  try {
    const { id } =
      await context.params

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Falta el ID de la cotización.",
        },
        {
          status: 400,
        }
      )
    }

    const acceso =
      await verificarAdministrador()

    if (!acceso.autorizado) {
      return NextResponse.json(
        {
          error:
            acceso.mensaje,
        },
        {
          status:
            acceso.status,
        }
      )
    }

    const admin =
      acceso.admin

    const {
      data: cotizacion,
      error: cotizacionError,
    } = await admin
      .from("cotizaciones")
      .select("*")
      .eq("id", id)
      .single()

    if (
      cotizacionError ||
      !cotizacion
    ) {
      throw new Error(
        cotizacionError?.message ||
          "No se encontró la cotización."
      )
    }

    /*
     * ==========================================================
     * REVISAR SI YA EXISTE UNA FACTURA
     * ==========================================================
     *
     * Esto evita crear una segunda factura si la primera
     * conversión alcanzó a crear la factura pero la cotización
     * quedó todavía como aprobada.
     */

    const {
      data: facturaExistente,
      error:
        facturaExistenteError,
    } = await admin
      .from("facturas")
      .select(
        "id, numero, estado"
      )
      .eq(
        "cotizacion_id",
        id
      )
      .maybeSingle()

    if (
      facturaExistenteError
    ) {
      throw new Error(
        facturaExistenteError.message
      )
    }

    if (facturaExistente) {
      let reparada = false

      if (
        cotizacion.estado !==
        "convertida"
      ) {
        const {
          data:
            cotizacionActualizada,
          error:
            actualizarError,
        } = await admin
          .from("cotizaciones")
          .update({
            estado:
              "convertida",
          })
          .eq(
            "id",
            id
          )
          .select(
            "id, estado"
          )
          .single()

        if (
          actualizarError ||
          !cotizacionActualizada
        ) {
          throw new Error(
            actualizarError?.message ||
              "La factura ya existe, pero no se pudo marcar la cotización como convertida."
          )
        }

        reparada = true
      }

      return NextResponse.json({
        success: true,
        facturaId:
          facturaExistente.id,
        numero:
          facturaExistente.numero,
        reparada,
      })
    }

    /*
     * ==========================================================
     * SOLO LAS COTIZACIONES APROBADAS SE PUEDEN CONVERTIR
     * ==========================================================
     */

    if (
      cotizacion.estado !==
      "aprobada"
    ) {
      return NextResponse.json(
        {
          error:
            "Solo una cotización aprobada puede convertirse en factura.",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * ==========================================================
     * CARGAR DETALLES DE LA COTIZACIÓN
     * ==========================================================
     */

    const {
      data: detalles,
      error:
        detallesError,
    } = await admin
      .from(
        "cotizacion_detalles"
      )
      .select("*")
      .eq(
        "cotizacion_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      )

    if (detallesError) {
      throw new Error(
        detallesError.message
      )
    }

    if (
      !detalles ||
      detalles.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "La cotización no tiene muebles para convertir en factura.",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * ==========================================================
     * CREAR FACTURA COMO BORRADOR
     * ==========================================================
     */

    const {
      data: factura,
      error: facturaError,
    } = await admin
      .from("facturas")
      .insert({
        cliente_id:
          cotizacion.cliente_id,

        cotizacion_id:
          cotizacion.id,

        fecha:
          cotizacion.fecha,

        fecha_vencimiento:
          cotizacion.fecha_vencimiento,

        estado:
          "borrador",

        tipo_iva:
          cotizacion.tipo_iva,

        porcentaje_iva:
          Number(
            cotizacion.porcentaje_iva
          ) || 0,

        subtotal:
          Number(
            cotizacion.subtotal
          ) || 0,

        descuento:
          Number(
            cotizacion.descuento
          ) || 0,

        iva:
          Number(
            cotizacion.iva
          ) || 0,

        total:
          Number(
            cotizacion.total
          ) || 0,

        observaciones:
          cotizacion.observaciones ||
          null,
      })
      .select("*")
      .single()

    if (
      facturaError ||
      !factura
    ) {
      throw new Error(
        facturaError?.message ||
          "No se pudo crear la factura."
      )
    }

    /*
     * ==========================================================
     * COPIAR DETALLES
     * ==========================================================
     */

    const detallesFactura =
      detalles.map(
        (
          detalle
        ) => ({
          factura_id:
            factura.id,

          producto_id:
            detalle.producto_id,

          descripcion:
            detalle.descripcion,

          cantidad:
            Number(
              detalle.cantidad
            ) || 0,

          precio_unitario:
            Number(
              detalle.precio_unitario
            ) || 0,

          descuento:
            Number(
              detalle.descuento
            ) || 0,

          subtotal:
            Number(
              detalle.subtotal
            ) || 0,

          especificaciones:
            detalle.especificaciones ||
            null,
        })
      )

    const {
      error:
        insertarDetallesError,
    } = await admin
      .from(
        "factura_detalles"
      )
      .insert(
        detallesFactura
      )

    if (
      insertarDetallesError
    ) {
      await admin
        .from("facturas")
        .delete()
        .eq(
          "id",
          factura.id
        )

      throw new Error(
        "La factura se creó, pero no se pudieron guardar sus detalles."
      )
    }

    /*
     * ==========================================================
     * MARCAR COTIZACIÓN COMO CONVERTIDA
     * ==========================================================
     */

    const {
      data:
        cotizacionActualizada,
      error:
        actualizarError,
    } = await admin
      .from("cotizaciones")
      .update({
        estado:
          "convertida",
      })
      .eq(
        "id",
        id
      )
      .eq(
        "estado",
        "aprobada"
      )
      .select(
        "id, estado"
      )
      .single()

    if (
      actualizarError ||
      !cotizacionActualizada
    ) {
      await admin
        .from(
          "factura_detalles"
        )
        .delete()
        .eq(
          "factura_id",
          factura.id
        )

      await admin
        .from("facturas")
        .delete()
        .eq(
          "id",
          factura.id
        )

      throw new Error(
        actualizarError?.message ||
          "La factura se creó, pero no se pudo marcar la cotización como convertida."
      )
    }

    return NextResponse.json({
      success: true,
      facturaId:
        factura.id,
      numero:
        factura.numero,
      reparada: false,
    })
  } catch (error) {
    console.error(
      "ERROR API CONVERTIR COTIZACIÓN:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo convertir la cotización en factura.",
      },
      {
        status: 500,
      }
    )
  }
}