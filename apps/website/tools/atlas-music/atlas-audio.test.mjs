import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAudioEngine} from './src/atlas-audio.js';
import {loadScore} from './src/atlas-score.js';
import fs from 'node:fs/promises';
function fixture(loadMusic=async()=>({duration:106.666,numberOfChannels:2})){
  const sources=[];let calls=0;
  const node=()=>({gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}});
  const context={state:'suspended',currentTime:0,destination:{},createGain:node,createDynamicsCompressor:node,
    createBufferSource(){const s={...node(),start(...a){this.startArgs=a;},stop(){this.stopped=true;}};sources.push(s);return s;},
    async resume(){this.state='running';},async suspend(){this.state='suspended';},async close(){this.state='closed';}};
  const engine=createAudioEngine({createContext:()=>{calls++;return context;},loadMusic});
  return {engine,context,sources,get calls(){return calls;}};
}
test('manual enable, mute, resume and disposal preserve audio ownership',async()=>{
  const f=fixture();assert.equal(f.calls,0);assert.equal(f.engine.enabled,false);
  assert.equal(await f.engine.enable(),true);assert.equal(f.sources.length,1);assert.equal(f.sources[0].loop,true);
  f.context.currentTime=17;f.engine.setBackground(true);assert.equal(f.sources[0].stopped,true);assert.equal(f.engine.wanted,true);
  f.engine.setBackground(false);await new Promise(r=>setTimeout(r,0));assert.equal(f.sources.length,2);assert.equal(f.sources[1].startArgs[1],17);
  f.engine.mute();assert.equal(f.sources[1].stopped,true);assert.equal(f.engine.wanted,false);
  f.engine.setBackground(false);await new Promise(r=>setTimeout(r,0));assert.equal(f.sources.length,2);
  await f.engine.enable();assert.equal(f.sources[2].startArgs[1],0);
  f.engine.destroy();assert.equal(f.context.state,'closed');assert.equal(await f.engine.enable(),false);
});
test('mute during asynchronous decoding never starts a late recording',async()=>{
  let complete;const f=fixture(()=>new Promise(r=>complete=r));const attempt=f.engine.enable();
  await new Promise(r=>setTimeout(r,0));f.engine.mute();complete({duration:106.666,numberOfChannels:2});
  assert.equal(await attempt,false);assert.equal(f.sources.length,0);assert.equal(f.engine.enabled,false);f.engine.destroy();
});
test('mute while resume is pending prevents even the recording request',async()=>{
  let resume,loads=0;const f=fixture(async()=>{loads++;return {duration:106.666};});
  f.context.resume=()=>new Promise(r=>resume=()=>{f.context.state='running';r();});
  const attempt=f.engine.enable();f.engine.mute();resume();
  assert.equal(await attempt,false);assert.equal(loads,0);assert.equal(f.sources.length,0);f.engine.destroy();
});
test('failed recording and sensitive content remain silent',async()=>{
  const f=fixture(async()=>{throw Error('Integrity failure');});assert.equal(await f.engine.enable(),false);
  assert.equal(f.sources.length,0);assert.equal(f.engine.wanted,false);
  f.engine.setSensitive(true);assert.equal(await f.engine.enable(),false);assert.equal(f.engine.sound('open'),false);f.engine.destroy();
});
test('successful fetch followed by stalled decode reaches the real deadline and allows retry',async()=>{
  const bytes=await fs.readFile(new URL('./media/horizonte.ogg',import.meta.url));
  const actualFetch=globalThis.fetch;globalThis.fetch=async()=>new Response(bytes);
  const f=fixture(loadScore);f.context.decodeAudioData=()=>new Promise(()=>{});
  try{
    const started=Date.now();assert.equal(await f.engine.enable(),false);
    assert.ok(Date.now()-started>=14900);assert.equal(f.engine.wanted,false);assert.equal(f.sources.length,0);
    f.context.decodeAudioData=async()=>({duration:106.666,numberOfChannels:2});
    assert.equal(await f.engine.enable(),true);assert.equal(f.sources.length,1);
  }finally{f.engine.destroy();globalThis.fetch=actualFetch;}
});
