require('dotenv').config({ path: './.env.local' });
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (msg) => {
    console.log(`BROWSER_CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.log(`BROWSER_ERROR: ${err.message}`);
  });
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/rest/v1/') || url.includes('supabase')) {
      console.log(`REQUEST: ${request.method()} ${url}`);
    }
  });
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/rest/v1/') || url.includes('supabase')) {
      const status = response.status();
      const text = await response.text().catch(() => '<no body>');
      console.log(`RESPONSE: ${response.request().method()} ${url} ${status} ${text.slice(0, 1000)}`);
    }
  });
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type=email]', process.env.E2E_TEST_EMAIL);
  await page.fill('input[type=password]', process.env.E2E_TEST_PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL('**/');
  await page.goto('http://localhost:3000/muebles');
  await page.click('button:has-text("Nuevo mueble")');
  await page.waitForSelector('h2:has-text("Nuevo mueble")');
  const labels = await page.$$eval('label', els => els.map(el => el.textContent.trim()));
  const placeholders = await page.$$eval('input', els => els.map(el => ({ placeholder: el.placeholder, type: el.type, value: el.value, name: el.name, ariaLabel: el.getAttribute('aria-label') })));
  const buttons = await page.$$eval('button', els => els.map(el => ({ text: el.textContent.trim(), type: el.type, disabled: el.disabled })));
  await page.locator('input[placeholder="Ej. SAL-001"]').fill('TEST-E2E-DEBUG');
  await page.locator('input[placeholder="Ej. Sala Roma"]').fill('TEST PRODUCTO E2E DEBUG');
  await page.locator('input[placeholder="Sala, comedor, dormitorio..."]').fill('TEST E2E');
  const priceInputLocator = page.locator('label:has-text("Precio de venta")').locator('xpath=..').locator('input[type="number"]');
  const stockInputLocator = page.locator('label:has-text("Stock")').locator('xpath=..').locator('input[type="number"]');
  console.log('PRICE_EXISTS', await priceInputLocator.count());
  console.log('STOCK_EXISTS', await stockInputLocator.count());
  await priceInputLocator.fill('100.00');
  await stockInputLocator.fill('10');
  await page.click('button:has-text("Guardar mueble")');
  await page.waitForTimeout(1000);
  const modalHtml = await page.$eval('h2:has-text("Nuevo mueble")', el => el.parentElement.outerHTML).catch(() => 'no modal');
  const errorMessages = await page.$$eval('div', els => els.filter(el => el.textContent.includes('No se pudo')).map(el => el.textContent.trim()));
  const bodyHtml = await page.$eval('body', el => el.innerHTML.slice(0, 5000));
  console.log('LABELS_START');
  console.log(JSON.stringify(labels, null,2));
  console.log('LABELS_END');
  console.log('PLACEHOLDERS_START');
  console.log(JSON.stringify(placeholders, null,2));
  console.log('PLACEHOLDERS_END');
  console.log('BUTTONS_START');
  console.log(JSON.stringify(buttons, null,2));
  console.log('BUTTONS_END');
  console.log('MODAL_HTML_START');
  console.log(modalHtml);
  console.log('MODAL_HTML_END');
  console.log('ERRORS_START');
  console.log(JSON.stringify(errorMessages, null,2));
  console.log('ERRORS_END');
  console.log('BODY_START');
  console.log(bodyHtml);
  console.log('BODY_END');
  await browser.close();
})();
