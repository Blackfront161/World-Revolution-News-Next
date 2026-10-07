import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import links from './data/radio-original-links-v1.json';
import { radioCatalogueRows, radioOriginalStream } from './radio-original-links';

describe('source-bound radio original links', () => {
  it('adds the dated 3CR original without duplicate identity or original URL', () => {
    const row = radioCatalogueRows([])[0]!;
    expect(row.id).toBe(
      'app-' +
        createHash('sha256')
          .update('radio:' + row.url)
          .digest('hex'),
    );
    expect(radioCatalogueRows([row])).toEqual([row]);
    expect(radioCatalogueRows([{ ...row, id: 'already-known-identity' }])).toHaveLength(1);
    expect(links.rights).toBe('original-link-only-no-redistribution-no-offline-audio');
  });

  it('offers the official stream only for the bound station ID and original URL', () => {
    const row = radioCatalogueRows([])[0]!;
    expect(radioOriginalStream(row)).toBe(links.records[0]!.streamUrl);
    expect(radioOriginalStream({ ...row, id: 'different-station' })).toBeNull();
    expect(radioOriginalStream({ ...row, url: 'https://example.org/' })).toBeNull();
    expect(links.records[0]!.evidenceUrl).toBe('https://www.3cr.org.au/streaming');
  });
});
