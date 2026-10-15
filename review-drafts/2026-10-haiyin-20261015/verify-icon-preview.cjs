const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const visualDir = 'C:/Users/fanta/.codex/visualizations/2026/08/24/01a032eb-3731-7c72-9194-e2bfe2ee10ba';
const preview = path.join(visualDir, 'community-entry-icon-options-preview.html');
let browser;
(async () => {
  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ viewport: { width: 736, height: 600 } });
  const page = await context.newPage(), errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('file:///' + preview, { waitUntil: 'load' });
  const frame = page.frames().find(candidate => candidate.parentFrame());
  await frame.locator('#community-icon-designs').waitFor();
  if (!await frame.locator('.entry-icon svg').count()) {
    await frame.addScriptTag({ content: fs.readFileSync('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/lucide/dist/umd/lucide.js', 'utf8') });
    await frame.evaluate(() => lucide.createIcons());
  }
  assert.equal(await frame.locator('.entry-icon svg').count(), 16);
  assert.equal(await frame.locator('.relief [data-category="shopping"] svg.lucide-shopping-cart').count(), 1);
  const variantNames = await frame.locator('[data-variant]').evaluateAll(items => items.map(item => item.dataset.variant));
  for (const width of [320, 390, 736]) {
    await page.setViewportSize({ width, height: 600 });
    for (let index = 0; index < variantNames.length; index++) {
      await frame.locator('[data-variant]').evaluateAll((items, current) => items.forEach((item, i) => { item.hidden = current !== i; }), index);
      const active = frame.locator(`[data-variant="${variantNames[index]}"]`);
      assert(await active.locator('.entry-icon > svg').first().evaluate(svg => svg.getBoundingClientRect().width >= 30), 'Main glyph unexpectedly too small');
      await active.locator('[data-category="shopping"]').click();
      assert.equal(await active.locator('[data-category="shopping"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await active.locator('.preview-status').textContent(), '生活购物');
      await active.locator('[data-category="leisure"]').click();
      assert.equal(await active.locator('[data-category="shopping"]').getAttribute('aria-pressed'), 'false');
      const geometry = await active.locator('.entry-nav').evaluate(nav => {
        const nr = nav.getBoundingClientRect();
        return [...nav.querySelectorAll('.entry-label, .entry-icon')].every(item => { const r = item.getBoundingClientRect(); return r.left >= nr.left && r.right <= nr.right + .5; });
      });
      assert(geometry, `Icon or label outside navigation at ${width} / ${variantNames[index]}`);
      assert(!await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Horizontal overflow at ${width}`);
      if (width === 736) await active.locator('.jiaxiang-preview').screenshot({ path: path.join(__dirname, `图标预览-${index + 1}.png`) });
      checks.push({ width, variant: variantNames[index], icons: 'visible', clickFeedback: 'passed', layout: 'passed' });
    }
  }
  const fragment = fs.readFileSync(path.join(visualDir, 'community-entry-icon-options.html'), 'utf8');
  assert(!/<svg|<path|\bfetch\(/i.test(fragment), 'Unexpected authored SVG or network request');
  assert(fragment.length < 1000000);
  assert.deepEqual(errors, []);
  const result = { localOnly: true, deployed: false, websiteIconsChanged: false, checks, errors };
  fs.writeFileSync(path.join(__dirname, 'icon-preview-verification.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
