import { createHash } from 'node:crypto';
import { createShellProtocol } from './protocol.mjs';
import { installWebsiteShellRuntime } from './worker-runtime.mjs';

// Bind the actual canonical protocol AND runtime source, not a manual version label.
const runtimeSource = createShellProtocol.toString() + '\n' + installWebsiteShellRuntime.toString();
export const workerProtocolRevision =
  'wrn.website-shell.worker.v1.2.' + createHash('sha256').update(runtimeSource).digest('hex');

export function renderWebsiteShellWorker(manifest) {
  return (
    '/* generated; deterministic website shell worker */\n' +
    '(' +
    installWebsiteShellRuntime.toString() +
    ')(self,' +
    JSON.stringify(manifest) +
    ',(' +
    createShellProtocol.toString() +
    ')());\n'
  );
}
