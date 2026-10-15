// 仅启动只读本地预览，验证页面并输出截图/记录；不访问或部署线上网站。
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const out = __dirname;
const draft = JSON.parse(fs.readFileSync(path.join(out, 'review-copy.json'), 'utf8'));
const activeReviews = draft.entries.filter(entry => entry.pointId);
assert.deepEqual(draft.entries.map(entry => entry.rating), [5,3,4,4,4,null,5,3,5]);
assert.equal(activeReviews.length, 8);
for (const entry of draft.entries) {
  const length = [...entry.text].filter(char => /[\p{Script=Han}\p{Letter}\p{Number}]/u.test(char)).length;
  assert(length >= 30 && length <= 50, entry.name + ': short review length');
}
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'};
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || pathname.includes('/.git')) {
    response.writeHead(403); response.end(); return;
  }
  fs.readFile(file, (error, bytes) => {
    response.writeHead(error ? 404 : 200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    response.end(error ? 'Not found' : bytes);
  });
});
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context = await browser.newContext({viewport:{width:390,height:1000}, colorScheme:'light'});
  // 阻止外部资源；仅用本地页面验证点位卡片。导航目标用静态页拦截，绝不调用实际地图。
  await context.route('**/*', route => {
    if (route.request().url().startsWith(base + '/')) return route.continue();
    if (route.request().url().startsWith('https://uri.amap.com/')) {
      return route.fulfill({status:200,contentType:'text/html',body:'<title>Navigation target captured</title>'});
    }
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [], failedLocalResponses = [], reviewChecks = [], layoutChecks = [], navigationChecks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400 && !response.url().endsWith('/favicon.ico')) failedLocalResponses.push(response.url());
  });
  const select = async id => {
    await page.evaluate(id => {
      state.view = 'map'; state.category = 'all'; state.mapMode = null;
      document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.dataset.view === 'map'));
      document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.go === 'map'));
      selectRealMapPoint(POINTS.find(point => point.id === id));
    }, id);
    await page.locator('#mapSheet.is-open').waitFor({state:'visible'});
  };
  for (const entryPage of ['/', '/index_renew.html']) {
    await page.goto(base + entryPage, {waitUntil:'load'});
    const {points, data} = await page.evaluate(() => ({points:window.POINTS_DATA, data:window.POINT_REVIEWS_DATA}));
    assert.equal(points.length, 57);
    assert.equal(points.filter(point => point.image).length, 54);
    assert.equal(new Set(points.map(point => point.id)).size, 57);
    assert(!points.some(point => point.id === 'haochuizi'));
    assert.deepEqual(Object.keys(data.entries).sort(), activeReviews.map(entry => entry.pointId).sort());
    assert.deepEqual(data.pending, draft.entries.filter(entry => !entry.pointId).map(({name,pointId,rating,status,text}) => ({name,pointId,rating,status,text})));
    for (const entry of activeReviews) {
      const point = points.find(point => point.id === entry.pointId);
      assert(point, 'Active point missing: ' + entry.pointId);
      assert.equal(data.entries[point.id].rating, entry.rating);
      assert.equal(data.entries[point.id].text, entry.text);
      await select(point.id);
      const strip = page.locator('#mapSheet .map-point-review');
      assert.equal(await strip.count(), 1);
      assert(await strip.isVisible(), 'Review hidden before opening details');
      assert.equal(await strip.locator('.map-point-review__title').textContent(), draft.label);
      assert.equal(await strip.locator('.map-point-review__score').textContent(), `个人 ${entry.rating} / 5`);
      assert.equal(await strip.locator('.map-point-review__text').textContent(), entry.text);
      assert.equal(await strip.locator('.map-point-review__disclaimer').textContent(), draft.disclaimer);
      assert.equal(await page.locator('#detailsBtn').getAttribute('aria-expanded'), 'false');
      await page.locator('#detailsBtn').click();
      assert(await page.locator('#sheetDetailExtra').isVisible());
      assert(await strip.isVisible());
      await page.locator('#detailsBtn').click();
      assert(!await page.locator('#sheetDetailExtra').isVisible());
      assert(await strip.isVisible());
      if (point.image) {
        await page.locator('#mapSheet .map-place-photo img').evaluate(img => img.decode());
        await page.locator('#mapSheet .map-place-photo-zoom').click();
        await page.locator('#activityPhotoLightbox').waitFor({state:'visible'});
        await page.locator('#activityPhotoImage').evaluate(img => img.decode());
        assert.equal(await page.locator('#activityPhotoImage').getAttribute('src'), point.image);
        await page.keyboard.press('Escape');
        await page.locator('#activityPhotoLightbox').waitFor({state:'hidden'});
      }
      reviewChecks.push({page:entryPage, id:point.id, rating:entry.rating, text:'matches', details:'ok', photoZoom:point.image?'ok':'not-provided'});
    }
    // 全部非点评点位逐一验证：无空条、无评分、聚合点位原样保留。
    for (const point of points.filter(point => !data.entries[point.id])) {
      await select(point.id);
      assert.equal(await page.locator('#mapSheet .map-point-review').count(), 0, 'Empty review strip: ' + point.id);
    }
    for (const width of [320,375,430]) {
      await page.setViewportSize({width,height:1000});
      for (const id of ['panguoxianhuntun','traditional-beef-noodles','roast-meat-rice-canteen','tonecoffee']) {
        await select(id);
        const layout = await page.locator('.map-point-review').evaluate(strip => {
          const box = strip.getBoundingClientRect();
          const head = strip.querySelector('.map-point-review__head').getBoundingClientRect();
          const title = strip.querySelector('h4').getBoundingClientRect();
          const score = strip.querySelector('.map-point-review__score').getBoundingClientRect();
          const text = strip.querySelector('.map-point-review__text');
          const style = getComputedStyle(text);
          const disclaimerStyle = getComputedStyle(strip.querySelector('.map-point-review__disclaimer'));
          return {pageOverflow:document.documentElement.scrollWidth > window.innerWidth, stripOverflow:strip.scrollWidth > strip.clientWidth,
            fits:box.left >= 0 && box.right <= window.innerWidth && head.width > 0,
            headerFits:title.right <= score.left || title.bottom <= score.top,
            background:getComputedStyle(strip).backgroundColor,fontSize:style.fontSize,lineHeight:style.lineHeight,disclaimerSize:disclaimerStyle.fontSize};
        });
        assert(!layout.pageOverflow && !layout.stripOverflow && layout.fits && layout.headerFits, 'Layout overflow: ' + entryPage + ' ' + id + ' ' + width);
        assert.equal(layout.background, 'rgb(255, 244, 229)');
        assert.equal(layout.fontSize, '14px');
        assert.equal(layout.lineHeight, '24.5px');
        assert.equal(layout.disclaimerSize, '11px');
        layoutChecks.push({page:entryPage,width,id,status:'ok'});
      }
    }
    await page.setViewportSize({width:390,height:1000});
    await select('traditional-beef-noodles');
    const expectedNav = await page.evaluate(() => buildAmapUrl(POINTS.find(point => point.id === 'traditional-beef-noodles')));
    await page.locator('#navBtn').click();
    await page.waitForURL(url => url.origin === 'https://uri.amap.com');
    assert.equal(page.url(), expectedNav);
    assert.equal(new URL(page.url()).searchParams.get('to'), '121.50125,31.21243,传统牛肉面');
    navigationChecks.push({page:entryPage,mode:'walk',coordinates:'121.50125,31.21243',status:'ok'});
  }
  await page.goto(base + '/', {waitUntil:'load'});
  await select('panguoxianhuntun');
  // 内容逃逸和异常数据：作为文字显示，不创建图片或执行脚本；无效评分不显示。
  const safety = await page.evaluate(() => {
    const original = window.POINT_REVIEWS_DATA;
    window.POINT_REVIEWS_DATA = {label:'<b>label</b>',disclaimer:'<b>note</b>',entries:{test:{rating:5,text:'<img src=x onerror="window.__unsafeReview=true"> & <script>bad()</script>'}}};
    const fragment = document.createElement('div'); fragment.innerHTML = renderPointReview({id:'test',name:'" ><img src=x>'});
    const escaped = !fragment.querySelector('img,script,b') && fragment.querySelector('p').textContent.includes('<img');
    const invalid = [0,6,null,NaN,'5'].every(rating => {
      window.POINT_REVIEWS_DATA.entries.test.rating = rating; return renderPointReview({id:'test',name:'Test'}) === '';
    });
    window.POINT_REVIEWS_DATA = undefined;
    const missingData = renderPointReview({id:'test',name:'Test'}) === '';
    window.POINT_REVIEWS_DATA = original;
    return {escaped,invalid,missingData};
  });
  assert.deepEqual(safety, {escaped:true,invalid:true,missingData:true});
  for (const [id,filename] of [['panguoxianhuntun','轻量短评条-本地实页.png'],['traditional-beef-noodles','传统牛肉面-短评.png'],['roast-meat-rice-canteen','烧腊卤味饭堂-短评.png'],['zhongtai-securities','中泰证券-已确认照片.png']]) {
    await select(id);
    await page.locator('#mapSheet .map-place-photo img').evaluate(img => img.decode());
    await page.locator('#mapSheet .map-sheet-compact').screenshot({path:path.join(out,filename)});
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failedLocalResponses, []);
  const results = {date:'2026-10-13',localOnly:true,deployed:false,selectedStyle:'轻量短评条',activePointCount:57,photographedPointCount:54,
    reviewedPointCount:8,pendingPoint:'超杰沪味面坊（待补点位，不评分）',reviewChecks,layoutChecks,navigationChecks,safety,errors,failedLocalResponses};
  fs.writeFileSync(path.join(out,'integration-verification-results.json'), JSON.stringify(results,null,2));
  console.log(JSON.stringify({reviewChecks:reviewChecks.length,layoutChecks:layoutChecks.length,navigationChecks,safety,errors,failedLocalResponses}));
})().catch(error => {console.error(error);process.exitCode=1;}).finally(async () => {if (browser) await browser.close();server.close();});
