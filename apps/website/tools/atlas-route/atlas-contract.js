export const ATLAS_VERSION = 'r76-8a0c503f6d00';
export const LANGUAGES = Object.freeze(['de', 'en', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']);
export const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.world.revolution';
export function languageFromSearch(search) {
  const value = new URLSearchParams(search).get('lang');
  return LANGUAGES.includes(value) ? value : 'de';
}
export function publicAtlasUrl(language) {
  const url = new URL('https://solinaridao.com/atlas/');
  url.searchParams.set('lang', LANGUAGES.includes(language) ? language : 'de');
  return url.href;
}
export function atlasFrameUrl(language, origin) {
  const url = new URL(`/atlas/versions/${ATLAS_VERSION}/index.html`, origin);
  url.search = new URLSearchParams({ embed: '1', offline: '0', supabase: '0', welcome: '0', intro: '1', lang: LANGUAGES.includes(language) ? language : 'de', parentOrigin: new URL(origin).origin }).toString();
  return url.href;
}
export function isAtlasReady(event, source, origin) {
  return !!source && event.source === source && event.origin === origin &&
    event.data?.source === 'resistance-atlas' && event.data?.version === '2.3.0' && event.data?.type === 'ready' &&
    event.data?.detail?.embedded === true && Number.isSafeInteger(event.data?.detail?.eventCount) && event.data.detail.eventCount > 0;
}
