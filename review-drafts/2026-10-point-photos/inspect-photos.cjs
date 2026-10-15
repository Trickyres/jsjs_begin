const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = 'F:/Project/jsjs_begin';
const sourceDir = 'E:/OneDrive/Desktop/稼享指南网页版本/稼享指南网页/20261013_重命名图片/webp照片文件';
const outputDir = path.join(root, 'review-drafts/2026-10-point-photos');
const text = fs.readFileSync(path.join(root, 'points-data.js'), 'utf8');
const points = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1).split(/\r?\n/).filter(line=>!line.trimStart().startsWith('//')).join('\n'));
const names = fs.readdirSync(sourceDir).filter(name => /\.webp$/i.test(name)).sort((a,b) => a.localeCompare(b,'zh-CN'));
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
async function sheet(files, filename) {
  const width = 1200, cellWidth = 400, cellHeight = 270;
  const layers = [];
  for(let i=0;i<files.length;i++) {
    const x=i%3*cellWidth,y=Math.floor(i/3)*cellHeight;
    const image=await sharp(files[i].path).rotate().resize(384,224,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer();
    const metadata=await sharp(image).metadata();
    layers.push({input:image,left:x+Math.round((400-metadata.width)/2),top:y+8});
    layers.push({input:Buffer.from(`<svg width="400" height="32"><rect width="400" height="32" fill="#fff8ef"/><text x="12" y="23" font-size="17" font-family="Microsoft YaHei,SimHei,sans-serif" fill="#30251c">${escape(files[i].label)}</text></svg>`),left:x,top:y+236});
  }
  await sharp({create:{width,height:Math.ceil(files.length/3)*cellHeight,channels:3,background:'#fff8ef'}}).composite(layers).png().toFile(path.join(outputDir,filename));
}
(async()=>{
  const photos=[];
  for(let i=0;i<names.length;i++) {
    const filename=names[i], file=path.join(sourceDir,filename), metadata=await sharp(file).metadata();
    photos.push({number:i+1,filename,width:metadata.width,height:metadata.height,bytes:fs.statSync(file).size});
  }
  fs.writeFileSync(path.join(outputDir,'photo-inventory.json'),JSON.stringify({sourceDir,photos,points:points.map(({id,name,address,image,imageAlt,imageCaption})=>({id,name,address,image:image||null,imageAlt,imageCaption}))},null,2));
  for(let start=0;start<names.length;start+=12) await sheet(names.slice(start,start+12).map((name,i)=>({path:path.join(sourceDir,name),label:`${start+i+1}. ${name}`})),`new-photos-${Math.floor(start/12)+1}.png`);
  const old=points.filter(point=>point.image);
  for(let start=0;start<old.length;start+=12) await sheet(old.slice(start,start+12).map(point=>({path:path.join(root,point.image),label:`${point.id} · 现有`})),`existing-photos-${Math.floor(start/12)+1}.png`);
  console.log(JSON.stringify({photos,points:points.map(({id,name,address,image})=>({id,name,address,image:image||null})),total:points.length,withPhotos:old.length},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
