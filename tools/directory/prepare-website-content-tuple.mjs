import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildWebsiteContentProjection,
  websiteProjectionSummary,
  projectionBytes,
  projectionHash,
} from './website-content-projection.mjs';
import { prepareWebsiteAppHome } from './prepare-website-app-home.mjs';
import { prepareWebsiteAppImages } from './prepare-website-app-images.mjs';
import {
  websiteTupleSchema,
  websiteTuplePointerSchema,
  websiteTupleMaxBytes,
  validateWebsiteContentTuple,
} from '../../packages/content-contracts/src/directory/website-content-tuple-v1.ts';
export async function prepareWebsiteContentTuple({
  baseline,
  feedBytes,
  statusBytes,
  sourceBytes,
  sourcePassBytes,
  revocationBytes,
  binding,
  sequence,
  allowedImageOrigins,
}) {
  const projection = await buildWebsiteContentProjection({
    baseline,
    feedBytes,
    statusBytes,
    sourceBytes,
    sourcePassBytes,
    revocationBytes,
    binding,
    sequence,
  });
  const { document, report } = projection;
  const home = await prepareWebsiteAppHome({ feedBytes, directory: document });
  const images = prepareWebsiteAppImages({
    feedBytes,
    directory: document,
    appCommit: home.appFreeze,
    handoffSha256: home.handoffSha256,
  });
  images.entries = images.entries.filter((entry) => {
    if (allowedImageOrigins.includes(new URL(entry.imageUrl).origin)) return true;
    images.excluded.push({ row: entry.sourceRow, reason: 'origin-not-admitted-by-host-shell' });
    return false;
  });
  images.origins = [...new Set(images.entries.map((e) => new URL(e.imageUrl).origin))].sort();
  const source = {
    appCommit: home.appFreeze,
    handoffSha256: home.handoffSha256,
    selectorSha256: home.selectorSha256,
    dataCommit: binding.commit,
    feedSha256: binding.hashes.feed,
    statusSha256: binding.hashes.status,
    registrySha256: binding.hashes.registry,
    sourcePassSha256: binding.hashes.sourcePass,
    revocationsSha256: binding.hashes.revocations,
  };
  const tuple = {
    schema: websiteTupleSchema,
    sequence,
    observedAt: document.observedAt,
    source,
    directory: document,
    summary: websiteProjectionSummary(report),
    home,
    images,
    report,
  };
  const bytes = projectionBytes(tuple);
  if (
    bytes.length > websiteTupleMaxBytes ||
    !(await validateWebsiteContentTuple(tuple, { allowedImageOrigins }))
  )
    throw Error('Website tuple validation failed');
  const artifactSha256 = projectionHash(bytes),
    pointer = {
      schema: websiteTuplePointerSchema,
      sequence,
      observedAt: tuple.observedAt,
      artifactPath: `snapshots/website-${sequence}-${artifactSha256}.json`,
      artifactSha256,
      artifactBytes: bytes.length,
      source,
    };
  return { tuple, bytes, pointer, pointerBytes: projectionBytes(pointer) };
}
export async function writePreparedWebsiteTuple(prepared, output) {
  await fs.mkdir(output); // Exclusive release directory, never replace a frozen packet.
  await fs.mkdir(path.join(output, 'snapshots'));
  await fs.writeFile(path.join(output, prepared.pointer.artifactPath), prepared.bytes, {
    flag: 'wx',
  });
  await fs.writeFile(path.join(output, 'current.json'), prepared.pointerBytes, { flag: 'wx' });
  await fs.writeFile(
    path.join(output, 'READY.json'),
    projectionBytes({
      schema: 'wrn.website-content-tuple-ready.v1',
      artifactSha256: prepared.pointer.artifactSha256,
      artifactBytes: prepared.bytes.length,
      sequence: prepared.pointer.sequence,
      publicationPerformed: false,
    }),
    { flag: 'wx' },
  );
}
const option = (name) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const input = option('--input'),
    output = option('--output');
  if (!input || !output)
    throw Error('Usage: --input bounded-input-directory --output exclusive-packet-directory');
  const read = async (name) => {
    const file = path.join(input, name),
      stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024)
      throw Error('Invalid bounded input');
    return fs.readFile(file);
  };
  const [
    baseline,
    feedBytes,
    statusBytes,
    sourceBytes,
    sourcePassBytes,
    revocationBytes,
    binding,
    origins,
  ] = await Promise.all(
    [
      'baseline.json',
      'news-feed.json',
      'feed-status.json',
      'sources-registry.json',
      'source-passes.json',
      'revocations.json',
      'binding.json',
      'allowed-image-origins.json',
    ].map(read),
  );
  const prepared = await prepareWebsiteContentTuple({
    baseline: JSON.parse(baseline),
    feedBytes,
    statusBytes,
    sourceBytes,
    sourcePassBytes,
    revocationBytes,
    binding: JSON.parse(binding),
    sequence: Number(option('--sequence')),
    allowedImageOrigins: JSON.parse(origins),
  });
  await writePreparedWebsiteTuple(prepared, output);
  console.log(
    JSON.stringify({
      state: 'prepared',
      sequence: prepared.pointer.sequence,
      artifactSha256: prepared.pointer.artifactSha256,
      bytes: prepared.bytes.length,
    }),
  );
}
