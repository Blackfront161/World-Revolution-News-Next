import { createHash } from 'node:crypto';
import { createShellProtocol } from './protocol.mjs';
import { installWebsiteShellRuntime } from './worker-runtime.mjs';

const normalNamespace = 'wrn.website-shell';
const stagingNamespace = 'wrn.website-staging-shell';
const headerMarker = "        'x-wrn-shell-id': manifest.shellId,";

function replaceExactlyOnce(source, marker, replacement, label) {
  const first = source.indexOf(marker);
  if (first < 0 || source.indexOf(marker, first + marker.length) >= 0)
    throw new Error(`Staging worker ${label} marker changed`);
  return source.slice(0, first) + replacement + source.slice(first + marker.length);
}

const normalProtocolSource = createShellProtocol.toString();
if (!normalProtocolSource.includes(normalNamespace))
  throw new Error('Staging worker protocol namespace marker changed');
const stagingProtocolSource = normalProtocolSource.replaceAll(normalNamespace, stagingNamespace);
const stagingRuntimeSource = replaceExactlyOnce(
  installWebsiteShellRuntime.toString(),
  headerMarker,
  `${headerMarker}\n        ...(expected.path.endsWith('.html') ? (manifest.htmlResponseHeaders ?? {}) : {}),`,
  'HTML header',
);
const stagingRuntimeIdentity = `${stagingProtocolSource}\n${stagingRuntimeSource}`;

export const stagingWorkerProtocolRevision =
  'wrn.website-staging-shell.worker.v1.' +
  createHash('sha256').update(stagingRuntimeIdentity).digest('hex');

export function renderStagingWebsiteShellWorker(manifest) {
  if (!manifest?.stagingOrigin) throw new Error('Staging worker origin is required');
  return (
    '/* generated; deterministic staging-only website shell worker */\n' +
    `if(self.location.origin!==${JSON.stringify(manifest.stagingOrigin)})throw new Error('staging-origin-mismatch');\n` +
    '(' +
    stagingRuntimeSource +
    ')(self,' +
    JSON.stringify(manifest) +
    ',(' +
    stagingProtocolSource +
    ')());\n'
  );
}
