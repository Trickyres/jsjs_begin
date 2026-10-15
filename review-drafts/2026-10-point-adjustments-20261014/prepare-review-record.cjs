const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
if(fs.existsSync(path.join(__dirname,'恢复五店位置记录.json')))throw new Error('5家餐饮点位已恢复；本生成器仅对应恢复前的历史快照，不再覆盖现行恢复记录。');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'points-data.js'),'utf8'),sandbox);
const points=JSON.parse(JSON.stringify(sandbox.window.POINTS_DATA));
const actions=[
  {id:'kangyou-siji',name:'康友四季经络足道（多稼路店）',action:'注释停用',description:'地图、分类列表和搜索不再显示；原数据与照片均保留，可恢复。'},
  {id:'traditional-beef-noodles',action:'标记偏右',description:'在密集餐饮区域适度向右错开，保留你此前给定的导航坐标。'},
  {id:'xiaolaoban',action:'密集标记避让',description:'与过水鱼馆、汤包馆、阿力烧烤及传统牛肉面分开显示。'},
  {id:'guoshuiyuguan',action:'密集标记避让',description:'与附近同类标记错开，点位仍启用，照片及介绍保留。'},
  {id:'laochengxiangtangbao',action:'密集标记避让',description:'与阿力烧烤分开，阿力烧烤显示在本店右侧。'},
  {id:'alishaokao',action:'标记移至汤包馆右侧',description:'调整显示顺序与间距，原地址、照片、短评和导航坐标保留。'},
  {id:'tonecoffee',action:'标记向南微调',description:'地图朝北状态下图标略向下移动；现有地址和导航坐标不变。'},
  {id:'haoxiang',action:'补充照片',description:'采用豪祥名烟名酒原图，非浩丞照片；按你的要求仅补图，不改任何位置相关信息。'},
  {id:'beef-noodles-lamb-soup-yangguangli',action:'简化名称',beforeName:'上海黄浦区牛肉面羊肉汤（阳光里店）',description:'名称改为“牛肉面羊肉汤（阳光里店）”，地图标签、介绍和列表同步读取新名称。'}
].map(action=>{
  const point=points.find(p=>p.id===action.id);
  return {...action,name:point?.name||action.name,address:point?.address||null,lng:point?.lng??null,lat:point?.lat??null,
    markerOffset:point?.markerOffset||null,image:point?.image||null};
});
const photo=JSON.parse(fs.readFileSync(path.join(__dirname,'photo-record.json'),'utf8'));
const validation=JSON.parse(fs.readFileSync(path.join(__dirname,'verification-results.json'),'utf8'));
const realMap=JSON.parse(fs.readFileSync(path.join(__dirname,'real-map-preview-record.json'),'utf8'));
const record={date:'2026-10-14',localOnly:true,deployed:false,status:'本地完成，待用户审核；未提交、未推送、未上线',
  before:{activePoints:57,photographedPoints:54},after:{activePoints:points.length,photographedPoints:points.filter(p=>p.image).length},
  coordinatePolicy:'只用markerOffset调整标记的屏幕显示；任何现有导航lng/lat均未修改，豪祥的地址及坐标亦不变。',
  historicalRecords:'2026-10-13照片、点位与短评记录保留，未改写历史快照。',actions,photoRecord:'photo-record.json',
  reviewedPhoto:photo.identityCheck,photoAddressNote:photo.addressNote,shortReviewsPreserved:validation.shortReviewsPreserved,
  supportingMaintenance:'点位数据导出保留markerOffset；同时兼容x/y为空的真实地图点位，避免导出时报错。',
  verification:'verification-results.json',realMapPreview:'real-map-preview-record.json',mapGeometry:realMap.geometry.map(({zoom,overlap,aliRight})=>({zoom,overlap,aliRight}))};
fs.writeFileSync(path.join(__dirname,'update-records.json'),JSON.stringify(record,null,2));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=actions.map(a=>`<tr><td>${escape(a.name)}</td><td>${escape(a.action)}</td><td>${escape(a.description)}</td><td>${a.markerOffset?`显示偏移 ${a.markerOffset[0]} / ${a.markerOffset[1]} px<br>`:''}${a.lng!=null?`导航坐标未变<br>${a.lng}, ${a.lat}`:'原数据注释保留'}</td></tr>`).join('');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>10月14日点位调整 · 本地审核记录</title><style>
body{margin:0;background:#fff8ef;color:#3e3026;font:14px/1.7 'Microsoft YaHei',sans-serif}main{max-width:1080px;padding:28px 22px;margin:auto}h1{font-size:25px}h2{margin-top:30px;font-size:20px}.note{padding:16px 18px;border:1px solid #f2d4b3;border-radius:16px;background:#fff0db;color:#905224}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;background:#fffdf8}th,td{padding:12px 14px;border:1px solid #ebdfd2;text-align:left;vertical-align:top}th{background:#f6e8d7}td:first-child{min-width:140px}td:nth-child(3){min-width:260px}a{color:#b65327}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}figure{margin:0}figure img{display:block;max-width:100%;width:390px;border-radius:18px;box-shadow:0 10px 25px #5238251a}figcaption{font-size:12px;color:#927b6c;margin-top:10px}.muted{color:#927b6c}</style></head><body><main>
<h1>10月14日点位调整 · 本地审核记录</h1><div class="note">仅本地修改，未提交、未推送、未上线。<br>康友四季已注释；5家密集餐饮点位分开显示；豪祥补图、阳光里店简名、T-ONE向南微调。此次调整导航坐标均保留，标记位置仅作显示微调。</div>
<h2>修改明细</h2><p>当前${record.after.activePoints}个启用点位、${record.after.photographedPoints}个有照片；8条轻量短评及原有照片放大功能保留。历史审核记录未改写。</p><div class="scroll"><table><thead><tr><th>点位</th><th>调整</th><th>说明</th><th>位置记录</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>真实地图本地预览</h2><p>截图来自本地网页加载的真实高德底图，非示意图。点击图片可查看大图。</p><div class="grid">
<figure><a href="餐饮点位-调整后.png"><img src="餐饮点位-调整后.png" alt="传统牛肉面偏右后的真实地图预览"></a><figcaption>传统牛肉面偏右，5家餐饮标记适度错开</figcaption></figure>
<figure><a href="阿力烧烤-调整后.png"><img src="阿力烧烤-调整后.png" alt="阿力烧烤在汤包馆右侧的真实地图预览"></a><figcaption>阿力烧烤位于汤包馆右侧</figcaption></figure>
<figure><a href="T-ONE咖啡-向南微调.png"><img src="T-ONE咖啡-向南微调.png" alt="T-ONE咖啡向南微调后的预览"></a><figcaption>T-ONE咖啡图标向南侧微调</figcaption></figure></div>
<p><a href="餐饮点位-未偏移对照.png">查看尚未应用显示偏移的对照截图</a>（此对照仅关闭显示偏移，不恢复已注释的康友点位）</p>
<h2>豪祥名烟名酒照片</h2><figure><a href="豪祥名烟名酒-本地点位.png"><img src="豪祥名烟名酒-本地点位.png" alt="豪祥名烟名酒补充照片后的点位介绍"></a><figcaption>照片可点击放大；原地址和坐标未改动。</figcaption></figure><p class="muted">照片门牌可读“多稼路236号-1”，与现有地址文字不同。本轮依据你“只补图片、位置不改”的明确要求保留现有地址，图片说明不另加门牌。源图未更改，输出1600×900 WebP。</p>
<h2>验证与维护记录</h2><p>两份首页已同步。已核对地图点击进入正确点位、导航坐标、照片放大、短评、分类列表，以及手机窄屏布局；滨江漫步路线继续使用原4个点位，未应用本轮店铺显示偏移。</p><p><a href="verification-results.json">本地检查记录</a> · <a href="real-map-preview-record.json">真实底图缩放核验</a> · <a href="photo-record.json">豪祥照片来源记录</a> · <a href="update-records.json">完整更新记录</a></p><p class="muted">标记微调使用高德提供的显示偏移参数；位置导航仍读取原坐标。<a href="https://lbs.amap.com/api/javascript-api-v2/guide/amap-marker/marker-anchor-offset" target="_blank" rel="noopener noreferrer">高德官方说明</a>。数据导出已保留显示偏移，并兼容旧示意图位置为空的点位。</p>
</main></body></html>`;
fs.writeFileSync(path.join(__dirname,'更新记录.html'),html);
console.log(JSON.stringify({status:record.status,counts:record.after,changedPoints:actions.length}));
