import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
const origin=process.env.WRN_LIVE_TEST_ORIGIN??'https://solinaridao.com';
const dir=process.env.WRN_LIVE_TEST_OUTPUT??'work/website-projection-live-20261001/browser-app-parity-live';fs.mkdirSync(dir,{recursive:true});
const source=fs.readFileSync('apps/website/src/assets/wrn-app-icon.png');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'wrn-live-shell-'));
let context;
const transport=process.env.WRN_LIVE_TEST_TCP==='1'?'HTTPS over HTTP/1.1':'browser default';
const launch=(offline=false)=>chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,args:transport==='browser default'?[]:['--disable-quic','--disable-http2'],offline,timezoneId:'Asia/Singapore',viewport:{width:1440,height:900},reducedMotion:'reduce'});
let diagnosisPage; const unsolicitedStreamRequests=[];
const layout=JSON.parse(fs.readFileSync('apps/website/src/features/home/app-home-layout-v1.json'));
const expectedIds=[layout.lead,...layout.top,...layout.sport,...layout.more];
const verifyAppSelection=async p=>{
 await expect(p.locator('[data-app-home-article]')).toHaveCount(expectedIds.length);
 const ids=await p.locator('[data-app-home-article]').evaluateAll(es=>es.map(e=>e.getAttribute('data-app-home-article')));
 if(JSON.stringify(ids)!==JSON.stringify(expectedIds))throw Error('App selection/order differs');
 await expect(p.locator('[data-app-home-section="briefing"] li')).toHaveCount(4);
 await expect(p.locator('[data-wrn-illustration]')).toHaveCount(3);
 await expect.poll(()=>p.locator('[data-wrn-illustration] img').first().evaluate(el=>el.complete&&el.naturalWidth===1672)).toBe(true);
 const image=await p.evaluate(async()=>{const src=document.querySelector('[data-wrn-illustration] img').src;const response=await fetch(src);const bytes=await response.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',bytes);return{mime:response.headers.get('content-type'),bytes:bytes.byteLength,sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}});
 if(image.mime!=='image/webp'||image.bytes!==230192||image.sha256!=='b7d83ace0ea59e05d803f1076c524af4a95e05345d1cb272306a7ce2fbec7eb0')throw Error('Illustration online/offline integrity differs');

 const extras=JSON.parse(fs.readFileSync('apps/website/src/features/home/home-additional-illustrations-v1.json')).entries;
 for(const asset of extras){const src=await p.locator('[data-wrn-illustration="'+asset.articleId+'"] img').getAttribute('src');const actual=await p.evaluate(async src=>{const response=await fetch(src);const body=await response.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',body);return{status:response.status,mime:response.headers.get('content-type'),bytes:body.byteLength,sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}},src);if(actual.status!==200||actual.mime!=='image/webp'||actual.bytes!==asset.bytes||actual.sha256!==asset.sha256)throw Error('Additional illustration hash/MIME mismatch');}
 result.illustration={...image,width:1672,additionalImages:extras.map(e=>({bytes:e.bytes,sha256:e.sha256}))};
};
const result={origin,transport,sourceCommit:process.env.WRN_LIVE_TEST_COMMIT??"5c0cc6991bfa1b585f3b1354f37e9a8130eb5a07",observedAtUTC:new Date().toISOString(),status:'IN-PROGRESS',checks:[]};
try{
 context=await launch();
 await context.addInitScript(()=>sessionStorage.setItem('wrn.website.support-welcome.v1','dismissed'));
 const page=await context.newPage();result.networkFailures=[];page.on('requestfailed',r=>result.networkFailures.push({url:r.url(),error:r.failure()?.errorText}));page.on('request',r=>{if(r.url().includes('streamtheworld.com'))unsolicitedStreamRequests.push(r.url())});diagnosisPage=page;const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(origin+'/?lang=de#home');
 await page.locator('.website-coverage').waitFor({state:'attached',timeout:30000});
 await expect(page.locator('.website-coverage')).toContainText('465/500');
 await expect(page.locator('[data-home-directory-article]')).toHaveCount(5);
 await expect(page.locator('.website-coverage')).toContainText('35');
 if(origin==='https://solinaridao.com'){
  // A bounded failed live refresh must truthfully show the verified fallback.
  // The independent 45-file readback proves server bytes; never infer freshness from it.
  await expect(page.locator('.website-coverage')).toContainText(/Server|Aktualisierung unbestätigt: der geprüfte gespeicherte Stand wird gezeigt\./,{timeout:15000});
  result.coverageText=await page.locator('.website-coverage').innerText();
 }
 await verifyAppSelection(page);
 const notes=JSON.parse(fs.readFileSync('apps/website/src/features/home/app-home-editorial-v1.json')).entries;
 const localized=JSON.parse(fs.readFileSync('apps/website/src/features/home/home-note-languages-v1.json')).entries;
 for(const language of ['de','en','es','fr','it','pt','ru','el','tr']){
  await page.goto(origin+'/?lang='+language+'#home');await verifyAppSelection(page);
  for(const id of expectedIds){const note=notes.find(n=>n.articleId===id), translated=localized.find(n=>n.articleId===id);await expect(page.locator('[data-app-home-article="'+id+'"] p')).toHaveText(language==='de'?note.summaryDe:language==='en'?note.summaryEn:translated.summaries[language]);}
  for(const held of layout.excludedSelection)await expect(page.locator('[data-app-home-article="'+held.articleId+'"]')).toHaveCount(0);
 }
 result.currentHome={reviewedItems:15,mainCards:11,briefing:4,heldItems:5,noteLanguages:9,directoryCoverage:'465/500',originalBodiesImported:0};
 await page.goto(origin+'/?lang=de#home');await verifyAppSelection(page);
 const ids=await page.locator('[data-home-directory-article]').evaluateAll(es=>es.map(e=>e.getAttribute('data-home-directory-article')));
 const icon=await page.locator('link[rel="icon"]').getAttribute('href');
 if(!/^\/assets\/wrn-app-icon-[\w-]+\.png$/.test(icon))throw Error('Wrong favicon');
 const response=await page.request.get(new URL(icon,origin).href);const bytes=await response.body();
 if(response.status()!==200||response.headers()['content-type']!=='image/png'||!bytes.equals(source))throw Error('Online favicon bytes or MIME differ');
 result.icon={href:icon,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
 const links=await page.locator('[data-home-directory-article] a').evaluateAll(es=>es.map(e=>({href:e.href,rel:e.rel,referrerpolicy:e.getAttribute('referrerpolicy')})));
 if(links.some(l=>!l.href.startsWith(origin+'/?article=news-')||!l.href.endsWith('&lang=de#home')))throw Error('Internal reader link policy differs');
 result.checks.push({name:'live homepage, coverage and original links',status:'PASS',ids,links});
 for(const [width,height] of [[1440,900],[390,844]]){
  await page.setViewportSize({width,height});await page.goto(origin+'/?lang=de#home');
  await expect(page.locator('[data-home-directory-article]')).toHaveCount(5);
  if(!await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth+1))throw Error('Horizontal overflow '+width);
  await page.screenshot({path:dir+'/website-'+width+'x'+height+'.png',fullPage:true});
  result.checks.push({name:'responsive '+width+'x'+height,status:'PASS'});
 }
 await page.goto(origin+'/?lang=de#discover/news');await expect(page.locator('.website-content-list>li')).toHaveCount(30);
 await page.goto(origin+'/?lang=de#discover/sources');await expect(page.getByText('Ungeprüfte Quelle · nur Originallink').first()).toBeVisible();
 result.checks.push({name:'news and sources deep links with unverified labels',status:'PASS'});
 const verifyCatalogues=async p=>{ await p.setViewportSize({width:1440,height:900});
  await p.goto(origin+'/?lang=de#media');
  try{await expect(p.locator('[data-app-catalog-count]')).toHaveText('28 von 28',{timeout:15000});}
  catch(error){
   if(origin!=='https://solinaridao.com')throw error;
   const catalogue=p.locator('.website-app-catalog');
   await expect(catalogue.getByText('Lokale Wissensdaten konnten nicht vorbereitet werden.',{exact:true})).toBeVisible();
   result.mediaRetry={reason:'bounded ten-second catalogue load failed; explicit product retry',atUTC:new Date().toISOString()};
   await catalogue.getByRole('button',{name:'Erneut versuchen',exact:true}).click();
   await expect(p.locator('[data-app-catalog-count]')).toHaveText('28 von 28',{timeout:15000});
  }
  await p.locator('.website-app-catalog input').fill('3CR');await expect(p.locator('[data-app-catalog-count]')).toHaveText('1 von 1');const station=p.locator('[data-app-catalog-record="app-fcaee58ec0c1ae8928f6421ed6db0e950bb48f6d2072e3d5b1e20e4b90d9f6e0"]'); await expect(station.getByRole('heading',{name:'3CR Community Radio',exact:true})).toBeVisible(); const stream=station.getByRole('link',{name:'Live beim Originalsender hören',exact:true});await expect(stream).toHaveAttribute('href','https://playerservices.streamtheworld.com/api/livestream-redirect/3CR.mp3');await expect(stream).toHaveAttribute('rel','noopener noreferrer');await expect(stream).toHaveAttribute('referrerpolicy','no-referrer');if(p===page){await p.screenshot({path:dir+'/radio-1440.png'});await p.setViewportSize({width:390,height:844});await expect(station.getByRole('heading',{name:'3CR Community Radio',exact:true})).toBeVisible();await p.screenshot({path:dir+'/radio-390.png'});await p.setViewportSize({width:1440,height:900});}await p.locator('.website-app-catalog input').fill('');await expect(p.locator('[data-app-catalog-count]')).toHaveText('28 von 28');;
  await p.locator('.website-app-catalog').getByRole('button',{name:'Podcast-Folgen (1722)',exact:true}).click();await expect(p.locator('[data-app-catalog-count]')).toHaveText('30 von 1722');
  await p.locator('.website-app-catalog').getByRole('button',{name:'Videos (16)',exact:true}).click();await expect(p.locator('[data-app-catalog-count]')).toHaveText('16 von 16');
  await p.goto(origin+'/?lang=de#knowledge');await p.locator('.website-knowledge-panel .website-content-filters').getByRole('button').click();await expect(p.locator('.website-knowledge-panel').getByText('30 von 731',{exact:true})).toBeVisible();await expect(p.locator('.website-knowledge-panel ol.website-content-list>li')).toHaveCount(30);await expect(p.locator('[data-learning-path]')).toHaveCount(4);await p.getByRole('button',{name:'Lexikon',exact:true}).click();await expect(p.locator('.website-lexicon-layout>ul>li')).toHaveCount(177);
  const additions=JSON.parse(fs.readFileSync('work/app-handoff-integration-20261003/scope.json')).lexicon.added; const terms=JSON.parse(fs.readFileSync('apps/website/src/features/knowledge/packed/legacy-knowledge-v1.json')).currentKnowledge.lexicon.terms;for(const id of additions){const term=terms.find(t=>t.id===id);await expect(p.locator('.website-lexicon-layout>ul').getByRole('link',{name:term.title.de,exact:true})).toBeVisible();}await p.locator('.website-lexicon-layout>ul').getByRole('link',{name:'Digitale Gemeingüter',exact:true}).click(); await expect(p.locator('.website-lexicon-layout article h2')).toHaveText('Digitale Gemeingüter');await expect(p.locator('.website-lexicon-layout article h2')).toBeVisible();await p.locator('.website-lexicon-layout article h2').scrollIntoViewIfNeeded(); if(p===page){await p.screenshot({path:dir+'/knowledge-1440.png'});await p.setViewportSize({width:390,height:844});await p.locator('.website-lexicon-layout article h2').scrollIntoViewIfNeeded();await p.screenshot({path:dir+'/knowledge-390.png'});await p.setViewportSize({width:1440,height:900});};
  await p.goto(origin+'/?lang=de#events');await expect(p.locator('[data-app-catalog-count]')).toHaveText('6 von 6');
  await p.goto(origin+'/?lang=de#solidarity');await expect(p.locator('#website-page-title')).toBeVisible();
 };

 const verifyPrisonerSupplement=async(p,offline=false)=>{
  for(const [width,height]of[[1440,900],[390,844]]){
   await p.setViewportSize({width,height});await p.goto(origin+'/?lang=de#solidarity');
   await expect(p.locator('[data-prisoner-support-link]')).toHaveCount(5);
   await expect(p.locator('[data-prisoner-review-state="dated-address-match"]')).toHaveCount(13);
   await expect(p.locator('[data-prisoner-review-state="needs-review"]')).toHaveCount(17);
   const rows=await p.locator('[data-prisoner-support-link] a').evaluateAll(a=>a.map(x=>({url:x.href,rel:x.rel,referrerPolicy:x.getAttribute('referrerpolicy')})));
   const expected=JSON.parse(fs.readFileSync('apps/website/src/features/support/data/prisoner-review-v1.json')).links;
   if(JSON.stringify(rows.map(x=>x.url))!==JSON.stringify(expected.map(x=>x.url))||rows.some(x=>x.rel!=='noopener noreferrer'||x.referrerPolicy!=='no-referrer'))throw Error('Support link binding/privacy differs');
   await expect(p.locator('[data-prisoner-review-id] button')).toHaveCount(0);
   const stamp=p.locator('[data-prisoner-review-state="dated-address-match"]').first().locator('time').first();await expect(stamp).toHaveText('2026-10-03');
   if(!await p.locator('body').evaluate(b=>b.scrollWidth<=innerWidth+1))throw Error('Prisoner viewport overflow '+width);
   await p.screenshot({path:dir+'/solidarity-'+(offline?'offline-':'')+width+'.png'});
   await p.locator('[data-prisoner-review-state="dated-address-match"]').first().scrollIntoViewIfNeeded();
   await p.screenshot({path:dir+'/address-review-'+(offline?'offline-':'')+width+'.png'});
  }
  result.checks.push({name:'five public support originals and source-bound 13/17 review states '+(offline?'after complete offline restart':'online'),status:'PASS'});
  result.prisonerAlignment={profiles:30,datedAddressMatches:13,needsReview:17,publicSupportLinks:5,addressesImported:0,appProduct:'8c0c0d90a119b7a95b5154fa64c49dfb97c8842e'};
 };

 const lead=layout.lead;
 const verifyReader=async(p,offline=false)=>{
  await p.goto(origin+'/?lang=de&theme=light#home');
  await p.locator('[data-app-home-article="'+lead+'"] h2 a').click();
  await expect(p.locator('.website-news-reader')).toBeVisible();
  if(new URL(p.url()).searchParams.get('article')!==lead)throw Error('Same-tab reader navigation missing');
  await expect(p.locator('.website-news-reader h1')).toHaveText(notes.find(n=>n.articleId===lead).headlineDe);
  for(const language of ['de','en','es','fr','it','pt','ru','el','tr']){
   await p.locator('.news-reader-toolbar select').first().selectOption(language);
   const note=notes.find(n=>n.articleId===lead),translated=localized.find(n=>n.articleId===lead);
   await expect(p.locator('.news-reader-note')).toHaveText(language==='de'?note.summaryDe:language==='en'?note.summaryEn:translated.summaries[language]);
   await expect(p.locator('.news-reader-share-link input')).toHaveValue('https://solinaridao.com/?article='+lead+'&lang='+language+'#home');
  }
  await p.locator('.news-reader-toolbar select').first().selectOption('de');
  await p.locator('.news-reader-toolbar select').last().selectOption('200');
  for(const [width,height]of[[1440,900],[390,844]]){
   await p.setViewportSize({width,height});
   if(!await p.locator('body').evaluate(b=>b.scrollWidth<=innerWidth+1))throw Error('Reader overflow '+width);
   await p.screenshot({path:dir+'/reader-'+(offline?'offline-':'')+width+'.png',fullPage:true});
  }
  const saved=p.getByRole('button',{name:/Später lesen|Aus Gespeichert entfernen/});
  if(!offline){await saved.click();await expect(saved).toHaveAttribute('aria-pressed','true');await p.getByRole('button',{name:/Als gelesen markieren/}).click();await expect(p.getByRole('button',{name:/Als ungelesen markieren/})).toHaveAttribute('aria-pressed','true');}
  else{await expect(saved).toHaveAttribute('aria-pressed','true');await expect(p.getByRole('button',{name:/Als ungelesen markieren/})).toHaveAttribute('aria-pressed','true');}
  await p.goto(origin+'/?lang=de#saved');
  await expect(p.locator('.website-news-saved a')).toHaveCount(1);
  await p.locator('.website-news-saved').getByRole('button',{name:'Lesen',exact:true}).click();
  await expect(p.locator('.website-news-saved a')).toHaveCount(1);
  await p.locator('.website-news-saved a').click();await expect(p.locator('.website-news-reader')).toBeVisible();
  await p.getByRole('button',{name:'← Zurück',exact:true}).click();await expect(p.locator('.website-news-saved')).toBeVisible();
  result.checks.push({name:'internal reader, nine own language versions, canonical URLs, 200% text, saved/read state '+(offline?'after full offline restart':'online'),status:'PASS'});
 };
 const themes=['violet','dark','editorial','oled','soft','pink','light','system','contrast'];result.themePalettes={};
 for(const theme of themes){
  await page.goto(origin+'/?lang=de&theme='+theme+'#home');await verifyAppSelection(page);
  const palette=await page.locator('html').evaluate(e=>({theme:e.dataset.theme,canvas:getComputedStyle(e).getPropertyValue('--wrn-color-canvas').trim(),action:getComputedStyle(e).getPropertyValue('--wrn-color-action').trim()}));
  result.themePalettes[theme]=palette;
  for(const width of [1440,390]){await page.setViewportSize({width,height:900});if(!await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth+1))throw Error('Theme overflow '+theme+'/'+width);}
  if(theme==='editorial'){await expect(page.locator('.app-start-lead .app-start-story')).toHaveCSS('display','grid');await page.screenshot({path:dir+'/home-autonom-390.png',fullPage:true});}
 }
 await verifyReader(page);
 result.checks.push({name:'all nine themes with three WRN illustrations and own Autonom grid, both viewport widths',status:'PASS'});

 await verifyPrisonerSupplement(page);

 const verifyLibraryRegional=async(p,offline=false)=>{
  const input=JSON.parse(fs.readFileSync('docs/evidence/WRN-WEBSITE-LIBRARY-REGIONAL-2026-10-03/library-refresh.json'));
  const regional=JSON.parse(fs.readFileSync('packages/browser-content/src/regional-events/events.json'));
  for(const[width,height]of[[1440,900],[390,844]]){
   await p.setViewportSize({width,height});await p.goto(origin+'/?lang=de#knowledge');
   const panel=p.locator('section.website-knowledge-panel[aria-label="Bibliothek"]');await panel.locator('.website-content-filters').getByRole('button').click();
   await expect(panel.getByText('30 von 731',{exact:true})).toBeVisible();
   for(const book of input.added){
    await panel.locator('.website-content-filters input').fill(book.title);
    await expect(panel.locator('ol.website-content-list>li')).toHaveCount(1);
    const row=panel.locator('ol.website-content-list>li').first();
    await expect(row.getByRole('heading',{name:book.title,exact:true})).toBeVisible();
    const link=row.getByRole('link',{name:'EPUB',exact:true});
    await expect(link).toHaveAttribute('href',book.downloads.epub);await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveAttribute('referrerpolicy','no-referrer');
    if(book.title==='Actually Existing Multipolarity')await p.screenshot({path:dir+'/library-'+(offline?'offline-':'')+width+'.png'});
   }
   if(!await p.locator('body').evaluate(b=>b.scrollWidth<=innerWidth+1))throw Error('Library viewport overflow');
   await p.goto(origin+'/?lang=de#events');const block=p.locator('.current-regional-events');
   await expect(block.locator('time[datetime="'+regional.validUntil+'"]')).toBeVisible();
   for(const[continent,country,count]of[['continent-europe','country-gb',2],['continent-north-america','country-us',1],['continent-south-america','country-cl',1],['continent-south-america','country-br',0]]){
    await block.getByLabel('Kontinent',{exact:true}).selectOption(continent);await block.getByLabel('Land',{exact:true}).selectOption(country);
    await expect(block.locator('[data-regional-event]')).toHaveCount(count);
    for(const event of regional.events.filter(e=>regional.regions.find(r=>r.id===e.regionId)?.countryId===country)){
     const row=block.locator('[data-regional-event="'+event.id+'"]');await expect(row).toBeVisible();
     await expect(row.getByRole('link',{name:/Originalankündigung öffnen/})).toHaveAttribute('href',event.originalUrl);
     await expect(row.locator('time[datetime="2026-10-03"]')).toBeVisible();
    }
    if(country==='country-br')await expect(block.getByText('Für diese Auswahl sind aktuell keine kommenden Termine erfasst.',{exact:true})).toBeVisible();
    if(country==='country-gb')await p.screenshot({path:dir+'/regional-'+(offline?'offline-':'')+width+'.png'});
   }
   await expect(block.getByText('Diese Auswahl gilt vorerst nur für diese Ansicht.',{exact:true})).toBeVisible();
   if(!await p.locator('body').evaluate(b=>b.scrollWidth<=innerWidth+1))throw Error('Regional viewport overflow');
  }
  result.checks.push({name:'731 books with all three added original links; four regional events and Brazil empty '+(offline?'after full offline restart':'online'),status:'PASS'});
  result.libraryRegional={books:731,addedBookIds:input.added.map(b=>b.id),regionalRevision:regional.revision,regionalEventIds:regional.events.map(e=>e.id),validUntil:regional.validUntil,selectionSaved:false};
 };
 const verifyNewKnowledgeNavigation=async(p,offline=false)=>{
  const document=JSON.parse(fs.readFileSync('apps/website/src/features/knowledge/packed/legacy-knowledge-v1.json')).currentKnowledge;
  const book=document.library.books[0],term=document.lexicon.terms.find(term=>term.id==='worker-cooperative');
  const notices={de:'WRN-Entwurf',en:'WRN draft',es:'Borrador WRN',fr:'Brouillon WRN',it:'Bozza WRN',pt:'Rascunho WRN',ru:'Черновик WRN',el:'Προσχέδιο WRN',tr:'WRN taslağı'};
  for(const[lang,notice]of Object.entries(notices)){
   await p.goto(origin+'/?lang='+lang+'#knowledge/lexicon?item='+term.id);
   await expect(p.getByText(notice,{exact:false})).toBeVisible();
   await expect(p.getByRole('heading',{level:2,name:term.title[lang==='de'?'de':'en']})).toBeVisible();
  }
  await p.goto(origin+'/?lang=de#knowledge/library');
  const panel=p.locator('section[aria-label="Bibliothek"]');
  await panel.locator('.website-content-filters').getByRole('button').click();
  await panel.locator('input').fill(book.title);
  const trigger=panel.locator('ol.website-content-list').getByRole('link',{name:book.title,exact:true});
  await expect(trigger).toBeVisible();await trigger.click();
  await expect(p.getByRole('heading',{level:2,name:book.title,exact:true})).toBeVisible();
  if(!p.url().includes('#knowledge/library?item='+book.id))throw Error('Book stable internal link differs');
  await p.goBack();await expect(panel.locator('input')).toHaveValue(book.title);await expect(trigger).toBeFocused();
  await panel.locator('.website-content-filters').getByRole('button').click();
  result.checks.push({name:'nine-language original glossary draft status and internal book/native Back filter/focus '+(offline?'after full offline Chrome restart':'online'),status:'PASS'});
 };
 await verifyNewKnowledgeNavigation(page);
 await verifyLibraryRegional(page);
 await verifyCatalogues(page);result.checks.push({name:'all current app catalogues and 177 glossary terms and source-bound 3CR original link online',status:'PASS'});

 await page.goto(origin+'/?lang=en#more');await page.getByRole('button',{name:'Save website shell',exact:true}).click();
 await expect(page.locator('.website-shell-panel')).toHaveAttribute('data-shell-status',/^(saved|active)$/,{timeout:30000});
 await expect.poll(()=>page.evaluate(async()=>(await navigator.serviceWorker.getRegistration())?.active?.state),{timeout:15000}).toBe('activated');
 await context.close();context=await launch(true);
 await context.addInitScript(()=>sessionStorage.setItem('wrn.website.support-welcome.v1','dismissed'));
 const reopened=await context.newPage();diagnosisPage=reopened;
 await reopened.goto(origin+'/?lang=en#home');await expect(reopened.locator('[data-home-directory-article]')).toHaveCount(5);
 await expect(reopened.locator('.website-coverage')).toContainText('465/500');
 await verifyAppSelection(reopened);
 const restoredIds=await reopened.locator('[data-home-directory-article]').evaluateAll(es=>es.map(e=>e.getAttribute('data-home-directory-article')));
 if(JSON.stringify(restoredIds)!==JSON.stringify(ids))throw Error('Offline metadata identity differs');
 const offline=await reopened.evaluate(async()=>{const href=document.querySelector('link[rel="icon"]').getAttribute('href');const image=new Image();image.src=href;await image.decode();const response=await fetch(href);const bytes=await response.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',bytes);return{href,width:image.naturalWidth,height:image.naturalHeight,controlled:!!navigator.serviceWorker.controller,mime:response.headers.get('content-type'),bytes:bytes.byteLength,sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}});
 if(!offline.controlled||offline.href!==icon||offline.width!==72||offline.height!==72||offline.sha256!==result.icon.sha256||offline.mime!=='image/png')throw Error('Offline logo contract differs');
 await verifyReader(reopened,true);
 await verifyNewKnowledgeNavigation(reopened,true);await verifyPrisonerSupplement(reopened,true);await verifyLibraryRegional(reopened,true);await verifyCatalogues(reopened);result.checks.push({name:'all current catalogues and glossary after complete offline Chrome restart',status:'PASS'});await reopened.goto(origin+'/?lang=de#home');
 result.offline=offline;result.checks.push({name:'Chrome process closed and restarted offline with persistent test profile, metadata and exact favicon',status:'PASS'});
 await verifyAppSelection(reopened);
 await reopened.screenshot({path:dir+'/website-offline-reopened.png',fullPage:false});
 if(errors.length)throw Error('Page errors: '+errors.join('; '));result.pageErrors=errors;if(unsolicitedStreamRequests.length)throw Error('Unsolicited radio stream request');result.radioSupplement={visibleCount:28,unsolicitedStreamRequests};result.status='PASS';
}catch(e){result.status='FAIL';result.error=String(e);process.exitCode=1;
 if(diagnosisPage&&!diagnosisPage.isClosed()){result.failureUI=await diagnosisPage.locator('body').innerText();result.worker=await diagnosisPage.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return{active:r?.active?.state,waiting:r?.waiting?.state,installing:r?.installing?.state,caches:await caches.keys()}});await diagnosisPage.screenshot({path:dir+'/failure-ui.png',fullPage:false});}
}
finally{await context?.close();fs.writeFileSync(dir+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
