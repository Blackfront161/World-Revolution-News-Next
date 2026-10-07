function newsCardTeaser(article, translation = null, language = state.language) {
    const source = translation
      ? translation.intro || translation.content
      : article?.content || article?.intro;
    return cardCopy.completeFirstSentence(source, language);
  }
function isSportArticle(article) {
    const sportWords = /\b(sport|football|fußball|fussball|futbol|soccer|basketball|cycling|radsport|ultras?|fankultur|fan culture)\b/i;
    return sportWords.test([article.primaryTopic, ...(article.categories || []), article.title].join(' '));
  }
function homeSportArticles(excludedIds, articles = state.articles) {
    return core.balanceBySource(articles.filter(article =>
      !excludedIds.has(article.id)
      && core.isLeadEligible(article)
      && isSportArticle(article)
    ), 3, 1);
  }
  function selectHome() {
    viewRoot.dataset.view = 'home';
    state.cardArticles = [];
    const quickArticles = state.articles.filter(article => state.quickArticleIds.has(article.id));
    const balanced = core.balanceEditorially(quickArticles, HOME_COUNT + 12, {
      maxPerFamily: 2,
      poolSize: 90
    });
    const hero = balanced.find(article => core.isLeadEligible(article) && article.image)
      || balanced.find(core.isLeadEligible)
      || quickArticles.find(core.isLeadEligible);
    if (!hero) return renderError();
    const sportStories = homeSportArticles(new Set([hero.id]), quickArticles);
    const sportIds = new Set(sportStories.map(article => article.id));
    const candidates = balanced.filter(article =>
      article.id !== hero.id
      && !sportIds.has(article.id)
      && core.isLeadEligible(article)
      && newsCardTeaser(article)
    );
    const pictured = candidates.filter(article => article.image);
    const topStories = [...pictured, ...candidates.filter(article => !article.image)].slice(0, 5);
    const topIds = new Set([hero.id, ...topStories.map(article => article.id)]);
    const occupiedIds = new Set([...topIds, ...sportStories.map(article => article.id)]);
    const moreStories = balanced.filter(article => !occupiedIds.has(article.id)).slice(0, HOME_COUNT - 1);
    const homeGroups = personalizedHomeGroups(moreStories, [...occupiedIds]);
    const selected = [hero, ...topStories, ...moreStories];
    const visibleIds = new Set([...selected, ...sportStories].map(article => article.id));
    const briefingSeen = new Set();
    const briefingItems = quickArticles
      .filter(article => {
        if (!core.isLeadEligible(article) || visibleIds.has(article.id) || briefingSeen.has(article.id)) return false;
        briefingSeen.add(article.id);
        return true;
      })
      .slice(0, 5);

 return {lead:[hero],top:topStories,sport:sportStories,more:moreStories,briefing:briefingItems};
}