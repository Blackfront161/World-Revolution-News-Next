import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {OWN_PREFIX, ownsCache, byteRange, verifiedBytes} from './atlas-route/atlas-offline-core.js';
test('cache deletion admits only this host control and UUID payloads, never Website or Game caches',()=>{
 assert.equal(ownsCache(OWN_PREFIX+'control'),true);assert.equal(ownsCache(OWN_PREFIX+'payload.12345678-1234-1234-1234-123456789abc'),true);
 for(const n of ['wrn.website-shell.v1.control','atlas-wrn-r77-v1',OWN_PREFIX+'foreign',OWN_PREFIX+'payload.fake','foreign'+OWN_PREFIX+'control'])assert.equal(ownsCache(n),false);
});
test('full, suffix, open and bounded range handling rejects malformed and out of bounds',()=>{
 assert.equal(byteRange(null,100),null);
 for(const [input,expected] of [['bytes=0-9',{start:0,end:9}],['bytes=90-',{start:90,end:99}],['bytes=-10',{start:90,end:99}],['bytes=-200',{start:0,end:99}],['bytes=50-999',{start:50,end:99}]])assert.deepEqual(byteRange(input,100),expected);
 for(const input of ['bytes=100-','bytes=90-20','bytes=-0','bytes=0-1,3-4','bytes=-','bytes=1e3-','bytes=999999999999999999999-'])assert.equal(byteRange(input,100),false);
});
test('partial, opaque, redirected, short and corrupted bytes cannot pass package integrity',async()=>{
 const bytes=new TextEncoder().encode('complete');const sha=[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');const entry={bytes:bytes.length,sha256:sha};
 assert.equal((await verifiedBytes(new Response(bytes),entry)).byteLength,entry.bytes);
 await assert.rejects(verifiedBytes(new Response(bytes,{status:206}),entry),/HTTP/);
 await assert.rejects(verifiedBytes(new Response('corrupt!'),entry),/INTEGRITY/);
 await assert.rejects(verifiedBytes(new Response('short'),entry),/INTEGRITY/);
 await assert.rejects(verifiedBytes({status:200,type:'opaque'},entry),/HTTP/);
 await assert.rejects(verifiedBytes({status:200,type:'basic',redirected:true},entry),/HTTP/);
});
