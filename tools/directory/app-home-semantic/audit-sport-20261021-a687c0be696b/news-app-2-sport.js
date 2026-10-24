(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WRNSport = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const STORE = 'https://play.google.com/store/apps/details?id=com.world.revolution';
  const labels = {
    de: ['Sport', 'Fankultur', 'Noch keine passenden Artikel in diesem Bereich.'],
    en: ['Sport', 'Fan culture', 'No matching articles in this section yet.'],
    es: ['Deporte', 'Cultura de afición', 'Todavía no hay artículos en esta sección.'],
    fr: ['Sport', 'Culture des supporters', 'Aucun article dans cette rubrique pour le moment.'],
    it: ['Sport', 'Cultura dei tifosi', 'Non ci sono ancora articoli in questa sezione.'],
    pt: ['Desporto', 'Cultura de adeptos', 'Ainda não há artigos nesta secção.'],
    ru: ['Спорт', 'Фан-культура', 'В этом разделе пока нет подходящих статей.'],
    el: ['Αθλητισμός', 'Οπαδική κουλτούρα', 'Δεν υπάρχουν ακόμη σχετικά άρθρα.'],
    tr: ['Spor', 'Taraftar kültürü', 'Bu bölümde henüz ilgili makale yok.']
  };
  const SPORT = /\b(sports?|football|fußball|fussball|f[uú]tbol|futebol|calcio|soccer|basketball|volleyball|handball|hockey|eishockey|ice[- ]hockey|rugby|tennis|cricket|cycling|radsport|ciclismo|athletics|leichtathletik|frisbee|roller derby|stockkampf|darts?|sportif|deport[eo]s?|desporto|spor)\b|(?:спорт|αθλητισ)/iu;
  const FAN = /\b(ultras?\b(?![-\u2010-\u2015\u2212\uFE63\uFF0D])(?!\s+(?:left|rich)\b)|fankultur|fanszene|fan[- ]culture|fan[- ]clubs?|fan[- ]rights|fanhilfe|tifos[io]|hinchad[ao]s?|torcid[ao]s?|fanbewegung|fankurve|fanpolitik|fanarbeit|fußballfans|football fans)\b|(?:фан-культур|οπαδ)/iu;
  function section(article) {
    if (!article || typeof article !== 'object') return '';
    if (['sport', 'fan-culture'].includes(article.sportSection)) return article.sportSection;
    const text = [article.title, article.primaryTopic, ...(article.categories || []), ...(article.sourceTags || [])].filter(x => typeof x === 'string').join(' ');
    if (FAN.test(text)) return 'fan-culture';
    if (/\b(?:supporters?|fans?)\b/i.test(text) && SPORT.test(text)) return 'fan-culture';
    return SPORT.test(text) ? 'sport' : '';
  }
  function copy(language) {
    const [sport, fanCulture, empty] = labels[language] || labels.en;
    return { sport, fanCulture, empty };
  }
  function originalImage(article, references) {
    const row = (Array.isArray(references) ? references : []).find(r =>
      r.originalUrl === article?.link && r.evidenceUrl === r.originalUrl
      && r.policy === 'remote-original-reference-only' && r.offlineAllowed === false);
    if (!row) return null;
    try {
      const image = new URL(row.imageUrl), original = new URL(row.originalUrl);
      const publisherCdn = original.hostname === 'nunatsiaq.com' && image.hostname === 'cdn.nunatsiaq.com';
      if (image.protocol !== 'https:' || (image.hostname !== original.hostname && !publisherCdn)
          || image.username || image.password || !/\.(?:jpe?g|png|webp)(?:$|\?)/i.test(image.href)) return null;
      return { url: image.href, credit: String(row.credit || '') };
    } catch (_) { return null; }
  }
  function websiteUrl(article, language) {
    const lang = Object.hasOwn(labels, language) ? language : 'en';
    // Only an explicitly linked, public Website reader identity can become a
    // per-article link. New imports fall back to the reachable directory.
    try {
      const url = new URL(article?.websiteUrl || '');
      if (url.origin === 'https://solinaridao.com' && url.pathname === '/'
          && /^news-[a-f0-9]{64}$/.test(url.searchParams.get('article') || '')
          && !url.username && !url.password) {
        return `https://solinaridao.com/?article=${url.searchParams.get('article')}&lang=${lang}#home`;
      }
    } catch (_) { /* An absent reader reference uses the directory. */ }
    return `https://solinaridao.com/?lang=${lang}#discover/${section(article) ? 'sport' : 'news'}`;
  }
  function articleShareText(article, title, attribution, language) {
    return `${title}\n${attribution}\n${article.link}\n\n${websiteUrl(article, language)}\n\n${STORE}`;
  }
  return { section, copy, originalImage, websiteUrl, articleShareText };
});
