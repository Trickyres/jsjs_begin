const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'points-before.json'), 'utf8'));
const assets = JSON.parse(fs.readFileSync(path.join(__dirname, 'guide-assets.json'), 'utf8'));
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
  const page = await context.newPage();
  const errors = [], failedLocalRequests = [], checks = [], requested = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requested.push(request.url()));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) failedLocalRequests.push({ url: response.url(), status: response.status() }); });
  for (const entryPage of ['index.html', 'index_renew.html']) {
    await page.goto(`${base}/${entryPage}`, { waitUntil: 'load' });
    assert(!requested.some(url => /guide-page-0[12]-20261012\.webp$/.test(url)), 'Full-size guide must not load before first opening');
    const points = await page.evaluate(() => window.POINTS_DATA);
    assert.equal(points.length, baseline.length);
    for (const before of baseline) {
      const after = points.find(point => point.id === before.id);
      if (before.id === 'qiangsheng') {
        assert.deepEqual(after, { ...before, name: '强生医院', imageAlt: '强生医院楼体和沿街入口', imageCaption: '强生医院 · 建筑外观' });
      } else assert.deepEqual(after, before, `Unrequested point changed: ${before.id}`);
    }
    await page.locator('[data-guide-open]').click();
    await page.locator('.guide-view.active').waitFor();
    await page.locator('.guide-gallery').scrollIntoViewIfNeeded();
    const thumbnails = await page.locator('.guide-gallery-photo img').evaluateAll(async imgs => {
      await Promise.all(imgs.map(img => img.decode()));
      return imgs.map(img => ({ src: img.getAttribute('src'), width: img.naturalWidth, height: img.naturalHeight }));
    });
    assert.deepEqual(thumbnails, assets.entries.map(asset => ({ src: asset.thumbnail, width: asset.thumbnailWidth, height: asset.thumbnailHeight })));
    if (entryPage === 'index.html') await page.locator('.guide-gallery').screenshot({ path: path.join(__dirname, '纸质指南-正反面.png') });
    for (let index = 0; index < assets.entries.length; index++) {
      const asset = assets.entries[index];
      await page.locator(`[data-gallery-page="${index}"]`).click();
      await page.locator('#guideLightbox.is-open').waitFor();
      await page.locator('#guideLightboxImage').evaluate(img => img.decode());
      const image = await page.locator('#guideLightboxImage').evaluate(img => ({ src: img.getAttribute('src'), width: img.naturalWidth, height: img.naturalHeight }));
      assert.deepEqual(image, { src: asset.full, width: asset.fullWidth, height: asset.fullHeight });
      assert.equal(await page.locator('#guideLightboxTitle').textContent(), `稼享指南 · ${asset.label}`);
      assert.equal(await page.locator('#guideLightboxCounter').textContent(), `${index + 1} / 2`);
      await page.locator('#guideLightboxStage').dblclick();
      assert.equal(await page.evaluate(() => guideGalleryState.scale), 2);
      const stage = await page.locator('#guideLightboxStage').boundingBox();
      await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
      await page.mouse.down(); await page.mouse.move(stage.x + stage.width / 2 + 45, stage.y + stage.height / 2, { steps: 4 }); await page.mouse.up();
      assert.notEqual(await page.evaluate(() => guideGalleryState.x), 0, 'Zoomed guide must remain draggable');
      await page.keyboard.press('0');
      assert.equal(await page.evaluate(() => guideGalleryState.scale), 1);
      await page.locator('[data-gallery-action="next"]').click();
      await page.locator('#guideLightboxImage').evaluate(img => img.decode());
      assert.equal(await page.locator('#guideLightboxCounter').textContent(), `${(index + 1) % 2 + 1} / 2`);
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('#guideLightboxCounter').textContent(), `${index + 1} / 2`);
      if (index === 0) await page.keyboard.press('Escape');
      else await page.locator('.guide-lightbox-close').click();
      await page.locator('#guideLightbox').waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => document.activeElement.dataset.galleryPage), String(index));
    }
    await page.locator('[data-guide-category="service"]').click();
    await page.locator('.list-view.active, [data-view="list"].active').first().waitFor();
    await page.locator('#searchInput').fill('强生医院');
    const hospitalCard = page.locator('.place-card').filter({ has: page.locator('[data-view-map="qiangsheng"]') });
    await hospitalCard.waitFor();
    assert((await hospitalCard.textContent()).includes('强生医院'));
    assert(!(await hospitalCard.textContent()).includes('上海市强生职工医院'));
    for (const id of ['qiangsheng', 'time-plastic']) {
      const point = points.find(point => point.id === id);
      const marker = await page.evaluate(id => createAmapMarkerElement(POINTS.find(point => point.id === id)).textContent, id);
      assert(marker.includes(point.name));
      await page.evaluate(id => {
        state.view = 'map';
        document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.dataset.view === 'map'));
        selectRealMapPoint(POINTS.find(point => point.id === id));
      }, id);
      await page.locator('#mapSheet.is-open .map-place-photo img').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#mapSheet h3').textContent(), point.name);
      const photo = page.locator('#mapSheet .map-place-photo img');
      await photo.evaluate(img => img.decode());
      assert.equal(await photo.getAttribute('src'), point.image);
      assert((await photo.evaluate(img => img.naturalWidth)) > 0);
      if (entryPage === 'index.html') await page.locator('#mapSheet .map-sheet-compact').screenshot({ path: path.join(__dirname, `${id}-点位预览.png`) });
      await page.locator('#mapSheet .map-place-photo-zoom').click();
      await page.locator('#activityPhotoLightbox').waitFor({ state: 'visible' });
      await page.locator('#activityPhotoImage').evaluate(img => img.decode());
      assert.equal(await page.locator('#activityPhotoTitle').textContent(), point.imageCaption);
      assert((await page.locator('#activityPhotoImage').getAttribute('src')).includes(point.image));
      await page.keyboard.press('Escape');
      await page.locator('#activityPhotoLightbox').waitFor({ state: 'hidden' });
    }
    checks.push({ entryPage, pointCount: points.length, unrelatedPointData: 'unchanged', qiangshengName: 'passed', hospitalPhotosAndZoom: 'passed', guideOrder: '01正面/02反面', guideFullResolution: '8976×4960', galleryNavigationZoomPanAndClose: 'passed' });
    requested.length = 0;
  }
  const widths = [320, 375, 430, 1280];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => setView('guide'));
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Overflow at width ${width}`);
    await page.locator('[data-gallery-page="0"]').click();
    await page.locator('#guideLightbox.is-open').waitFor();
    await page.locator('#guideLightboxImage').evaluate(img => img.decode());
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `Lightbox overflow at width ${width}`);
    if (width === 1280) await page.screenshot({ path: path.join(__dirname, '纸质指南-高清预览.png') });
    await page.keyboard.press('Escape');
    await page.locator('#guideLightbox').waitFor({ state: 'hidden' });
  }
  assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n'), fs.readFileSync(path.join(root, 'index_renew.html'), 'utf8').replace(/\r\n/g, '\n'));
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(`${base}/review-drafts/2026-10-hospitals-guide-20261015/${encodeURIComponent('更新记录.html')}`, { waitUntil: 'load' });
  await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
  assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await page.screenshot({ path: path.join(__dirname, '更新审核预览.png'), fullPage: true });
  assert.deepEqual(errors, []);
  assert.deepEqual(failedLocalRequests, []);
  const result = { date: '2026-10-15', localOnly: true, deployed: false, checks, viewports: widths, errors, failedLocalRequests };
  fs.writeFileSync(path.join(__dirname, 'verification-results.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
