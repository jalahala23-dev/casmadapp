import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

function adminClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Falta configurar SUPABASE_SECRET_KEY.")
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
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      autorizado: false as const,
      status: 401,
      mensaje: "No hay una sesión válida.",
    }
  }

  const admin = adminClient()

  console.log(
    "USUARIO AUTENTICADO:",
    user.id,
    user.email
  )

  const {
    data: perfil,
    error: perfilError,
  } = await admin
    .from("perfiles")
    .select("id, nombre, rol, activo")
    .eq("id", user.id)
    .maybeSingle()

  console.log("RESULTADO PERFIL:", {
    perfil,
    perfilError,
    userId: user.id,
  })

  if (perfilError) {
    console.error(
      "ERROR CONSULTANDO PERFIL:",
      perfilError
    )

    return {
      autorizado: false as const,
      status: 500,
      mensaje:
        "No se pudo comprobar el perfil del usuario.",
    }
  }

  if (!perfil) {
    return {
      autorizado: false as const,
      status: 403,
      mensaje:
        "No existe un perfil para el usuario autenticado.",
    }
  }

  if (
    perfil.rol !== "administrador" ||
    perfil.activo !== true
  ) {
    return {
      autorizado: false as const,
      status: 403,
      mensaje:
        "El usuario no tiene permisos de administrador.",
    }
  }

  return {
    autorizado: true as const,
    user,
    admin,
  }
}

export async function GET() {
  try {
    const acceso =
      await verificarAdministrador()

    if (!acceso.autorizado) {
      return NextResponse.json(
        { error: acceso.mensaje },
        { status: acceso.status }
      )
    }

    const {
      data: usuariosData,
      error: usuariosError,
    } =
      await acceso.admin.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      })

    if (usuariosError) {
      throw usuariosError
    }

    const {
      data: perfiles,
      error: perfilesError,
    } = await acceso.admin
      .from("perfiles")
      .select(
        "id, nombre, rol, activo, created_at, updated_at"
      )

    if (perfilesError) {
      throw perfilesError
    }

    const usuarios =
      usuariosData.users.map((usuario) => {
        const perfil = perfiles?.find(
          (item) => item.id === usuario.id
        )

        return {
          id: usuario.id,
          email: usuario.email ?? "",
          nombre: perfil?.nombre ?? "",
          rol:
            perfil?.rol ??
            "administrador",
          activo:
            perfil?.activo ?? true,
          created_at:
            perfil?.created_at ??
            usuario.created_at,
        }
      })

    return NextResponse.json({
      usuarios,
    })
  } catch (error) {
    console.error(
      "ERROR AL LISTAR USUARIOS:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los usuarios.",
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request
) {
  try {
    const acceso =
      await verificarAdministrador()

    if (!acceso.autorizado) {
      return NextResponse.json(
        { error: acceso.mensaje },
        { status: acceso.status }
      )
    }

    const body = await request.json()

    const email = String(
      body?.email ?? ""
    )
      .trim()
      .toLowerCase()

    if (!email) {
      return NextResponse.json(
        {
          error:
            "El correo electrónico es obligatorio.",
        },
        { status: 400 }
      )
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )

    if (!emailValido) {
      return NextResponse.json(
        {
          error:
            "Ingresa un correo electrónico válido.",
        },
        { status: 400 }
      )
    }

    const {
      data: usuarioCreado,
      error: crearError,
    } =
      await acceso.admin.auth.admin.createUser({
        email,
        password: "Casmad26",
        email_confirm: true,
      })

    if (crearError) {
      return NextResponse.json(
        {
          error:
            crearError.message.includes(
              "already been registered"
            )
              ? "Ese correo ya está registrado."
              : crearError.message,
        },
        { status: 400 }
      )
    }

    if (!usuarioCreado.user) {
      throw new Error(
        "Supabase no devolvió el usuario creado."
      )
    }

    const { error: perfilError } =
      await acceso.admin
        .from("perfiles")
        .insert({
          id: usuarioCreado.user.id,
          nombre: email.split("@")[0],
          rol: "administrador",
          activo: true,
        })

    if (perfilError) {
      await acceso.admin.auth.admin.deleteUser(
        usuarioCreado.user.id
      )

      throw perfilError
    }

    return NextResponse.json(
      {
        success: true,
        usuario: {
          id: usuarioCreado.user.id,
          email,
          nombre: email.split("@")[0],
          rol: "administrador",
          activo: true,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      "ERROR AL CREAR USUARIO:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el usuario.",
      },
      { status: 500 }
    )
  }
}
export async function DELETE(
  request: Request
) {
  try {
    const acceso =
      await verificarAdministrador()

    if (!acceso.autorizado) {
      return NextResponse.json(
        { error: acceso.mensaje },
        { status: acceso.status }
      )
    }

    const body = await request.json()

    const id = String(
      body?.id ?? ""
    ).trim()

    if (!id) {
      return NextResponse.json(
        {
          error:
            "El ID del usuario es obligatorio.",
        },
        { status: 400 }
      )
    }

    // No permitir que el administrador
    // elimine su propia cuenta.
    if (id === acceso.user.id) {
      return NextResponse.json(
        {
          error:
            "No puedes eliminar el usuario con el que estás conectado.",
        },
        { status: 400 }
      )
    }

    // Eliminar primero el perfil.
    const {
      error: perfilError,
    } = await acceso.admin
      .from("perfiles")
      .delete()
      .eq("id", id)

    if (perfilError) {
      throw perfilError
    }

    // Eliminar el usuario de Supabase Auth.
    const {
      error: usuarioError,
    } =
      await acceso.admin.auth.admin.deleteUser(
        id
      )

    if (usuarioError) {
      throw usuarioError
    }

    return NextResponse.json({
      success: true,
      message:
        "Usuario eliminado correctamente.",
    })
  } catch (error) {
    console.error(
      "ERROR AL ELIMINAR USUARIO:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el usuario.",
      },
      { status: 500 }
    )
  }
}
