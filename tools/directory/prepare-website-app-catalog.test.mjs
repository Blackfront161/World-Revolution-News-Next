import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {prepareWebsiteAppCatalog} from './prepare-website-app-catalog.mjs';
async function run(podcasts, library=[], policy={}) {
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'wrn-catalog-policy-'));
 for(const [name,rows] of Object.entries({'radio-stations.json':[],'podcasts.json':podcasts,'video-feed.json':[],'library-feed.json':library,'events-feed.json':[]}))await fs.writeFile(path.join(directory,name),JSON.stringify(rows));
 const historyFile=path.join(directory,'history.json'),outputFile=path.join(directory,'out.json');await fs.writeFile(historyFile,'{}');
 await prepareWebsiteAppCatalog({inputDirectory:directory,historyFile,outputFile,commit:'a'.repeat(40),observedAt:'2026-10-04T15:00:00.000Z',podcastPolicy:policy,libraryAllowedIds:new Set(['approved'])});
 return JSON.parse(await fs.readFile(outputFile)).current.collections;
}
const episode=(id,extra={})=>({id,title:'Recorded title',sourceName:'Recorded source',sourceId:'provider',episodeUrl:'https://source.example/episode',language:'en',audioUrl:'https://source.example/audio.mp3',body:'Must never be projected',...extra});
test('canonical aliases suppress old metadata; reviewed original URLs take precedence',async()=>{
 const result=await run([episode('old',{title:'Old title'}),episode('canonical')],[],{episodeIdAliases:{old:'canonical'},reviewedEpisodeOverrides:{canonical:{episodeUrl:'https://source.example/repaired',title:'Reviewed title'}}});
 assert.equal(result.podcasts.length,1);assert.equal(result.podcasts[0].title,'Reviewed title');assert.equal(result.podcasts[0].url,'https://source.example/repaired');assert.deepEqual(Object.keys(result.podcasts[0]).sort(),['country','id','language','publishedAt','source','title','url']);
});
test('LORA intake IDs stay distinct and unverified language stays unknown',async()=>{
 const result=await run([episode('guid',{sourceId:'lora-muenchen'}),episode('reviewed',{sourceId:'lora-muenchen',languageVerified:false})]);
 assert.equal(result.podcasts.length,2);assert.notEqual(result.podcasts[0].id,result.podcasts[1].id);assert.equal(result.podcasts[1].language,'und');
});
test('new Data books cannot bypass frozen App intake',async()=>{
 const result=await run([],['approved','not-approved'].map(id=>({id,title:id,sourceName:'Library',readUrl:'https://library.example/'+id})));
 assert.deepEqual(result.library.map(r=>r.title),['approved']);
});
test('unsafe repaired original URLs remain rejected',async()=>{
 await assert.rejects(()=>run([episode('x')],[],{reviewedEpisodeOverrides:{x:{episodeUrl:'https://user:pass@example.com/'}}}),/unsafe-original/);
});
