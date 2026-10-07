// Original synthesized score “Horizonte”, melodic ambient at 72 BPM.
import {SCORE,loadScore} from "./atlas-score.js";
// Locally rendered original composition; no external service or third-party samples.
export const EFFECTS = Object.freeze({ point: [440, 660], filter: [294, 392], open: [330, 440], close: [440, 330], save: [349, 440, 523], route: [294, 440, 587] });
export const CHORDS = SCORE.chords;
export function volume(value) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0; }

export function createAudioEngine({ createContext, onState = () => {}, loadMusic = loadScore }) {
  let context, master, music, effects, enabled = false, blocked = false, generation = 0;
  let musicVolume = .22, effectsVolume = .35, lastEffect = -1, lastIntro = -10;
  let destroyed = false, pending = false, wanted = false, background = false;
  const voices = new Set();
  let recording, loading, musicStarted = 0, musicOffset = 0;
  function tone(frequency, at, duration, level, bus, shape = 'sine') {
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = shape; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + Math.min(.012, duration * .1));
    gain.gain.linearRampToValueAtTime(0, at + duration);
    oscillator.connect(gain); gain.connect(bus); voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(at); oscillator.stop(at + duration + .02);
  }
  function stopVoices() {
    for (const voice of voices) { try { voice.stop(); } catch { /* already stopped */ } }
    voices.clear();
  }
  function startMusic(continuing) {
    if (!continuing) musicOffset = 0;
    const source = context.createBufferSource();
    source.buffer = recording; source.loop = true; source.connect(music);
    musicStarted = context.currentTime; voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); };
    source.start(0, musicOffset % recording.duration);
  }
  function sound(name) {
    if (!enabled || blocked || context?.state !== 'running' || !EFFECTS[name]) return false;
    if (context.currentTime - lastEffect < .1 || voices.size > 64) return false;
    lastEffect = context.currentTime;
    EFFECTS[name].forEach((note, i) => tone(note, context.currentTime + .01 + i * .055, .15, .09, effects));
    return true;
  }
  function intro() {
    if (!enabled || blocked || context?.state !== 'running') return false;
    if (context.currentTime - lastIntro < 3.5 || voices.size > 64) return false;
    lastIntro = context.currentTime;
    [164.814, 246.942, 329.628, 293.664].forEach((note, i) => tone(note, context.currentTime + .02 + i * .15625, .3, .06, effects, "triangle"));
    return true;
  }
  function pause() {
    if (enabled && recording) musicOffset = (musicOffset + Math.max(0, context.currentTime - musicStarted)) % recording.duration;
    loading?.abort();
    generation++; enabled = false; stopVoices(); lastIntro = -10; lastEffect = -1;
    if (master) master.gain.value = 0;
    if (context?.state === 'running') context.suspend().catch(() => {});
    onState(false);
  }
  function mute() { wanted = false; pause(); musicOffset = 0; }
  function recover() { if (wanted && !blocked && !background && !destroyed) void api.enable(true); }
  const api = {
    get enabled() { return enabled; },
    get blocked() { return blocked; },
    get wanted() { return wanted; },
    async enable(continuing = false) {
      if (destroyed || blocked || background || enabled || pending) return false;
      if (continuing && !wanted) return false;
      wanted = true;
      pending = true;
      const attempt = ++generation;
      try {
        if (!context || context.state === 'closed') {
          context = createContext(); master = context.createGain(); music = context.createGain(); effects = context.createGain();
          // Preserve the user's choice across temporary interruptions, not mute.
          context.onstatechange = () => {
            if (context.state === 'closed') mute();
            else if (enabled && context.state !== 'running') pause();
            else if (!enabled && context.state === 'running') recover();
          };
          const limiter = context.createDynamicsCompressor();
          master.gain.value = 0; music.gain.value = musicVolume; effects.gain.value = effectsVolume;
          music.connect(master); effects.connect(master); master.connect(limiter); limiter.connect(context.destination);
        }
        await context.resume();
        if (destroyed || !wanted || attempt !== generation || blocked || background || context.state !== 'running') { if (!enabled && context.state !== 'closed') context.suspend().catch(() => {}); return false; }
        if (!recording) {
          const controller = new AbortController(); loading = controller;
          let timeout;
          const deadline = new Promise((_, reject) => {
            timeout = setTimeout(() => { controller.abort(); reject(Error('Music loading timeout')); }, 15000);
          });
          try { recording = await Promise.race([loadMusic(context, controller.signal), deadline]); }
          finally { clearTimeout(timeout); loading = undefined; }
        }
        if (destroyed || !wanted || attempt !== generation || blocked || background || context.state !== 'running') { if (!enabled && context.state !== 'closed') context.suspend().catch(() => {}); return false; }
        enabled = true; master.gain.value = .5; startMusic(continuing); onState(true); return true;
      } catch { if (attempt === generation) mute(); return false; }
      finally { pending = false; if (wanted && !enabled && attempt !== generation) recover(); }
    },
    mute, sound, intro,
    setVolume(kind, value) {
      const amount = volume(value);
      if (kind === 'music') { musicVolume = amount; if (music) music.gain.value = amount; }
      if (kind === 'effects') { effectsVolume = amount; if (effects) effects.gain.value = amount; }
    },
    setSensitive(value) { blocked = Boolean(value); if (blocked) pause(); else { onState(enabled); recover(); } },
    setBackground(value) { background = Boolean(value); if (background) pause(); else recover(); },
    destroy() {
      if (destroyed) return;
      destroyed = true; mute();
      if (context) { context.onstatechange = null; context.close().catch(() => {}); }
    }
  };
  return api;
}

export function mountAtlasAudio({ document: doc, window: host, t }) {
  const make = (tag, text, className = '') => { const el = doc.createElement(tag); if (text) el.textContent = text; el.className = className; return el; };
  const trigger = make('button', '', 'atlas-audio-trigger'); trigger.type = 'button';
  const dialog = make('dialog', '', 'atlas-audio-dialog'); dialog.setAttribute('aria-labelledby', 'atlas-audio-title');
  const heading = make('h2'); heading.id = 'atlas-audio-title';
  const close = make('button', '×'); close.type = 'button'; close.addEventListener('click', () => dialog.close());
  const toggle = make('button'); toggle.type = 'button';
  const status = make('p'); status.setAttribute('role', 'status');
  const note = make('p');
  let failed = false, returnFocus = trigger, toggleRequest = 0;
  const engine = createAudioEngine({ createContext: () => new (host.AudioContext || host.webkitAudioContext)(), onState: enabled => { if (enabled) failed = false; refresh(); } });
  const sliders = ['music', 'effects'].map(kind => {
    const label = make('label'), text = make('span'), input = make('input');
    input.type = 'range'; input.min = '0'; input.max = '100'; input.value = kind === 'music' ? '22' : '35';
    input.addEventListener('input', () => engine.setVolume(kind, Number(input.value) / 100));
    label.append(text, input); return { kind, label, text };
  });
  const samples = make('div', '', 'atlas-audio-samples');
  const sampleButtons = Object.keys(EFFECTS).map(name => {
    const button = make('button'); button.type = 'button'; button.addEventListener('click', () => engine.sound(name)); samples.append(button); return button;
  });
  const intro = make('button'); intro.type = 'button'; intro.addEventListener('click', () => engine.intro());
  const open = () => { returnFocus = doc.activeElement; dialog.showModal(); };
  function refresh() {
    trigger.textContent = t(engine.enabled ? 'audioOn' : 'audioOff');
    heading.textContent = t('audioTitle'); close.setAttribute('aria-label', t('audioSamples').split('|')[3]);
    toggle.textContent = t(engine.wanted ? 'audioMute' : 'audioEnable'); toggle.setAttribute('aria-pressed', String(engine.wanted));
    note.textContent = `${SCORE.title} · ${t('audioNote')}`; status.textContent = engine.blocked ? t('audioSensitive') : failed ? t('audioError') : t(engine.enabled ? 'audioOn' : 'audioOff');
    sliders.forEach(item => { item.text.textContent = t(item.kind === 'music' ? 'audioMusic' : 'audioEffects'); });
    sampleButtons.forEach((button, i) => { button.textContent = t('audioSamples').split('|')[i]; button.disabled = !engine.enabled; });
    intro.textContent = t('audioIntro'); intro.disabled = !engine.enabled;
  }
  toggle.addEventListener('click', async () => {
    const request = ++toggleRequest; failed = false;
    if (engine.wanted) engine.mute();
    else { const enabled = await engine.enable(); if (request === toggleRequest) failed = !enabled && !engine.enabled; }
    refresh();
  });
  trigger.addEventListener('click', open);
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus(); });
  dialog.append(close, heading, toggle, status, ...sliders.map(item => item.label), intro, samples, note);
  doc.body.append(trigger, dialog);
  const click = event => {
    if (event.target.closest('.atlas-audio-dialog,.atlas-audio-trigger,.is-sensitive')) return;
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    const route = button.matches('[data-newsroom-panel="routes"],.route-start,.pilot-primary');
    engine.sound(route ? 'route' : button.matches('.maplibregl-popup-close-button,.event-sheet-close') ? 'close' : 'open');
  };
  const change = event => { if (!event.target.closest('.atlas-audio-dialog')) engine.sound('filter'); };
  const hidden = () => engine.setBackground(doc.hidden);
  const leave = () => engine.mute();
  doc.addEventListener('click', click); doc.addEventListener('change', change);
  doc.addEventListener('visibilitychange', hidden); host.addEventListener('pagehide', leave);
  refresh();
  return { engine, open, refresh, destroy() { engine.destroy(); trigger.remove(); dialog.remove(); doc.removeEventListener('click', click); doc.removeEventListener('change', change); doc.removeEventListener('visibilitychange', hidden); host.removeEventListener('pagehide', leave); } };
}
