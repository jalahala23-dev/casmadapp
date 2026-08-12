import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value)
            }
          )

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              )
            }
          )
        },
      },
    }
  )

  const { data } =
    await supabase.auth.getClaims()

  const claims = data?.claims
  const pathname = request.nextUrl.pathname

  const isLoginPage =
    pathname === "/login"

  // ==========================================
  // USUARIO SIN SESIÓN
  // ==========================================

  if (!claims && !isLoginPage) {
    const loginUrl =
      request.nextUrl.clone()

    loginUrl.pathname = "/login"

    return NextResponse.redirect(loginUrl)
  }

  // ==========================================
  // USUARIO CON SESIÓN EN /login
  // ==========================================

  if (claims && isLoginPage) {
    const dashboardUrl =
      request.nextUrl.clone()

    dashboardUrl.pathname = "/"

    return NextResponse.redirect(
      dashboardUrl
    )
  }

  if (!claims) {
    return response
  }

  // ==========================================
  // COMPROBAR PERFIL Y ROL
  // ==========================================

  const userId =
    typeof claims.sub === "string"
      ? claims.sub
      : null

  if (!userId) {
    const loginUrl =
      request.nextUrl.clone()

    loginUrl.pathname = "/login"

    return NextResponse.redirect(loginUrl)
  }

  const {
    data: perfil,
    error: perfilError,
  } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", userId)
    .maybeSingle()

  if (perfilError) {
    console.error(
      "ERROR AL COMPROBAR PERMISOS:",
      perfilError
    )
  }

  const rol =
    perfil?.rol ?? "usuario"

  const puedeAdministrar =
    perfil?.activo === true &&
    (
      rol === "administrador" ||
      rol === "programador"
    )

  // ==========================================
  // RUTAS SOLO PARA ADMIN / PROGRAMADOR
  // ==========================================

  const rutaConfiguracion =
    pathname === "/configuracion" ||
    pathname.startsWith(
      "/configuracion/"
    )

  const rutaUsuarios =
    pathname === "/usuarios" ||
    pathname.startsWith(
      "/usuarios/"
    )

  const rutaSoloAdministracion =
    rutaConfiguracion ||
    rutaUsuarios

  if (
    rutaSoloAdministracion &&
    !puedeAdministrar
  ) {
    const dashboardUrl =
      request.nextUrl.clone()

    dashboardUrl.pathname = "/"
    dashboardUrl.searchParams.set(
      "acceso",
      "denegado"
    )

    return NextResponse.redirect(
      dashboardUrl
    )
  }

  return response
}