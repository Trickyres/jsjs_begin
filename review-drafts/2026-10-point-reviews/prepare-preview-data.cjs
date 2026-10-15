const fs=require('node:fs');
const path=require('node:path');
const sharp=require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='F:/Project/jsjs_begin';
const source='E:/OneDrive/Desktop/稼享指南网页版本/稼享指南网页/20261013_重命名图片/webp照片文件';
const draft=JSON.parse(fs.readFileSync(path.join(root,'review-drafts/2026-10-point-reviews/review-copy.json'),'utf8'));
const metadata=[
  ['上海市黄浦区薛家浜路236号',path.join(root,'assets/points/eght.webp')],
  ['上海市黄浦区多稼路（具体门牌待核实）',path.join(source,'传统牛肉面.webp')],
  ['上海市黄浦区多稼路220号一楼',path.join(root,'assets/points/ali-bbq.webp')],
  ['上海市黄浦区多稼路220号',path.join(root,'assets/points/laochengxiangtangbao-20261013.webp')],
  ['上海市黄浦区多稼路226号',path.join(root,'assets/points/xiaolaoban-20261013.webp')],
  ['具体位置待核实',null],
  ['上海市黄浦区多稼路228号',path.join(root,'assets/points/chaoshanyiniuhuoguo-20261013.webp')],
  ['上海市黄浦区多稼路232号',path.join(source,'烧腊卤味饭堂.webp')],
  ['上海市黄浦区陆家浜路305弄3-1号',path.join(root,'assets/points/tonecoffee-20261013.webp')]
];
(async()=>{
  const previews=[];
  for(let i=0;i<draft.entries.length;i++){
    const entry=draft.entries[i], [address,photo]=metadata[i];
    const charCount=[...entry.text].filter(char=>/[\p{Script=Han}\p{Letter}\p{Number}]/u.test(char)).length;
    if(charCount<30||charCount>50)throw new Error('Review length invalid: '+entry.name+' '+charCount);
    const image=photo?'data:image/webp;base64,'+(await sharp(photo).resize(250,250,{fit:'cover',position:'attention'}).webp({quality:77}).toBuffer()).toString('base64'):null;
    previews.push({...entry,address,charCount,image});
  }
  fs.writeFileSync(path.join(root,'review-drafts/2026-10-point-reviews/preview-data.json'),JSON.stringify(previews));
  const pointRecord=JSON.parse(fs.readFileSync(path.join(root,'review-drafts/2026-10-point-additions/update-records.json'),'utf8'));
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const pointRows=pointRecord.entries.map(entry=>`<tr><td>${escape(entry.action)}</td><td>${escape(entry.name)}</td><td>${entry.lng==null?'保留原数据为注释':`${entry.lng}, ${entry.lat}`}</td><td>${entry.asset?`<a href="../../${escape(entry.asset)}">查看照片</a>`:'不绑定照片'}</td><td>${escape([entry.userConfirmation,entry.uncertainty||entry.reason||'招牌与位置对应已核对'].filter(Boolean).join(' '))}</td></tr>`).join('');
  const reviewRows=previews.map(entry=>`<tr><td>${escape(entry.name)}</td><td>${entry.rating==null?'待开业 · 未评分':`${entry.rating} / 5`}</td><td>${escape(entry.text)}</td><td>${entry.charCount}字</td><td>${entry.pointId?'已本地接入':'保留待补点位'}</td></tr>`).join('');
  const html=`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>点位调整与邻里点评 · 本地审核稿</title>
<style>
body{margin:0;background:#fff8ef;color:#382a22;font-family:'Microsoft YaHei',sans-serif;line-height:1.65}
main{max-width:1100px;margin:auto;padding:28px 20px}h1{font-size:25px}h2{font-size:21px;margin-top:30px}p{font-size:14px}
.note{padding:16px;border:1px solid #efd9bf;border-radius:14px;background:#fff2de;color:#935525}.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;background:#fffdf8;font-size:14px}th,td{padding:13px 12px;border:1px solid #ebdfd2;text-align:left;vertical-align:top}
th{background:#f6e8d7}a{color:#b35527}td:nth-child(2){min-width:100px}.reviews td:nth-child(3){min-width:230px}small{color:#8b7565}
.previews{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}.previews figure{margin:0}.previews img{display:block;max-width:100%;width:390px;border-radius:20px;box-shadow:0 10px 24px #5238251a}.previews figcaption{margin-top:10px;font-size:13px;color:#8b7565}
</style></head><body><main>
<h1>点位调整与邻里点评 · 本地审核稿</h1>
<div class="note">2026年10月13日｜仅本地修改，未提交、未推送、未上线。<br>已按你选择的“轻量短评条”接入8个现有点位，打开点位即可看到；中泰证券照片已根据你的确认补齐，坐标保持不变。此版本仍待上线审核。</div>
<h2>本地实页效果</h2><p>下方为真实网页点位介绍截图。沿用奶油色背景、圆角短评条及暖橙色个人评分标签；无需点击“查看详情”即可阅读，不增加扫码或操作步骤。</p>
<div class="previews">
  <figure><a href="轻量短评条-本地实页.png"><img src="轻量短评条-本地实页.png" alt="潘国仙耳光馄饨：轻量短评条实页效果"></a><figcaption>5分示例：潘国仙耳光馄饨</figcaption></figure>
  <figure><a href="传统牛肉面-短评.png"><img src="传统牛肉面-短评.png" alt="传统牛肉面：轻量短评条实页效果"></a><figcaption>3分示例：传统牛肉面</figcaption></figure>
</div>
<h2>本次点位调整</h2><p>新增5个点位、恢复过水鱼馆、停用好厨子小碗菜。新增坐标使用你提供的高德坐标，不以照片定位替换。当前共${pointRecord.activePointCount}个启用点位，其中${pointRecord.photographedPointCount}个有照片。</p>
<div class="scroll"><table><thead><tr><th>操作</th><th>点位名称</th><th>高德经纬度</th><th>照片</th><th>核对说明</th></tr></thead><tbody>${pointRows}</tbody></table></div>
<p><small>中泰证券源图GPS偏差约468.5米，保留为历史核验信息；照片身份已由你明确确认，本次采用照片但不改指定坐标。照片仅缩放压缩，源图未更改。</small></p>
<h2>9条邻里点评文案与接入状态</h2><p>评分原样保留，每条文案30—50字；“超杰沪味面坊”只记录待开业状态，不虚构食评或评分。</p>
<p><small>统一标注：个人体验，仅供参考，非综合评分。下列字数不含标点。</small></p>
<div class="scroll"><table class="reviews"><thead><tr><th>店铺</th><th>个人评分／状态</th><th>文案审核稿</th><th>字数</th><th>接入状态</th></tr></thead><tbody>${reviewRows}</tbody></table></div>
<p><small>超杰沪味面坊暂无对应启用点位，本次不另行猜测位置或创建该店点位。没有点评的点位不显示空白短评条。</small></p>
<h2>样式与验证记录</h2><p>单独维护轻量短评条样式，首页及其他卡片不受影响；两份首页均已接入。原有照片放大、详情折叠和一键导航保留。</p>
<p><a href="integration-verification-results.json">查看真实页面验证记录</a> · <a href="../../point-review.css">固定短评条样式</a> · <a href="中泰证券-已确认照片.png">查看中泰证券点位效果</a></p>
</main></body></html>`;
  fs.writeFileSync(path.join(root,'review-drafts/2026-10-point-reviews/审核记录.html'),html);
  console.log(JSON.stringify(previews.map(({name,rating,text,charCount})=>({name,rating,text,charCount})),null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
