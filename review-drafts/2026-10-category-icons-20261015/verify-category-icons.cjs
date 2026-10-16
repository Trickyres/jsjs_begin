const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'before-hashes.json'), 'utf8'));
const assets = JSON.parse(fs.readFileSync(path.join(__dirname, 'icon-assets.json'), 'utf8')).assets;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const oldGlyphs = /[👥🛒🌳🏛]/u;
for (const [file, expected] of Object.entries(baseline.preserved)) assert.equal(hash(fs.readFileSync(path.join(root, file))), expected, `Unrequested file changed: ${file}`);
const entryHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.equal(entryHtml.replace(/\r\n/g, '\n'), fs.readFileSync(path.join(root, 'index_renew.html'), 'utf8').replace(/\r\n/g, '\n'));
for (const file of ['index.html', 'index_renew.html', 'index_renew.js']) assert(!oldGlyphs.test(fs.readFileSync(path.join(root, file), 'utf8')), `Old category emoji remains in ${file}`);
assert(entryHtml.includes('index_renew.css?v=20261015-category-icons'));
assert(entryHtml.includes('index_renew.js?v=20261015-category-icons'));
for (const asset of assets) assert.equal(hash(fs.readFileSync(path.join(root, asset.file))), asset.sha256);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || pathname.includes('/.git')) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, bytes) => { res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(error ? 'Not found' : bytes); });
});
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await context.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
  const page = await context.newPage(), errors = [], failedLocalAssets = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) failedLocalAssets.push(response.url()); });
  async function decoded(selector) {
    await page.locator(selector).evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    assert(await page.locator(selector).evaluateAll(imgs => imgs.every(img => img.naturalWidth > 0 && img.naturalHeight > 0)));
  }
  for (const entry of ['index.html', 'index_renew.html']) {
    await page.goto(`${base}/${entry}`, { waitUntil: 'load' });
    // Only avoid loading the external SDK in this offline, component-focused check.
    await page.evaluate(() => { ensureAmapMap = async () => {}; });
    const homeSymbols = await page.locator('#quickEntries .category-symbol').evaluateAll(imgs => imgs.map(img => ({ key: img.dataset.categoryIcon, src: img.getAttribute('src') })));
    assert.deepEqual(homeSymbols, assets.map(asset => ({ key: asset.key, src: asset.file })));
    await decoded('#quickEntries .category-symbol');
    assert.equal(await page.locator('#quickEntries [data-quick="bussiness"] .category-symbol').count(), 0);
    assert((await page.locator('#quickEntries [data-quick="bussiness"]').textContent()).includes('🏢'));
    if (entry === 'index.html') {
      await page.screenshot({ path: path.join(__dirname, '首页-新图标.png'), animations: 'disabled' });
      await page.locator('#quickEntries').screenshot({ path: path.join(__dirname, '首页-四类入口.png'), animations: 'disabled' });
    }
    const categoryResults = [];
    for (const asset of assets) {
      await page.evaluate(() => setView('home'));
      await page.locator(`[data-quick="${asset.key}"]`).click();
      assert.equal(await page.locator('#listTitle').textContent(), asset.label);
      const count = await page.locator('#placeList .place-card').count();
      assert(count > 0);
      assert.equal(await page.locator('#placeList .place-icon .category-symbol').count(), count);
      const icons = await page.locator('#placeList .place-icon img').evaluateAll(imgs => imgs.map(img => img.getAttribute('src')));
      assert(icons.every(src => src === asset.file));
      assert(!oldGlyphs.test(await page.locator('#placeList').textContent()));
      await decoded('#placeList .place-icon img');
      if (entry === 'index.html') {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: path.join(__dirname, `列表-${asset.key}.png`), animations: 'disabled' });
      }
      await page.locator('#placeList [data-view-map]').first().click();
      await page.locator('#mapSheet.is-open').waitFor();
      assert.equal(await page.locator('#mapSheet .tag').textContent(), asset.label);
      const detailId = await page.evaluate(() => state.selectedId);
      const nav = await page.evaluate(id => { const point = getPoint(id); return { lng: point.lng, lat: point.lat, url: buildAmapUrl(point) }; }, detailId);
      assert(nav.url.includes(`to=${nav.lng},${nav.lat},`));
      categoryResults.push({ category: asset.key, listCount: count, homeNavigation: 'passed', listSymbols: 'passed', mapDetailsAndNavigation: 'passed' });
    }
    await page.evaluate(() => { state.category = 'all'; state.search = ''; setView('list'); });
    const expectedCount = await page.evaluate(() => POINTS.filter(point => hasCategoryIcon(point.category)).length);
    assert.equal(await page.locator('#placeList .category-symbol').count(), expectedCount);
    await decoded('#placeList .category-symbol');
    const allListNoEmoji = !oldGlyphs.test(await page.locator('#placeList').textContent());
    assert(allListNoEmoji);
    await page.locator('#searchInput').fill('海音');
    assert.equal(await page.locator('#placeList .place-card').count(), 1);
    assert.equal(await page.locator('#placeList .category-symbol').getAttribute('src'), assets[1].file);
    await page.locator('#searchInput').fill('');
    await page.evaluate(() => setView('guide'));
    await page.locator('.guide-chapters').scrollIntoViewIfNeeded();
    await decoded('.guide-chapter-icon .category-symbol');
    for (const asset of assets) {
      assert.equal(await page.locator(`[data-guide-category="${asset.key}"] img`).getAttribute('src'), asset.file);
      await page.locator(`[data-guide-category="${asset.key}"]`).click();
      assert.equal(await page.locator('#listTitle').textContent(), asset.label);
      await page.evaluate(() => setView('guide'));
    }
    await page.locator('.guide-chapters').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    if (entry === 'index.html') await page.locator('.guide-chapters').screenshot({ path: path.join(__dirname, '纸质指南-四个章节.png'), animations: 'disabled' });
    await page.evaluate(() => setView('phone'));
    await decoded('#contactList .category-symbol');
    assert.equal(await page.locator('#contactList .category-symbol').count(), 1);
    assert.equal(await page.locator('#contactList .category-symbol').getAttribute('src'), assets[0].file);
    assert(!oldGlyphs.test(await page.locator('#contactList').textContent()));
    const police = page.locator('.contact-card').filter({ hasText: '小东门派出所' });
    assert((await police.locator('.contact-icon').textContent()).includes('👮'));
    assert.equal(await police.locator('a').getAttribute('href'), 'tel:021-23034720');
    if (entry === 'index.html') {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(__dirname, '电话页-便民图标.png'), animations: 'disabled' });
    }
    const markerAudit = await page.evaluate(async () => {
      const savedMode = state.mapMode;
      state.mapMode = null;
      const normal = [];
      for (const point of POINTS) {
        const element = createAmapMarkerElement(point);
        const image = element.querySelector('.category-symbol');
        if (image) await image.decode();
        normal.push({ id: point.id, category: point.category, icon: image?.getAttribute('src') || null, name: element.getAttribute('aria-label'), x: point.lng, y: point.lat });
      }
      state.mapMode = BINJIANG_ROUTE_MODE;
      const route = BINJIANG_ROUTE_POINT_IDS.map(id => {
        const element = createAmapMarkerElement(getPoint(id));
        return { id, number: element.querySelector('.amap-community-marker-core').textContent, icons: element.querySelectorAll('img').length };
      });
      state.mapMode = savedMode;
      return { normal, route };
    });
    for (const marker of markerAudit.normal) {
      const asset = assets.find(asset => asset.key === marker.category);
      assert.equal(marker.icon, asset?.file || null);
      assert(marker.name);
    }
    assert.deepEqual(markerAudit.route.map(marker => marker.number), ['1', '2', '3', '4']);
    assert(markerAudit.route.every(marker => marker.icons === 0));
    // Capture actual generated marker elements, labelled as an icon sample, not a real basemap.
    if (entry === 'index.html') {
      await page.evaluate(() => {
        const fixture = document.createElement('div');
        fixture.id = 'categoryIconAuditSamples';
        fixture.style.cssText = 'position:fixed;inset:80px auto auto 10px;width:370px;padding:24px 12px;background:#fff9ee;display:flex;justify-content:space-around;z-index:10000;border-radius:18px';
        state.mapMode = null;
        ['service', 'shopping', 'leisure', 'memory'].forEach(key => {
          const column = document.createElement('div'); column.style.cssText = 'display:grid;justify-items:center;gap:8px';
          const point = POINTS.find(point => point.category === key);
          column.append(createAmapMarkerElement(point));
          const label = document.createElement('span'); label.textContent = getCategory(key).full; label.style.cssText = 'font:12px sans-serif;color:#49382a'; column.append(label); fixture.append(column);
        });
        document.body.append(fixture);
      });
      await decoded('#categoryIconAuditSamples img');
      await page.locator('#categoryIconAuditSamples').screenshot({ path: path.join(__dirname, '地图点位图标样例.png') });
      await page.locator('#categoryIconAuditSamples').evaluate(element => element.remove());
    }
    checks.push({ entry, categories: categoryResults, allListCategoryIcons: expectedCount, normalMarkersChecked: markerAudit.normal.length, numberedRouteMarkers: '1–4 preserved', guideChapters: '4/4 passed', phoneCommittee: 'passed', policeIconAndPhone: 'unchanged', oldEmojiOnActiveSurfaces: 'none', search: 'passed' });
    for (const width of [320, 375, 430, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const view of ['home', 'guide', 'list', 'phone']) {
        await page.evaluate(view => { state.category = 'all'; state.search = ''; setView(view); }, view);
        assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${entry}/${view}/${width} overflow`);
      }
    }
    await page.setViewportSize({ width: 390, height: 900 });
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failedLocalAssets, []);
  const result = { date: '2026-10-15', localOnly: true, deployed: false, selectedStyle: '暖彩轻浮雕', shoppingIcon: '购物车', checks, preservedData: Object.keys(baseline.preserved), widths: [320, 375, 430, 1280], mapVerification: 'Actual generated marker DOM; external basemap not loaded in offline tests', errors, failedLocalAssets };
  fs.writeFileSync(path.join(__dirname, 'verification-results.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
