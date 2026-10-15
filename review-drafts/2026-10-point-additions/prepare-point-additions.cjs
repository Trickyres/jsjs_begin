'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const sharp = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '../..');
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'selection-plan.json'), 'utf8'));
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'points-data.js'), 'utf8'), context);
const points = context.window.POINTS_DATA;
const byId = new Map(points.map(point => [point.id, point]));
if (byId.size !== points.length) throw new Error('Duplicate active point IDs');
const gps = JSON.parse(execFileSync('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe', [path.join(__dirname, 'check-additions-gps.py')], {encoding: 'utf8'}));

(async () => {
  const records = [];
  for (const entry of plan.entries) {
    const point = byId.get(entry.id);
    if (entry.action === '注释停用') {
      if (point) throw new Error('Disabled point is still active: ' + entry.id);
      records.push({...entry, name: '好厨子小碗菜'});
      continue;
    }
    if (!point || point.lng !== entry.lng || point.lat !== entry.lat) throw new Error('Point coordinate mismatch: ' + entry.id);
    if (entry.asset && point.image !== entry.asset) throw new Error('Image binding mismatch: ' + entry.id);
    if (!entry.asset && point.image) throw new Error('Unconfirmed image was bound: ' + entry.id);
    if (entry.id === 'guoshuiyuguan' ? point.isNew !== false : point.isNew !== true) throw new Error('Incorrect new-point badge: ' + entry.id);
    const sourcePath = path.join(plan.sourceDir, entry.source);
    const source = fs.readFileSync(sourcePath);
    const sourceMetadata = await sharp(source).metadata();
    const record = {...entry, name: point.name, address: point.address, category: point.category,
      isNew: point.isNew, sourcePath, sourceSha256: hash(source), sourceBytes: source.length,
      sourceWidth: sourceMetadata.width, sourceHeight: sourceMetadata.height,
      gpsEvidence: gps.find(item => item.pointId === entry.id),
      imageAlt: point.imageAlt || null, imageCaption: point.imageCaption || null};
    if (entry.asset) {
      const target = path.resolve(root, entry.asset);
      if (!target.startsWith(path.join(root, 'assets', 'points') + path.sep)) throw new Error('Asset path outside points directory');
      const output = await sharp(source).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:5}).toBuffer();
      if (fs.existsSync(target)) {
        if (hash(fs.readFileSync(target)) !== hash(output)) throw new Error('Refusing to overwrite existing image: ' + entry.asset);
      } else {
        fs.writeFileSync(target, output, {flag:'wx'});
      }
      const outputMetadata = await sharp(output).metadata();
      Object.assign(record, {outputSha256:hash(output), outputBytes:output.length,
        outputWidth:outputMetadata.width, outputHeight:outputMetadata.height,
        treatment:'仅缩放压缩，不裁切、不改色；长边1600，WebP quality84。'});
    }
    if (hash(fs.readFileSync(sourcePath)) !== record.sourceSha256) throw new Error('Source file changed: ' + entry.source);
    records.push(record);
  }
  const previous = JSON.parse(fs.readFileSync(path.join(root,'review-drafts/2026-10-point-photos/update-records.json'),'utf8'));
  const summary = {reviewDate:plan.reviewDate, coordinateSystem:plan.coordinateSystem,
    coordinatePolicy:plan.coordinatePolicy, localOnly:true, deployed:false,
    addedPoints:5, restoredPoints:1, disabledPoints:1, changedPoints:7,
    createdPhotoAssets:records.filter(entry => entry.asset).length,
    activePointCount:points.length, photographedPointCount:points.filter(point => point.image).length,
    previousPhotoReview:{path:'review-drafts/2026-10-point-photos/update-records.json', pointCount:previous.pointCount, photosAfter:previous.photosAfter, unchanged:true},
    entries:records};
  fs.writeFileSync(path.join(__dirname, 'update-records.json'), JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({changedPoints:summary.changedPoints,createdPhotoAssets:summary.createdPhotoAssets,
    activePointCount:summary.activePointCount,photographedPointCount:summary.photographedPointCount,
    deferredPhotoPoints:records.filter(entry => entry.source && !entry.asset).map(entry => entry.id)},null,2));
})().catch(error => {console.error(error); process.exitCode = 1;});
