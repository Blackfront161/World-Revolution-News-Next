import {createHash} from 'node:crypto';
import {normaliseDirectoryUrl} from '../../packages/content-contracts/src/directory/mobile-content-directory-v1.ts';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
/** Preserve existing App image references only. Never fetch or publish image bytes. */
export function prepareWebsiteAppImages({feedBytes,directory,appCommit,handoffSha256}) {
 const feed=JSON.parse(feedBytes),byUrl=new Map(directory.articles.filter(a=>!a.historical).map(a=>[a.url,a]));
 const entries=[],excluded=[];
 for(let row=0;row<feed.length;row++) {
  const item=feed[row],url=normaliseDirectoryUrl(item.link,{news:true,allowHttp:true}),article=byUrl.get(url);
  if(!article||!item.image)continue;
  let image;try{image=new URL(item.image);}catch{excluded.push({row,reason:'invalid-image-url'});continue;}
  if(image.protocol!=='https:'||image.username||image.password||image.hash||item.image.length>4096||/[\x00-\x20\x7f]/.test(item.image)) {excluded.push({row,reason:'unsafe-image-url'});continue;}
  if(article.title!==item.title||article.sourceName!==item.quelleName) {excluded.push({row,reason:'article-identity-mismatch'});continue;}
  if(['unavailable','missing','blocked'].includes(item.imageStatus)){excluded.push({row,reason:'upstream-image-unavailable'});continue;}
  const rights=Object.fromEntries(['imageLicense','imageRights','imageCredit','imageCopyright','imageAttribution','imageSource'].filter(k=>Object.hasOwn(item,k)).map(k=>[k,item[k]]));
  entries.push({articleId:article.id,originalUrl:article.url,originalTitle:article.title,sourceName:article.sourceName,imageUrl:item.image,sourceRow:row,rightsMetadata:rights});
 }
 if(new Set(entries.map(e=>e.articleId)).size!==entries.length)throw Error('Duplicate image identity');
 const origins=[...new Set(entries.map(e=>new URL(e.imageUrl).origin))].sort();
 return {schema:'wrn.website-app-image-references.v1',appCommit,dataCommit:directory.sourceCommit,feedSha256:hash(feedBytes),handoffSha256,rights:'existing-original-image-reference-only',imageBytesHosted:false,imageBytesOffline:false,origins,entries,excluded};
}
