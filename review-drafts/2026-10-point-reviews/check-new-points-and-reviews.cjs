const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root='F:/Project/jsjs_begin';
const out=path.join(root,'review-drafts/2026-10-point-reviews');
const preview='C:/Users/fanta/.codex/visualizations/2026/08/24/01a032eb-3731-7c72-9194-e2bfe2ee10ba/point-review-ui-options-preview.html';
const record=JSON.parse(fs.readFileSync(path.join(root,'review-drafts/2026-10-point-additions/update-records.json'),'utf8'));
const reviews=JSON.parse(fs.readFileSync(path.join(out,'review-copy.json'),'utf8'));
const expected={
  'traditional-beef-noodles':[121.50125,31.21243],
  'guaniu-convenience':[121.50622,31.212472],
  'beef-noodles-lamb-soup-yangguangli':[121.50049,31.212606],
  'roast-meat-rice-canteen':[121.500786,31.212633],
  'zhongtai-securities':[121.504206,31.2122],
  'guoshuiyuguan':[121.501158,31.212449]
};
if(JSON.stringify(reviews.entries.map(e=>e.rating))!==JSON.stringify([5,3,4,4,4,null,5,3,5]))throw new Error('Original ratings changed');
reviews.entries.forEach(entry=>{const count=[...entry.text].filter(c=>/[\p{Script=Han}\p{Letter}\p{Number}]/u.test(c)).length;if(count<30||count>50)throw new Error('Invalid review length');});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(path.resolve(root)+path.sep)||pathname.includes('/.git')){response.writeHead(403);response.end();return;}
  fs.readFile(file,(error,bytes)=>{response.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});response.end(error?'Not found':bytes);});
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context=await browser.newContext({viewport:{width:390,height:900}});
  const errors=[];const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://**/*',route=>route.abort());
  const pointChecks=[];
  for(const pathname of ['/','/index_renew.html']){
    await page.goto(base+pathname,{waitUntil:'domcontentloaded'});
    const actual=await page.evaluate(()=>window.POINTS_DATA);
    if(actual.length!==57||new Set(actual.map(p=>p.id)).size!==57||actual.some(p=>p.id==='haochuizi'))throw new Error('Incorrect point enable/disable state');
    if(actual.filter(p=>p.image).length!==54)throw new Error('Incorrect photo count');
    for(const [id,coords] of Object.entries(expected)){
      const point=actual.find(p=>p.id===id);
      if(!point||point.lng!==coords[0]||point.lat!==coords[1])throw new Error('Coordinates changed '+id);
      if(id==='zhongtai-securities'&&point.image!=='assets/points/zhongtai-securities-20261013.webp')throw new Error('Confirmed Zhongtai image missing');
      await page.evaluate(id=>{state.view='map';state.category='all';state.mapMode=null;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view==='map'));selectRealMapPoint(POINTS.find(p=>p.id===id));},id);
      if(point.image){
        const img=page.locator('#mapSheet .map-place-photo img');await img.evaluate(img=>img.decode());
        if(await img.getAttribute('src')!==point.image)throw new Error('Wrong thumbnail');
        await page.locator('.map-place-photo-zoom').click();await page.locator('#activityPhotoLightbox').waitFor({state:'visible'});
        await page.locator('#activityPhotoImage').evaluate(img=>img.decode());
        if(await page.locator('#activityPhotoImage').getAttribute('src')!==point.image)throw new Error('Wrong enlarged photo');
        await page.keyboard.press('Escape');
      }
      pointChecks.push({page:pathname,id,photo:point.image?'verified':'not-provided',coords:'verified'});
    }
    await page.evaluate(()=>{state.category='shopping';setView('list');});
    const text=await page.locator('[data-view="list"]').innerText();
    if(text.includes('好厨子小碗菜')||!text.includes('传统牛肉面')||!text.includes('瓜牛便利店')||!text.includes('过水鱼馆'))throw new Error('List includes disabled point or misses new point');
  }
  const ui=await context.newPage();ui.on('pageerror',error=>errors.push(error.message));
  await ui.setViewportSize({width:736,height:760});
  await ui.goto('file:///'+preview,{waitUntil:'domcontentloaded'});
  const frame=ui.frameLocator('iframe');
  await frame.locator('#point-review-designs').waitFor();
  const variantNames=['轻量短评条','详情内展开','评分便签卡'];const variantChecks=[];
  for(let i=0;i<variantNames.length;i++){
    if(i)await frame.getByRole('button',{name:'下个样式',exact:true}).click();
    const variant=frame.locator(`[data-variant="${variantNames[i]}"]`);await variant.waitFor({state:'visible'});
    for(let n=0;n<reviews.entries.length;n++){
      await frame.locator('#review-shop-picker').selectOption(String(n));
      if(await variant.locator('[data-review-text]').textContent()!==reviews.entries[n].text)throw new Error('Preview review incorrect');
      if(n===5&&await variant.locator('[data-review-photo]').isVisible())throw new Error('Upcoming shop shows invented photo');
      const score=await variant.locator('[data-review-score], [data-review-big-score]').allTextContents();
      if(n===5&&!score.some(t=>t.includes('待开业')))throw new Error('Upcoming status missing');
    }
    await frame.locator('#review-shop-picker').selectOption('0');
    if(i===1){const fold=variant.locator('[data-fold-review]');await fold.click();if(await variant.locator('#review-expanded-detail').isVisible())throw new Error('Cannot collapse details');await fold.click();}
    for(const width of [320,375,736]){
      await ui.setViewportSize({width,height:760});
      const overflow=await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
      if(overflow)throw new Error('UI overflow '+variantNames[i]+' '+width);
    }
    await ui.setViewportSize({width:430,height:760});
    await frame.locator('#point-review-designs').screenshot({path:path.join(out,`preview-review-style-${i+1}.png`)});
    variantChecks.push({name:variantNames[i],shops:9,widths:[320,375,736],status:'ok'});
  }
  if(errors.length)throw new Error(errors.join('; '));
  const results={pointChecks,variantChecks,originalScoresPreserved:true,reviewLengthRange:'30–50字',localOnly:true,errors};
  fs.writeFileSync(path.join(out,'verification-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
