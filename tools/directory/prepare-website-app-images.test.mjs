import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareWebsiteAppImages} from './prepare-website-app-images.mjs';
const article={id:'news-'+ 'a'.repeat(64),url:'https://source.example/story',title:'Recorded title',sourceName:'Recorded source',historical:false};
const item={link:article.url,title:article.title,quelleName:article.sourceName,image:'https://source.example/original.jpg',imageCredit:'Original photographer'};
const run=(row=item,rows=[article])=>prepareWebsiteAppImages({feedBytes:Buffer.from(JSON.stringify([row])),directory:{sourceCommit:'b'.repeat(40),articles:rows},appCommit:'c'.repeat(40),handoffSha256:'d'.repeat(64)});
test('retains the exact original reference and rights metadata without media bytes',()=>{
 const result=run();assert.equal(result.entries[0].imageUrl,item.image);assert.deepEqual(result.entries[0].rightsMetadata,{imageCredit:'Original photographer'});assert.deepEqual(result.origins,['https://source.example']);assert.equal(result.imageBytesHosted,false);assert.equal(result.imageBytesOffline,false);
});
test('historical, unadmitted and changed identities cannot receive a current image',()=>{
 assert.equal(run(item,[]).entries.length,0);assert.equal(run(item,[{...article,historical:true}]).entries.length,0);assert.equal(run({...item,title:'Changed'}).entries.length,0);assert.equal(run({...item,quelleName:'Changed source'}).entries.length,0);
});
test('unsafe, unavailable or malformed image URLs are excluded',()=>{
 for(const image of ['http://example.com/a','javascript:alert(1)','https://user:pass@example.com/a','https://example.com/a#fragment','https://example.com/a b','invalid'])assert.equal(run({...item,image}).entries.length,0);
 assert.equal(run({...item,imageStatus:'blocked'}).entries.length,0);
});
