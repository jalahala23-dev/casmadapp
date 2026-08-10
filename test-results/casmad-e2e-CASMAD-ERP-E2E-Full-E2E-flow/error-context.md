# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: casmad-e2e.spec.ts >> CASMAD ERP E2E >> Full E2E flow
- Location: tests\e2e\casmad-e2e.spec.ts:348:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Editando cotización')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Editando cotización')
  - Protocol error (Runtime.callFunctionOn): Page crashed.

```

```yaml
- complementary:
  - heading "CASMAD" [level=1]
  - paragraph: Muebles Castillo
  - paragraph: Sistema Administrativo
  - navigation:
    - link "Dashboard":
      - /url: /
    - link "Clientes":
      - /url: /clientes
    - link "Muebles":
      - /url: /muebles
    - link "Inventario":
      - /url: /inventario
    - link "Cotizaciones":
      - /url: /cotizaciones
    - link "Facturación":
      - /url: /facturacion
    - link "Reportes":
      - /url: /reportes
    - link "Configuración":
      - /url: /configuracion
  - paragraph: CASMAD ERP
  - paragraph: Muebles Castillo
- banner:
  - paragraph: Sistema administrativo
  - paragraph: Muebles Castillo
  - button "Notificaciones"
  - button "Menú de usuario":
    - paragraph: jalahala
    - paragraph: Administrador
- main: Cargando cotización...
- alert
```

# Test source

```ts
  100 |   await expect(nuevoClienteBtn).toBeVisible({ timeout: 10000 })
  101 |   await nuevoClienteBtn.click()
  102 |   await page.waitForSelector('h2:has-text("Nuevo cliente")', { timeout: 10000 })
  103 |   await page.locator('input[placeholder="Ej. Juan Pérez"]').fill(testData.clienteNombre)
  104 |   await page.locator('input[placeholder="correo@ejemplo.com"]').fill(testData.clienteCorreo)
  105 |   await page.locator('button:has-text("Guardar cliente")').click()
  106 |   await page.locator('h2', { hasText: 'Nuevo cliente' }).waitFor({ state: 'detached' })
  107 | 
  108 |   const cliente = await supabase
  109 |     .from('clientes')
  110 |     .select('*')
  111 |     .eq('correo', testData.clienteCorreo)
  112 |     .single()
  113 | 
  114 |   expect(cliente.error).toBeNull()
  115 |   expect(cliente.data).not.toBeNull()
  116 |   expect(cliente.data.estado).toBe('activo')
  117 |   clienteId = cliente.data.id
  118 | }
  119 | 
  120 | async function crearProducto(page: any) {
  121 |   await page.goto(urls.muebles)
  122 |   await expect(page.locator('h1', { hasText: 'Muebles' })).toBeVisible()
  123 |   await page.locator('button:has-text("Nuevo mueble")').click()
  124 |   await expect(page.locator('h2', { hasText: 'Nuevo mueble' })).toBeVisible()
  125 |   await page.locator('input[placeholder="Ej. SAL-001"]').fill(testData.productoCodigo)
  126 |   await page.locator('input[placeholder="Ej. Sala Roma"]').fill(testData.productoNombre)
  127 |   await page.locator('input[placeholder="Sala, comedor, dormitorio..."]').fill('TEST E2E')
  128 |   await page.locator('label:has-text("Precio de venta")').locator('xpath=..').locator('input[type="number"]').fill(testData.productoPrecio)
  129 |   await page.locator('label:has-text("Stock")').locator('xpath=..').locator('input[type="number"]').fill('10')
  130 |   await page.locator('button:has-text("Guardar mueble")').click()
  131 |   await page.locator('h2', { hasText: 'Nuevo mueble' }).waitFor({ state: 'detached' })
  132 | 
  133 |   const producto = await supabase
  134 |     .from('productos')
  135 |     .select('*')
  136 |     .eq('codigo', testData.productoCodigo)
  137 |     .single()
  138 | 
  139 |   expect(producto.error).toBeNull()
  140 |   expect(producto.data).not.toBeNull()
  141 |   expect(producto.data.estado).toBe('activo')
  142 |   expect(producto.data.precio).toBe(100)
  143 |   productoId = producto.data.id
  144 | }
  145 | 
  146 | async function crearCotizacion(page: any) {
  147 |   await page.goto(urls.cotizaciones)
  148 |   await expect(page.locator('h1', { hasText: 'Cotizaciones' })).toBeVisible()
  149 |   const nuevaCotizacionButton = page.locator('button:has-text("Nueva cotización")').first()
  150 |   await expect(nuevaCotizacionButton).toBeVisible({ timeout: 10000 })
  151 |   await expect(nuevaCotizacionButton).toBeEnabled({ timeout: 10000 })
  152 |   await nuevaCotizacionButton.click()
  153 |   await page.waitForSelector('h2:has-text("Nueva cotización")', { timeout: 15000 })
  154 |   const modalHeading = page.locator('h2:has-text("Nueva cotización")')
  155 | 
  156 |   const clienteSelect = page.locator('label:has-text("Cliente *") + select')
  157 |   await expect(clienteSelect).toBeVisible({ timeout: 10000 })
  158 |   await clienteSelect.selectOption({ label: testData.clienteNombre })
  159 | 
  160 |   await page.locator('button:has-text("Agregar mueble")').click()
  161 |   const productoBuscador = page.locator('input[placeholder="Buscar por código o nombre..."]')
  162 |   await expect(productoBuscador).toBeVisible({ timeout: 10000 })
  163 |   await productoBuscador.fill(testData.productoNombre)
  164 |   await page.waitForTimeout(500)
  165 |   await page.locator(`button:has-text("${testData.productoNombre}")`).first().click()
  166 | 
  167 |   const cantidadInput = page.locator('label:has-text("Cantidad")').locator('xpath=../input')
  168 |   const precioUnitarioInput = page.locator('label:has-text("Precio unitario")').locator('xpath=../input')
  169 |   await expect(cantidadInput).toBeVisible({ timeout: 10000 })
  170 |   await expect(precioUnitarioInput).toBeVisible({ timeout: 10000 })
  171 |   await cantidadInput.fill(testData.cantidad)
  172 |   await precioUnitarioInput.fill(testData.productoPrecio)
  173 | 
  174 |   await page.locator('button:has-text("Guardar cotización")').click()
  175 |   await expect(nuevaCotizacionButton).toBeVisible({ timeout: 10000 })
  176 | 
  177 |   // small delay to allow DB write propagation
  178 |   await new Promise((res) => setTimeout(res, 800))
  179 | 
  180 |   const { data: cotList, error: cotListError } = await supabase
  181 |     .from('cotizaciones')
  182 |     .select('*')
  183 |     .order('created_at', { ascending: false })
  184 |     .limit(10)
  185 | 
  186 |   expect(cotListError).toBeNull()
  187 | 
  188 |   const found = (cotList ?? []).find((c: any) => c.cliente_id === clienteId || (c.subtotal === 100 && c.total === 113))
  189 | 
  190 |   expect(found).toBeDefined()
  191 |   expect(found.estado).toBe('borrador')
  192 |   expect(found.subtotal).toBe(100)
  193 |   expect(found.total).toBe(113)
  194 |   expect(found.iva).toBe(13)
  195 |   cotizacionId = found.id
  196 | }
  197 | 
  198 | async function aprobarCotizacion(page: any) {
  199 |   await page.goto(`/cotizaciones/${cotizacionId}/editar`)
> 200 |   await expect(page.locator('text=Editando cotización')).toBeVisible()
      |                                                          ^ Error: expect(locator).toBeVisible() failed
  201 |   await page.locator('select').filter({ hasText: 'Estado' }).selectOption('aprobada')
  202 |   await page.locator('button:has-text("Guardar cambios")').click()
  203 |   await page.waitForURL(`**/cotizaciones/${cotizacionId}`)
  204 | 
  205 |   const cotizacion = await supabase
  206 |     .from('cotizaciones')
  207 |     .select('*')
  208 |     .eq('id', cotizacionId)
  209 |     .single()
  210 | 
  211 |   expect(cotizacion.error).toBeNull()
  212 |   expect(cotizacion.data.estado).toBe('aprobada')
  213 | }
  214 | 
  215 | async function crearYEmitirFactura(page: any) {
  216 |   await page.goto(urls.facturacionNueva)
  217 |   await expect(page.locator('text=Crear factura')).toBeVisible()
  218 |   await page.locator('select').filter({ hasText: 'Seleccionar cliente...' }).first().selectOption(clienteId!)
  219 |   await page.locator(`select`).filter({ hasText: 'Seleccionar mueble...' }).first()
  220 |   await page.locator('button:has-text("Agregar")').first().click()
  221 |   await page.locator('select').filter({ hasText: 'Seleccionar mueble...' }).first().selectOption(productoId!)
  222 |   await page.locator('input[placeholder="Cantidad"]').fill(testData.cantidad)
  223 |   await page.locator('input[placeholder="Precio unitario"]').fill(testData.productoPrecio)
  224 |   await page.locator('button:has-text("Emitir factura")').click()
  225 | 
  226 |   const factura = await supabase
  227 |     .from('facturas')
  228 |     .select('*')
  229 |     .eq('cliente_id', clienteId)
  230 |     .order('created_at', { ascending: false })
  231 |     .limit(1)
  232 |     .single()
  233 | 
  234 |   expect(factura.error).toBeNull()
  235 |   expect(factura.data).not.toBeNull()
  236 |   expect(factura.data.estado).toBe('emitida')
  237 |   expect(factura.data.subtotal).toBe(100)
  238 |   expect(factura.data.total).toBe(113)
  239 |   expect(factura.data.iva).toBe(13)
  240 |   facturaId = factura.data.id
  241 | }
  242 | 
  243 | async function registrarPago(page: any) {
  244 |   await page.goto(`/facturacion/${facturaId}`)
  245 |   await expect(page.locator('text=Registrar pago')).toBeVisible()
  246 |   await page.locator('button:has-text("Registrar pago")').click()
  247 |   await page.locator('input[placeholder="0.00"]').fill('113.00')
  248 |   await page.locator('select').filter({ hasText: 'Efectivo' }).selectOption('efectivo')
  249 |   await page.locator('button:has-text("Guardar pago")').click()
  250 | 
  251 |   const pago = await supabase
  252 |     .from('pagos')
  253 |     .select('*')
  254 |     .eq('factura_id', facturaId)
  255 |     .order('fecha_pago', { ascending: false })
  256 |     .limit(1)
  257 |     .single()
  258 | 
  259 |   expect(pago.error).toBeNull()
  260 |   expect(pago.data).not.toBeNull()
  261 |   expect(pago.data.monto).toBe(113)
  262 |   expect(pago.data.metodo_pago).toBe('efectivo')
  263 |   pagoId = pago.data.id
  264 | 
  265 |   const factura = await supabase
  266 |     .from('facturas')
  267 |     .select('*')
  268 |     .eq('id', facturaId)
  269 |     .single()
  270 | 
  271 |   expect(factura.error).toBeNull()
  272 |   expect(factura.data.estado).toBe('pagada')
  273 | }
  274 | 
  275 | async function verificarInventario() {
  276 |   const producto = await supabase
  277 |     .from('productos')
  278 |     .select('stock')
  279 |     .eq('id', productoId)
  280 |     .single()
  281 | 
  282 |   expect(producto.error).toBeNull()
  283 |   expect(producto.data).not.toBeNull()
  284 | }
  285 | 
  286 | async function verifyFinalState() {
  287 |   const cliente = await supabase
  288 |     .from('clientes')
  289 |     .select('*')
  290 |     .eq('id', clienteId)
  291 |     .single()
  292 |   expect(cliente.error).toBeNull()
  293 |   expect(cliente.data.nombre_completo).toBe(testData.clienteNombre)
  294 | 
  295 |   const producto = await supabase
  296 |     .from('productos')
  297 |     .select('*')
  298 |     .eq('id', productoId)
  299 |     .single()
  300 |   expect(producto.error).toBeNull()
```