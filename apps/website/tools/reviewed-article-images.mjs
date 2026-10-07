export function validateReviewedArticleImages(reviewed, directory, feedImages) {
  const https = (value) => {
    try {
      const u = new URL(value);
      return (
        u.protocol === 'https:' &&
        !u.username &&
        !u.password &&
        !u.hash &&
        !/[\x00-\x20\x7f]/.test(value)
      );
    } catch {
      return false;
    }
  };
  if (
    reviewed.schema !== 'wrn.website-reviewed-article-image-references.v1' ||
    reviewed.dataCommit !== directory.sourceCommit ||
    reviewed.dataCommit !== feedImages.dataCommit ||
    reviewed.feedSha256 !== feedImages.feedSha256 ||
    reviewed.imageBytesHosted !== false ||
    reviewed.imageBytesOffline !== false ||
    !Array.isArray(reviewed.entries) ||
    reviewed.entries.length > 1000 ||
    new Set(reviewed.entries.map((e) => e.articleId)).size !== reviewed.entries.length
  )
    throw Error('Reviewed article image binding differs');
  for (const e of reviewed.entries) {
    const a = directory.articles.find((a) => a.id === e.articleId && !a.historical);
    if (
      !a ||
      e.originalUrl !== a.url ||
      e.originalTitle !== a.title ||
      e.sourceName !== a.sourceName ||
      !https(e.originalUrl) ||
      (e.imageUrl !== null && !https(e.imageUrl)) ||
      typeof e.imageCredit !== 'string' ||
      e.imageCredit.length > 2048 ||
      !['http-html', 'browser-dom'].includes(e.verification) ||
      !Number.isFinite(Date.parse(e.observedAt)) ||
      (e.verification === 'http-html' && !/^[a-f0-9]{64}$/.test(e.sourcePageSha256))
    )
      throw Error('Reviewed article image identity/provenance differs');
  }
  const origins = [
    ...new Set(reviewed.entries.filter((e) => e.imageUrl).map((e) => new URL(e.imageUrl).origin)),
  ].sort();
  if (JSON.stringify(origins) !== JSON.stringify(reviewed.origins))
    throw Error('Reviewed image origins differ');
  return origins;
}
