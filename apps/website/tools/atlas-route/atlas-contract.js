export const ATLAS_VERSION = 'r77-564c7ef0fdc9';
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
export function atlasSharePayload(language) {
  const hints={de:'WRN-App für Android bei Google Play',en:'WRN Android app on Google Play',es:'App WRN para Android en Google Play',fr:'Application WRN pour Android sur Google Play',it:'App WRN per Android su Google Play',pt:'App WRN para Android no Google Play',ru:'Приложение WRN для Android в Google Play',el:'Εφαρμογή WRN για Android στο Google Play',tr:'Google Play’de Android için WRN uygulaması'};
  const code=LANGUAGES.includes(language)?language:'de';
  const url=publicAtlasUrl(code);
  return {title:'World Revolution Atlas · WRN',url,text:`World Revolution Atlas · WRN\n${url}\n\n${hints[code]}\n${ANDROID_URL}`};
}
export function atlasFrameUrl(language, origin, theme = 'dark') {
  const url = new URL(`/atlas/versions/${ATLAS_VERSION}/index.html`, origin);
  const allowedThemes = ['violet','dark','autonom','oled','soft','pink','light','system','contrast','editorial'];
  url.search = new URLSearchParams({ embed: '1', offline: '0', supabase: '0', welcome: '0', intro: '0', lang: LANGUAGES.includes(language) ? language : 'de', parentOrigin: new URL(origin).origin,theme: allowedThemes.includes(theme)?theme:'dark' }).toString();
  return url.href;
}
export function isAtlasReady(event, source, origin) {
  return !!source && event.source === source && event.origin === origin &&
    event.data?.source === 'resistance-atlas' && event.data?.version === '2.3.0' && event.data?.type === 'ready' &&
    event.data?.detail?.embedded === true && Number.isSafeInteger(event.data?.detail?.eventCount) && event.data.detail.eventCount > 0;
}
