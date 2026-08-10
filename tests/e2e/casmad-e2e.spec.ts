import path from 'path'
import { config } from 'dotenv'
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required')
}

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables are required for the login test')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function ensureAuthenticatedSupabase() {
  const { error, data } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (error) {
    throw new Error(`Supabase authentication failed: ${error.message}`)
  }

  if (!data?.session) {
    throw new Error('Supabase authentication did not return a session')
  }
}

const e2eSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const testData = {
  clienteNombre: `TEST E2E CASMAD ${e2eSuffix}`,
  clienteCorreo: `test-e2e-casmad-${e2eSuffix}@example.com`,
  productoNombre: `TEST PRODUCTO E2E ${e2eSuffix}`,
  productoCodigo: `TEST-E2E-${e2eSuffix}`,
  productoPrecio: '100.00',
  cantidad: '1',
}

let clienteId: string | null = null
let productoId: string | null = null
let cotizacionId: string | null = null
let facturaId: string | null = null
let pagoId: string | null = null

const urls = {
  login: '/login',
  clientes: '/clientes',
  muebles: '/muebles',
  cotizaciones: '/cotizaciones',
  facturacionNueva: '/facturacion/nueva',
}

async function cleanupTestData() {
  if (pagoId) {
    await supabase.from('pagos').delete().eq('id', pagoId)
  }
  if (facturaId) {
    await supabase.from('factura_detalles').delete().eq('factura_id', facturaId)
    await supabase.from('facturas').delete().eq('id', facturaId)
  }
  if (cotizacionId) {
    await supabase.from('cotizacion_detalles').delete().eq('cotizacion_id', cotizacionId)
    await supabase.from('cotizaciones').delete().eq('id', cotizacionId)
  }
  if (productoId) {
    await supabase.from('productos').delete().eq('id', productoId)
  } else {
    await supabase.from('productos').delete().eq('codigo', testData.productoCodigo)
  }
  if (clienteId) {
    await supabase.from('clientes').delete().eq('id', clienteId)
  } else {
    await supabase.from('clientes').delete().eq('correo', testData.clienteCorreo)
  }
}

async function verifyCuentaLogin(page: any) {
  await page.goto(urls.login)
  await expect(page.locator('h2', { hasText: 'Iniciar sesión' })).toBeVisible()
  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 15000 })
}

async function crearCliente(page: any) {
  await page.goto(urls.clientes)
  await expect(page.locator('h1', { hasText: 'Clientes' })).toBeVisible()
  const nuevoClienteBtn = page.locator('button:has-text("Nuevo cliente")').first()
  await expect(nuevoClienteBtn).toBeVisible({ timeout: 10000 })
  await nuevoClienteBtn.click()
  await page.waitForSelector('h2:has-text("Nuevo cliente")', { timeout: 10000 })
  await page.locator('input[placeholder="Ej. Juan Pérez"]').fill(testData.clienteNombre)
  await page.locator('input[placeholder="correo@ejemplo.com"]').fill(testData.clienteCorreo)
  await page.locator('button:has-text("Guardar cliente")').click()
  await page.locator('h2', { hasText: 'Nuevo cliente' }).waitFor({ state: 'detached' })

  const cliente = await supabase
    .from('clientes')
    .select('*')
    .eq('correo', testData.clienteCorreo)
    .maybeSingle()

  expect(cliente.error).toBeNull()
  expect(cliente.data).not.toBeNull()
  expect(cliente.data.estado).toBe('activo')
  clienteId = cliente.data.id
}

async function crearProducto(page: any) {
  await page.goto(urls.muebles)
  await expect(page.locator('h1', { hasText: 'Muebles' })).toBeVisible()
  await page.locator('button:has-text("Nuevo mueble")').click()
  await expect(page.locator('h2', { hasText: 'Nuevo mueble' })).toBeVisible()
  await page.locator('input[placeholder="Ej. SAL-001"]').fill(testData.productoCodigo)
  await page.locator('input[placeholder="Ej. Sala Roma"]').fill(testData.productoNombre)
  await page.locator('input[placeholder="Sala, comedor, dormitorio..."]').fill('TEST E2E')
  await page.locator('label:has-text("Precio de venta")').locator('xpath=..').locator('input[type="number"]').fill(testData.productoPrecio)
  await page.locator('label:has-text("Stock")').locator('xpath=..').locator('input[type="number"]').fill('10')
  await page.locator('button:has-text("Guardar mueble")').click()
  await page.locator('h2', { hasText: 'Nuevo mueble' }).waitFor({ state: 'detached' })

  const producto = await supabase
    .from('productos')
    .select('*')
    .eq('codigo', testData.productoCodigo)
    .maybeSingle()

  expect(producto.error).toBeNull()
  expect(producto.data).not.toBeNull()
  expect(producto.data.estado).toBe('activo')
  expect(producto.data.precio).toBe(100)
  productoId = producto.data.id
}

async function crearCotizacion(page: any) {
  await page.goto(urls.cotizaciones)
  await expect(page.locator('h1', { hasText: 'Cotizaciones' })).toBeVisible()
  const nuevaCotizacionButton = page.locator('button:has-text("Nueva cotización")').first()
  await expect(nuevaCotizacionButton).toBeVisible({ timeout: 10000 })
  await expect(nuevaCotizacionButton).toBeEnabled({ timeout: 10000 })
  await nuevaCotizacionButton.click()
  await page.waitForSelector('h2:has-text("Nueva cotización")', { timeout: 15000 })
  const modalHeading = page.locator('h2:has-text("Nueva cotización")')

  const clienteSelect = page.locator('label:has-text("Cliente *") + select')
  await expect(clienteSelect).toBeVisible({ timeout: 10000 })
  await clienteSelect.selectOption({ label: testData.clienteNombre })

  await page.locator('button:has-text("Agregar mueble")').click()
  const productoBuscador = page.locator('input[placeholder="Buscar por código o nombre..."]')
  await expect(productoBuscador).toBeVisible({ timeout: 10000 })
  await productoBuscador.fill(testData.productoNombre)
  await page.waitForTimeout(500)
  await page.locator(`button:has-text("${testData.productoNombre}")`).first().click()

  const cantidadInput = page.locator('label:has-text("Cantidad")').locator('xpath=../input')
  const precioUnitarioInput = page.locator('label:has-text("Precio unitario")').locator('xpath=../input')
  await expect(cantidadInput).toBeVisible({ timeout: 10000 })
  await expect(precioUnitarioInput).toBeVisible({ timeout: 10000 })
  await cantidadInput.fill(testData.cantidad)
  await precioUnitarioInput.fill(testData.productoPrecio)

  await page.locator('button:has-text("Guardar cotización")').click()
  await expect(nuevaCotizacionButton).toBeVisible({ timeout: 10000 })

  // small delay to allow DB write propagation
  await new Promise((res) => setTimeout(res, 800))

  const { data: cotList, error: cotListError } = await supabase
    .from('cotizaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  expect(cotListError).toBeNull()

  const found = (cotList ?? []).find((c: any) => c.cliente_id === clienteId || (c.subtotal === 100 && c.total === 113))

  expect(found).toBeDefined()
  expect(found.estado).toBe('borrador')
  expect(found.subtotal).toBe(100)
  expect(found.total).toBe(113)
  expect(found.iva).toBe(13)
  cotizacionId = found.id
}

async function aprobarCotizacion(page: any) {
  await page.goto(`/cotizaciones/${cotizacionId}/editar`)
  await expect(page.locator('text=Editando cotización')).toBeVisible()
  await page.locator('select').filter({ hasText: 'Estado' }).selectOption('aprobada')
  await page.locator('button:has-text("Guardar cambios")').click()
  await page.waitForURL(`**/cotizaciones/${cotizacionId}`)

  const cotizacion = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('id', cotizacionId)
    .maybeSingle()

  expect(cotizacion.error).toBeNull()
  expect(cotizacion.data.estado).toBe('aprobada')
}

async function crearYEmitirFactura(page: any) {
  await page.goto(urls.facturacionNueva)
  await expect(page.locator('text=Crear factura')).toBeVisible()
  await page.locator('select').filter({ hasText: 'Seleccionar cliente...' }).first().selectOption(clienteId!)
  await page.locator(`select`).filter({ hasText: 'Seleccionar mueble...' }).first()
  await page.locator('button:has-text("Agregar")').first().click()
  await page.locator('select').filter({ hasText: 'Seleccionar mueble...' }).first().selectOption(productoId!)
  await page.locator('input[placeholder="Cantidad"]').fill(testData.cantidad)
  await page.locator('input[placeholder="Precio unitario"]').fill(testData.productoPrecio)
  await page.locator('button:has-text("Emitir factura")').click()

  const factura = await supabase
    .from('facturas')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  expect(factura.error).toBeNull()
  expect(factura.data).not.toBeNull()
  expect(factura.data.estado).toBe('emitida')
  expect(factura.data.subtotal).toBe(100)
  expect(factura.data.total).toBe(113)
  expect(factura.data.iva).toBe(13)
  facturaId = factura.data.id
}

async function registrarPago(page: any) {
  await page.goto(`/facturacion/${facturaId}`)
  await expect(page.locator('text=Registrar pago')).toBeVisible()
  await page.locator('button:has-text("Registrar pago")').click()
  await page.locator('input[placeholder="0.00"]').fill('113.00')
  await page.locator('select').filter({ hasText: 'Efectivo' }).selectOption('efectivo')
  await page.locator('button:has-text("Guardar pago")').click()

  const pago = await supabase
    .from('pagos')
    .select('*')
    .eq('factura_id', facturaId)
    .order('fecha_pago', { ascending: false })
    .limit(1)
    .maybeSingle()

  expect(pago.error).toBeNull()
  expect(pago.data).not.toBeNull()
  expect(pago.data.monto).toBe(113)
  expect(pago.data.metodo_pago).toBe('efectivo')
  pagoId = pago.data.id

  const factura = await supabase
    .from('facturas')
    .select('*')
    .eq('id', facturaId)
    .maybeSingle()

  expect(factura.error).toBeNull()
  expect(factura.data.estado).toBe('pagada')
}

async function verificarInventario() {
  const producto = await supabase
    .from('productos')
    .select('stock')
    .eq('id', productoId)
    .maybeSingle()

  expect(producto.error).toBeNull()
  expect(producto.data).not.toBeNull()
}

async function verifyFinalState() {
  const cliente = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .maybeSingle()
  expect(cliente.error).toBeNull()
  expect(cliente.data.nombre_completo).toBe(testData.clienteNombre)

  const producto = await supabase
    .from('productos')
    .select('*')
    .eq('id', productoId)
    .maybeSingle()
  expect(producto.error).toBeNull()
  expect(producto.data.nombre).toBe(testData.productoNombre)
  expect(producto.data.precio).toBe(100)

  const cotizacion = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('id', cotizacionId)
    .maybeSingle()
  expect(cotizacion.error).toBeNull()
  expect(cotizacion.data.cliente_id).toBe(clienteId)
  expect(cotizacion.data.estado).toBe('aprobada')
  expect(cotizacion.data.subtotal).toBe(100)
  expect(cotizacion.data.iva).toBe(13)
  expect(cotizacion.data.total).toBe(113)

  const factura = await supabase
    .from('facturas')
    .select('*')
    .eq('id', facturaId)
    .maybeSingle()
  expect(factura.error).toBeNull()
  expect(factura.data.cliente_id).toBe(clienteId)
  expect(factura.data.subtotal).toBe(100)
  expect(factura.data.iva).toBe(13)
  expect(factura.data.total).toBe(113)
  expect(factura.data.estado).toBe('pagada')

  const pago = await supabase
    .from('pagos')
    .select('*')
    .eq('id', pagoId)
    .maybeSingle()
  expect(pago.error).toBeNull()
  expect(pago.data.factura_id).toBe(facturaId)
  expect(pago.data.monto).toBe(113)
}

test.describe('CASMAD ERP E2E', () => {
  test.beforeAll(async () => {
    await cleanupTestData()
    await ensureAuthenticatedSupabase()
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('Full E2E flow', async ({ page }) => {
    await verifyCuentaLogin(page)
    await crearCliente(page)
    await crearProducto(page)
    await crearCotizacion(page)
    await aprobarCotizacion(page)
    await crearYEmitirFactura(page)
    await registrarPago(page)
    await verifyFinalState()
  })
})
