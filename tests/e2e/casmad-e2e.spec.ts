import path from "path"
import { config } from "dotenv"
import {
  test,
  expect,
  type Page,
} from "@playwright/test"
import { createClient } from "@supabase/supabase-js"

config({
  path: path.resolve(
    process.cwd(),
    ".env.local"
  ),
})

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const TEST_EMAIL =
  process.env.E2E_TEST_EMAIL

const TEST_PASSWORD =
  process.env.E2E_TEST_PASSWORD

if (
  !SUPABASE_URL ||
  !SUPABASE_KEY
) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  )
}

if (
  !TEST_EMAIL ||
  !TEST_PASSWORD
) {
  throw new Error(
    "Faltan E2E_TEST_EMAIL o E2E_TEST_PASSWORD en .env.local."
  )
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)

const sufijo =
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`

const datosPrueba = {
  clienteNombre:
    `TEST E2E CASMAD ${sufijo}`,

  clienteCorreo:
    `test-e2e-casmad-${sufijo}@example.com`,

  clienteNombreEditado:
    `TEST E2E CASMAD EDITADO ${sufijo}`,

  clienteTelefono:
    "7777-1234",

  productoNombre:
    `TEST PRODUCTO E2E ${sufijo}`,

  productoCodigo:
    `TEST-E2E-${sufijo}`,

  categoria:
    "TEST E2E",

  categoriaEditada:
    "TEST E2E EDITADO",

  materialEditado:
    "MADERA TEST E2E",

  precio: 100,

  precioIvaIncluido: 113,

  stockInicial: 10,

  cantidadFactura: 1,

  iva: 13,
}

let clienteId: string | null = null
let productoId: string | null = null
let cotizacionId: string | null = null
let cotizacionIvaIncluidoId: string | null = null

let facturaId: string | null = null
let facturaIvaIncluidoId: string | null = null

let pagoId: string | null = null

const urls = {
  login: "/login",
  clientes: "/clientes",
  muebles: "/muebles",
  cotizaciones: "/cotizaciones",
  facturacionNueva:
    "/facturacion/nueva",
}

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function escaparRegex(
  texto: string
) {
  return texto.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  )
}

function inputPorEtiqueta(
  page: Page,
  etiqueta: string
) {
  return page
    .locator("label")
    .filter({
      hasText: new RegExp(
        `^\\s*${escaparRegex(
          etiqueta
        )}\\s*$`
      ),
    })
    .locator("..")
    .locator("input")
    .first()
}

function selectPorEtiqueta(
  page: Page,
  etiqueta: string
) {
  return page
    .locator("label")
    .filter({
      hasText: new RegExp(
        `^\\s*${escaparRegex(
          etiqueta
        )}\\s*$`
      ),
    })
    .locator("..")
    .locator("select")
    .first()
}

async function autenticarSupabase() {
  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword(
      {
        email: TEST_EMAIL!,
        password: TEST_PASSWORD!,
      }
    )

  if (error) {
    throw new Error(
      `No se pudo autenticar en Supabase: ${error.message}`
    )
  }

  if (!data.session) {
    throw new Error(
      "Supabase no devolvió una sesión."
    )
  }
}

/*
 * ============================================================
 * LIMPIEZA
 * ============================================================
 */

async function limpiarDatosPrueba() {
  /*
   * Pago
   */
  if (pagoId) {
    await supabase
      .from("pagos")
      .delete()
      .eq("id", pagoId)
  }

  /*
   * Factura de prueba con IVA incluido
   */
  if (facturaIvaIncluidoId) {
    await supabase
      .from("factura_detalles")
      .delete()
      .eq(
        "factura_id",
        facturaIvaIncluidoId
      )

    await supabase
      .from("facturas")
      .delete()
      .eq(
        "id",
        facturaIvaIncluidoId
      )
  }

  /*
   * Factura principal
   */
  if (facturaId) {
    await supabase
      .from("factura_detalles")
      .delete()
      .eq(
        "factura_id",
        facturaId
      )

    await supabase
      .from("facturas")
      .delete()
      .eq("id", facturaId)
  }

  /*
   * Cotización de prueba con IVA incluido
   */
  if (cotizacionIvaIncluidoId) {
    await supabase
      .from("cotizacion_detalles")
      .delete()
      .eq(
        "cotizacion_id",
        cotizacionIvaIncluidoId
      )

    await supabase
      .from("cotizaciones")
      .delete()
      .eq(
        "id",
        cotizacionIvaIncluidoId
      )
  }

  /*
   * Cotización principal
   */
  if (cotizacionId) {
    await supabase
      .from(
        "cotizacion_detalles"
      )
      .delete()
      .eq(
        "cotizacion_id",
        cotizacionId
      )

    await supabase
      .from("cotizaciones")
      .delete()
      .eq(
        "id",
        cotizacionId
      )
  }

  /*
   * Producto
   */
  if (productoId) {
    await supabase
      .from("productos")
      .delete()
      .eq("id", productoId)
  } else {
    await supabase
      .from("productos")
      .delete()
      .eq(
        "codigo",
        datosPrueba.productoCodigo
      )
  }

  /*
   * Cliente
   */
  if (clienteId) {
    await supabase
      .from("clientes")
      .delete()
      .eq("id", clienteId)
  } else {
    await supabase
      .from("clientes")
      .delete()
      .eq(
        "correo",
        datosPrueba.clienteCorreo
      )
  }
}

/*
 * ============================================================
 * LOGIN
 * ============================================================
 */

async function iniciarSesion(
  page: Page
) {
  await page.goto(urls.login)

  await expect(
    page.getByRole("heading", {
      name: "Iniciar sesión",
      exact: true,
    })
  ).toBeVisible()

  await page
    .locator('input[type="email"]')
    .fill(TEST_EMAIL!)

  await page
    .locator('input[type="password"]')
    .fill(TEST_PASSWORD!)

  await page
    .getByRole("button", {
      name: "Iniciar sesión",
      exact: true,
    })
    .click()

  await expect(
    page.getByRole("heading", {
      name: "Dashboard",
      exact: true,
    })
  ).toBeVisible({
    timeout: 15000,
  })
}

/*
 * ============================================================
 * CLIENTE
 * ============================================================
 */

async function crearCliente(
  page: Page
) {
  await page.goto(
    urls.clientes
  )

  await expect(
    page.getByRole(
      "heading",
      {
        name: "Clientes",
        exact: true,
      }
    )
  ).toBeVisible()

  const botonNuevo =
    page
      .getByRole("button", {
        name: "Nuevo cliente",
      })
      .first()

  await expect(
    botonNuevo
  ).toBeVisible()

  await botonNuevo.click()

  const tituloModal =
    page.getByRole(
      "heading",
      {
        name: "Nuevo cliente",
        exact: true,
      }
    )

  await expect(
    tituloModal
  ).toBeVisible()

  /*
   * El formulario actual ya no usa
   * placeholder para el nombre.
   */
  await inputPorEtiqueta(
    page,
    "Nombre completo *"
  ).fill(
    datosPrueba.clienteNombre
  )

  await inputPorEtiqueta(
    page,
    "Correo"
  ).fill(
    datosPrueba.clienteCorreo
  )

  await page
    .getByRole("button", {
      name: "Guardar cliente",
    })
    .click()

  await expect(
    tituloModal
  ).toBeHidden({
    timeout: 15000,
  })

  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("clientes")
          .select("*")
          .eq(
            "correo",
            datosPrueba.clienteCorreo
          )
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          clienteId = data.id
        }

        return data
      },
      {
        timeout: 10000,
      }
    )
    .not.toBeNull()

  const {
    data: cliente,
    error,
  } = await supabase
    .from("clientes")
    .select("*")
    .eq(
      "id",
      clienteId!
    )
    .single()

  expect(error).toBeNull()

  expect(
    cliente.nombre_completo
  ).toBe(
    datosPrueba.clienteNombre
  )

  expect(
    cliente.correo
  ).toBe(
    datosPrueba.clienteCorreo
  )

  expect(
    cliente.estado
  ).toBe("activo")
}


/*
 * ============================================================
 * EDITAR CLIENTE
 * ============================================================
 */

async function editarCliente(
  page: Page
) {
  await page.goto(
    `/clientes/${clienteId}?editar=1`
  )

  await expect(
    page.getByRole("heading", {
      name: "Editar cliente",
      exact: true,
    })
  ).toBeVisible({
    timeout: 15000,
  })

  await inputPorEtiqueta(
    page,
    "Nombre completo *"
  ).fill(
    datosPrueba.clienteNombreEditado
  )

  await inputPorEtiqueta(
    page,
    "Telefono"
  ).fill(
    datosPrueba.clienteTelefono
  )

  await page
    .getByRole("button", {
      name: "Guardar cambios",
      exact: true,
    })
    .click()

  /*
   * No dependemos del encabezado con el nombre nuevo.
   * La señal estable de que terminó el guardado es que
   * desaparezca el formulario "Editar cliente".
   */
  await expect(
    page.getByRole("heading", {
      name: "Editar cliente",
      exact: true,
    })
  ).toBeHidden({
    timeout: 15000,
  })

  /*
   * La verificación real se hace contra Supabase.
   */
  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("clientes")
          .select("nombre_completo, telefono")
          .eq("id", clienteId!)
          .single()

        if (error) {
          throw error
        }

        return data
      },
      {
        timeout: 10000,
      }
    )
    .toMatchObject({
      nombre_completo:
        datosPrueba.clienteNombreEditado,
      telefono:
        datosPrueba.clienteTelefono,
    })

  console.log(
    "✅ Cliente editado y verificado"
  )
}

/*
 * ============================================================
 * MUEBLE / PRODUCTO
 * ============================================================
 */

async function crearMueble(
  page: Page
) {
  await page.goto(
    urls.muebles
  )

  await expect(
    page.getByRole(
      "heading",
      {
        name: "Muebles",
        exact: true,
      }
    )
  ).toBeVisible()

  await page
    .getByRole("button", {
      name: "Nuevo mueble",
    })
    .click()

  const tituloModal =
    page.getByRole(
      "heading",
      {
        name: "Nuevo mueble",
        exact: true,
      }
    )

  await expect(
    tituloModal
  ).toBeVisible()

  await inputPorEtiqueta(
    page,
    "Código *"
  ).fill(
    datosPrueba.productoCodigo
  )

  await inputPorEtiqueta(
    page,
    "Nombre *"
  ).fill(
    datosPrueba.productoNombre
  )

  await inputPorEtiqueta(
    page,
    "Categoría"
  ).fill(
    datosPrueba.categoria
  )

  await inputPorEtiqueta(
    page,
    "Precio de venta"
  ).fill(
    String(
      datosPrueba.precio
    )
  )

  await inputPorEtiqueta(
    page,
    "Stock"
  ).fill(
    String(
      datosPrueba.stockInicial
    )
  )

  await page
    .getByRole("button", {
      name: "Guardar mueble",
    })
    .click()

  await expect(
    tituloModal
  ).toBeHidden({
    timeout: 15000,
  })

  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("productos")
          .select("*")
          .eq(
            "codigo",
            datosPrueba.productoCodigo
          )
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          productoId = data.id
        }

        return data
      },
      {
        timeout: 10000,
      }
    )
    .not.toBeNull()

  const {
    data: producto,
    error,
  } = await supabase
    .from("productos")
    .select("*")
    .eq(
      "id",
      productoId!
    )
    .single()

  expect(error).toBeNull()

  expect(
    producto.nombre
  ).toBe(
    datosPrueba.productoNombre
  )

  expect(
    Number(producto.precio)
  ).toBe(
    datosPrueba.precio
  )

  expect(
    Number(producto.stock)
  ).toBe(
    datosPrueba.stockInicial
  )

  expect(
    producto.estado
  ).toBe("activo")
}


/*
 * ============================================================
 * EDITAR MUEBLE
 * ============================================================
 */

async function editarMueble(
  page: Page
) {
  await page.goto(
    urls.muebles
  )

  await expect(
    page.getByRole("heading", {
      name: "Muebles",
      exact: true,
    })
  ).toBeVisible({
    timeout: 15000,
  })

  const buscador =
    page.locator(
      'input[placeholder="Buscar mueble..."]'
    )

  await buscador.fill(
    datosPrueba.productoCodigo
  )

  const filaProducto =
    page
      .locator("tr")
      .filter({
        hasText:
          datosPrueba.productoCodigo,
      })
      .first()

  await expect(
    filaProducto
  ).toBeVisible({
    timeout: 10000,
  })

  await filaProducto
    .locator(
      'button[title="Editar"]'
    )
    .click()

  const tituloModal =
    page.getByRole("heading", {
      name: "Editar mueble",
      exact: true,
    })

  await expect(
    tituloModal
  ).toBeVisible()

  await inputPorEtiqueta(
    page,
    "Categoría"
  ).fill(
    datosPrueba.categoriaEditada
  )

  await inputPorEtiqueta(
    page,
    "Material"
  ).fill(
    datosPrueba.materialEditado
  )

  await page
    .getByRole("button", {
      name: "Guardar cambios",
      exact: true,
    })
    .click()

  await expect(
    tituloModal
  ).toBeHidden({
    timeout: 15000,
  })

  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("productos")
          .select("categoria, material")
          .eq("id", productoId!)
          .single()

        if (error) {
          throw error
        }

        return data
      },
      {
        timeout: 10000,
      }
    )
    .toMatchObject({
      categoria:
        datosPrueba.categoriaEditada,
      material:
        datosPrueba.materialEditado,
    })

  console.log(
    "✅ Mueble editado y verificado"
  )
}

/*
 * ============================================================
 * COTIZACIÓN
 * ============================================================
 */

async function crearCotizacion(
  page: Page
) {
  await page.goto(
    urls.cotizaciones
  )

  await expect(
    page.getByRole(
      "heading",
      {
        name: "Cotizaciones",
        exact: true,
      }
    )
  ).toBeVisible()

  const botonNueva =
    page
      .getByRole("button", {
        name: "Nueva cotización",
      })
      .first()

  await botonNueva.click()

  const tituloModal =
    page.getByRole(
      "heading",
      {
        name: "Nueva cotización",
        exact: true,
      }
    )

  await expect(
    tituloModal
  ).toBeVisible()

  /*
   * Cliente
   */
  await selectPorEtiqueta(
    page,
    "Cliente *"
  ).selectOption(
    clienteId!
  )

  /*
   * Agregar producto
   */
  await page
    .getByRole("button", {
      name: "Agregar mueble",
    })
    .click()

  const buscadorProducto =
    page.locator(
      'input[placeholder="Buscar por código o nombre..."]'
    )

  await expect(
    buscadorProducto
  ).toBeVisible()

  await buscadorProducto.fill(
    datosPrueba.productoNombre
  )

  const botonProducto =
    page
      .getByRole("button")
      .filter({
        hasText:
          datosPrueba.productoNombre,
      })
      .first()

  await expect(
    botonProducto
  ).toBeVisible()

  await botonProducto.click()

  /*
   * Confirmar IVA separado.
   */
  await selectPorEtiqueta(
    page,
    "Modalidad IVA"
  ).selectOption(
    "separado"
  )

  await inputPorEtiqueta(
    page,
    "IVA %"
  ).fill(
    String(datosPrueba.iva)
  )

  await page
    .getByRole("button", {
      name: "Guardar cotización",
    })
    .click()

  await expect(
    tituloModal
  ).toBeHidden({
    timeout: 15000,
  })

  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "cotizaciones"
          )
          .select("*")
          .eq(
            "cliente_id",
            clienteId!
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          cotizacionId =
            data.id
        }

        return data
      },
      {
        timeout: 10000,
      }
    )
    .not.toBeNull()

  const {
    data: cotizacion,
    error,
  } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq(
      "id",
      cotizacionId!
    )
    .single()

  expect(error).toBeNull()

  expect(
    cotizacion.estado
  ).toBe("borrador")

  expect(
    Number(
      cotizacion.subtotal
    )
  ).toBe(100)

  expect(
    Number(
      cotizacion.iva
    )
  ).toBe(13)

  expect(
    Number(
      cotizacion.total
    )
  ).toBe(113)
}


/*
 * ============================================================
 * COTIZACIÓN - IVA INCLUIDO
 * ============================================================
 */

async function probarCotizacionIvaIncluido(
  page: Page
) {
  await page.goto(
    urls.cotizaciones
  )

  await expect(
    page.getByRole(
      "heading",
      {
        name: "Cotizaciones",
        exact: true,
      }
    )
  ).toBeVisible()

  await page
    .getByRole("button", {
      name: "Nueva cotización",
    })
    .first()
    .click()

  const tituloModal =
    page.getByRole(
      "heading",
      {
        name: "Nueva cotización",
        exact: true,
      }
    )

  await expect(
    tituloModal
  ).toBeVisible()

  await selectPorEtiqueta(
    page,
    "Cliente *"
  ).selectOption(
    clienteId!
  )

  await page
    .getByRole("button", {
      name: "Agregar mueble",
    })
    .click()

  const buscadorProducto =
    page.locator(
      'input[placeholder="Buscar por código o nombre..."]'
    )

  await buscadorProducto.fill(
    datosPrueba.productoNombre
  )

  const botonProducto =
    page
      .getByRole("button")
      .filter({
        hasText:
          datosPrueba.productoNombre,
      })
      .first()

  await expect(
    botonProducto
  ).toBeVisible()

  await botonProducto.click()

  /*
   * Para que la cuenta sea clara:
   * precio final = $113
   * IVA incluido 13% = $13
   * base neta = $100
   */
  await inputPorEtiqueta(
    page,
    "Precio unitario"
  ).fill(
    String(
      datosPrueba.precioIvaIncluido
    )
  )

  await selectPorEtiqueta(
    page,
    "Modalidad IVA"
  ).selectOption(
    "incluido"
  )

  await inputPorEtiqueta(
    page,
    "IVA %"
  ).fill(
    String(datosPrueba.iva)
  )

  await page
    .getByRole("button", {
      name: "Guardar cotización",
    })
    .click()

  await expect(
    tituloModal
  ).toBeHidden({
    timeout: 15000,
  })

  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("cotizaciones")
          .select("*")
          .eq(
            "cliente_id",
            clienteId!
          )
          .eq(
            "tipo_iva",
            "incluido"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          cotizacionIvaIncluidoId =
            data.id
        }

        return data
      },
      {
        timeout: 10000,
      }
    )
    .not.toBeNull()

  const {
    data: cotizacion,
    error,
  } = await supabase
    .from("cotizaciones")
    .select(
      "id, tipo_iva, porcentaje_iva, subtotal, iva, total"
    )
    .eq(
      "id",
      cotizacionIvaIncluidoId!
    )
    .single()

  expect(error).toBeNull()

  if (!cotizacion) {
    throw new Error(
      "No se encontró la cotización con IVA incluido."
    )
  }

  expect(
    cotizacion.tipo_iva
  ).toBe("incluido")

  expect(
    Number(
      cotizacion.porcentaje_iva
    )
  ).toBe(13)

  /*
   * En el modelo actual el campo subtotal conserva
   * el precio de línea, que ya contiene el IVA.
   */
  expect(
    Number(
      cotizacion.subtotal
    )
  ).toBeCloseTo(113, 2)

  expect(
    Number(
      cotizacion.iva
    )
  ).toBeCloseTo(13, 2)

  expect(
    Number(
      cotizacion.total
    )
  ).toBeCloseTo(113, 2)

  /*
   * Comprobación económica:
   * total - IVA incluido = base sin IVA.
   */
  expect(
    Number(
      cotizacion.total
    ) -
      Number(
        cotizacion.iva
      )
  ).toBeCloseTo(100, 2)

  console.log(
    "✅ Cotización IVA incluido: $113 = $100 base + $13 IVA"
  )
}

/*
 * ============================================================
 * APROBAR COTIZACIÓN
 * ============================================================
 */

async function aprobarCotizacion(
  page: Page
) {
  await page.goto(
    `/cotizaciones/${cotizacionId}/editar`
  )

  await expect(
    page.getByText(
      "Editando cotización",
      {
        exact: true,
      }
    )
  ).toBeVisible({
    timeout: 15000,
  })

  await selectPorEtiqueta(
    page,
    "Estado"
  ).selectOption(
    "aprobada"
  )

  await page
    .getByRole("button", {
      name: "Guardar cambios",
    })
    .first()
    .click()

  await page.waitForURL(
    `**/cotizaciones/${cotizacionId}`,
    {
      timeout: 15000,
    }
  )

  const {
    data: cotizacion,
    error,
  } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq(
      "id",
      cotizacionId!
    )
    .single()

  expect(error).toBeNull()

  expect(
    cotizacion.estado
  ).toBe(
    "aprobada"
  )
}

/*
 * ============================================================
 * FACTURA
 * ============================================================
 */

async function crearYEmitirFactura(
  page: Page
) {
  await page.goto(
    urls.facturacionNueva
  )

  await expect(
    page.getByRole(
      "heading",
      {
        name: "Crear factura",
      }
    )
  ).toBeVisible({
    timeout: 15000,
  })

  /*
   * Cliente
   */
  await selectPorEtiqueta(
    page,
    "Cliente"
  ).selectOption(
    clienteId!
  )

  /*
   * La factura nueva ya trae una línea.
   * No presionamos "Agregar" porque
   * dejaríamos una segunda línea vacía.
   */
  await selectPorEtiqueta(
    page,
    "Producto / mueble"
  ).selectOption(
    productoId!
  )

  await inputPorEtiqueta(
    page,
    "Cantidad"
  ).fill(
    String(
      datosPrueba.cantidadFactura
    )
  )

  await inputPorEtiqueta(
    page,
    "Precio unitario"
  ).fill(
    String(
      datosPrueba.precio
    )
  )

  /*
   * Facturación inicia con IVA incluido,
   * pero esta prueba quiere comprobar
   * $100 + 13% = $113.
   */
  await selectPorEtiqueta(
    page,
    "IVA"
  ).selectOption(
    "separado"
  )

  await inputPorEtiqueta(
    page,
    "Porcentaje de IVA"
  ).fill(
    String(
      datosPrueba.iva
    )
  )

  /*
   * CASMAD pide confirmación antes de emitir.
   * Playwright cancela los confirm por defecto,
   * así que debemos aceptarlo explícitamente.
   */
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm")

    console.log(
      "Confirmando emisión de factura:",
      dialog.message()
    )

    await dialog.accept()
  })

  await page
    .getByRole("button", {
      name: "Emitir factura",
    })
    .first()
    .click()

  /*
   * Esperamos que la factura aparezca
   * en la base de datos.
   */
  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("facturas")
          .select("*")
          .eq(
            "cliente_id",
            clienteId!
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          facturaId =
            data.id
        }

        return data?.estado
      },
      {
        timeout: 15000,
      }
    )
    .toBe("emitida")

  const {
    data: factura,
    error,
  } = await supabase
    .from("facturas")
    .select("*")
    .eq(
      "id",
      facturaId!
    )
    .single()

  expect(error).toBeNull()

  expect(
    factura.estado
  ).toBe("emitida")

  expect(
    Number(
      factura.subtotal
    )
  ).toBe(100)

  expect(
    Number(
      factura.iva
    )
  ).toBe(13)

  expect(
    Number(
      factura.total
    )
  ).toBe(113)
}


/*
 * ============================================================
 * FACTURA - IVA INCLUIDO
 * ============================================================
 */

async function probarFacturaIvaIncluido(
  page: Page
) {
  await page.goto(
    urls.facturacionNueva
  )

  await expect(
    page.getByRole(
      "heading",
      {
        name: "Crear factura",
        exact: true,
      }
    )
  ).toBeVisible({
    timeout: 15000,
  })

  await selectPorEtiqueta(
    page,
    "Cliente"
  ).selectOption(
    clienteId!
  )

  await selectPorEtiqueta(
    page,
    "Producto / mueble"
  ).selectOption(
    productoId!
  )

  await inputPorEtiqueta(
    page,
    "Cantidad"
  ).fill("1")

  await inputPorEtiqueta(
    page,
    "Precio unitario"
  ).fill(
    String(
      datosPrueba.precioIvaIncluido
    )
  )

  await selectPorEtiqueta(
    page,
    "IVA"
  ).selectOption(
    "incluido"
  )

  await inputPorEtiqueta(
    page,
    "Porcentaje de IVA"
  ).fill(
    String(datosPrueba.iva)
  )

  /*
   * Guardamos como borrador para comprobar
   * la matemática sin volver a descontar stock.
   */
  await page
    .getByRole("button", {
      name: "Guardar borrador",
      exact: true,
    })
    .first()
    .click()

  await page.waitForURL(
    /\/facturacion\/[^/]+$/,
    {
      timeout: 15000,
    }
  )

  const partesUrl =
    new URL(page.url())
      .pathname
      .split("/")
      .filter(Boolean)

  facturaIvaIncluidoId =
    partesUrl.at(-1) ?? null

  if (
    !facturaIvaIncluidoId
  ) {
    throw new Error(
      "No se pudo obtener el ID de la factura con IVA incluido."
    )
  }

  const {
    data: factura,
    error,
  } = await supabase
    .from("facturas")
    .select(
      "id, estado, tipo_iva, porcentaje_iva, subtotal, iva, total"
    )
    .eq(
      "id",
      facturaIvaIncluidoId
    )
    .single()

  expect(error).toBeNull()

  if (!factura) {
    throw new Error(
      "No se encontró la factura con IVA incluido."
    )
  }

  expect(
    factura.estado
  ).toBe("borrador")

  expect(
    factura.tipo_iva
  ).toBe("incluido")

  expect(
    Number(
      factura.porcentaje_iva
    )
  ).toBe(13)

  expect(
    Number(
      factura.subtotal
    )
  ).toBeCloseTo(113, 2)

  expect(
    Number(
      factura.iva
    )
  ).toBeCloseTo(13, 2)

  expect(
    Number(
      factura.total
    )
  ).toBeCloseTo(113, 2)

  expect(
    Number(
      factura.total
    ) -
      Number(
        factura.iva
      )
  ).toBeCloseTo(100, 2)

  /*
   * Como es borrador, el inventario NO debe
   * descontarse de nuevo. Debe seguir en 9
   * después de la factura emitida anterior.
   */
  const {
    data: producto,
    error: productoError,
  } = await supabase
    .from("productos")
    .select("stock")
    .eq(
      "id",
      productoId!
    )
    .single()

  expect(
    productoError
  ).toBeNull()

  if (!producto) {
    throw new Error(
      "No se encontró el producto al comprobar el inventario."
    )
  }

  expect(
    Number(
      producto.stock
    )
  ).toBe(9)

  console.log(
    "✅ Factura IVA incluido: $113 = $100 base + $13 IVA; borrador no altera inventario"
  )
}

/*
 * ============================================================
 * INVENTARIO
 * ============================================================
 */

async function verificarInventario() {
  const {
    data: producto,
    error,
  } = await supabase
    .from("productos")
    .select("stock")
    .eq(
      "id",
      productoId!
    )
    .single()

  expect(error).toBeNull()

  if (!producto) {
    throw new Error(
      "No se encontró el producto al verificar inventario."
    )
  }

  /*
   * Creado con 10.
   * Facturamos 1.
   * Debe quedar 9.
   */
  expect(
    Number(producto.stock)
  ).toBe(9)
}

/*
 * ============================================================
 * PAGO
 * ============================================================
 */

async function registrarPago(
  page: Page
) {
  await page.goto(
    `/facturacion/${facturaId}`
  )

  /*
   * Esperar que la factura termine de cargar
   * y que aparezca el botón de pago.
   */
  const botonRegistrar =
    page
      .getByRole("button", {
        name: "Registrar pago",
        exact: true,
      })
      .first()

  await expect(
    botonRegistrar
  ).toBeVisible({
    timeout: 15000,
  })

  await botonRegistrar.click()

  /*
   * "Registrar pago" no necesariamente es
   * un heading semántico. Verificamos un
   * texto único del formulario.
   */
  await expect(
    page.getByText(
      "Saldo disponible para abonar:",
      {
        exact: false,
      }
    )
  ).toBeVisible({
    timeout: 10000,
  })

  /*
   * El formulario normalmente coloca el saldo
   * pendiente automáticamente. Lo llenamos con
   * el total esperado para comprobar el flujo.
   */
  await inputPorEtiqueta(
    page,
    "Monto del pago"
  ).fill("113.00")

  await selectPorEtiqueta(
    page,
    "Metodo de pago"
  ).selectOption(
    "efectivo"
  )

  await page
    .getByRole("button", {
      name: "Guardar pago",
      exact: true,
    })
    .click()

  /*
   * Esperar que el pago realmente exista
   * en Supabase.
   */
  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("pagos")
          .select("*")
          .eq(
            "factura_id",
            facturaId!
          )
          .order(
            "fecha_pago",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data) {
          pagoId = data.id
        }

        return data
      },
      {
        timeout: 15000,
      }
    )
    .not.toBeNull()

  /*
   * Comprobar los datos del pago.
   */
  const {
    data: pago,
    error: pagoError,
  } = await supabase
    .from("pagos")
    .select("*")
    .eq(
      "id",
      pagoId!
    )
    .single()

  expect(
    pagoError
  ).toBeNull()

  expect(
    Number(pago.monto)
  ).toBe(113)

  expect(
    pago.metodo_pago
  ).toBe("efectivo")

  /*
   * Cuando el pago cubre el total,
   * la factura debe pasar a "pagada".
   */
  await expect
    .poll(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from("facturas")
          .select("estado")
          .eq(
            "id",
            facturaId!
          )
          .single()

        if (error) {
          throw error
        }

        return data.estado
      },
      {
        timeout: 15000,
      }
    )
    .toBe("pagada")

  console.log(
    "✅ Pago registrado: $113.00 en efectivo"
  )
}

/*
 * ============================================================
 * VERIFICACIÓN FINAL
 * ============================================================
 */

async function verificarEstadoFinal() {
  /*
   * Cliente
   */
  const {
    data: cliente,
    error: clienteError,
  } = await supabase
    .from("clientes")
    .select("*")
    .eq(
      "id",
      clienteId!
    )
    .single()

  expect(
    clienteError
  ).toBeNull()

  expect(
    cliente.nombre_completo
  ).toBe(
    datosPrueba.clienteNombreEditado
  )

  /*
   * Producto
   */
  const {
    data: producto,
    error: productoError,
  } = await supabase
    .from("productos")
    .select("*")
    .eq(
      "id",
      productoId!
    )
    .single()

  expect(
    productoError
  ).toBeNull()

  expect(
    producto.nombre
  ).toBe(
    datosPrueba.productoNombre
  )

  expect(
    producto.categoria
  ).toBe(
    datosPrueba.categoriaEditada
  )

  expect(
    producto.material
  ).toBe(
    datosPrueba.materialEditado
  )

  expect(
    Number(
      producto.precio
    )
  ).toBe(100)

  expect(
    Number(
      producto.stock
    )
  ).toBe(9)

  /*
   * Cotización
   */
  const {
    data: cotizacion,
    error: cotizacionError,
  } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq(
      "id",
      cotizacionId!
    )
    .single()

  expect(
    cotizacionError
  ).toBeNull()

  expect(
    cotizacion.cliente_id
  ).toBe(clienteId)

  expect(
    cotizacion.estado
  ).toBe(
    "aprobada"
  )

  expect(
    Number(
      cotizacion.subtotal
    )
  ).toBe(100)

  expect(
    Number(
      cotizacion.iva
    )
  ).toBe(13)

  expect(
    Number(
      cotizacion.total
    )
  ).toBe(113)

  /*
   * Factura
   */
  const {
    data: factura,
    error: facturaError,
  } = await supabase
    .from("facturas")
    .select("*")
    .eq(
      "id",
      facturaId!
    )
    .single()

  expect(
    facturaError
  ).toBeNull()

  expect(
    factura.cliente_id
  ).toBe(clienteId)

  expect(
    Number(
      factura.subtotal
    )
  ).toBe(100)

  expect(
    Number(
      factura.iva
    )
  ).toBe(13)

  expect(
    Number(
      factura.total
    )
  ).toBe(113)

  expect(
    factura.estado
  ).toBe(
    "pagada"
  )

  /*
   * Pago
   */
  const {
    data: pago,
    error: pagoError,
  } = await supabase
    .from("pagos")
    .select("*")
    .eq(
      "id",
      pagoId!
    )
    .single()

  expect(
    pagoError
  ).toBeNull()

  expect(
    pago.factura_id
  ).toBe(facturaId)

  expect(
    Number(
      pago.monto
    )
  ).toBe(113)

  expect(
    pago.metodo_pago
  ).toBe(
    "efectivo"
  )
}

/*
 * ============================================================
 * TEST COMPLETO CASMAD
 * ============================================================
 */

test.describe(
  "CASMAD ERP E2E",
  () => {
    test.beforeAll(
      async () => {
        await autenticarSupabase()
        await limpiarDatosPrueba()
      }
    )

    test.afterAll(
      async () => {
        await limpiarDatosPrueba()
      }
    )

    test(
      "Flujo completo: cliente → mueble → IVA separado/incluido → factura → inventario → pago",
      async ({ page }) => {
        test.setTimeout(
          120000
        )

        console.log(
          "1/12 Login..."
        )
        await iniciarSesion(
          page
        )

        console.log(
          "2/12 Creando cliente..."
        )
        await crearCliente(
          page
        )

        console.log(
          "3/12 Editando cliente..."
        )
        await editarCliente(
          page
        )

        console.log(
          "4/12 Creando mueble..."
        )
        await crearMueble(
          page
        )

        console.log(
          "5/12 Editando mueble..."
        )
        await editarMueble(
          page
        )

        console.log(
          "6/12 Cotización con IVA separado..."
        )
        await crearCotizacion(
          page
        )

        console.log(
          "7/12 Cotización con IVA incluido..."
        )
        await probarCotizacionIvaIncluido(
          page
        )

        console.log(
          "8/12 Aprobando cotización principal..."
        )
        await aprobarCotizacion(
          page
        )

        console.log(
          "9/12 Factura con IVA separado + emisión..."
        )
        await crearYEmitirFactura(
          page
        )

        console.log(
          "10/12 Verificando inventario 10 → 9..."
        )
        await verificarInventario()

        console.log(
          "11/12 Factura con IVA incluido en borrador..."
        )
        await probarFacturaIvaIncluido(
          page
        )

        console.log(
          "12/12 Registrando pago y verificando todo..."
        )
        await registrarPago(
          page
        )

        await verificarEstadoFinal()

        console.log(
          "✅ PRUEBA E2E CASMAD COMPLETADA"
        )
      }
    )
  }
)