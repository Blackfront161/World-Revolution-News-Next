import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { sportSources } from '../packages/browser-content/src/sport-sources-data.ts';

const maxBytes = 2 * 1024 * 1024;

/** Read-only health check; never admits articles, images or rights. */
export async function inspectSportFeed(source, fetcher = fetch) {
  const url = new URL(source.feedUrl);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    !sportSources.some(
      (s) => s.feed === 'observed' && s.id === source.id && s.feedUrl === source.feedUrl,
    )
  )
    throw new Error('Unreviewed feed');
  let reader;
  let dom;
  try {
    const response = await fetcher(url.href, {
      signal: AbortSignal.timeout(15000),
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      headers: { accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml' },
    });
    reader = response.body?.getReader();
    if (!response.ok || !reader || Number(response.headers.get('content-length')) > maxBytes)
      throw new Error('Feed unavailable');
    let count = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > maxBytes) throw new Error('Feed exceeds limit');
      chunks.push(value);
    }
    const xml = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
    if (/<!DOCTYPE|<!ENTITY/iu.test(xml)) throw new Error('Feed DTD not supported');
    dom = new JSDOM(xml, { contentType: 'application/xml' });
    const root = dom.window.document.documentElement;
    const atom = root.localName === 'feed' && root.namespaceURI === 'http://www.w3.org/2005/Atom';
    const rss = root.localName === 'rss' && root.getAttribute('version') === '2.0';
    if (!atom && !rss) throw new Error('Unsupported feed');
    const entries = atom
      ? root.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'entry').length
      : root.getElementsByTagName('item').length;
    if (entries < 1 || entries > 1000) throw new Error('Invalid entry count');
    return {
      sourceId: source.id,
      status: 'available',
      format: atom ? 'Atom' : 'RSS',
      entries,
      bytes: count,
      publicationPerformed: false,
    };
  } catch {
    return { sourceId: source.id, status: 'unavailable', publicationPerformed: false };
  } finally {
    dom?.window.close();
    // Cleanup must not extend the bounded request when a transport stalls on cancel.
    void reader?.cancel().catch(() => {});
    reader?.releaseLock();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await Promise.all(
    sportSources.filter((s) => s.feed === 'observed').map((s) => inspectSportFeed(s)),
  );
  process.stdout.write(`${JSON.stringify({ checkedAt: new Date().toISOString(), results })}\n`);
  if (results.some((r) => r.status !== 'available')) process.exitCode = 1;
}
