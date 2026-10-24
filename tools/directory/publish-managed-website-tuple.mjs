import { execFileSync } from 'node:child_process';
import {
  isWebsiteTuplePointer,
  websiteTupleMaxBytes,
} from '../../packages/content-contracts/src/directory/website-content-tuple-v1.ts';
import { projectionHash } from './website-content-projection.mjs';
import {
  publishPreparedWebsiteTuple,
  readPublicWebsiteTuplePointerBytes,
  websiteTuplePublicBase,
} from './publish-website-content-tuple.mjs';
import {
  parseManagedListing,
  retentionPlan,
  readAutomationState,
  guardedPrune,
  semanticTupleHash,
  maximumNoopMs,
} from './website-tuple-retention.mjs';
const check = (value, reason) => {
  if (!value) throw Error(reason);
};
const stateBytes = (state) => Buffer.from(JSON.stringify(state) + '\n');
export async function publishManagedWebsiteTuple({
  prepared,
  transport,
  fetchPublic = fetch,
  fetchCurrentBytes = () => readPublicWebsiteTuplePointerBytes(fetchPublic),
  codeCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  now = Date.now(),
}) {
  check(/^[a-f0-9]{40}$/.test(codeCommit), 'tuple-code-pin');
  let expectedBytes = await fetchCurrentBytes();
  const current = JSON.parse(Buffer.from(expectedBytes).toString('utf8'));
  check(isWebsiteTuplePointer(current), 'tuple-current-contract');
  const state = readAutomationState(await transport.readAutomationState(), current);
  const unchanged = async () =>
    check(
      Buffer.from(await fetchCurrentBytes()).equals(Buffer.from(expectedBytes)),
      'tuple-managed-concurrent-writer',
    );
  const saveState = async (next) => {
    await unchanged();
    await transport.writeAutomationState(stateBytes(next));
    await unchanged();
  };
  const entries = [
    ...parseManagedListing(await transport.listManaged('')),
    ...parseManagedListing(await transport.listManaged('snapshots/'), 'snapshots/'),
  ];
  check(
    entries
      .filter((e) => /^\.wrn-news-auto-state-v1\.(json|tmp)$/.test(e.path))
      .every((e) => e.regular && Number.isSafeInteger(e.size) && e.size <= 32768),
    'tuple-state-nonregular-entry',
  );
  let noop = false;
  if (
    state.codeCommit === codeCommit &&
    now - Date.parse(current.observedAt) >= 0 &&
    now - Date.parse(current.observedAt) < maximumNoopMs
  ) {
    try {
      const response = await fetchPublic(new URL(current.artifactPath, websiteTuplePublicBase), {
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      });
      check(
        response.status === 200 && !response.redirected && response.body,
        'tuple-noop-response',
      );
      let length = 0;
      const chunks = [];
      for await (const chunk of response.body) {
        length += chunk.length;
        check(length <= websiteTupleMaxBytes, 'tuple-noop-size');
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks);
      check(
        bytes.length === current.artifactBytes && projectionHash(bytes) === current.artifactSha256,
        'tuple-noop-binding',
      );
      const old = JSON.parse(bytes);
      noop =
        semanticTupleHash(old, codeCommit) ===
        semanticTupleHash(JSON.parse(prepared.snapshotBytes), codeCommit);
    } catch {
      /* An unverifiable previous snapshot never justifies skipping a publication. */
    }
  }
  const target = entries.find((e) => e.path === prepared.manifest.artifactPath);
  check(noop || !target, 'tuple-managed-snapshot-already-exists');
  check(noop || prepared.manifest.sequence > current.sequence, 'tuple-rollback-or-conflict');
  const plan = retentionPlan(entries, {
    current,
    previous: state.previous,
    now,
    reserveBytes: noop ? 0 : prepared.snapshotBytes.length + prepared.pointerBytes.length * 2,
    reserveCount: noop ? 0 : 1,
  });
  const pruned = await guardedPrune({ plan, transport, expectedBytes, fetchCurrentBytes });
  await saveState(state);
  if (noop) return { state: 'unchanged', sequence: current.sequence, pruned };
  await saveState({ ...state, pending: { pointer: prepared.manifest, codeCommit } });
  const outcome = await publishPreparedWebsiteTuple({
    prepared,
    transport,
    fetchCurrentBytes,
    fetchPublic,
  });
  // Activation has been confirmed. Later housekeeping must never report a rollback.
  expectedBytes = prepared.pointerBytes;
  try {
    await saveState({
      ...state,
      active: prepared.manifest,
      previous: current,
      codeCommit,
      pending: null,
    });
    const rollback = `current.${prepared.manifest.sequence}-${prepared.manifest.artifactSha256}.rollback.tmp`;
    await guardedPrune({
      plan: { remove: [rollback] },
      transport,
      expectedBytes,
      fetchCurrentBytes,
    });
    return { ...outcome, pruned, cleanup: 'complete' };
  } catch {
    return { ...outcome, pruned, cleanup: 'failed-after-confirmed-publication' };
  }
}
