const fs = require('node:fs');
const path = require('node:path');
const modules = 'C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp = require(path.join(modules, 'sharp'));
const inputDirectory = 'F:/Project/jsjs_begin/review-drafts/2026-10-activities';
const fragment = 'C:/Users/fanta/.codex/visualizations/2026/08/24/01a032eb-3731-7c72-9194-e2bfe2ee10ba/community-registration-options.html';
const files = {
  plant: 'header-plant-1331x756.png',
  chongyang: 'header-chongyang-anime-v2-1331x756.png',
  osmanthus: 'header-osmanthus-shangchuan-huiguan-1331x756.png'
};

(async () => {
  const assets = {};
  for (const [id, file] of Object.entries(files)) {
    const bytes = await sharp(path.join(inputDirectory,file)).resize({width:720,withoutEnlargement:true}).jpeg({quality:76,mozjpeg:true}).toBuffer();
    assets[id] = `data:image/jpeg;base64,${bytes.toString('base64')}`;
  }
  const text = fs.readFileSync(fragment, 'utf8');
  if (!text.includes('__REGISTRATION_IMAGE_DATA__')) throw new Error('Image placeholder not found');
  fs.writeFileSync(fragment, text.replace('__REGISTRATION_IMAGE_DATA__', JSON.stringify(assets)), 'utf8');
  console.log(JSON.stringify({fragment,bytes:fs.statSync(fragment).size}));
})().catch(error => { console.error(error); process.exitCode = 1; });
