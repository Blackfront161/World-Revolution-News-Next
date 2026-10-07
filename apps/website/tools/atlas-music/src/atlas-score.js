// Original WRN composition, deterministic synthesis; no third-party samples.
export const SCORE=Object.freeze({id:'horizonte-v1',title:'Horizonte',bpm:72,barSeconds:10/3,
  style:'melodic ambient, synthesized keys and strings',chords:[[110,164.814,261.626],[87.307,130.813,220],[130.813,195.998,246.942],[97.999,146.832,220]]});
export const RECORDING=Object.freeze({url:new URL('../media/audio/horizonte.ogg',import.meta.url).href,bytes:728880,sha256:'e191061280ecfcaa5a4f56b65a7f39c575d35c884462e041158573fdb1632495',seconds:106.66665625});
// Fetch/decode occurs only after the existing explicit audio enable action.
export async function loadScore(context, signal) {
  const response=await fetch(RECORDING.url,{credentials:'omit',referrerPolicy:'no-referrer',signal});
  if(!response.ok || response.status!==200 || response.redirected || response.type==='opaque')throw Error('Music response unavailable');
  if(Number(response.headers.get('content-length'))>2000000)throw Error('Music response too large');
  const reader=response.body.getReader(),chunks=[];let length=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>RECORDING.bytes)throw Error('Music byte count differs');chunks.push(value);}}
  finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
  if(length!==RECORDING.bytes)throw Error('Music byte count differs');
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(digest!==RECORDING.sha256)throw Error('Music integrity differs');
  const decoded=await context.decodeAudioData(bytes.buffer);
  if(decoded.duration<106 || decoded.duration>107 || decoded.numberOfChannels!==2)throw Error('Music decode differs');
  return decoded;
}
