import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const publicDirectory = path.resolve(import.meta.dirname, '../public');
const readPublic = (name) => readFile(path.join(publicDirectory, name), 'utf8');

test('privacy page uses local assets, a closed language catalog, and privacy-safe copy', async () => {
  const [html, css, js] = await Promise.all([
    readPublic('privacy.html'),
    readPublic('privacy.css'),
    readPublic('privacy.js'),
  ]);

  const localReferences = [...html.matchAll(/(?:href|src)="(\/[^"?#]+)"/g)].map(
    ([, reference]) => reference,
  );
  assert.deepEqual(localReferences, ['/privacy.css', '/privacy.js']);
  for (const reference of localReferences)
    await access(path.join(publicDirectory, reference.slice(1)));

  const languageIds = [...js.matchAll(/^ {2}([a-z]{2}): \{$/gm)].map(([, id]) => id);
  assert.deepEqual(languageIds, ['en', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr']);

  const source = `${html}\n${css}\n${js}`;
  assert.doesNotMatch(source, /<script[^>]+(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(source, /(?:src|href|url)\s*\([^)]*https?:\/\//i);
  assert.doesNotMatch(
    source,
    /(?:googletagmanager|google-analytics|plausible|segment|hotjar|matomo)/i,
  );
  assert.doesNotMatch(source, /https?:\/\//i);

  assert.match(js, /Device text-to-speech stays on the device\./);
  assert.match(js, /optional online podcast service/);
  assert.match(js, /It remains disabled unless its reviewed endpoint is configured\./);
});
