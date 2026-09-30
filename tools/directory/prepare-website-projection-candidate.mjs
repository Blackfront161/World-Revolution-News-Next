import { readFile, readdir, mkdir, writeFile, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkWebsiteContentProjection } from './check-website-content-projection.mjs';
import { projectionBytes, projectionHash } from './website-content-projection.mjs';
import { writePreparedDirectoryRefresh } from './prepare-content-directory-refresh.mjs';
import {
  prepareProductionWebsitePackage,
  verifyProductionWebsitePackage,
} from '../../apps/website/tools/production-site-package.mjs';
import {
  prepareProductionHostingPacket,
  verifyProductionHostingPacket,
} from '../prepare-production-hosting-packet.mjs';

async function confined(root, target) {
  const rel = relative(root, target);
  if (!rel || isAbsolute(rel) || rel.split(sep).includes('..'))
    throw Error('candidate-outside-workspace');
  // Reject links/junctions before delegating to the existing bounded packagers.
  let cursor = root;
  for (const segment of rel.split(sep)) {
    cursor = resolve(cursor, segment);
    try {
      if ((await lstat(cursor)).isSymbolicLink()) throw Error('candidate-linked-path');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

/** Local preparation only. READY is written last after both unchanged release validators. */
export async function prepareWebsiteProjectionCandidate({
  trustedWorkspaceRoot,
  buildDirectory,
  outputDirectory,
  sourceCommit,
  generatedAtUTC,
  previousRevocationsFile,
  now = Date.now(),
}) {
  if (
    ![trustedWorkspaceRoot, buildDirectory, outputDirectory, previousRevocationsFile].every(
      isAbsolute,
    )
  )
    throw Error('absolute-candidate-paths-required');
  const root = await realpath(trustedWorkspaceRoot);
  const build = resolve(buildDirectory),
    output = resolve(outputDirectory);
  await confined(root, build);
  await confined(root, output);
  await confined(root, resolve(previousRevocationsFile));
  const projection = await checkWebsiteContentProjection(root, now);
  const data = resolve(root, 'apps/website/src/features/projection/data');
  const directoryBytes = await readFile(resolve(data, 'content-directory-v1.json'));
  const report = JSON.parse(
    await readFile(
      resolve(root, 'docs/evidence/WRN-WEBSITE-CONTENT-PARITY-2026-10-01/parity-report.json'),
    ),
  );
  const current = JSON.parse(await readFile(resolve(build, 'wrn-production-content/current.json')));
  const fulltexts = JSON.parse(
    await readFile(
      resolve(build, 'wrn-production-content', current.releaseRevision, 'articles.json'),
    ),
  ).articles;
  const sourceProfiles = new Set(fulltexts.map((article) => article.source.id));
  const admissionClasses = {
    individuallyAdmittedFulltext: {
      articles: fulltexts.length,
      sourceProfiles: sourceProfiles.size,
      revision: current.releaseRevision,
      corpus: 'existing-separate-production-admission',
    },
    newFulltextOrMedia: { articles: 0, sourceEndpoints: 0 },
    metadataLinkOnly: {
      articles: projection.counts.metadataLinkOnly,
      sourceEndpoints: projection.counts.metadataOnlySources,
      withoutConfirmedSourcePass: report.articles.filter(
        (d) => d.status !== 'excluded' && d.sourcePassStatus === 'pending-unverified',
      ).length,
      editorialVerification: false,
      reuseRightsGranted: false,
    },
    directoryOnly: { articles: 0, sourceEndpoints: projection.counts.directoryOnlySources },
    excluded: {
      articles: projection.counts.excluded,
      sourceEndpoints: projection.counts.excludedSources,
      reasons: report.articles.reduce((reasons, d) => {
        if (d.reason) reasons[d.reason] = (reasons[d.reason] ?? 0) + 1;
        return reasons;
      }, {}),
    },
    upstream: {
      articles: projection.counts.feed,
      sourceEndpoints: projection.counts.registry,
      recordedFeedSourceNames: projection.counts.feedSources,
    },
  };
  const recordedClasses = JSON.parse(
    await readFile(
      resolve(root, 'docs/evidence/WRN-WEBSITE-CONTENT-PARITY-2026-10-01/admission-classes.json'),
    ),
  );
  if (JSON.stringify(admissionClasses) !== JSON.stringify(recordedClasses.classes))
    throw Error('candidate-classification-mismatch');
  const assets = await readdir(resolve(build, 'assets'));
  const directoryAssets = assets.filter((name) => /^content-directory-v1-.*\.json$/.test(name));
  if (
    directoryAssets.length !== 1 ||
    !(await readFile(resolve(build, 'assets', directoryAssets[0]))).equals(directoryBytes)
  )
    throw Error('candidate-build-projection-mismatch');
  if (!/^[a-f0-9]{40}$/.test(sourceCommit ?? '') || !Number.isFinite(Date.parse(generatedAtUTC)))
    throw Error('candidate-identity');
  await realpath(dirname(output));
  // mkdir is exclusive: preserve every previous candidate and all foreign files.
  await mkdir(output);
  await writePreparedDirectoryRefresh({
    document: JSON.parse(directoryBytes),
    sequence: projection.sequence,
    output: resolve(output, 'directory'),
  });
  const website = await prepareProductionWebsitePackage({
    trustedWorkspaceRoot: root,
    buildDirectory: build,
    outputDirectory: resolve(output, 'website'),
    sourceCommit,
    generatedAtUTC,
    previousRevocationsFile,
  });
  const hosting = await prepareProductionHostingPacket({
    trustedWorkspaceRoot: root,
    websiteDirectory: website.outputDirectory,
    directoryRefreshDirectory: resolve(output, 'directory'),
    outputDirectory: resolve(output, 'hosting'),
  });
  await verifyProductionWebsitePackage({
    directory: website.outputDirectory,
    trustedWorkspaceRoot: root,
  });
  await verifyProductionHostingPacket({
    directory: hosting.outputDirectory,
    trustedWorkspaceRoot: root,
  });
  const receipt = {
    schema: 'wrn.website-projection-candidate.v1',
    status: 'LOCAL-PASS',
    publicationPerformed: false,
    sourceCommit,
    generatedAtUTC,
    projection,
    admissionClasses,
    publicationStatus: {
      liveDeviationResolved: false,
      directoryParity: 'bound-local-snapshot-only',
      directoryProjectionPublication: 'pending',
      websitePublication: 'pending',
      liveVerification: 'not-performed',
    },
    shellId: website.shellId,
    websiteFiles: website.files,
    hostingFiles: hosting.files,
    websiteManifestSha256: projectionHash(await readFile(website.manifestPath)),
    hostingManifestSha256: projectionHash(await readFile(hosting.manifestPath)),
    previousRevocationsSha256: projectionHash(await readFile(previousRevocationsFile)),
    previousRevocationsReceipt:
      'local-input-only; last-delivered-host-receipt-required-before-rollout',
    externalGates: [
      'independent-controller-review',
      'source-and-item-rights-for-body-media',
      'last-delivered-revocations-receipt',
      'live-Apache-CSP-CORS-and-two-pointer-rollback',
      'explicit-deployment-authorization',
    ],
  };
  await writeFile(resolve(output, 'READY.json'), projectionBytes(receipt), { flag: 'wx' });
  return receipt;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [config] = process.argv.slice(2);
  if (!config) throw Error('usage: new-local-candidate-config.json');
  console.log(
    JSON.stringify(await prepareWebsiteProjectionCandidate(JSON.parse(await readFile(config)))),
  );
}
