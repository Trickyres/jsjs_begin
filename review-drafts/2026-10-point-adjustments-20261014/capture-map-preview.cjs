// 在只读本地预览中加载真实高德地图截图，不推送、不部署。
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||pathname.includes('/.git')){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,bytes)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'Not found':bytes);});
});
let browser;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--use-angle=swiftshader']});
  const page=await browser.newPage({viewport:{width:430,height:1050},deviceScaleFactor:2});
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded'});
  await page.locator('.bottom-nav [data-go="map"]').click();
  await page.waitForFunction(()=>Boolean(amapRuntime.map&&amapRuntime.markers.size)||document.querySelector('#amapMapStatus').classList.contains('is-error'),undefined,{timeout:45000});
  if(!await page.evaluate(()=>Boolean(amapRuntime.map&&amapRuntime.markers.size)))throw new Error('真实高德底图未加载，未制作模拟底图截图。');
  await page.evaluate(()=>{
    amapRuntime.map.setZoomAndCenter(17,[121.50117,31.21245]);
    selectRealMapPoint(POINTS.find(p=>p.id==='traditional-beef-noodles'));
  });
  await page.waitForTimeout(1800);
  await page.locator('#mapSheet .map-place-photo img').evaluate(img=>img.decode());
  await page.locator('[data-view="map"]').screenshot({path:path.join(__dirname,'餐饮点位-调整后.png')});
  await page.evaluate(()=>amapRuntime.markers.forEach(({marker})=>marker.setOffset(new amapRuntime.api.Pixel(0,0))));
  await page.waitForTimeout(250);
  await page.locator('.real-design-map').screenshot({path:path.join(__dirname,'餐饮点位-未偏移对照.png')});
  await page.evaluate(()=>{
    renderAmapMarkers();amapRuntime.map.setZoomAndCenter(17,[121.50117,31.21245]);
    selectRealMapPoint(POINTS.find(p=>p.id==='alishaokao'));
  });
  await page.waitForTimeout(800);
  await page.locator('[data-view="map"]').screenshot({path:path.join(__dirname,'阿力烧烤-调整后.png')});
  await page.evaluate(()=>{
    amapRuntime.map.setZoomAndCenter(17,[121.500203,31.211531]);
    selectRealMapPoint(POINTS.find(p=>p.id==='tonecoffee'));
  });
  await page.waitForTimeout(800);
  await page.locator('[data-view="map"]').screenshot({path:path.join(__dirname,'T-ONE咖啡-向南微调.png')});
  // 真实API下确认5店的点击框互不相交，并确认阿力在汤包馆右侧。
  const geometry=[];
  for(const zoom of [15.5,17,18,19]){
    await page.evaluate(zoom=>{
      amapRuntime.map.setZoomAndCenter(zoom,[121.50117,31.21245]);
      state.selectedId='duojia-committee';updateAmapMarkerSelection();
    },zoom);
    await page.waitForTimeout(350);
    geometry.push(await page.evaluate(zoom=>{
      const ids=['xiaolaoban','guoshuiyuguan','laochengxiangtangbao','alishaokao','traditional-beef-noodles'];
      const boxes=Object.fromEntries(ids.map(id=>{
        const box=amapRuntime.markers.get(id).element.getBoundingClientRect();
        return[id,{left:box.left,right:box.right,top:box.top,bottom:box.bottom}];
      }));
      const overlap=[];
      for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
        const a=boxes[ids[i]],b=boxes[ids[j]];
        if(Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top))overlap.push([ids[i],ids[j]]);
      }
      return{zoom,overlap,aliRight:boxes.alishaokao.left>boxes.laochengxiangtangbao.right,boxes};
    },zoom));
  }
  const result={localOnly:true,deployed:false,map:'真实高德地图，本地页面截图',geometry};
  fs.writeFileSync(path.join(__dirname,'real-map-preview-record.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({map:result.map,geometry:geometry.map(({zoom,overlap,aliRight})=>({zoom,overlap,aliRight}))}));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
