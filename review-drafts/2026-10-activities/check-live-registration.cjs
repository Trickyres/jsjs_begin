const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = 'F:/Project/jsjs_begin';
const output = 'C:/Users/fanta/.codex/visualizations/2026/08/24/01a032eb-3731-7c72-9194-e2bfe2ee10ba';
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf'};
const server = http.createServer((request,response)=>{
  const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const file = path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(path.resolve(root)+path.sep) || pathname.includes('/.git')) {response.writeHead(403);response.end();return;}
  fs.readFile(file,(error,bytes)=>{response.writeHead(error?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});response.end(error?'Not found':bytes);});
});
const mapping = [
  {id:'plant',title:'白领绿植手工活动',url:'https://f.wps.cn/g/XqX8hSU4/'},
  {id:'chongyang',title:'重阳敬老主题活动',url:'https://f.wps.cn/g/9kanmwuG/'},
  {id:'osmanthus',title:'金桂节主题活动',url:'https://f.wps.cn/g/JPJ5677T/'}
];
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = process.argv[2] || process.env.REGISTRATION_SITE_URL || `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context = await browser.newContext({viewport:{width:390,height:1000},colorScheme:'light'});
  await context.route('https://f.wps.cn/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<title>Registration destination</title>'}));
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.__registrationNow=Date.parse('2026-10-13T09:00:00+08:00');Date.now=()=>window.__registrationNow;});
  for(const entry of ['/','/index_renew.html']) {
    await page.goto(base+entry,{waitUntil:'domcontentloaded'});
    await page.locator('.home-registration').waitFor();
    for(const event of mapping) {
      await page.locator(`[data-registration-select="${event.id}"]`).click();
      const links=page.locator('a.event-registration__card:visible');
      if(await links.count()!==1 || await links.first().getAttribute('href')!==event.url) throw new Error('Wrong visible registration link');
      if(await links.locator('.event-registration__title').textContent()!==event.title) throw new Error('Wrong event title');
      const popupPromise=page.waitForEvent('popup');
      await links.locator('.event-registration__status').click();
      const popup=await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      if(popup.url()!==event.url) throw new Error('Registration does not navigate directly');
      await popup.close();
    }
    await page.locator('[data-registration-select="plant"]').click();
  }
  const layout=[];
  for(const width of [320,375,430]) {
    await page.setViewportSize({width,height:1000});
    layout.push(await page.locator('.home-registration').evaluate((section,width)=>{
      const title=section.querySelector('a:not([hidden]) .event-registration__title');
      return {width,titleFits:title.scrollWidth<=title.clientWidth,dates:[...section.querySelectorAll('.event-registration__day')].map(button=>({text:button.textContent,height:button.getBoundingClientRect().height})),pageOverflow:document.documentElement.scrollWidth>window.innerWidth};
    },width));
  }
  await page.setViewportSize({width:390,height:1100});
  await page.screenshot({path:path.join(output,'registration-styles-home.png'),fullPage:true});
  const multipleMarkup=await page.locator('.home-registration').evaluate(section=>section.outerHTML);
  const expiry=[];
  let singleMarkup;
  for(const [date,expectedDays,expectedId,expectedCount,mode] of [
    ['2026-10-14T12:00:00+08:00',['16日','27日'],'chongyang',2,'multiple'],
    ['2026-10-16T10:00:00+08:00',[],'osmanthus',1,'single'],
    ['2026-10-27T11:00:00+08:00',[],null,0,'empty']
  ]) {
    await page.evaluate(date=>{window.__registrationNow=Date.parse(date);window.dispatchEvent(new Event('pageshow'));},date);
    const days=await page.locator('.event-registration__day:visible').allTextContents();
    if(JSON.stringify(days)!==JSON.stringify(expectedDays)) throw new Error('Expired dates remain visible');
    const active=await page.locator('a.event-registration__card:visible').count();
    if(active!==(expectedId?1:0)) throw new Error('Expired registration remains available');
    if(expectedId && await page.locator('a.event-registration__card:visible').getAttribute('data-registration-id')!==expectedId) throw new Error('Selection does not advance to next activity');
    if(await page.locator('a[data-registration-id]:not([href])').count()!==3-expectedCount) throw new Error('Expired href remains present');
    if(!await page.locator(`.event-registration--${mode}`).count()) throw new Error('Incorrect registration layout mode');
    if(mode==='single') {
      if(!await page.locator('a.event-registration__card:visible .event-registration__date').isVisible()) throw new Error('Single date missing');
      if(await page.locator('a.event-registration__card:visible .event-registration__date').textContent()!=='10月27日') throw new Error('Wrong single date');
      for(const width of [320,375,430]) {
        await page.setViewportSize({width,height:1000});
        const result=await page.locator('a.event-registration__card:visible').evaluate(card=>{
          const boxes=[...card.children].map(child=>child.getBoundingClientRect());
          return {fits:boxes.every((box,i)=>i===0 || box.left>=boxes[i-1].right),overflow:document.documentElement.scrollWidth>window.innerWidth};
        });
        if(!result.fits || result.overflow) throw new Error('Single layout overlaps at '+width);
      }
      await page.setViewportSize({width:390,height:1100});
      singleMarkup=await page.locator('.home-registration').evaluate(section=>section.outerHTML);
      const popupPromise=page.waitForEvent('popup');
      await page.locator('a.event-registration__card:visible .event-registration__status').click();
      const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
      if(popup.url()!==mapping[2].url) throw new Error('Single registration URL incorrect');
      await popup.close();
    }
    expiry.push({date,days,active,mode});
  }
  if(!await page.locator('.event-registration__empty').isVisible()) throw new Error('Missing ended state');
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{window.__registrationNow=Date.parse('2026-10-14T12:00:00+08:00');document.getElementById('homeRegistrationPlant').click();});
  if(context.pages().length!==1) throw new Error('Expired click opens form');
  // 用真实首页组件的两种状态，仅加载独立CSS，检查脱离全站样式也可复用。
  const preview=await context.newPage();
  const css=fs.readFileSync(path.join(root,'activity-registration.css'),'utf8');
  await preview.setViewportSize({width:430,height:430});
  await preview.setContent(`<html><head><style>${css}</style><style>body{margin:0;padding:24px;background:#fff8ef;font-family:'Microsoft YaHei',sans-serif}.preview-label{margin:0 0 16px;color:#927d6f;font-size:13px}section+ .preview-label{margin-top:36px}</style></head><body><p class="preview-label">单个活动 · 固定报名样式</p>${singleMarkup}<p class="preview-label">多个活动 · 固定报名样式</p>${multipleMarkup}</body></html>`);
  await preview.screenshot({path:path.join(output,'registration-styles-preview.png'),fullPage:true});
  for(const width of [320,375,430]) {
    await preview.setViewportSize({width,height:590});
    const overflow=await preview.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
    if(overflow) throw new Error('Standalone CSS causes horizontal overflow');
  }
  await preview.close();
  console.log(JSON.stringify({mapping,layout,expiry,errors}));
  if(errors.length || layout.some(item=>!item.titleFits || item.pageOverflow)) throw new Error('Page or layout checks failed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
