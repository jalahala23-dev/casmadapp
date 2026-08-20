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

async function verificarPermiso() {
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
    !perfil.activo
  ) {
    return {
      autorizado: false as const,
      status: 403,
      mensaje:
        "No tienes permisos para realizar esta acción.",
    }
  }

  if (
    perfil.rol !== "administrador" &&
    perfil.rol !== "programador"
  ) {
    return {
      autorizado: false as const,
      status: 403,
      mensaje:
        "Solo un administrador o programador puede eliminar cotizaciones.",
    }
  }

  return {
    autorizado: true as const,
    admin,
  }
}

export async function DELETE(
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
      await verificarPermiso()

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

    /*
     * ==========================================================
     * 1. BUSCAR COTIZACIÓN
     * ==========================================================
     */

    const {
      data: cotizacion,
      error:
        cotizacionError,
    } = await admin
      .from("cotizaciones")
      .select(
        "id, numero, estado"
      )
      .eq("id", id)
      .maybeSingle()

    if (cotizacionError) {
      console.error(
        "ERROR AL BUSCAR COTIZACIÓN:",
        cotizacionError
      )

      return NextResponse.json(
        {
          error:
            cotizacionError.message ||
            "No se pudo consultar la cotización.",
        },
        {
          status: 500,
        }
      )
    }

    if (!cotizacion) {
      return NextResponse.json(
        {
          error:
            "La cotización no existe.",
        },
        {
          status: 404,
        }
      )
    }

    /*
     * ==========================================================
     * 2. NO PERMITIR ELIMINAR COTIZACIONES CONVERTIDAS
     * ==========================================================
     */

    if (
      cotizacion.estado ===
      "convertida"
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar una cotización que ya fue convertida en factura.",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * ==========================================================
     * 3. ELIMINAR DETALLES
     * ==========================================================
     */

    const {
      error:
        detallesError,
    } = await admin
      .from("cotizacion_detalles")
      .delete()
      .eq(
        "cotizacion_id",
        id
      )

    if (detallesError) {
      console.error(
        "ERROR AL ELIMINAR DETALLES:",
        detallesError
      )

      return NextResponse.json(
        {
          error:
            detallesError.message ||
            "No se pudieron eliminar los detalles de la cotización.",
        },
        {
          status: 500,
        }
      )
    }

    /*
     * ==========================================================
     * 4. ELIMINAR COTIZACIÓN
     * ==========================================================
     */

    const {
      error:
        eliminarError,
    } = await admin
      .from("cotizaciones")
      .delete()
      .eq(
        "id",
        id
      )

    if (eliminarError) {
      console.error(
        "ERROR AL ELIMINAR COTIZACIÓN:",
        eliminarError
      )

      return NextResponse.json(
        {
          error:
            eliminarError.message ||
            "No se pudo eliminar la cotización.",
        },
        {
          status: 500,
        }
      )
    }

    /*
     * ==========================================================
     * 5. RESPUESTA
     * ==========================================================
     */

    return NextResponse.json({
      success: true,
      mensaje:
        `La cotización COT-${String(
          cotizacion.numero
        ).padStart(6, "0")} fue eliminada correctamente.`,
    })
  } catch (error) {
    console.error(
      "ERROR API ELIMINAR COTIZACIÓN:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar la cotización.",
      },
      {
        status: 500,
      }
    )
  }
}