const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),asset='assets/points/south-bund-tailoring-center-20261014.webp';
assert(fs.existsSync(path.join(root,asset)));assert(fs.existsSync(path.join(root,'assets/points/south-bund-tailoring-center.webp')));
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
  const context=await browser.newContext({viewport:{width:390,height:850}});
  await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const name of ['/','/index_renew.html']){
    await page.goto(base+name,{waitUntil:'load'});
    const point=await page.evaluate(()=>window.POINTS_DATA.find(p=>p.id==='fabric-market'));
    assert.equal(point.image,asset);assert.equal(point.name,'南外滩量身定制中心');
    assert.equal(point.address,'上海市黄浦区陆家浜路399号');assert.deepEqual([point.lng,point.lat],[121.499716,31.211674]);
    await page.evaluate(()=>{
      state.view='map';document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view==='map'));
      selectRealMapPoint(POINTS.find(p=>p.id==='fabric-market'));
    });
    await page.locator('#mapSheet .map-place-photo img').evaluate(img=>img.decode());
    await page.locator('#mapSheet .map-place-photo-zoom').click();
    await page.locator('#activityPhotoLightbox').waitFor({state:'visible'});
    await page.locator('#activityPhotoImage').evaluate(img=>img.decode());
    assert.equal(await page.locator('#activityPhotoImage').getAttribute('src'),asset);
    await page.keyboard.press('Escape');await page.locator('#activityPhotoLightbox').waitFor({state:'hidden'});
  }
  await page.locator('#mapSheet .map-place-photo-zoom').evaluate(button=>button.blur());
  await page.locator('#mapSheet .map-sheet-compact').screenshot({path:path.join(__dirname,'南外滩量身定制中心-新照片.png')});
  assert.deepEqual(errors,[]);
  const result={localOnly:true,deployed:false,pages:['index.html','index_renew.html'],asset,photoLoaded:true,photoZoom:'passed',nameAddressCoordinates:'unchanged',oldAssetPreserved:true,errors};
  fs.writeFileSync(path.join(__dirname,'tailoring-photo-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
