const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = 'F:/Project/jsjs_begin';
const directory = path.join(root, 'review-drafts/2026-10-point-photos');
const inventory = JSON.parse(fs.readFileSync(path.join(directory, 'photo-inventory.json'), 'utf8'));
const plan = JSON.parse(fs.readFileSync(path.join(directory, 'selection-plan.json'), 'utf8'));
const points = new Map(inventory.points.map(point => [point.id, point]));
const allowed = new Set(['新增照片', '替换照片', '暂不采用']);
const assets = path.resolve(root, 'assets/points');
const thumbnailDir = path.join(directory, 'thumbnails');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const previousLogPath = path.join(directory, 'update-records.json');
const previousLog = fs.existsSync(previousLogPath) ? JSON.parse(fs.readFileSync(previousLogPath, 'utf8')) : null;
const adoptedIds = new Set();
if(new Set(plan.entries.map(entry=>entry.file)).size !== inventory.photos.length || plan.entries.length !== inventory.photos.length) throw new Error('Every source photo must have exactly one decision');
for(const entry of plan.entries) {
  if(!allowed.has(entry.status) || !inventory.photos.some(photo=>photo.filename===entry.file)) throw new Error('Invalid selection');
  if(entry.pointId && !points.has(entry.pointId)) throw new Error('Unknown point: '+entry.pointId);
  if(entry.status !== '暂不采用') {
    const point=points.get(entry.pointId);
    if(!point || !entry.alt || !entry.caption || !/^[a-z0-9-]+$/.test(point.id)) throw new Error('Missing photo mapping');
    if(adoptedIds.has(point.id)) throw new Error('A point cannot adopt two photos');
    adoptedIds.add(point.id);
    if((entry.status === '新增照片') !== !point.image) throw new Error('Incorrect new/replacement classification');
    const target=path.resolve(assets,`${point.id}-20261013.webp`);
    if(!target.startsWith(assets+path.sep)) throw new Error('Invalid asset target');
    if(fs.existsSync(target)) {
      const prior=previousLog?.entries.find(item=>item.pointId===point.id && item.newImage===`assets/points/${point.id}-20261013.webp`);
      if(!prior || hash(fs.readFileSync(target))!==prior.outputSha256) throw new Error('Refusing to overwrite existing asset '+target);
    }
  }
}
(async()=>{
  fs.mkdirSync(thumbnailDir,{recursive:true});
  const entries=[];
  for(let index=0;index<plan.entries.length;index++) {
    const entry=plan.entries[index], point=points.get(entry.pointId), sourcePath=path.join(inventory.sourceDir,entry.file);
    const source=fs.readFileSync(sourcePath), sourceMeta=await sharp(source).metadata();
    const adopted=entry.status!=='暂不采用';
    const newImage=adopted?`assets/points/${point.id}-20261013.webp`:null;
    const thumbnail=`thumbnails/source-${String(index+1).padStart(3,'0')}.webp`;
    await sharp(source).rotate().resize({width:440,height:300,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toFile(path.join(directory,thumbnail));
    let outputMeta=null, outputBytes=null, outputSha256=null;
    if(adopted) {
      const target=path.join(root,newImage);
      if(!fs.existsSync(target)) await sharp(source).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:5}).toFile(target);
      const output=fs.readFileSync(target);outputMeta=await sharp(output).metadata();outputBytes=output.length;outputSha256=hash(output);
    }
    entries.push({...entry,number:index+1,pointName:point?.name||null,pointAddress:point?.address||null,sourcePath,sourceSha256:hash(source),sourceWidth:sourceMeta.width,sourceHeight:sourceMeta.height,sourceBytes:source.length,oldImage:point?.image||null,newImage,selectedImage:adopted?newImage:point?.image||null,thumbnail,outputWidth:outputMeta?.width||null,outputHeight:outputMeta?.height||null,outputBytes,outputSha256});
  }
  const counts=Object.fromEntries([...allowed].map(status=>[status,entries.filter(entry=>entry.status===status).length]));
  const remaining=inventory.points.filter(point=>!point.image&&!adoptedIds.has(point.id));
  const result={reviewDate:plan.reviewDate,scope:plan.scope,sourceDirectory:inventory.sourceDir,counts,totalSourcePhotos:entries.length,pointCount:inventory.points.length,photosBefore:inventory.points.filter(point=>point.image).length,photosAfter:inventory.points.filter(point=>point.image).length+counts['新增照片'],remainingWithoutPhotos:remaining,entries};
  fs.writeFileSync(previousLogPath,JSON.stringify(result,null,2));
  const comparison=entry=>{
    const before=entry.oldImage?`<a href="../../${escape(entry.oldImage)}"><img src="../../${escape(entry.oldImage)}" alt="${escape(entry.pointName)}原照片" loading="lazy"></a>`:`<div class="no-image">${entry.pointId?'原点位没有照片':'无对应启用点位'}</div>`;
    return `<div class="comparison"><figure><figcaption>更新前</figcaption>${before}</figure><figure><figcaption>${entry.status==='暂不采用'?'本次候选（未采用）':'本次采用'}</figcaption><a href="${entry.newImage?'../../'+escape(entry.newImage):escape(entry.thumbnail)}"><img src="${escape(entry.thumbnail)}" alt="${escape(entry.file)}" loading="lazy"></a></figure></div>`;
  };
  const sections=[...allowed].map((status,i)=>`<section id="category-${i+1}"><h2>${status} <span>${counts[status]} 张</span></h2>${entries.filter(entry=>entry.status===status).map(entry=>`<article><div class="record-copy"><h3>${entry.number}. ${escape(entry.pointName||entry.file.replace(/\.webp$/i,''))}</h3><p class="source">源照片：${escape(entry.file)}</p>${entry.pointAddress?`<p>网页地址：${escape(entry.pointAddress)}</p>`:''}<p class="reason">${escape(entry.reason)}</p>${entry.detail?`<p class="decision">处理：${escape(entry.detail)}，不改点位介绍。</p>`:''}${entry.newImage?`<p class="decision">处理：${status}，原文件保留。</p>`:''}<details><summary>文件记录与校验信息</summary><p>原路径：${escape(entry.oldImage||'无')}</p><p>采用路径：${escape(entry.selectedImage||'无；未添加')}</p><p>源文件：${escape(entry.sourcePath)}</p><p>原尺寸：${entry.sourceWidth} × ${entry.sourceHeight}；${(entry.sourceBytes/1024).toFixed(1)} KB</p>${entry.outputBytes?`<p>网页版本：${entry.outputWidth} × ${entry.outputHeight}；${(entry.outputBytes/1024).toFixed(1)} KB（仅缩放压缩，不裁切、不改色）</p>`:''}<p>源文件SHA-256：${entry.sourceSha256}</p></details></div>${comparison(entry)}</article>`).join('')}</section>`).join('');
  const remainingList=remaining.map(point=>{
    const candidate=entries.find(entry=>entry.pointId===point.id&&entry.status==='暂不采用');
    return `<li>${escape(point.name)}：${candidate?escape(candidate.detail)+'，本次不添加。':'本批没有能准确对应的照片，继续保留无图状态。'}</li>`;
  }).join('');
  const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>2026年10月13日 · 多稼点位照片更新记录</title><style>
  *{box-sizing:border-box}body{margin:0;background:#fff8ef;color:#382a22;font-family:'Microsoft YaHei','PingFang SC',sans-serif;line-height:1.65}main{max-width:1120px;margin:auto;padding:28px 24px 50px}h1{font-size:26px;margin:0 0 12px}h2{font-size:22px;margin:34px 0 16px}h2 span{font-size:14px;color:#8b7565;font-weight:400}h3{margin:0 0 8px;font-size:17px}p{margin:6px 0;font-size:14px}.scope{color:#b24c28;font-weight:700}.notice{padding:14px 18px;border-radius:14px;background:#fff0dc;margin:18px 0}nav{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}nav a{padding:9px 14px;border:1px solid #ebd7c6;border-radius:999px;background:#fffdf8;text-decoration:none;color:#77442c}article{display:grid;grid-template-columns:minmax(0,1fr) 430px;gap:22px;padding:20px;margin-bottom:14px;border:1px solid #ecdfd2;border-radius:16px;background:#fffdf8;break-inside:avoid}.source{color:#8b7565}.reason{margin-top:12px}.decision{color:#557e47}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-self:center}figure{margin:0}figcaption{font-size:12px;color:#8b7565;margin-bottom:5px}.comparison img,.no-image{display:block;width:100%;height:146px;object-fit:contain;background:#eee8df;border-radius:9px}.no-image{display:grid;place-items:center;padding:16px;text-align:center;font-size:12px;color:#8b7565}details{margin-top:14px;color:#77675b;font-size:13px}details p{overflow-wrap:anywhere;font-size:12px}summary{cursor:pointer}a:focus-visible{outline:3px solid #c76c39;outline-offset:3px}.remaining{margin-top:30px;padding:18px;border-radius:14px;background:#f1f5ea}@media(max-width:760px){main{padding:20px 14px}h1{font-size:22px}article{grid-template-columns:1fr;padding:16px;gap:15px}.comparison img,.no-image{height:135px}}@media print{body{background:white}nav,details{display:none}main{padding:0}article{box-shadow:none}}
  </style></head><body><main><h1>多稼周边点位照片 · 本地更新记录</h1><p class="scope">2026年10月13日｜仅本地完成，未推送、未上线。</p><p>检查源目录中的全部 ${entries.length} 张照片。按地点是否准确、招牌及入口辨识度、构图、清晰度与遮挡程度选图，不单凭文件名或分辨率替换。</p><div class="notice">${counts['新增照片']} 个无图点位补齐照片；${counts['替换照片']} 个已有点位换用较好的照片；${counts['暂不采用']} 张候选暂不采用。网页照片覆盖从 ${result.photosBefore}/${result.pointCount} 变为 ${result.photosAfter}/${result.pointCount}。<br>源照片和替换前的网页素材均保留。未新增点位，也未修改点位名称、地址、分类和坐标。</div><nav aria-label="记录分类">${[...allowed].map((status,i)=>`<a href="#category-${i+1}">${status} · ${counts[status]}</a>`).join('')}</nav>${sections}<section class="remaining"><h2>仍未补图的点位</h2><ul>${remainingList}</ul><p>本记录和缩略图仅用于本地审核；暂不采用的照片没有加入网站的 assets/points 素材目录。</p></section></main></body></html>`;
  fs.writeFileSync(path.join(directory,'更新记录.html'),html);
  console.log(JSON.stringify({counts,sourcePhotos:entries.length,photosBefore:result.photosBefore,photosAfter:result.photosAfter,remaining:remaining.map(({id,name})=>({id,name})),addedAssetBytes:entries.reduce((sum,entry)=>sum+(entry.outputBytes||0),0),updates:entries.filter(entry=>entry.newImage).map(({pointId,pointName,oldImage,newImage,alt,caption})=>({pointId,pointName,oldImage,newImage,alt,caption}))},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
