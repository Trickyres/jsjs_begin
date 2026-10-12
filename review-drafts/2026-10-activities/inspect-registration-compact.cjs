const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const directory = 'C:/Users/fanta/.codex/visualizations/2026/08/24/01a032eb-3731-7c72-9194-e2bfe2ee10ba';
(async()=>{
  const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page = await browser.newPage({viewport:{width:736,height:1220},colorScheme:'light',deviceScaleFactor:1});
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.join(directory,'community-registration-compact-preview.html')).href);
  const frame = page.frameLocator('iframe');
  await frame.locator('#cr-register-button').waitFor();
  await frame.locator('.cr-device').screenshot({path:path.join(directory,'registration-compact-home.png')});
  const selections=[];
  for(const [id,title] of [['plant','白领绿植手工活动'],['chongyang','重阳敬老主题活动'],['osmanthus','金桂节主题活动']]) {
    await frame.locator(`[data-event="${id}"]`).click();
    const actual = await frame.locator('#cr-event-title').textContent();
    if(actual!==title) throw new Error(`Event mismatch: ${actual}`);
    await frame.locator('#cr-register-button').click();
    if(await frame.locator('#cr-preview-title').textContent()!==title) throw new Error('Registration target mismatch');
    await frame.locator('#cr-preview-close').click();
    selections.push({id,title:actual});
  }
  const layout=[];
  for(const width of [320,390,736]) {
    await page.setViewportSize({width,height:1220});
    layout.push(await frame.locator('#jia-compact-registration').evaluate((root,width)=>{
      const button=root.querySelector('#cr-register-button');
      const title=root.querySelector('#cr-event-title');
      const dates=[...root.querySelectorAll('.cr-date')].map(element=>({text:element.querySelector('strong').textContent,height:element.getBoundingClientRect().height,width:element.getBoundingClientRect().width}));
      return {viewport:width,deviceWidth:root.querySelector('.cr-device').getBoundingClientRect().width,rowHeight:button.getBoundingClientRect().height,titleFits:title.scrollWidth<=title.clientWidth+1,dates};
    },width));
  }
  await page.setViewportSize({width:736,height:1220});
  await frame.locator('[data-event="plant"]').click();
  await frame.locator('.cr-registration').screenshot({path:path.join(directory,'registration-compact-section.png')});
  console.log(JSON.stringify({selections,layout,errors}));
  await browser.close();
  if(errors.length || layout.some(item=>!item.titleFits)) process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
