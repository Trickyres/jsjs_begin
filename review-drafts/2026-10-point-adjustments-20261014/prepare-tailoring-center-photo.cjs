const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const projectRoot = path.resolve(__dirname, '..', '..');
const sourcePath = 'E:/OneDrive/Desktop/稼享指南网页版本/稼享指南网页/20261013_重命名图片/webp照片文件/上海十六铺面料中心.webp';
const oldImageRelativePath = 'assets/points/south-bund-tailoring-center.webp';
const outputRelativePath = 'assets/points/south-bund-tailoring-center-20261014.webp';
const oldImagePath = path.join(projectRoot, oldImageRelativePath);
const outputPath = path.join(projectRoot, outputRelativePath);
const recordPath = path.join(__dirname, 'tailoring-center-photo-record.json');
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

async function main() {
  const pointsSource = fs.readFileSync(path.join(projectRoot, 'points-data.js'), 'utf8')
    .replace(/^\s*\/\/.*$/gm, '');
  const match = pointsSource.match(/window\.POINTS_DATA\s*=\s*(\[[\s\S]*\]);/);
  if (!match) throw new Error('Cannot locate the existing points array.');
  const point = JSON.parse(match[1]).find(item => item.id === 'fabric-market');
  if (!point || point.name !== '南外滩量身定制中心') throw new Error('Expected tailoring-center point was not found.');
  if (fs.existsSync(outputPath) || fs.existsSync(recordPath)) {
    throw new Error('Target photo or record already exists; inspect before replacing.');
  }

  const sourceBuffer = fs.readFileSync(sourcePath);
  const oldImageBuffer = fs.readFileSync(oldImagePath);
  const sourceSha256 = sha256(sourceBuffer);
  const oldImageSha256 = sha256(oldImageBuffer);
  const sourceMetadata = await sharp(sourceBuffer).metadata();
  const oldImageMetadata = await sharp(oldImageBuffer).metadata();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(sourceBuffer)
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(outputPath);
  const outputBuffer = fs.readFileSync(outputPath);
  const outputMetadata = await sharp(outputBuffer).metadata();
  const sourceSha256After = sha256(fs.readFileSync(sourcePath));
  const oldImageSha256After = sha256(fs.readFileSync(oldImagePath));
  if (sourceSha256 !== sourceSha256After || oldImageSha256 !== oldImageSha256After) {
    throw new Error('Source or old photo checksum changed.');
  }
  if (Math.max(outputMetadata.width, outputMetadata.height) !== 1600) {
    throw new Error('Unexpected output long edge.');
  }

  const record = {
    preparedAt: new Date().toISOString(),
    pointId: point.id,
    pointName: point.name,
    userAuthorization: '用户明确确认南外滩量身定制中心可以使用刚拍的照片；本轮采用20261013照片批中的上海十六铺面料中心.webp。',
    source: {
      path: sourcePath,
      sha256: sourceSha256,
      width: sourceMetadata.width,
      height: sourceMetadata.height,
      bytes: sourceBuffer.length,
      sha256AfterPreparation: sourceSha256After,
      unchanged: true
    },
    output: {
      path: outputRelativePath,
      sha256: sha256(outputBuffer),
      width: outputMetadata.width,
      height: outputMetadata.height,
      bytes: outputBuffer.length,
      format: outputMetadata.format,
      quality: 84,
      longEdge: 1600,
      operation: '原始完整画面等比缩小并编码为WebP，未裁切；仅有像素尺寸取整，未改画面内容。',
      sharpVersion: sharp.versions.sharp
    },
    oldImage: {
      path: oldImageRelativePath,
      sha256: oldImageSha256,
      width: oldImageMetadata.width,
      height: oldImageMetadata.height,
      bytes: oldImageBuffer.length,
      sha256AfterPreparation: oldImageSha256After,
      preserved: true,
      unchanged: true
    },
    identityCheck: {
      basis: '查看源图，红色建筑外墙金色店名可读上海南外滩量身定制中心；建筑转角为裁缝主题大型画面。',
      readableBuildingName: '上海南外滩量身定制中心',
      sourceFilenameCaution: '源文件名上海十六铺面料中心.webp不作为地点身份的唯一依据；采用照片墙面可读名称及本轮用户明确选择。',
      result: '对应现有fabric-market／南外滩量身定制中心点位。'
    },
    pointSnapshot: {
      address: point.address,
      lng: point.lng,
      lat: point.lat,
      imageAtInspection: point.image
    },
    suggestedImageAlt: '南外滩量身定制中心建筑与沿街入口',
    suggestedImageCaption: '南外滩量身定制中心 · 门面实景',
    pointDataModifiedByThisScript: false,
    publicationPerformedByThisScript: false
  };
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({
    output: record.output,
    sourceUnchanged: record.source.unchanged,
    oldImagePreserved: record.oldImage.preserved && record.oldImage.unchanged,
    recordPath
  }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
