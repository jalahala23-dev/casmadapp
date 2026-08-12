import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

type RolReal = "programador" | "administrador" | "usuario"
type RolVisible = RolReal | "sistema"

function adminClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY."
    )
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function verificarAccesoAdministrativo() {
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

  const { data: perfil, error: perfilError } = await admin
    .from("perfiles")
    .select("id, nombre, telefono, rol, activo")
    .eq("id", user.id)
    .maybeSingle()

  if (perfilError) {
    console.error("ERROR CONSULTANDO PERFIL:", perfilError)

    return {
      autorizado: false as const,
      status: 500,
      mensaje: "No se pudo comprobar el perfil del usuario.",
    }
  }

  if (!perfil) {
    return {
      autorizado: false as const,
      status: 403,
      mensaje: "No existe un perfil para el usuario autenticado.",
    }
  }

  if (perfil.activo !== true) {
    return {
      autorizado: false as const,
      status: 403,
      mensaje: "El usuario está desactivado.",
    }
  }

  const rolesPermitidos: RolReal[] = [
    "programador",
    "administrador",
  ]

  if (!rolesPermitidos.includes(perfil.rol as RolReal)) {
    return {
      autorizado: false as const,
      status: 403,
      mensaje:
        "El usuario no tiene permisos para administrar usuarios.",
    }
  }

  return {
    autorizado: true as const,
    user,
    admin,
    perfil: {
      ...perfil,
      rol: perfil.rol as RolReal,
    },
  }
}

export async function GET() {
  try {
    const acceso = await verificarAccesoAdministrativo()

    if (!acceso.autorizado) {
      return NextResponse.json(
        { error: acceso.mensaje },
        { status: acceso.status }
      )
    }

    const {
      data: usuariosData,
      error: usuariosError,
    } = await acceso.admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    })

    if (usuariosError) {
      throw usuariosError
    }

    const { data: perfiles, error: perfilesError } =
      await acceso.admin
        .from("perfiles")
        .select(
          "id, nombre, telefono, rol, activo, created_at, updated_at"
        )

    if (perfilesError) {
      throw perfilesError
    }

    const solicitanteEsProgramador =
      acceso.perfil.rol === "programador"

    const usuarios = usuariosData.users.map((usuario) => {
      const perfil = perfiles?.find(
        (item) => item.id === usuario.id
      )

      const rolReal = (perfil?.rol ??
        "usuario") as RolReal

      /*
       * Si quien está viendo la lista NO es programador,
       * cualquier cuenta programador se oculta y se
       * presenta simplemente como "System".
       */
      if (
        rolReal === "programador" &&
        !solicitanteEsProgramador
      ) {
        return {
          id: "system",
          email: "system@casmad.local",
          nombre: "System",
          telefono: null,
          rol: "sistema" as RolVisible,
          activo: true,
          protegido: true,
          created_at:
            perfil?.created_at ?? usuario.created_at,
        }
      }

      return {
        id: usuario.id,
        email: usuario.email ?? "",
        nombre:
          perfil?.nombre ??
          usuario.email?.split("@")[0] ??
          "",
        telefono: perfil?.telefono ?? null,
        rol: rolReal as RolVisible,
        activo: perfil?.activo ?? true,
        protegido: rolReal === "programador",
        created_at:
          perfil?.created_at ?? usuario.created_at,
      }
    })

    return NextResponse.json({
      usuarios,
      usuarioActual: {
        id: acceso.user.id,
        rol: acceso.perfil.rol,
      },
    })
  } catch (error) {
    console.error("ERROR AL LISTAR USUARIOS:", error)

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

export async function POST(request: Request) {
  try {
    const acceso = await verificarAccesoAdministrativo()

    if (!acceso.autorizado) {
      return NextResponse.json(
        { error: acceso.mensaje },
        { status: acceso.status }
      )
    }

    const body = await request.json()

    const email = String(body?.email ?? "")
      .trim()
      .toLowerCase()

    const nombre = String(body?.nombre ?? "").trim()

    const telefono = String(body?.telefono ?? "").trim()

    const rolSolicitado = String(body?.rol ?? "usuario")
      .trim()
      .toLowerCase() as RolReal

    if (!email) {
      return NextResponse.json(
        {
          error: "El correo electrónico es obligatorio.",
        },
        { status: 400 }
      )
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!emailValido) {
      return NextResponse.json(
        {
          error:
            "Ingresa un correo electrónico válido.",
        },
        { status: 400 }
      )
    }

    /*
     * Nunca se permite crear un programador
     * desde la interfaz normal.
     */
    const rolesCreables: RolReal[] = [
      "administrador",
      "usuario",
    ]

    if (!rolesCreables.includes(rolSolicitado)) {
      return NextResponse.json(
        {
          error:
            "Solo puedes crear usuarios con rol Administrador o Usuario.",
        },
        { status: 400 }
      )
    }

    const password = String(
      body?.password ?? "Casmad26"
    ).trim()

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 8 caracteres.",
        },
        { status: 400 }
      )
    }

    const {
      data: usuarioCreado,
      error: crearError,
    } = await acceso.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (crearError) {
      return NextResponse.json(
        {
          error: crearError.message.includes(
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

    const nombreFinal =
      nombre || email.split("@")[0]

    const { error: perfilError } = await acceso.admin
      .from("perfiles")
      .insert({
        id: usuarioCreado.user.id,
        nombre: nombreFinal,
        telefono: telefono || null,
        rol: rolSolicitado,
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
          nombre: nombreFinal,
          telefono: telefono || null,
          rol: rolSolicitado,
          activo: true,
          protegido: false,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("ERROR AL CREAR USUARIO:", error)

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

export async function PATCH(request: Request) {
  try {
    const acceso = await verificarAccesoAdministrativo()

    if (!acceso.autorizado) {
      return NextResponse.json(
        { error: acceso.mensaje },
        { status: acceso.status }
      )
    }

    const body = await request.json()

    const id = String(body?.id ?? "").trim()

    if (!id) {
      return NextResponse.json(
        {
          error: "El ID del usuario es obligatorio.",
        },
        { status: 400 }
      )
    }

    const { data: perfilObjetivo, error: perfilError } =
      await acceso.admin
        .from("perfiles")
        .select("id, nombre, telefono, rol, activo")
        .eq("id", id)
        .maybeSingle()

    if (perfilError) {
      throw perfilError
    }

    if (!perfilObjetivo) {
      return NextResponse.json(
        {
          error: "El usuario no existe.",
        },
        { status: 404 }
      )
    }

    /*
     * El usuario Programador no puede modificarse
     * desde esta API.
     */
    if (perfilObjetivo.rol === "programador") {
      return NextResponse.json(
        {
          error:
            "El usuario del sistema está protegido.",
        },
        { status: 403 }
      )
    }

    const cambios: {
      nombre?: string
      telefono?: string | null
      rol?: RolReal
      activo?: boolean
      updated_at?: string
    } = {}

    if (body?.nombre !== undefined) {
      const nombre = String(body.nombre).trim()

      if (!nombre) {
        return NextResponse.json(
          {
            error: "El nombre no puede estar vacío.",
          },
          { status: 400 }
        )
      }

      cambios.nombre = nombre
    }

    if (body?.telefono !== undefined) {
      const telefono = String(body.telefono ?? "").trim()
      cambios.telefono = telefono || null
    }

    if (body?.rol !== undefined) {
      const rol = String(body.rol)
        .trim()
        .toLowerCase() as RolReal

      const rolesEditables: RolReal[] = [
        "administrador",
        "usuario",
      ]

      if (!rolesEditables.includes(rol)) {
        return NextResponse.json(
          {
            error:
              "El rol debe ser Administrador o Usuario.",
          },
          { status: 400 }
        )
      }

      if (
        id === acceso.user.id &&
        rol !== acceso.perfil.rol
      ) {
        return NextResponse.json(
          {
            error:
              "No puedes cambiar tu propio rol.",
          },
          { status: 400 }
        )
      }

      cambios.rol = rol
    }

    if (body?.activo !== undefined) {
      if (typeof body.activo !== "boolean") {
        return NextResponse.json(
          {
            error:
              "El estado activo debe ser verdadero o falso.",
          },
          { status: 400 }
        )
      }

      if (
        id === acceso.user.id &&
        body.activo === false
      ) {
        return NextResponse.json(
          {
            error:
              "No puedes desactivar el usuario con el que estás conectado.",
          },
          { status: 400 }
        )
      }

      cambios.activo = body.activo
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json(
        {
          error: "No hay cambios para guardar.",
        },
        { status: 400 }
      )
    }

    cambios.updated_at = new Date().toISOString()

    const { data: perfilActualizado, error: actualizarError } =
      await acceso.admin
        .from("perfiles")
        .update(cambios)
        .eq("id", id)
        .select("id, nombre, telefono, rol, activo, updated_at")
        .single()

    if (actualizarError) {
      throw actualizarError
    }

    return NextResponse.json({
      success: true,
      usuario: perfilActualizado,
    })
  } catch (error) {
    console.error("ERROR AL ACTUALIZAR USUARIO:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el usuario.",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const acceso = await verificarAccesoAdministrativo()

    if (!acceso.autorizado) {
      return NextResponse.json(
        { error: acceso.mensaje },
        { status: acceso.status }
      )
    }

    const body = await request.json()

    const id = String(body?.id ?? "").trim()

    if (!id) {
      return NextResponse.json(
        {
          error: "El ID del usuario es obligatorio.",
        },
        { status: 400 }
      )
    }

    if (id === acceso.user.id) {
      return NextResponse.json(
        {
          error:
            "No puedes eliminar el usuario con el que estás conectado.",
        },
        { status: 400 }
      )
    }

    const { data: perfilObjetivo, error: consultarError } =
      await acceso.admin
        .from("perfiles")
        .select("id, rol")
        .eq("id", id)
        .maybeSingle()

    if (consultarError) {
      throw consultarError
    }

    /*
     * Nunca permitir borrar una cuenta Programador
     * desde la aplicación.
     */
    if (perfilObjetivo?.rol === "programador") {
      return NextResponse.json(
        {
          error:
            "El usuario del sistema está protegido y no puede eliminarse.",
        },
        { status: 403 }
      )
    }

    const { error: perfilError } = await acceso.admin
      .from("perfiles")
      .delete()
      .eq("id", id)

    if (perfilError) {
      throw perfilError
    }

    const { error: usuarioError } =
      await acceso.admin.auth.admin.deleteUser(id)

    if (usuarioError) {
      throw usuarioError
    }

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado correctamente.",
    })
  } catch (error) {
    console.error("ERROR AL ELIMINAR USUARIO:", error)

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