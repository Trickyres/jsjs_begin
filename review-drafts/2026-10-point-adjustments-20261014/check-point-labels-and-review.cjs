const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..');
const change=JSON.parse(fs.readFileSync(path.join(__dirname,'point-labels-and-noodle-review.json'),'utf8'));
const originalReviews=JSON.parse(fs.readFileSync(path.join(root,'review-drafts/2026-10-point-reviews/review-copy.json'),'utf8'));
const originalPoints=JSON.parse(fs.readFileSync(path.join(root,'review-drafts/2026-10-point-additions/update-records.json'),'utf8'));
const restore=JSON.parse(fs.readFileSync(path.join(__dirname,'恢复五店位置记录.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)||name.includes('/.git')){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,bytes)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'Not found':bytes);});
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context=await browser.newContext({viewport:{width:390,height:950}});
  await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page=await context.newPage(),errors=[],checks=[];page.on('pageerror',error=>errors.push(error.message));
  for(const name of ['/','/index_renew.html']){
    await page.goto(base+name,{waitUntil:'load'});
    const {points,reviews}=await page.evaluate(()=>({points:window.POINTS_DATA,reviews:window.POINT_REVIEWS_DATA.entries}));
    assert.equal(points.length,56);assert.equal(points.filter(p=>p.image).length,54);assert.equal(Object.keys(reviews).length,9);
    for(const original of originalReviews.entries.filter(e=>e.pointId))assert.deepEqual(reviews[original.pointId],{rating:original.rating,text:original.text});
    for(const entry of restore.restoredPoints){
      const p=points.find(p=>p.id===entry.id);assert(!Object.hasOwn(p,'markerOffset'));assert.deepEqual([p.lng,p.lat],[entry.lng,entry.lat]);
    }
    assert.deepEqual(points.find(p=>p.id==='tonecoffee').markerOffset,[-8,40]);
    for(const id of change.removedNewTags){
      const point=points.find(p=>p.id===id),before=originalPoints.entries.find(e=>e.id===id);
      assert.equal(point.isNew,false);assert.equal(point.image,before.asset);assert.deepEqual([point.lng,point.lat],[before.lng,before.lat]);
      const marker=await page.evaluate(id=>{
        const el=createAmapMarkerElement(POINTS.find(p=>p.id===id));
        return{hasNew:!!el.querySelector('.amap-community-marker-new'),name:el.querySelector('.amap-community-marker-label').textContent};
      },id);
      assert(!marker.hasNew);assert.equal(marker.name,point.name);
      await page.evaluate(()=>{state.category='all';setView('list');});
      const card=page.locator('.place-card').filter({has:page.locator(`[data-view-map="${id}"]`)});
      assert.equal(await card.count(),1);assert.equal(await card.locator('.new-point-badge').count(),0);
      await page.evaluate(id=>{
        state.view='map';document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view==='map'));
        selectRealMapPoint(POINTS.find(p=>p.id===id));
      },id);
      assert.equal(await page.locator('#mapSheet .new-point-badge').count(),0);
      assert.equal(await page.locator('#mapSheet h3').textContent(),point.name);
      checks.push({page:name,id,mapMarker:'no-new-tag',mapCard:'no-new-tag',list:'no-new-tag',coordinates:'unchanged'});
    }
    assert(points.find(p=>p.id==='roast-meat-rice-canteen').isNew,'Unrequested tag changed');
    const noodle=points.find(p=>p.id===change.rename.pointId);assert.equal(noodle.name,change.rename.after);assert.equal(noodle.imageCaption,change.rename.imageCaptionAfter);
    assert.deepEqual(reviews[noodle.id],{rating:3,text:change.review.text});
    assert.equal([...change.review.text].filter(c=>/\p{Script=Han}/u.test(c)).length,40);
    await page.evaluate(id=>selectRealMapPoint(POINTS.find(p=>p.id===id)),noodle.id);
    await page.locator('#mapSheet.is-open .map-point-review').waitFor({state:'visible'});
    assert.equal(await page.locator('.map-point-review__text').textContent(),change.review.text);
    assert.equal(await page.locator('.map-point-review__score').textContent(),'个人 3 / 5');
    assert(await page.locator('.map-point-review').isVisible());
    await page.locator('#mapSheet .map-place-photo img').evaluate(img=>img.decode());
    await page.locator('#mapSheet .map-place-photo-zoom').click();await page.locator('#activityPhotoLightbox').waitFor({state:'visible'});
    await page.locator('#activityPhotoImage').evaluate(img=>img.decode());assert.equal(await page.locator('#activityPhotoTitle').textContent(),noodle.imageCaption);
    await page.keyboard.press('Escape');await page.locator('#activityPhotoLightbox').waitFor({state:'hidden'});
  }
  for(const width of [320,375,430]){
    await page.setViewportSize({width,height:950});
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'Mobile overflow');
  }
  await page.setViewportSize({width:390,height:950});
  await page.locator('#mapSheet .map-place-photo-zoom').evaluate(button=>button.blur());
  await page.locator('#mapSheet .map-sheet-compact').screenshot({path:path.join(__dirname,'牛肉面羊肉汤-短评.png')});
  assert.deepEqual(errors,[]);
  const result={localOnly:true,deployed:false,checks,newName:change.rename.after,newReview:change.review.text,rating:3,
    originalReviewsPreserved:8,activeReviews:9,fivePointPositionsPreserved:true,photoZoom:'passed',phoneWidths:[320,375,430],errors};
  fs.writeFileSync(path.join(__dirname,'point-labels-and-review-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
