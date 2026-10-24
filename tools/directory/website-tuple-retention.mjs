import { createHash } from 'node:crypto';
import { isWebsiteTuplePointer } from '../../packages/content-contracts/src/directory/website-content-tuple-v1.ts';

export const ownershipStartSequence = 202610241355;
export const retentionGraceMs = 7 * 86400000;
export const maximumNoopMs = 6 * 3600000;
export const managedByteLimit = 1024 * 1024 * 1024;
export const managedSnapshotLimit = 256;
const check = (value, reason) => {
  if (!value) throw Error(reason);
};
const digest = (value) => createHash('sha256').update(value).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** MLSD only: never infer file type, size or age from human-readable LIST. */
export function parseManagedListing(bytes, directory = '') {
  check(directory === '' || directory === 'snapshots/', 'tuple-list-path');
  check(bytes.length <= 1048576, 'tuple-list-size');
  const seen = new Set();
  return new TextDecoder('utf-8', { fatal: true })
    .decode(bytes)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const match = /^((?:[A-Za-z0-9.]+=[^;\r\n]*;)+) (.+)$/.exec(line);
      check(match, 'tuple-list-format');
      const name = match[2];
      check(!seen.has(name), 'tuple-list-duplicate');
      seen.add(name);
      const factRows = match[1]
        .slice(0, -1)
        .split(';')
        .map((f) => {
          const i = f.indexOf('=');
          return [f.slice(0, i).toLowerCase(), f.slice(i + 1)];
        });
      check(
        new Set(factRows.map(([key]) => key)).size === factRows.length,
        'tuple-list-duplicate-fact',
      );
      const facts = Object.fromEntries(factRows);
      const size = /^\d+$/.test(facts.size ?? '') ? Number(facts.size) : null;
      const modify = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.\d+)?$/.exec(
        facts.modify ?? '',
      );
      let modifiedAt = modify
        ? Date.parse(
            `${modify[1]}-${modify[2]}-${modify[3]}T${modify[4]}:${modify[5]}:${modify[6]}Z`,
          )
        : NaN;
      if (
        Number.isFinite(modifiedAt) &&
        new Date(modifiedAt).toISOString().replace(/\D/g, '').slice(0, 14) !==
          modify.slice(1, 7).join('')
      )
        modifiedAt = NaN;
      const path = directory + name;
      const ownedName = (
        directory === 'snapshots/'
          ? /^website-(\d{12})-[a-f0-9]{64}\.json$/
          : /^current\.(\d{12})-[a-f0-9]{64}\.(?:rollback\.)?tmp$/
      ).exec(name);
      const sequenceTime = ownedName
        ? Date.parse(
            ownedName[1].replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/, '$1-$2-$3T$4:$5:00Z'),
          )
        : NaN;
      const validSequence =
        Number.isFinite(sequenceTime) &&
        new Date(sequenceTime).toISOString().replace(/\D/g, '').slice(0, 12) === ownedName[1];
      return {
        path,
        size,
        modifiedAt,
        regular: facts.type === 'file',
        sequence: ownedName ? Number(ownedName[1]) : null,
        owned: Boolean(validSequence && Number(ownedName[1]) > ownershipStartSequence),
        snapshot: directory === 'snapshots/',
      };
    });
}

export function retentionPlan(
  entries,
  { current, previous, now, reserveBytes = 0, reserveCount = 0 },
) {
  const protectedPaths = new Set([current.artifactPath, previous?.artifactPath].filter(Boolean));
  const managed = entries.filter((e) => e.owned);
  const eligible = managed.filter(
    (e) =>
      e.regular &&
      Number.isSafeInteger(e.size) &&
      e.size >= 0 &&
      Number.isFinite(e.modifiedAt) &&
      e.modifiedAt <= now - retentionGraceMs &&
      e.sequence < current.sequence &&
      !protectedPaths.has(e.path),
  );
  // One run is bounded even after a long outage. Capacity failure prevents upload.
  const remove = eligible
    .sort((a, b) => a.sequence - b.sequence || a.path.localeCompare(b.path))
    .slice(0, 24);
  const removed = new Set(remove.map((e) => e.path));
  const remaining = managed.filter((e) => !removed.has(e.path));
  check(
    remaining.every((e) => e.regular && Number.isSafeInteger(e.size) && e.size >= 0),
    'tuple-retention-unclassifiable-owned-entry',
  );
  const bytes = remaining.reduce((n, e) => n + e.size, 0) + reserveBytes;
  const snapshots = remaining.filter((e) => e.snapshot).length + reserveCount;
  check(
    bytes <= managedByteLimit && snapshots <= managedSnapshotLimit && remaining.length <= 768,
    'tuple-retention-capacity',
  );
  return { remove: remove.map((e) => e.path), bytes, snapshots };
}

/** Ignore only observation bookkeeping; titles, IDs, rights, dates, images and selection remain. */
export function semanticTupleHash(tuple, codeCommit) {
  check(/^[a-f0-9]{40}$/.test(codeCommit), 'tuple-code-pin');
  const copy = structuredClone(tuple);
  delete copy.sequence;
  delete copy.observedAt;
  delete copy.report;
  delete copy.source.dataCommit;
  delete copy.directory.sourceCommit;
  delete copy.directory.observedAt;
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.provenance && ['app', 'github'].includes(value.provenance.dataset)) {
      delete value.provenance.observedAt;
      if (value.provenance.dataset === 'github') delete value.provenance.commit;
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(copy.directory);
  delete copy.home.directoryCommit;
  delete copy.images.dataCommit;
  for (const key of ['directorySha256', 'sequence', 'commit', 'observedAt'])
    delete copy.summary[key];
  return digest(JSON.stringify({ codeCommit, tuple: copy }));
}

export function readAutomationState(bytes, current) {
  if (bytes === null) {
    check(current.sequence <= ownershipStartSequence, 'tuple-state-seed-required');
    return {
      schema: 'wrn.website-news-auto-state.v1',
      ownershipStartSequence,
      active: current,
      previous: null,
      codeCommit: null,
      pending: null,
    };
  }
  check(bytes.length <= 32768, 'tuple-state-size');
  const state = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  const code = (x) => x === null || /^[a-f0-9]{40}$/.test(x);
  check(
    state.schema === 'wrn.website-news-auto-state.v1' &&
      state.ownershipStartSequence === ownershipStartSequence &&
      isWebsiteTuplePointer(state.active) &&
      (state.previous === null || isWebsiteTuplePointer(state.previous)) &&
      code(state.codeCommit) &&
      (state.pending === null ||
        (isWebsiteTuplePointer(state.pending.pointer) && code(state.pending.codeCommit))),
    'tuple-state-contract',
  );
  check(
    state.previous === null || state.previous.sequence < state.active.sequence,
    'tuple-state-order',
  );
  check(
    state.pending === null ||
      (state.pending.pointer.sequence > state.active.sequence && state.pending.codeCommit !== null),
    'tuple-state-pending-order',
  );
  if (state.pending && same(current, state.pending.pointer)) {
    check(current.sequence > state.active.sequence, 'tuple-state-order');
    return {
      ...state,
      previous: state.active,
      active: current,
      codeCommit: state.pending.codeCommit,
      pending: null,
    };
  }
  check(same(current, state.active), 'tuple-state-concurrent-writer');
  return { ...state, pending: null };
}

export async function guardedPrune({ plan, transport, expectedBytes, fetchCurrentBytes }) {
  const unchanged = async () =>
    check(
      Buffer.from(await fetchCurrentBytes()).equals(Buffer.from(expectedBytes)),
      'tuple-retention-concurrent-writer',
    );
  for (const path of plan.remove) {
    await unchanged();
    await transport.removeManaged(path);
  }
  await unchanged();
  return plan.remove.length;
}
