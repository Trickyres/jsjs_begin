const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { icons } = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/lucide');
const root = path.resolve(__dirname, '../..');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const baselinePath = path.join(__dirname, 'before-hashes.json');
if (!fs.existsSync(baselinePath)) {
  const files = ['points-data.js', 'point-reviews-data.js', 'index_ori_version.html', 'jiaxiang_guide_h_5_index.html', 'jiaxiang_guide_h_5_index_zyf.html', 'amap.config.js', 'activity-registration.css'];
  const preserved = Object.fromEntries(files.filter(file => fs.existsSync(path.join(root, file))).map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
  fs.writeFileSync(baselinePath, JSON.stringify({ localOnly: true, deployed: false, preserved, beforeHtml: fs.readFileSync(path.join(root, 'index.html'), 'utf8'), beforeCss: fs.readFileSync(path.join(root, 'index_renew.css'), 'utf8'), beforeJs: fs.readFileSync(path.join(root, 'index_renew.js'), 'utf8') }, null, 2));
}
const escape = value => String(value).replace(/[&"<>]/g, char => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[char]));
const definitions = [
  ['service', 'UsersRound', '便民服务', '#df6730'],
  ['shopping', 'ShoppingCart', '生活购物', '#b87b26'],
  ['leisure', 'Trees', '休闲游玩', '#688f4e'],
  ['memory', 'Landmark', '多稼记忆', '#a3634d']
];
const license = fs.readFileSync('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/lucide/LICENSE', 'utf8');
fs.mkdirSync(path.join(root, 'assets/icons'), { recursive: true });
const entries = definitions.map(([key, name, label, color]) => {
  if (!icons[name]) throw new Error(`Missing Lucide icon: ${name}`);
  const nodes = icons[name].map(([tag, attributes]) => `  <${tag} ${Object.entries(attributes).map(([key, value]) => `${key}="${escape(value)}"`).join(' ')} />`).join('\n');
  const content = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fffdf5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  <!-- Lucide ${name}; ISC license and attribution in category-icons-LICENSE.txt -->\n${nodes}\n</svg>\n`;
  const file = `assets/icons/category-${key}.svg`;
  fs.writeFileSync(path.join(root, file), content);
  return { key, name, label, color, file, sha256: hash(content) };
});
fs.writeFileSync(path.join(root, 'assets/icons/category-icons-LICENSE.txt'), license);
fs.writeFileSync(path.join(__dirname, 'icon-assets.json'), JSON.stringify({ localOnly: true, deployed: false, iconSource: 'Bundled Lucide', style: '暖彩轻浮雕', assets: entries }, null, 2));
console.log(JSON.stringify(entries, null, 2));
