const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto'), http = require('node:http');
const { chromium } = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const before = JSON.parse(fs.readFileSync(path.join(__dirname, 'before-hashes.json'), 'utf8'));
const normalize = text => text.replace(/\r\n/g, '\n');
const normalizeHtml = text => normalize(text).replace(/(index_renew\.(?:css|js)\?v=)[^"\s]+/g, '$1VERSION');
assert.equal(normalize(fs.readFileSync(path.join(root, 'index_renew.js'), 'utf8')), normalize(before.beforeJs));
assert.equal(normalize(fs.readFileSync(path.join(root, 'index_renew.css'), 'utf8')), normalize(before.beforeCss));
for (const entry of ['index.html', 'index_renew.html']) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  assert.equal(normalizeHtml(html), normalizeHtml(before.beforeHtml));
  assert(html.includes('index_renew.css?v=20261015-original-icons-restored'));
  assert(html.includes('index_renew.js?v=20261015-original-icons-restored'));
}
for (const [file, expected] of Object.entries(before.preserved)) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), expected, `Unrelated change in ${file}`);
}
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.webp':'image/webp', '.png':'image/png' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || pathname.includes('/.git')) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, bytes) => { res.writeHead(error?404:200, {'Content-Type':mime[path.extname(file)]||'application/octet-stream'}); res.end(error?'Not found':bytes); });
});
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ viewport:{width:390,height:900} });
  await context.route('**/*', route => route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page = await context.newPage(), errors = [], iconRequests = [], checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/assets/icons/category-')) iconRequests.push(request.url()); });
  const categories = [['service','👥'],['shopping','🛒'],['leisure','🌳'],['memory','🏛️']];
  for (const entry of ['index.html','index_renew.html']) {
    await page.goto(`${base}/${entry}`, {waitUntil:'load'});
    for (const [key, icon] of categories) assert.equal(await page.locator(`[data-quick="${key}"] .quick-icon`).textContent(), icon);
    assert.equal(await page.locator('.category-symbol, .category-icon-frame').count(), 0);
    if (entry==='index.html') {
      await page.screenshot({path:path.join(__dirname,'恢复原图标-首页.png'),animations:'disabled'});
      await page.locator('#quickEntries').screenshot({path:path.join(__dirname,'恢复原图标-四类入口.png'),animations:'disabled'});
    }
    const markerCount = await page.evaluate(() => {
      state.mapMode=null;
      for(const point of POINTS) {
        const core=createAmapMarkerElement(point).querySelector('.amap-community-marker-core');
        if(core.textContent!==point.icon || core.querySelector('img')) throw new Error('Marker not restored: '+point.id);
      }
      return POINTS.length;
    });
    for(const [key,icon] of categories) {
      await page.locator(`[data-quick="${key}"]`).click();
      const icons=await page.locator('.place-icon').allTextContents(); assert(icons.length>0 && icons.every(text=>text===icon));
      await page.evaluate(()=>setView('home'));
      assert.equal(await page.locator(`[data-guide-category="${key}"] .guide-chapter-icon`).textContent(),icon);
    }
    await page.evaluate(()=>setView('phone'));
    assert.equal(await page.locator('.contact-icon').first().textContent(),'👥');
    const data=await page.evaluate(()=>({haiyin:getPoint('haiyin-music').name,qiangsheng:getPoint('qiangsheng').name,timePhoto:getPoint('time-plastic').image,guide:GUIDE_GALLERY_IMAGES.map(img=>img.src)}));
    assert.equal(data.haiyin,'海音琴行'); assert.equal(data.qiangsheng,'强生医院');
    assert(data.timePhoto.includes('time-plastic-20261013'));
    assert(data.guide.every(src=>src.includes('20261012')));
    checks.push({entry,home:'original icons',list:'all four restored',mapMarkers:markerCount,guide:'all four restored',phone:'restored',priorUpdates:'preserved'});
  }
  assert.deepEqual(errors,[]); assert.deepEqual(iconRequests,[]);
  const result={localOnly:true,deployed:false,restored:true,exactJsAndCssMatchBeforeIconChange:true,htmlDiff:'cache-version only',preservedFiles:Object.keys(before.preserved),checks,newIconAssetRequests:iconRequests,errors};
  fs.writeFileSync(path.join(__dirname,'restore-verification.json'),JSON.stringify(result,null,2)); console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser) await browser.close();server.close();});
