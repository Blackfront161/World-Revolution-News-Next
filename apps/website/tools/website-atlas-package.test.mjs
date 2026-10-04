import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createAtlasPreviewPlugin } from './atlas-vite-plugin.mjs';
import {THEMES,themeFromSearch,effectiveTheme,runtimeTheme,themeOptions} from './atlas-route/atlas-settings.js';
import {languageFromSearch, publicAtlasUrl, atlasFrameUrl, LANGUAGES, isAtlasReady, atlasSharePayload,ANDROID_URL} from './atlas-route/atlas-contract.js';
import {safeRelativePath,prepareWebsiteAtlasPackage} from './website-atlas-package.mjs';

test('all nine UI languages produce only public canonical URLs and fixed reviewed frame configuration',()=>{
 for(const language of LANGUAGES){
  assert.equal(languageFromSearch('?lang='+language),language);
  assert.equal(publicAtlasUrl(language),`https://solinaridao.com/atlas/?lang=${language}`);
  const share=atlasSharePayload(language);assert.equal(share.url,publicAtlasUrl(language));assert.ok(share.text.includes(share.url));assert.ok(share.text.endsWith(ANDROID_URL));
  const frame=new URL(atlasFrameUrl(language,'http://127.0.0.1:43240'));
  assert.equal(frame.pathname,'/atlas/versions/r77-564c7ef0fdc9/index.html');
  assert.deepEqual([...frame.searchParams.keys()],['embed','offline','supabase','welcome','intro','lang','parentOrigin','theme']);
  assert.equal(frame.searchParams.get('offline'),'0');assert.equal(frame.searchParams.get('supabase'),'0');
  assert.equal(frame.searchParams.get('parentOrigin'),'http://127.0.0.1:43240');
 }
});
test('invalid, encoded and extra private/preview parameters never survive public sharing',()=>{
 for(const value of ['?lang=xx','?lang=DE','?lang=de%26progress%3Dsecret','?lang=../en','?offline=1'])assert.equal(languageFromSearch(value),'de');
 const language=languageFromSearch('?lang=ru&preview=secret&progress=private&event=hidden');
 assert.equal(publicAtlasUrl(language),'https://solinaridao.com/atlas/?lang=ru');
 assert.equal(publicAtlasUrl('ru&secret=x'),'https://solinaridao.com/atlas/?lang=de');
});
test('ready lifecycle requires exact frame, origin, API version and embedded nonempty data',()=>{
 const source={};const event={source,origin:'https://solinaridao.com',data:{source:'resistance-atlas',version:'2.3.0',type:'ready',detail:{embedded:true,eventCount:123}}};
 assert.equal(isAtlasReady(event,source,event.origin),true);
 assert.equal(isAtlasReady(event,{},event.origin),false);
 assert.equal(isAtlasReady(event,source,'https://evil.invalid'),false);
 for(const data of [{...event.data,type:'progress'},{...event.data,version:'2.2.0'},{...event.data,detail:{embedded:false,eventCount:123}},{...event.data,detail:{embedded:true,eventCount:0}}])assert.equal(isAtlasReady({...event,data},source,event.origin),false);
});
test('snapshot paths reject traversal, empty components, encoded delimiters and absolute paths',()=>{
 for(const rel of ['../outside','/outside','a/../b','a//b','a\\b','a/%2e%2e/b','C:/outside','a/./b'])assert.equal(safeRelativePath(rel),false);
 assert.equal(safeRelativePath('assets/maps/world.geojson'),true);
});
test('unadmitted snapshot manifest fails before any runtime file reads',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'wrn-atlas-negative-'));
 try{await fs.writeFile(path.join(dir,'snapshot-manifest.json'),'{}');await assert.rejects(prepareWebsiteAtlasPackage({snapshotRoot:dir}),/manifest differs/);}finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('Atlas preview middleware is inactive in production build',()=>{
 const plugin=createAtlasPreviewPlugin('/test/website');
 assert.equal(plugin.apply,'serve');assert.equal(plugin.generateBundle,undefined);assert.equal(plugin.buildStart,undefined);
});
test('host is separate from public/build shell input and contains no automatic game src or storage export',async()=>{
 const html=await fs.readFile(new URL('./atlas-route/index.html',import.meta.url),'utf8');
 const js=await fs.readFile(new URL('./atlas-route/atlas-host.js',import.meta.url),'utf8');
 assert.doesNotMatch(html,/<iframe|versions\/r\d+|<img/);
 assert.match(html,/rel="icon" type="image\/png" href="\.\/wrn-icon.png"/);
 assert.doesNotMatch(js,/\.getState\(|\.exportProgress\(|\.importProgress\(|sessionStorage|\.register\(/);
 assert.match(js,/localStorage\.getItem\(THEME_STORAGE_KEY\)/);assert.match(js,/localStorage\.setItem\(THEME_STORAGE_KEY,/);
 assert.match(js,/byId\('start'\)\.addEventListener\('click'/);
 const config=await fs.readFile(new URL('../vite.config.ts',import.meta.url),'utf8');
 assert.match(config,/createAtlasPreviewPlugin/);
 const plugin=await fs.readFile(new URL('./atlas-vite-plugin.mjs',import.meta.url),'utf8');
 assert.match(plugin,/apply:'serve'/);
});
test('all App and Website themes are selectable in every language; unknown theme fails closed',()=>{
 assert.equal(THEMES.length,10);
 for(const language of LANGUAGES)assert.deepEqual(themeOptions(language).map(item=>item.value),THEMES);
 for(const theme of THEMES)assert.equal(themeFromSearch('?theme='+theme,'pink'),theme);
 assert.equal(themeFromSearch('?theme=unknown','pink'),'violet');
 assert.equal(themeFromSearch('','pink'),'pink');assert.equal(themeFromSearch('','private'),'violet');
 assert.equal(effectiveTheme('system',true),'dark');assert.equal(effectiveTheme('system',false),'light');
 assert.equal(runtimeTheme('violet'),'violet');assert.equal(runtimeTheme('autonom'),'autonom');assert.equal(runtimeTheme('editorial'),'autonom');
});
