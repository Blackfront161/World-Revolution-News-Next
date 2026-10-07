export const THEMES = Object.freeze(['violet','dark','editorial','oled','soft','pink','light','system','contrast','autonom']);
const labels = {
  de:['Violett/Rot','Rot/Cyan','Editorial Schwarz/Rot','OLED','Soft','Pink','Hell','System','Kontrast','Autonom'],
  en:['Violet/Red','Red/Cyan','Editorial Black/Red','OLED','Soft','Pink','Light','System','Contrast','Autonom'],
  es:['Violeta/Rojo','Rojo/Cian','Editorial Negro/Rojo','OLED','Suave','Rosa','Claro','Sistema','Contraste','Autonom'],
  fr:['Violet/Rouge','Rouge/Cyan','Éditorial Noir/Rouge','OLED','Doux','Rose','Clair','Système','Contraste','Autonom'],
  it:['Viola/Rosso','Rosso/Ciano','Editoriale Nero/Rosso','OLED','Morbido','Rosa','Chiaro','Sistema','Contrasto','Autonom'],
  pt:['Violeta/Vermelho','Vermelho/Ciano','Editorial Preto/Vermelho','OLED','Suave','Rosa','Claro','Sistema','Contraste','Autonom'],
  ru:['Фиолетовый/Красный','Красный/Циан','Чёрный/Красный','OLED','Мягкий','Розовый','Светлый','Система','Контраст','Autonom'],
  el:['Μωβ/Κόκκινο','Κόκκινο/Κυανό','Μαύρο/Κόκκινο','OLED','Απαλό','Ροζ','Φωτεινό','Σύστημα','Αντίθεση','Autonom'],
  tr:['Mor/Kırmızı','Kırmızı/Camgöbeği','Siyah/Kırmızı','OLED','Yumuşak','Pembe','Açık','Sistem','Kontrast','Autonom'],
};
export const controls = {
  de:['Theme','Optionen','Schließen','Suche und Filter','Bildschirm füllen'],
  en:['Theme','Options','Close','Search and filters','Fill screen'],
  es:['Tema','Opciones','Cerrar','Búsqueda y filtros','Pantalla completa'],
  fr:['Thème','Options','Fermer','Recherche et filtres','Plein écran'],
  it:['Tema','Opzioni','Chiudi','Ricerca e filtri','Schermo intero'],
  pt:['Tema','Opções','Fechar','Pesquisa e filtros','Ecrã inteiro'],
  ru:['Тема','Настройки','Закрыть','Поиск и фильтры','На весь экран'],
  el:['Θέμα','Επιλογές','Κλείσιμο','Αναζήτηση και φίλτρα','Πλήρης οθόνη'],
  tr:['Tema','Seçenekler','Kapat','Arama ve filtreler','Tam ekran'],
};
export function themeFromSearch(search, stored) {
  const params=new URLSearchParams(search);
  const value=params.has('theme') ? params.get('theme') : stored;
  return THEMES.includes(value) ? value : 'violet';
}
export function effectiveTheme(preference,prefersDark) {
  return preference==='system' ? (prefersDark?'dark':'light') : preference;
}
export function runtimeTheme(preference) {
  return preference==='editorial' ? 'autonom' : THEMES.includes(preference)?preference:'violet';
}
export function themeOptions(language) {return THEMES.map((value,index)=>({value,label:(labels[language]||labels.de)[index]}));}
export const THEME_STORAGE_KEY='wrn.theme-preference.v1';
