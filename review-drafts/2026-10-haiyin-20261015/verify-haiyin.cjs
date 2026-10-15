const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), http = require('node:http'), vm = require('node:vm'), assert = require('node:assert/strict');
const { chromium } = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const record = JSON.parse(fs.readFileSync(path.join(__dirname, '更新记录.json'), 'utf8'));
const source = fs.readFileSync(path.join(root, 'points-data.js'), 'utf8');
const dataContext = { window: {} };
vm.runInNewContext(source, dataContext);
const points = JSON.parse(JSON.stringify(dataContext.window.POINTS_DATA));
assert.equal(points.length, record.expectedCount);
assert.equal(new Set(points.map(p => p.id)).size, points.length);
const remaining = points.filter(p => p.id !== record.id);
assert.equal(remaining.length, record.previousCount);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(remaining)).digest('hex'), record.previousPointsSha256);
const point = points.find(p => p.id === record.id);
assert.equal(point.name, record.name); assert.equal(point.category, 'shopping');
assert.deepEqual([point.lng, point.lat], [121.506172, 31.212428]);
assert.equal(point.isNew, false); assert(!Object.hasOwn(point, 'markerOffset'));
assert.equal(point.image, record.asset);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, point.image))).digest('hex'), record.exportedSha256);
for (const pageName of ['index.html', 'index_renew.html']) assert(fs.readFileSync(path.join(root, pageName), 'utf8').includes('points-data.js?v=20261015-haiyin-music'));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png' };
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
  const context = await browser.newContext({ viewport: { width: 390, height: 950 } });
  await context.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
  const page = await context.newPage(), errors = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const pageName of ['/', '/index_renew.html']) {
    await page.goto(base + pageName, { waitUntil: 'load' });
    await page.evaluate(() => { state.category = 'shopping'; state.search = ''; setView('list'); });
    const card = page.locator('.place-card').filter({ has: page.locator('[data-view-map="haiyin-music"]') });
    assert.equal(await card.count(), 1);
    assert((await card.locator('h3').textContent()).includes('海音琴行'));
    assert.equal(await card.locator('.tag').textContent(), '生活购物');
    assert.equal(await card.locator('.new-point-badge').count(), 0);
    assert((await card.locator('.place-lines').textContent()).includes('详细地址待补充'));
    await page.locator('#searchInput').fill('海音');
    assert.equal(await page.locator('.place-card').count(), 1);
    const mapAndNavigation = await page.evaluate(() => {
      const p = POINTS.find(p => p.id === 'haiyin-music');
      const el = createAmapMarkerElement(p);
      const captured = [];
      const saved = { api: amapRuntime.api, map: amapRuntime.map, markers: amapRuntime.markers, category: state.category, mode: state.mapMode };
      amapRuntime.api = {
        Pixel: class Pixel { constructor(...values) { this.values = values; } },
        Marker: class Marker { constructor(options) { captured.push({ title: options.title, position: options.position, offset: options.offset.values }); } on() {} setMap() {} setzIndex() {} }
      };
      amapRuntime.map = {}; amapRuntime.markers = new Map(); state.category = 'shopping'; state.mapMode = null;
      renderAmapMarkers();
      const result = { marker: captured.find(m => m.title === p.name), markerHasNewTag: !!el.querySelector('.amap-community-marker-new'), nav: buildAmapUrl(p) };
      amapRuntime.api = saved.api; amapRuntime.map = saved.map; amapRuntime.markers = saved.markers; state.category = saved.category; state.mapMode = saved.mode;
      state.view = 'map'; document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === 'map'));
      selectRealMapPoint(p);
      return result;
    });
    assert.deepEqual(mapAndNavigation.marker.position, [121.506172, 31.212428]);
    assert.deepEqual(mapAndNavigation.marker.offset, [0, 0]);
    assert.equal(mapAndNavigation.markerHasNewTag, false);
    assert(mapAndNavigation.nav.includes('to=121.506172,31.212428,'));
    assert(mapAndNavigation.nav.includes('coordinate=gaode'));
    assert.equal(await page.locator('#mapSheet h3').textContent(), '海音琴行');
    const photo = page.locator('#mapSheet .map-place-photo img');
    await photo.evaluate(img => img.decode());
    assert((await photo.getAttribute('src')).endsWith(record.asset));
    await page.locator('#mapSheet .map-place-photo-zoom').click();
    await page.locator('#activityPhotoLightbox').waitFor({ state: 'visible' });
    await page.locator('#activityPhotoImage').evaluate(img => img.decode());
    assert.equal(await page.locator('#activityPhotoTitle').textContent(), '海音琴行 · 门店实景');
    await page.keyboard.press('Escape');
    await page.locator('#activityPhotoLightbox').waitFor({ state: 'hidden' });
    for (const width of [320, 375, 430]) {
      await page.setViewportSize({ width, height: 950 });
      assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Mobile overflow');
    }
    await page.setViewportSize({ width: 390, height: 950 });
    checks.push({ page: pageName, shoppingList: 'passed', search: 'passed', markerCoordinate: mapAndNavigation.marker.position, mapMarkerVerification: 'offline mocked constructor', navigationCoordinate: 'passed', photoZoom: 'passed', mobileWidths: [320, 375, 430] });
  }
  await page.locator('#mapSheet .map-place-photo-zoom').evaluate(button => button.blur());
  await page.locator('#mapSheet .map-sheet-compact').screenshot({ path: path.join(__dirname, '海音琴行-点位预览.png') });
  assert.deepEqual(errors, []);
  const result = { localOnly: true, deployed: false, count: points.length, originalPointsPreserved: remaining.length, originalPointsSha256: record.previousPointsSha256, point: { id: point.id, name: point.name, category: point.category, lng: point.lng, lat: point.lat }, checks, errors };
  fs.writeFileSync(path.join(__dirname, 'verification-results.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
