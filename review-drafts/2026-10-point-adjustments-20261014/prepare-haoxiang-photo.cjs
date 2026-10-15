const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const projectRoot = path.resolve(__dirname, '..', '..');
const sourcePath = 'E:/OneDrive/Desktop/稼享指南网页版本/稼享指南网页/20261013_重命名图片/webp照片文件/豪祥名烟名酒.webp';
const outputRelativePath = 'assets/points/haoxiang-tobacco-20261014.webp';
const outputPath = path.join(projectRoot, outputRelativePath);
const recordPath = path.join(__dirname, 'photo-record.json');
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

async function main() {
  const dataSource = fs.readFileSync(path.join(projectRoot, 'points-data.js'), 'utf8')
    .replace(/^\s*\/\/.*$/gm, '');
  const match = dataSource.match(/window\.POINTS_DATA\s*=\s*(\[[\s\S]*\]);/);
  if (!match) throw new Error('Cannot locate the existing points array.');
  const point = JSON.parse(match[1]).find(item => item.id === 'haoxiang');
  if (!point || point.name !== '豪祥名烟名酒') throw new Error('Expected 豪祥 point was not found.');
  if (fs.existsSync(outputPath) || fs.existsSync(recordPath)) {
    throw new Error('The target photo or record already exists; inspect it before replacing.');
  }

  const sourceBuffer = fs.readFileSync(sourcePath);
  const sourceSha256 = sha256(sourceBuffer);
  const sourceMetadata = await sharp(sourceBuffer).metadata();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const info = await sharp(sourceBuffer)
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(outputPath);
  const outputBuffer = fs.readFileSync(outputPath);
  const outputMetadata = await sharp(outputBuffer).metadata();
  const sourceSha256After = sha256(fs.readFileSync(sourcePath));
  if (sourceSha256After !== sourceSha256) throw new Error('Source checksum changed.');
  if (Math.max(outputMetadata.width, outputMetadata.height) !== 1600) {
    throw new Error('Unexpected output dimensions.');
  }

  const record = {
    preparedAt: new Date().toISOString(),
    pointId: point.id,
    pointName: point.name,
    userInstruction: '本轮用户要求给豪祥名烟名酒补对应图片，点位位置不变。',
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
      operation: '原始完整画面等比缩小并编码为WebP，未裁切、未改画面内容。',
      sharpVersion: sharp.versions.sharp
    },
    readableContent: [
      { kind: '门头店名', text: '豪祥名烟名酒', location: '照片上部中央金色门头' },
      { kind: '绿色门牌', text: '多稼路236号-1', location: '店门玻璃右上方' }
    ],
    identityCheck: '门头为豪祥名烟名酒；没有使用另一个浩丞名烟名酒门店的照片。',
    locationSnapshot: {
      address: point.address,
      lng: point.lng,
      lat: point.lat,
      x: point.x,
      y: point.y
    },
    addressNote: '照片门牌与当前点位地址文字不同；按本轮明确要求仅补图，现有地址及坐标均保留。',
    suggestedImageAlt: '豪祥名烟名酒店铺门头与入口',
    suggestedImageCaption: '豪祥名烟名酒 · 门面实景',
    sourcePointDataModifiedByThisScript: false,
    imagePipelineInfo: info
  };
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ output: record.output, sourceUnchanged: record.source.unchanged, recordPath }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
