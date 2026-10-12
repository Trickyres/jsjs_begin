const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/fanta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const directory = 'C:/Users/fanta/.codex/visualizations/2026/08/24/01a032eb-3731-7c72-9194-e2bfe2ee10ba';

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page = await browser.newPage({viewport:{width:736,height:1380},deviceScaleFactor:1,colorScheme:'light'});
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(directory,'community-registration-options-preview.html')).href);
  const frame = page.frameLocator('iframe');
  await frame.locator('[data-design="list"] .jr-list-card').first().waitFor();
  console.log('Carousel controls',await frame.locator('.viz-carousel').getByRole('button').allTextContents());
  await page.screenshot({path:path.join(directory,'registration-list-preview.png'),fullPage:true});

  const next = frame.getByRole('button',{name:'下一种方案',exact:true});
  await next.click();
  await frame.locator('[data-design="poster"]').waitFor({state:'visible'});
  await page.screenshot({path:path.join(directory,'registration-poster-preview.png'),fullPage:true});
  await next.click();
  await frame.locator('[data-design="dates"]').waitFor({state:'visible'});
  await frame.locator('[data-choose="osmanthus"]').click();
  const selectedTitle = await frame.locator('[data-design="dates"] .jr-detail-copy h3').textContent();
  if (selectedTitle !== '金桂节主题活动') throw new Error('Date selection did not update event');
  await page.screenshot({path:path.join(directory,'registration-dates-preview.png'),fullPage:true});
  await frame.locator('[data-design="dates"] [data-register="osmanthus"]').click();
  await frame.locator('[data-design="dates"] .jr-form').waitFor({state:'visible'});
  if (!await frame.locator('[data-design="dates"] .jr-form h2').textContent().then(text=>text.includes('金桂节'))) throw new Error('Registration preview is mismatched');
  await frame.locator('[data-design="dates"] [data-back]').click();
  await frame.locator('[data-design="dates"] .jr-home').waitFor({state:'visible'});

  const overflows = [];
  for (const width of [320,390,736]) {
    await page.setViewportSize({width,height:1380});
    for (let index = 0; index < 3; index++) {
      const result = await frame.locator('#jia-registration-options').evaluate(root => {
        const phone = [...root.querySelectorAll('.jr-phone')].find(item=>item.getBoundingClientRect().width>0);
        const rect = phone.getBoundingClientRect();
        const offenders = [...phone.querySelectorAll('*')].filter(element=>{
          const box = element.getBoundingClientRect();
          return box.width>0 && (box.left<rect.left-1 || box.right>rect.right+1);
        }).map(element=>element.className);
        return {design:phone.dataset.design,offenders,scrollWidth:phone.scrollWidth,width:phone.clientWidth};
      });
      if(result.offenders.length || result.scrollWidth>result.width+2) overflows.push({width,...result});
      await next.click();
    }
  }
  await page.setViewportSize({width:736,height:1380});
  await page.emulateMedia({colorScheme:'dark'});
  await page.screenshot({path:path.join(directory,'registration-dark-preview.png'),fullPage:true});
  console.log(JSON.stringify({selectedTitle,errors,overflows}));
  await browser.close();
  if (errors.length || overflows.length) process.exitCode=1;
})().catch(error => {console.error(error);process.exitCode=1;});
