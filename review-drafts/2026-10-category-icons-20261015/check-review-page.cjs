const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let browser;
(async () => {
  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('file:///' + path.join(__dirname, '更新记录.html').replaceAll('\\', '/'), { waitUntil: 'load' });
  await page.locator('details').evaluateAll(items => items.forEach(item => { item.open = true; }));
  await page.locator('img').evaluateAll(imgs => { imgs.forEach(img => { img.loading = 'eager'; }); return Promise.all(imgs.map(img => img.decode())); });
  for (const width of [360, 1200]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  }
  await page.locator('details').evaluateAll(items => items.forEach(item => { item.open = false; }));
  await page.screenshot({ path: path.join(__dirname, '本地审核预览.png'), fullPage: true });
  for (const href of await page.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')))) {
    assert(fs.existsSync(path.resolve(__dirname, href)), `Broken review link: ${href}`);
  }
  assert.deepEqual(errors, []);
  console.log('Review page: images, links, 360/1200 widths passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
