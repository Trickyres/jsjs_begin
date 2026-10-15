// 仅验证本地页面和素材，不连接线上网站、不发布。
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'points-data.js'), 'utf8');
const sandbox = {window:{}}; vm.runInNewContext(source,sandbox);
const points = JSON.parse(JSON.stringify(sandbox.window.POINTS_DATA));
const adjusted = {
  'traditional-beef-noodles': {coords:[121.50125,31.21243],offset:[62,22]},
  xiaolaoban: {coords:[121.501115,31.212487],offset:[-8,-58]},
  guoshuiyuguan: {coords:[121.501158,31.212449],offset:[-4,-12]},
  laochengxiangtangbao: {coords:[121.501217,31.212437],offset:[-16,32]},
  alishaokao: {coords:[121.501184,31.212451],offset:[30,-20]},
  tonecoffee: {coords:[121.500203,31.211531],offset:[-8,40]}
};
assert.equal(points.length,56); assert.equal(new Set(points.map(p=>p.id)).size,56);
assert.equal(points.filter(p=>p.image).length,54);
assert(!points.some(p=>p.id==='kangyou-siji'||p.id==='haochuizi'));
assert(source.includes('//   "id": "kangyou-siji"'));
assert(fs.existsSync(path.join(root,'assets/points/kangyou-siji.webp')));
for (const [id,expected] of Object.entries(adjusted)) {
  const point=points.find(p=>p.id===id);
  assert.deepEqual([point.lng,point.lat],expected.coords,id+' navigation coordinates');
  assert.deepEqual(point.markerOffset,expected.offset,id+' display offset');
}
for (const p of points.filter(p=>p.image)) assert(fs.existsSync(path.join(root,p.image)),'Missing asset: '+p.id);
const tobacco=points.find(p=>p.id==='haoxiang');
assert.equal(tobacco.address,'上海市黄浦区陆家浜路305弄4-8号阳光里');
assert.deepEqual([tobacco.lng,tobacco.lat],[121.500724,31.212636]);
assert.equal(tobacco.image,'assets/points/haoxiang-tobacco-20261014.webp');
const noodle=points.find(p=>p.id==='beef-noodles-lamb-soup-yangguangli');
assert.equal(noodle.name,'牛肉面羊肉汤（阳光里店）');
assert.deepEqual([noodle.lng,noodle.lat],[121.50049,31.212606]);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||pathname.includes('/.git')){response.writeHead(403);response.end();return;}
  fs.readFile(file,(error,bytes)=>{response.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});response.end(error?'Not found':bytes);});
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context=await browser.newContext({viewport:{width:390,height:1000}});
  await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  const page=await context.newPage(),errors=[],pageChecks=[],geometryChecks=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const pathname of ['/','/index_renew.html']){
    await page.goto(base+pathname,{waitUntil:'load'});
    const runtime=await page.evaluate(()=>window.POINTS_DATA);
    assert.deepEqual(runtime,points);
    await page.evaluate(()=>{
      state.view='map';state.category='shopping';state.mapMode=null;
      document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view==='map'));
      document.querySelector('#amapMapStatus').hidden=true;
      // 模拟覆盖物 API 以验证实际渲染函数、点击绑定、偏移和坐标；不伪造真实地图截图。
      window.__testMarkers=[];window.__testPan=[];
      class Pixel{constructor(x,y){this.x=x;this.y=y;}}
      class Marker{
        constructor(options){this.options=options;window.__testMarkers.push(this);}
        on(event,handler){if(event==='click')this.click=handler;}
        setMap(map){this.removed=map===null;}
        setzIndex(zIndex){this.zIndex=zIndex;}
      }
      amapRuntime.api={Pixel,Marker};
      amapRuntime.map={panTo:coords=>window.__testPan.push(coords)};
      renderAmapMarkers();
    });
    const markers=await page.evaluate(()=>window.__testMarkers.map(m=>({id:m.options.content.dataset.id,position:m.options.position,offset:[m.options.offset.x,m.options.offset.y],anchor:m.options.anchor})));
    assert.equal(markers.length,points.filter(p=>p.category==='shopping').length);
    assert(!markers.some(m=>m.id==='kangyou-siji'));
    for(const [id,expected] of Object.entries(adjusted)){
      const marker=markers.find(m=>m.id===id);
      assert.deepEqual(marker.position,expected.coords);
      assert.deepEqual(marker.offset,expected.offset);
      assert.equal(marker.anchor,'bottom-center');
      const exported=await page.evaluate(id=>JSON.parse(pointToSource(POINTS.find(p=>p.id===id))),id);
      assert.deepEqual(exported.markerOffset,expected.offset,'Export lost offset');
      const nav=await page.evaluate(id=>buildAmapUrl(POINTS.find(p=>p.id===id)),id);
      assert(new URL(nav).searchParams.get('to').startsWith(expected.coords.join(',')+','),'Navigation coordinates changed');
      await page.evaluate(id=>amapRuntime.markers.get(id).marker.click(),id);
      await page.locator('#mapSheet.is-open').waitFor({state:'visible'});
      assert.equal(await page.locator('#mapSheet h3').textContent(),points.find(p=>p.id===id).name);
      const pan=await page.evaluate(()=>window.__testPan.at(-1));assert.deepEqual(pan,expected.coords);
      pageChecks.push({page:pathname,id,markerOffset:'ok',navigation:'unchanged',click:'correct',export:'preserved'});
    }
    for(const id of ['haoxiang','beef-noodles-lamb-soup-yangguangli']){
      await page.evaluate(id=>amapRuntime.markers.get(id).marker.click(),id);
      await page.locator('#mapSheet .map-place-photo img').evaluate(img=>img.decode());
      await page.locator('#mapSheet .map-place-photo-zoom').click();
      await page.locator('#activityPhotoLightbox').waitFor({state:'visible'});
      await page.locator('#activityPhotoImage').evaluate(img=>img.decode());
      assert.equal(await page.locator('#activityPhotoImage').getAttribute('src'),points.find(p=>p.id===id).image);
      await page.keyboard.press('Escape');await page.locator('#activityPhotoLightbox').waitFor({state:'hidden'});
    }
    // 8条原有短评保留且直接可见。
    const reviewDraft=JSON.parse(fs.readFileSync(path.join(root,'review-drafts/2026-10-point-reviews/review-copy.json'),'utf8'));
    for(const entry of reviewDraft.entries.filter(e=>e.pointId)){
      await page.evaluate(id=>amapRuntime.markers.get(id).marker.click(),entry.pointId);
      assert.equal(await page.locator('.map-point-review__text').textContent(),entry.text);
      assert.equal(await page.locator('.map-point-review__score').textContent(),`个人 ${entry.rating} / 5`);
    }
    const validation=await page.evaluate(()=>{
      const invalid=[null,[],[1],[0,0,0],['1',0],[NaN,0],[Infinity,1],[100,0]].every(markerOffset=>getAmapMarkerOffset({markerOffset}).join(',')==='0,0');
      const mode=state.mapMode;state.mapMode=BINJIANG_ROUTE_MODE;
      const routeSafe=POINTS.every(p=>getAmapMarkerOffset(p).join(',')==='0,0');
      window.__testMarkers=[];renderAmapMarkers();
      const routeIds=window.__testMarkers.map(m=>m.options.content.dataset.id);
      state.mapMode=mode;renderAmapMarkers();
      return {invalid,routeSafe,routeIds};
    });
    assert(validation.invalid&&validation.routeSafe);
    assert.deepEqual(validation.routeIds,['huangpu-riverside','dongjiadu-flower-bridge','dongjiadu-road-ferry','ferry-space']);
    // 墨卡托投影及真实标记元素边界，用于测量5店防重叠和左右关系。
    for(const zoom of [13,15.5,17,19]){
      const geometry=await page.evaluate(({zoom,ids})=>{
        const canvas=document.querySelector('#duojiaMap');canvas.replaceChildren();
        const scale=256*2**zoom;
        const project=p=>[p.lng/360*scale,(1-Math.log(Math.tan(p.lat*Math.PI/180)+1/Math.cos(p.lat*Math.PI/180))/Math.PI)/2*scale];
        const center=project({lng:121.50117,lat:31.21245});
        const positions={};
        for(const id of ids){
          const point=POINTS.find(p=>p.id===id),[x,y]=project(point),[dx,dy]=getAmapMarkerOffset(point);
          const el=createAmapMarkerElement(point);
          el.style.position='absolute';el.style.left=(canvas.clientWidth/2+x-center[0]+dx-15)+'px';el.style.top=(canvas.clientHeight/2+y-center[1]+dy-38)+'px';
          canvas.append(el);const box=el.getBoundingClientRect();positions[id]={left:box.left,top:box.top,right:box.right,bottom:box.bottom};
        }
        const overlap=[];
        for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
          const x=positions[ids[a]],y=positions[ids[b]];
          if(Math.min(x.right,y.right)>Math.max(x.left,y.left)&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top))overlap.push([ids[a],ids[b]]);
        }
        const aliRight=positions.alishaokao.left>positions.laochengxiangtangbao.right;
        const beefRight=positions['traditional-beef-noodles'].left>positions.laochengxiangtangbao.right;
        canvas.replaceChildren();return{zoom,overlap,aliRight,beefRight};
      },{zoom,ids:['xiaolaoban','guoshuiyuguan','laochengxiangtangbao','alishaokao','traditional-beef-noodles']});
      assert.deepEqual(geometry.overlap,[],'5 marker click areas overlap at zoom '+zoom);
      assert(geometry.aliRight&&geometry.beefRight,'Marker ordering incorrect');
      geometryChecks.push({page:pathname,...geometry});
    }
    await page.evaluate(()=>{state.category='all';setView('list');});
    const list=await page.locator('[data-view="list"]').innerText();
    assert(!list.includes('康友四季'));
    assert(list.includes('牛肉面羊肉汤（阳光里店）')&&!list.includes('上海黄浦区牛肉面羊肉汤'));
  }
  await page.evaluate(()=>{
    state.view='map';document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.dataset.view==='map'));
    selectRealMapPoint(POINTS.find(p=>p.id==='haoxiang'));
  });
  await page.locator('#mapSheet .map-place-photo img').evaluate(img=>img.decode());
  await page.locator('#mapSheet .map-sheet-compact').screenshot({path:path.join(__dirname,'豪祥名烟名酒-本地点位.png')});
  for(const width of [320,375,430]){
    await page.setViewportSize({width,height:1000});
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'Mobile page overflow');
  }
  assert.deepEqual(errors,[]);
  const result={date:'2026-10-14',localOnly:true,deployed:false,pointCount:56,photoCount:54,shortReviewsPreserved:8,
    positionPolicy:'仅显示偏移，导航GCJ-02坐标未改',originalKangyouPhotoPreserved:true,pageChecks,geometryChecks,errors};
  fs.writeFileSync(path.join(__dirname,'verification-results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({pointCount:56,photoCount:54,pageChecks:pageChecks.length,geometryChecks,errors}));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
