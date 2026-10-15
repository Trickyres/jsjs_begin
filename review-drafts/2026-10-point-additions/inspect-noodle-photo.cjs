'use strict';
const path = require('node:path');
const sharp = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source = 'E:/OneDrive/Desktop/稼享指南网页版本/稼享指南网页/20261013_重命名图片/红烧牛肉面.jpg';
(async () => {
  await sharp(source).extract({left:1550,top:900,width:730,height:650}).png().toFile(path.join(__dirname,'noodle-entry-detail.png'));
  await sharp(source).extract({left:3180,top:1350,width:820,height:620}).png().toFile(path.join(__dirname,'noodle-menu-detail.png'));
})().catch(error => { console.error(error); process.exitCode = 1; });
