require('dotenv').config({ path: './.env.local' });
const { chromium } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase vars');
if (!TEST_EMAIL || !TEST_PASSWORD) throw new Error('Missing test auth vars');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function login(page) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type=email]', TEST_EMAIL);
  await page.fill('input[type=password]', TEST_PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL('**/');
}

async function createClientUI(page, name, email) {
  await page.goto('http://localhost:3000/clientes');
  await page.waitForSelector('h1:has-text("Clientes")');
  await page.click('button:has-text("Nuevo cliente")');
  await page.waitForSelector('h2:has-text("Nuevo cliente")');
  await page.fill('input[placeholder="Ej. Juan Pérez"]', name);
  await page.fill('input[placeholder="correo@ejemplo.com"]', email);
  await page.click('button:has-text("Guardar cliente")');
  await page.waitForSelector('h2:has-text("Nuevo cliente")', { state: 'detached' });
}

async function createProductUI(page, code, name) {
  await page.goto('http://localhost:3000/muebles');
  await page.waitForSelector('h1:has-text("Muebles")');
  await page.click('button:has-text("Nuevo mueble")');
  await page.waitForSelector('h2:has-text("Nuevo mueble")');
  await page.fill('input[placeholder="Ej. SAL-001"]', code);
  await page.fill('input[placeholder="Ej. Sala Roma"]', name);
  await page.fill('input[placeholder="Sala, comedor, dormitorio..."]', 'TEST E2E');
  await page.fill('label:has-text("Precio de venta") >> xpath=../input', '100.00');
  await page.fill('label:has-text("Stock") >> xpath=../input', '10');
  await page.click('button:has-text("Guardar mueble")');
  await page.waitForSelector('h2:has-text("Nuevo mueble")', { state: 'detached' });
}

(async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const clientName = `TMP E2E CLIENT ${suffix}`;
  const clientEmail = `tmp-e2e-client-${suffix}@example.com`;
  const productName = `TMP PRODUCTO E2E ${suffix}`;
  const productCode = `TMP-E2E-${suffix}`;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page);
  await createClientUI(page, clientName, clientEmail);
  await createProductUI(page, productCode, productName);

  await page.goto('http://localhost:3000/cotizaciones');
  await page.waitForSelector('h1:has-text("Cotizaciones")');
  await page.click('button:has-text("Nueva cotización")');
  await page.waitForSelector('h2:has-text("Nueva cotización")');

  const clienteSelect = page.locator('label:has-text("Cliente *") + select');
  await clienteSelect.selectOption({ label: clientName });
  await page.click('button:has-text("Agregar mueble")');
  await page.waitForSelector('h3:has-text("Agregar mueble")');
  await page.fill('input[placeholder="Buscar por código o nombre..."]', productName);
  await page.waitForTimeout(500);
  await page.locator('button:has-text("' + productName + '")').first().click();
  await page.waitForTimeout(500);
  await page.locator('label:has-text("Cantidad") + input').fill('1');
  await page.locator('label:has-text("Precio unitario") + input').fill('100.00');
  await page.click('button:has-text("Guardar cotización")');
  await page.waitForURL('http://localhost:3000/cotizaciones');

  const { data: cliente } = await supabase.from('clientes').select('id').eq('correo', clientEmail).single();
  console.log('client row', cliente);
  const { data: cotizaciones, error: cotError } = await supabase
    .from('cotizaciones')
    .select('*')
    .eq('cliente_id', cliente.id)
    .order('created_at', { ascending: false });
  console.log('cotError', cotError);
  console.log('cotizaciones', cotizaciones);

  await browser.close();
})();
