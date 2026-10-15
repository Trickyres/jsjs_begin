const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const sharp = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const root = path.resolve(__dirname, '../..');
const sourceDir = 'E:/OneDrive/03_W/00_tongbu_file/63_2026年工作/07_2026选调生汇报/20260927_稼享指南纸质版_更新';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

(async () => {
  const baseline = path.join(__dirname, 'points-before.json');
  if (!fs.existsSync(baseline)) {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'points-data.js'), 'utf8'), context);
    fs.writeFileSync(baseline, JSON.stringify(context.window.POINTS_DATA, null, 2));
  }
  const entries = [];
  for (const [number, label] of [['01', '正面'], ['02', '反面']]) {
    const source = path.join(sourceDir, `20261012_稼享指南纸质版_更新_${number}.png`);
    const sourceHash = hash(source);
    const full = `assets/guide/guide-page-${number}-20261012.webp`;
    const thumbnail = `assets/guide/guide-page-${number}-20261012-thumb.webp`;
    const metadata = await sharp(source).metadata();
    const fullResult = await sharp(source).webp({ quality: 94, effort: 6, smartSubsample: true }).toFile(path.join(root, full));
    const thumbnailResult = await sharp(source).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 90, effort: 6 }).toFile(path.join(root, thumbnail));
    if (hash(source) !== sourceHash) throw new Error('Source image unexpectedly changed');
    entries.push({ label, source, sourceSha256: sourceHash, sourceWidth: metadata.width, sourceHeight: metadata.height,
      full, fullSha256: hash(path.join(root, full)), fullWidth: fullResult.width, fullHeight: fullResult.height, fullBytes: fullResult.size,
      thumbnail, thumbnailSha256: hash(path.join(root, thumbnail)), thumbnailWidth: thumbnailResult.width, thumbnailHeight: thumbnailResult.height, thumbnailBytes: thumbnailResult.size });
  }
  const result = { localOnly: true, deployed: false, date: '2026-10-15', originalFilesPreserved: true, oldWebsiteAssetsPreserved: true, fullImageResolutionPreserved: true, entries };
  fs.writeFileSync(path.join(__dirname, 'guide-assets.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
