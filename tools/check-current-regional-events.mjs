import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';

register('./node-ts-source-loader.mjs', import.meta.url);
const { validateProductionRegionalEventsV1 } =
  await import('../packages/content-contracts/src/directory/production-regional-events-v1.ts');

export const regionalEventsMinimumReviewHours = 48;
const eventsPath = 'packages/browser-content/src/regional-events/events.json';
const pinPath = 'packages/browser-content/src/regional-events/data.ts';

function finiteInstant(value, label) {
  const instant = typeof value === 'number' ? value : Date.parse(String(value));
  if (!Number.isFinite(instant)) throw new Error(`invalid-${label}`);
  return instant;
}

export async function checkCurrentRegionalEvents(options = {}) {
  const root = path.resolve(options.root ?? process.cwd());
  const at = finiteInstant(options.at ?? Date.now(), 'audit-time');
  const minimumHours = Number(options.minimumHours ?? regionalEventsMinimumReviewHours);
  if (!Number.isFinite(minimumHours) || minimumHours < 0 || minimumHours > 168)
    throw new Error('invalid-minimum-hours');
  const [raw, pinSource] = await Promise.all([
    readFile(path.join(root, eventsPath), 'utf8'),
    readFile(path.join(root, pinPath), 'utf8'),
  ]);
  const matches = [...pinSource.matchAll(/regionalInputSha256\s*=\s*\r?\n\s*'([a-f0-9]{64})'/gu)];
  if (matches.length !== 1) throw new Error('regional-hash-pin-missing-or-ambiguous');
  const pinnedSha256 = matches[0][1];
  const actualSha256 = createHash('sha256').update(raw).digest('hex');
  if (actualSha256 !== pinnedSha256) throw new Error('regional-hash-pin-mismatch');
  const catalog = await validateProductionRegionalEventsV1(raw, pinnedSha256);
  if (!catalog) throw new Error('invalid-regional-events-contract');
  const generatedAt = finiteInstant(catalog.generatedAt, 'generated-at');
  const validUntil = finiteInstant(catalog.validUntil, 'valid-until');
  if (at < generatedAt) throw new Error('regional-events-not-yet-current');
  const remainingHours = (validUntil - at) / 3_600_000;
  if (remainingHours <= minimumHours) throw new Error('regional-events-renewal-required');
  return Object.freeze({
    schema: 'wrn.regional-events-freshness-check.v1',
    revision: catalog.revision,
    generatedAt: catalog.generatedAt,
    validUntil: catalog.validUntil,
    checkedAt: new Date(at).toISOString(),
    minimumHours,
    remainingHours: Math.floor(remainingHours * 1000) / 1000,
    events: catalog.events.length,
    sources: catalog.sources.length,
    sha256: actualSha256,
    publicationPerformed: false,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let minimumHours = regionalEventsMinimumReviewHours;
    if (args.length) {
      if (args.length !== 2 || args[0] !== '--minimum-hours')
        throw new Error('usage: check-current-regional-events.mjs [--minimum-hours 0..168]');
      minimumHours = Number(args[1]);
    }
    process.stdout.write(`${JSON.stringify(await checkCurrentRegionalEvents({ minimumHours }))}\n`);
  } catch (error) {
    process.stderr.write(
      `WRN regional events check failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
