// 仅生成新点位的派生照片和来源记录；不修改或删除用户原图。
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '../..');
const source = 'E:/OneDrive/Desktop/稼享指南网页版本/稼享指南网页/20261013_重命名图片/webp照片文件/海音琴行.webp';
const asset = 'assets/points/haiyin-music-20261015.webp';
const target = path.join(root, asset);
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
  const originalHash = sha256(source);
  const original = await sharp(source).metadata();
  await sharp(source).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }).toFile(target);
  const exported = await sharp(target).metadata();
  if (sha256(source) !== originalHash) throw new Error('Source photo changed');
  const record = {
    date: '2026-10-15', localOnly: true, deployed: false,
    id: 'haiyin-music', name: '海音琴行', category: 'shopping', lng: 121.506172, lat: 31.212428,
    coordinateSource: '用户提供的高德 GCJ-02 经纬度，原值直接使用，不做偏移或自动地址解析',
    source, asset, originalSha256: originalHash, exportedSha256: sha256(target),
    original: { width: original.width, height: original.height, bytes: fs.statSync(source).size },
    exported: { width: exported.width, height: exported.height, bytes: fs.statSync(target).size, format: exported.format, quality: 84 },
    photoMatch: '照片蓝色门头明确写有海音琴行旗舰店，用户照片身份明确；门牌可见917，但街道名未能清晰确认，不据此猜完整地址。',
    address: '详细地址待补充，请按地图点位导航',
    unavailable: ['完整街道地址', '联系电话', '经确认的营业时间', '评分'],
    defaults: '沿用页面的无电话、营业时间以现场公告为准等诚实默认值；无新增徽标。',
    previousCount: 56, expectedCount: 57,
    previousPointsSha256: '8febb7bca7f3df120b24cc343202003fc6f015b570da016ad9efff9b6d615c30',
    preservation: '新增点位移除后，原56个点位所有字段与原顺序的JSON序列化SHA-256应与基线完全一致；其他点位不作修改。'
  };
  fs.writeFileSync(path.join(__dirname, '更新记录.json'), JSON.stringify(record, null, 2));
  console.log(JSON.stringify(record, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
