import { ANDROID_URL, languageFromSearch, publicAtlasUrl, atlasFrameUrl, isAtlasReady, atlasSharePayload } from './atlas-contract.js';
import {THEME_STORAGE_KEY,themeFromSearch,effectiveTheme,runtimeTheme,themeOptions,controls} from './atlas-settings.js';
import {attachFramePresentation} from './atlas-presentation.js';
// UI translations only; the immutable Atlas keeps its own content/review labels.
const texts = {
  de: ['Sprache','Entdecke Bewegungen, Menschen und die Geschichte des Widerstands.','Der Atlas lädt erst beim Start. Er benötigt Internet und gehört nicht zum Offlinebereich der Website.','Atlas starten','Teilen','Link kopieren','Android-App bei Google Play','Entwurfs-, Quellen- und Rechtehinweise im Atlas gelten weiterhin. Die Sprache der Oberfläche bedeutet keine geprüfte Übersetzung aller Inhalte.','Atlas lädt …','Atlas bereit.','Link kopiert.','Öffentlicher Link','Der Atlas braucht länger zum Laden. Prüfe deine Internetverbindung.'],
  en: ['Language','Explore movements, people and the history of resistance.','The Atlas loads when you start it. It needs internet and is separate from the website’s offline area.','Start Atlas','Share','Copy link','Android app on Google Play','Draft, source and rights notices in the Atlas still apply. The interface language does not mean all content has a reviewed translation.','Loading Atlas …','Atlas ready.','Link copied.','Public link','The Atlas is taking longer to load. Check your internet connection.'],
  es: ['Idioma','Descubre movimientos, personas y la historia de la resistencia.','El Atlas carga al iniciarlo. Necesita internet y está separado del área sin conexión de la web.','Iniciar Atlas','Compartir','Copiar enlace','App Android en Google Play','Siguen vigentes los avisos de borrador, fuentes y derechos del Atlas. El idioma de la interfaz no implica una traducción revisada de todos los contenidos.','Cargando Atlas …','Atlas listo.','Enlace copiado.','Enlace público','El Atlas tarda más en cargar. Comprueba tu conexión a internet.'],
  fr: ['Langue','Découvrez les mouvements, les personnes et l’histoire de la résistance.','L’Atlas se charge au démarrage. Il nécessite internet et reste séparé de la partie hors ligne du site.','Lancer l’Atlas','Partager','Copier le lien','Application Android sur Google Play','Les mentions de brouillon, de sources et de droits dans l’Atlas restent valables. La langue de l’interface ne signifie pas que tous les contenus disposent d’une traduction vérifiée.','Chargement de l’Atlas …','Atlas prêt.','Lien copié.','Lien public','L’Atlas met plus de temps à charger. Vérifiez votre connexion internet.'],
  it: ['Lingua','Scopri movimenti, persone e la storia della resistenza.','L’Atlas si carica all’avvio. Richiede internet ed è separato dall’area offline del sito.','Avvia Atlas','Condividi','Copia link','App Android su Google Play','Restano validi gli avvisi su bozze, fonti e diritti nell’Atlas. La lingua dell’interfaccia non implica una traduzione verificata di tutti i contenuti.','Caricamento Atlas …','Atlas pronto.','Link copiato.','Link pubblico','L’Atlas richiede più tempo per caricarsi. Controlla la connessione internet.'],
  pt: ['Idioma','Descobre movimentos, pessoas e a história da resistência.','O Atlas carrega ao iniciar. Precisa de internet e está separado da área offline do site.','Iniciar Atlas','Partilhar','Copiar ligação','App Android no Google Play','Continuam válidos os avisos de rascunho, fontes e direitos no Atlas. O idioma da interface não significa que todo o conteúdo tenha uma tradução revista.','A carregar Atlas …','Atlas pronto.','Ligação copiada.','Ligação pública','O Atlas está a demorar mais a carregar. Verifica a ligação à internet.'],
  ru: ['Язык','Откройте движения, людей и историю сопротивления.','Атлас загружается при запуске. Ему нужен интернет; он отделён от офлайн-раздела сайта.','Запустить Атлас','Поделиться','Копировать ссылку','Приложение Android в Google Play','Пометки о черновиках, источниках и правах в Атласе остаются в силе. Язык интерфейса не означает, что весь контент имеет проверенный перевод.','Атлас загружается …','Атлас готов.','Ссылка скопирована.','Публичная ссылка','Атлас загружается дольше обычного. Проверьте подключение к интернету.'],
  el: ['Γλώσσα','Ανακαλύψτε κινήματα, ανθρώπους και την ιστορία της αντίστασης.','Ο Άτλας φορτώνει όταν τον ξεκινήσετε. Χρειάζεται διαδίκτυο και είναι χωριστός από το τμήμα εκτός σύνδεσης του ιστοτόπου.','Έναρξη Άτλαντα','Κοινοποίηση','Αντιγραφή συνδέσμου','Εφαρμογή Android στο Google Play','Οι σημάνσεις προσχεδίων, πηγών και δικαιωμάτων στον Άτλαντα εξακολουθούν να ισχύουν. Η γλώσσα διεπαφής δεν σημαίνει ελεγμένη μετάφραση όλου του περιεχομένου.','Φόρτωση Άτλαντα …','Ο Άτλας είναι έτοιμος.','Ο σύνδεσμος αντιγράφηκε.','Δημόσιος σύνδεσμος','Ο Άτλας αργεί να φορτώσει. Ελέγξτε τη σύνδεσή σας στο διαδίκτυο.'],
  tr: ['Dil','Hareketleri, insanları ve direnişin tarihini keşfet.','Atlas başlatıldığında yüklenir. İnternet gerekir ve sitenin çevrimdışı bölümünden ayrıdır.','Atlası başlat','Paylaş','Bağlantıyı kopyala','Google Play’de Android uygulaması','Atlastaki taslak, kaynak ve hak bildirimleri geçerlidir. Arayüz dili tüm içeriğin incelenmiş bir çevirisi olduğu anlamına gelmez.','Atlas yükleniyor …','Atlas hazır.','Bağlantı kopyalandı.','Herkese açık bağlantı','Atlasın yüklenmesi daha uzun sürüyor. İnternet bağlantını kontrol et.'],
};
const ids = ['language-label','intro','availability','start','share','copy','android','notice'];
let language = languageFromSearch(location.search), frame, ready = false, timeout;
let storedTheme;
try {storedTheme=localStorage.getItem(THEME_STORAGE_KEY);}catch{ /* Theme UI works without browser storage. */ }
let theme=themeFromSearch(location.search,storedTheme), presentation;
const colorScheme=matchMedia('(prefers-color-scheme: dark)');
const byId = id => document.getElementById(id);
function render() {
  document.documentElement.lang = language;
  const palette=effectiveTheme(theme,colorScheme.matches);
  document.documentElement.dataset.wrnHostTheme=palette;
  document.documentElement.dataset.themePreference=theme;
  const text = texts[language];
  ids.forEach((id, index) => { byId(id).textContent = text[index]; });
  byId('language').value = language;
  byId('language').setAttribute('aria-label', text[0]);
  byId('home').href = `/?lang=${language}&theme=${theme==='autonom'?'editorial':theme}#home`;
  byId('android').href = ANDROID_URL;
  byId('public-link').value = publicAtlasUrl(language);
  byId('link-label').textContent = text[11];
  byId('status').textContent = frame ? text[ready ? 9 : 8] : '';
  const copy=controls[language];
  byId('theme-label').textContent=copy[0];
  byId('options-title').textContent=copy[1];
  byId('options').setAttribute('aria-label',copy[1]);
  byId('close-options').setAttribute('aria-label',copy[2]);
  byId('filters').setAttribute('aria-label',copy[3]);
  byId('fullscreen').textContent=copy[4];
  byId('theme').replaceChildren(...themeOptions(language).map(item=>{const option=document.createElement('option');option.value=item.value;option.textContent=item.label;return option;}));
  byId('theme').value=theme;
  byId('theme-current').textContent=themeOptions(language).find(item=>item.value===theme).label;
  presentation?.refresh();
}
function copyFallback() { byId('copy-fallback').hidden = false; byId('public-link').focus(); byId('public-link').select(); }
async function copy() {
  try { await navigator.clipboard.writeText(publicAtlasUrl(language)); byId('status').textContent = texts[language][10]; }
  catch { copyFallback(); }
}
byId('copy').addEventListener('click', copy);
byId('share').addEventListener('click', async () => {
  if (!navigator.share) return copy();
  try { await navigator.share(atlasSharePayload(language)); }
  catch(error) { if (error?.name !== 'AbortError') copyFallback(); }
});
byId('language').addEventListener('change', () => {
  language = languageFromSearch('?lang=' + byId('language').value);
  // Only the public UI language survives; no filters, preview parameters or progress.
  history.replaceState(null, '', '/atlas/?lang=' + language);
  render();
  if (frame) frame.contentWindow.postMessage({source:'wrn-host',protocol:'wrn-atlas-v1',command:'setLanguage',requestId:'website-language',value:language}, location.origin);
});
function sendTheme(){if(frame&&ready)frame.contentWindow.postMessage({source:'wrn-host',protocol:'wrn-atlas-v1',command:'setTheme',requestId:'website-theme',value:runtimeTheme(theme)},location.origin);}
byId('theme').addEventListener('change',()=>{
  theme=themeFromSearch('?theme='+byId('theme').value);
  try{localStorage.setItem(THEME_STORAGE_KEY,theme==='autonom'?'editorial':theme);}catch{ /* Selection remains available. */ }
  render();sendTheme();
});
colorScheme.addEventListener('change',()=>{if(theme==='system'){render();sendTheme();}});
byId('options').addEventListener('click',()=>byId('options-dialog').showModal());
byId('close-options').addEventListener('click',()=>byId('options-dialog').close());
byId('options-dialog').addEventListener('close',()=>byId('options').focus());
byId('filters').addEventListener('click',()=>presentation?.toggleFilters());
byId('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{ /* The map still fills the browser viewport when OS fullscreen is unavailable. */ }
});
byId('start').addEventListener('click', () => {
  if (frame) return;
  frame = document.createElement('iframe');
  frame.title = 'World Revolution Atlas';
  frame.referrerPolicy = 'same-origin';
  frame.src = atlasFrameUrl(language, location.origin,runtimeTheme(theme));
  byId('game').hidden = false;
  byId('game').append(frame);
  document.body.classList.add('atlas-running');
  byId('options-dialog').append(document.querySelector('.intro'));
  byId('options').hidden=false;byId('filters').hidden=false;byId('fullscreen').hidden=false;
  byId('start').disabled = true;
  render();
  timeout = setTimeout(() => { if (!ready) byId('status').textContent = texts[language][12]; }, 40000);
});
window.addEventListener('message', event => {
  if (!isAtlasReady(event, frame?.contentWindow, location.origin)) return;
  ready = true; clearTimeout(timeout); render();
  if(!presentation)presentation=attachFramePresentation(frame,{getTheme:()=>effectiveTheme(theme,colorScheme.matches),onLanguage:next=>{
    language=languageFromSearch('?lang='+next);history.replaceState(null,'','/atlas/?lang='+language);render();
  },onFilters:open=>byId('filters').setAttribute('aria-expanded',String(open))});
  sendTheme();
  // No state getter, progress export/import, storage or analytics in this host.
  frame.contentWindow.postMessage({source:'wrn-host',protocol:'wrn-atlas-v1',command:'setLanguage',requestId:'website-language',value:language}, location.origin);
});
window.addEventListener('pagehide',()=>presentation?.destroy());
render();
