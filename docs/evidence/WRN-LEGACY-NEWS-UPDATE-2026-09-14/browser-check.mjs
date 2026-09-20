import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const candidate=path.join(import.meta.dirname,'candidate');
const input=JSON.parse(await readFile(path.join(candidate,'production-build-input-v3.json')));
const id='wrn-art-c6c6c2fd56d7a3965b4da062d0f73981',expected=input.documents.readerDetails.entries.find(e=>e.articleId===id).blocks.map(b=>b.text);
const out=path.join(import.meta.dirname,`work/browser-${Date.now()}`);await mkdir(out);
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{
 for(const [app,port] of [['mobile',43212],['website',43213]]){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage(),foreign=[],errors=[];
  page.on('request',r=>{if(new URL(r.url()).origin!==`http://127.0.0.1:${port}`)foreign.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/?theme=editorial#home`);
  if(app==='website'){await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);}
  await page.getByTestId('ui-language-selector').selectOption('de');
  const trigger=page.locator(`[data-reader-trigger="${id}"]`);await expect(trigger).toHaveCount(1);
  for(const article of input.documents.articles.articles) await expect(page.locator(`[data-reader-trigger="${article.id}"]`)).toHaveCount(1);
  let originalImagesDecoded=0;
  for(const detail of input.documents.readerDetails.entries){
   const blocks=detail.blocks.filter(b=>b.kind==='image');if(!blocks.length)continue;
   await page.locator(`[data-reader-trigger="${detail.articleId}"]`).click();
   const images=page.getByTestId('production-reader').locator('.production-reader-image img');
   await expect(images).toHaveCount(blocks.length);
   for(let i=0;i<blocks.length;i++){
    const img=images.nth(i);await img.scrollIntoViewIfNeeded();
    await expect.poll(()=>img.evaluate(e=>({width:e.naturalWidth,height:e.naturalHeight,complete:e.complete}))).toEqual({width:blocks[i].width,height:blocks[i].height,complete:true});
    originalImagesDecoded++;
   }
   await page.getByRole('button',{name:'Zurück',exact:true}).click();
  }
  expect(originalImagesDecoded).toBe(4);
  await trigger.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${app}-new-card.png`)});await trigger.click();
  const reader=page.getByTestId('production-reader');await expect(reader).toBeVisible();await expect(reader).toHaveAttribute('lang','it');
  await expect(reader.locator('.production-reader-blocks')).toContainText('Enrico Sanna');
  expect(await reader.locator('.production-reader-blocks').evaluate((root,blocks)=>{const actual=[...root.querySelectorAll('.production-translatable-paragraph > p[lang=it]')].map(p=>p.textContent);return JSON.stringify(actual)===JSON.stringify(blocks);},expected)).toBe(true);
  await expect(reader.locator('img')).toHaveCount(0);
  for(const language of ['de','en','es','fr','it','pt','ru','el','tr']){await page.getByTestId('ui-language-selector').selectOption(language);await expect(reader).toHaveAttribute('lang','it');await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.getByTestId('ui-language-selector').selectOption('de');
  expect((await new AxeBuilder({page}).include('[data-testid="production-reader"]').analyze()).violations).toEqual([]);
  await reader.locator('.production-translatable-paragraph').first().scrollIntoViewIfNeeded(); await page.screenshot({path:path.join(out,`${app}-italian-reader.png`)});
  await context.setOffline(true);await page.getByRole('button',{name:'Zurück',exact:true}).click();await expect(reader).toHaveCount(0);await trigger.click();await expect(reader).toBeVisible();
  expect(await reader.locator('.production-reader-blocks').evaluate((root,blocks)=>JSON.stringify([...root.querySelectorAll('.production-translatable-paragraph > p[lang=it]')].map(p=>p.textContent))===JSON.stringify(blocks),expected)).toBe(true);
  expect(foreign).toEqual([]);expect(errors).toEqual([]);results.push({app,articlesReachable:7,retainedArticles:6,originalImagesDecoded,sourceParagraphs:20,readerLanguage:'it',translatorPreserved:true,uiLanguages:9,reflow320:true,axeViolations:0,offlineReaderRemount:true,externalRequests:0,pageErrors:0});await context.close();
 }
}finally{await browser.close();}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');await writeFile(path.join(import.meta.dirname,'work/latest-browser.json'),JSON.stringify({out}));console.log(JSON.stringify({out,results}));
