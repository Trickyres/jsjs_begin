const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root='F:/Project/jsjs_begin';
const directory=path.join(root,'review-drafts/2026-10-point-photos');
const parse=source=>JSON.parse(source.slice(source.indexOf('['),source.lastIndexOf(']')+1).split(/\r?\n/).filter(line=>!line.trimStart().startsWith('//')).join('\n'));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const record=JSON.parse(fs.readFileSync(path.join(directory,'update-records.json'),'utf8'));
const before=parse(execFileSync('git',['show','HEAD:points-data.js'],{cwd:root,encoding:'utf8'}));
const after=parse(fs.readFileSync(path.join(root,'points-data.js'),'utf8'));
const ignorePhoto=point=>Object.fromEntries(Object.entries(point).filter(([key])=>!['image','imageAlt','imageCaption'].includes(key)));
if(JSON.stringify(before.map(ignorePhoto))!==JSON.stringify(after.map(ignorePhoto))) throw new Error('Non-photo point fields changed');
if(record.entries.length!==37 || new Set(record.entries.map(entry=>entry.file)).size!==37) throw new Error('Incomplete source decisions');
for(const entry of record.entries) {
  if(hash(fs.readFileSync(entry.sourcePath))!==entry.sourceSha256) throw new Error('Source file modified');
  const point=after.find(point=>point.id===entry.pointId);
  if(entry.newImage) {
    if(point.image!==entry.newImage || point.imageAlt!==entry.alt || point.imageCaption!==entry.caption) throw new Error('Photo fields do not match record: '+entry.pointId);
    if(hash(fs.readFileSync(path.join(root,entry.newImage)))!==entry.outputSha256) throw new Error('Selected asset changed');
  }
  if(entry.oldImage && !fs.existsSync(path.join(root,entry.oldImage))) throw new Error('Original asset was removed');
}
for(const point of after) if(point.image&&!fs.existsSync(path.join(root,point.image))) throw new Error('Missing point photo: '+point.id);
const changed=after.filter(point=>point.image!==before.find(prior=>prior.id===point.id)?.image);
if(changed.length!==record.entries.filter(entry=>entry.newImage).length) throw new Error('Unrecorded photo changes');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(path.resolve(root)+path.sep)||pathname.includes('/.git')) {response.writeHead(403);response.end();return;}
  fs.readFile(file,(error,bytes)=>{response.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});response.end(error?'Not found':bytes);});
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context=await browser.newContext({viewport:{width:390,height:900}});
  await context.route('https://**',route=>route.abort());
  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const browserResults=[];
  for(const pathname of ['/','/index_renew.html']) {
    await page.goto(base+pathname,{waitUntil:'domcontentloaded'});
    for(const entry of record.entries.filter(entry=>entry.newImage)) {
      await page.evaluate(id=>{
        state.view='map';state.category='all';state.mapMode=null;
        document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.dataset.view==='map'));
        selectRealMapPoint(POINTS.find(point=>point.id===id));
      },entry.pointId);
      const image=page.locator('#mapSheet .map-place-photo img');
      await image.waitFor({state:'visible'});
      await image.evaluate(image=>image.decode());
      if(!await image.evaluate(image=>image.naturalWidth>0)||await image.getAttribute('src')!==entry.newImage) throw new Error('Point thumbnail missing');
      await page.locator('.map-place-photo-zoom').click();
      await page.locator('#activityPhotoLightbox').waitFor({state:'visible'});
      await page.locator('#activityPhotoImage').evaluate(image=>image.decode());
      if(await page.locator('#activityPhotoImage').getAttribute('src')!==entry.newImage) throw new Error('Enlarged photo incorrect');
      await page.keyboard.press('Escape');
      if(await page.locator('#activityPhotoLightbox').isVisible()) throw new Error('Photo overlay cannot close');
      await page.locator('#detailsBtn').click();
      if(!await page.locator('#sheetDetailExtra').isVisible()) throw new Error('Point details did not open');
      browserResults.push({page:pathname,id:entry.pointId,thumbnail:'ok',enlarge:'ok',details:'ok'});
      if(pathname==='/'&&['health-center','dongjiadu-ferry'].includes(entry.pointId)) {
        await page.locator('#detailsBtn').click();
        await page.locator('#mapSheet').screenshot({path:path.join(directory,`preview-${entry.pointId}.png`)});
      }
    }
    for(const width of [320,375,430]) {
      await page.setViewportSize({width,height:900});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
      if(overflow) throw new Error('Mobile horizontal overflow');
    }
  }
  await page.setViewportSize({width:1100,height:1000});
  await page.goto(base+'/review-drafts/2026-10-point-photos/'+encodeURIComponent('更新记录.html'),{waitUntil:'load'});
  if(await page.locator('article').count()!==37) throw new Error('Report omits source photos');
  const reportImages=await page.locator('img').evaluateAll(async images=>{images.forEach(image=>{image.loading='eager';});await Promise.all(images.map(image=>image.decode()));return images.every(image=>image.complete&&image.naturalWidth>0);});
  if(!reportImages) throw new Error('Report image missing');
  await page.screenshot({path:path.join(directory,'preview-update-records.png')});
  await page.setViewportSize({width:375,height:900});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)) throw new Error('Report mobile overflow');
  if(errors.length) throw new Error('Browser errors: '+errors.join('; '));
  const results={pointCount:after.length,counts:record.counts,photosBefore:record.photosBefore,photosAfter:after.filter(point=>point.image).length,unchangedNamesAddressesCoordinates:true,sourceFilesPreserved:true,oldAssetsPreserved:true,browserResults,reportRows:37,errors};
  fs.writeFileSync(path.join(directory,'verification-results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
