const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'points-data.js'), 'utf8'), context);

const points = context.window.POINTS_DATA;
const ids = new Set();
const errors = [];
let pictured = 0;

for (const point of points) {
  if (ids.has(point.id)) errors.push(`重复点位 ID：${point.id}`);
  ids.add(point.id);
  if (!point.image) continue;
  pictured += 1;
  if (!fs.existsSync(path.join(root, point.image))) errors.push(`${point.name}：找不到 ${point.image}`);
  if (!point.imageAlt) errors.push(`${point.name}：缺少图片替代文字`);
  if (!point.imageCaption) errors.push(`${point.name}：缺少图片标题`);
  if (point.imageCredit && !(point.imageSource && point.imageLicense && point.imageLicenseUrl)) {
    errors.push(`${point.name}：图片署名信息不完整`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${points.length} 个点位，${pictured} 个有照片；所有照片路径及署名字段检查通过。`);
}
