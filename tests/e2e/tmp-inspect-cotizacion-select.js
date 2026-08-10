require('dotenv').config({ path: './.env.local' });
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log(`BROWSER: ${msg.type()} ${msg.text()}`));
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type=email]', process.env.E2E_TEST_EMAIL);
  await page.fill('input[type=password]', process.env.E2E_TEST_PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL('**/');
  await page.goto('http://localhost:3000/cotizaciones');
  await page.waitForSelector('h1:has-text("Cotizaciones")');
  await page.click('button:has-text("Nueva cotización")');
  await page.waitForSelector('h2:has-text("Nueva cotización")');
  const clienteSelect = page.locator('label:has-text("Cliente *")').locator('xpath=..').locator('select');
  console.log('CLIENTE SELECT COUNT', await clienteSelect.count());
  if ((await clienteSelect.count()) > 0) {
    const options = await clienteSelect.locator('option').allTextContents();
    console.log('CLIENTE OPTIONS', options);
  }
  const selects = await page.locator('select').all();
  console.log('TOTAL SELECTS', selects.length);
  for (let i = 0; i < selects.length; i++) {
    const text = await selects[i].evaluate(el => el.outerHTML);
    console.log(`SELECT ${i} HTML:`, text);
  }
  await browser.close();
})();