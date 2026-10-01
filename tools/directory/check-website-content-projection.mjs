import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  verifyWebsiteProjection,
  projectionHash,
  projectionBytes,
  websiteProjectionSummary,
} from './website-content-projection.mjs';
export async function checkWebsiteContentProjection(
  root = resolve(import.meta.dirname, '../..'),
  now = Date.now(),
) {
  const base = resolve(root, 'apps/website/src/features/projection/data');
  const [directoryBytes, reportBytes, lockBytes, pointerBytes] = await Promise.all([
    readFile(resolve(base, 'content-directory-v1.json')),
    readFile(resolve(base, 'report.json')),
    readFile(resolve(base, 'lock.json')),
    readFile(resolve(base, 'pointer.json')),
  ]);
  const result = await verifyWebsiteProjection({
    directoryBytes,
    reportBytes,
    lock: JSON.parse(lockBytes),
    pointer: JSON.parse(pointerBytes),
    now,
  });
  const lock = JSON.parse(lockBytes);
  for (const [name, file] of Object.entries({
    sourcePass: 'apps/website/public/wrn-source-passes/current.json',
    revocations: 'apps/website/public/wrn-source-pass-revocations/current.json',
  })) {
    if (projectionHash(await readFile(resolve(root, file))) !== lock.upstream.hashes[name])
      throw Error('website-projection:review-input-drift');
  }
  if (
    !projectionBytes(websiteProjectionSummary(JSON.parse(reportBytes))).equals(
      await readFile(resolve(base, 'summary.json')),
    )
  )
    throw Error('website-projection:summary-drift');
  return { ...result, reportSha256: lock.reportSha256, upstreamCommit: lock.upstream.commit };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await checkWebsiteContentProjection()));
