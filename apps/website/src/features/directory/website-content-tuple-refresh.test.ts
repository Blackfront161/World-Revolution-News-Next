import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type {
  WebsiteContentTupleV1,
  WebsiteContentTuplePointerV1,
} from '../../../../../packages/content-contracts/src/directory/website-content-tuple-v1';
import {
  loadWebsiteContentTuple,
  observedWebsiteTupleWithdrawals,
} from '../../../../../packages/browser-content/src/website-content-tuple-refresh';
import type { StoredWebsiteTuple } from '../../../../../packages/browser-content/src/website-content-tuple-store';
import { selectAppHomeArticles } from '../home/app-home-selection';
import { appArticleImage } from '../home/app-article-images';
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  save: vi.fn(),
  safety: vi.fn(),
  rollback: vi.fn(),
}));
vi.mock('../../../../../packages/browser-content/src/website-content-tuple-store', () => ({
  readWebsiteTupleStore: mocks.read,
  saveWebsiteTupleStore: mocks.save,
  saveWebsiteTupleRestrictions: mocks.safety,
  rollbackWebsiteTupleStore: mocks.rollback,
}));
type Packet = {
  tuple: WebsiteContentTupleV1;
  pointer: WebsiteContentTuplePointerV1;
  bytes: Uint8Array;
};
const raw = JSON.parse(
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import {websiteTupleFixture} from './tools/directory/website-tuple-test-fixture.mjs';import {prepareWebsiteContentTuple} from './tools/directory/prepare-website-content-tuple.mjs';const a=await prepareWebsiteContentTuple(websiteTupleFixture()),b=await prepareWebsiteContentTuple(websiteTupleFixture({revision:2}));const endpoint=a.tuple.directory.articles.find(x=>x.id===a.tuple.home.lead).endpointIds[0];const heldInput=websiteTupleFixture({revision:1,mutate:(_rows,_registry,revoke)=>revoke.endpointIds.push(endpoint)});heldInput.binding.commit='2'.repeat(40);heldInput.sequence=102;const held=await prepareWebsiteContentTuple(heldInput);console.log(JSON.stringify({packets:[a,b,held].map(p=>({tuple:p.tuple,pointer:p.pointer})),endpoint}));`,
    ],
    { cwd: resolve(process.cwd(), '../..'), maxBuffer: 8 * 1024 * 1024 },
  ).toString(),
);
const packets: Packet[] = raw.packets.map((p: Omit<Packet, 'bytes'>) => ({
  ...p,
  bytes: new TextEncoder().encode(JSON.stringify(p.tuple) + '\n'),
}));
let old: Packet,
  next: Packet,
  state: {
    active: StoredWebsiteTuple;
    previous: StoredWebsiteTuple | null;
    restrictions: { articleIds: string[]; endpointIds: string[] };
  };
beforeEach(async () => {
  vi.stubGlobal('crypto', webcrypto);
  old = packets[0]!;
  next = packets[1]!;
  state = {
    active: { pointer: old.pointer, bytes: old.bytes },
    previous: null,
    restrictions: { articleIds: [], endpointIds: [] },
  };
  mocks.safety
    .mockReset()
    .mockImplementation(async (restrictions: { articleIds: string[]; endpointIds: string[] }) => {
      state = { ...state, restrictions };
    });
  mocks.read.mockReset().mockImplementation(async () => state);
  mocks.save.mockReset().mockImplementation(async (entry: StoredWebsiteTuple) => {
    if (state.active.pointer.artifactSha256 === entry.pointer.artifactSha256) return null;
    state = { ...state, active: entry, previous: state.active };
    return {
      sha256: entry.pointer.artifactSha256,
      activationId: '11111111-1111-1111-1111-111111111111',
    };
  });
  mocks.rollback.mockReset().mockImplementation(async () => {
    if (state.previous) state = { ...state, active: state.previous, previous: null };
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const options = () => ({
  minimumSequence: 100,
  allowedImageOrigins: ['https://images.example'],
  now: Date.parse(next.tuple.observedAt),
  online: true,
});
function remote(pointer = next.pointer, bytes = next.bytes) {
  return vi.fn(
    async (url: URL | RequestInfo) =>
      new Response(
        String(url).endsWith('current.json') ? JSON.stringify(pointer) : Uint8Array.from(bytes),
        { headers: { 'content-type': 'application/json' } },
      ),
  );
}
it('activates complete new identities and supplies matching Home/image registers', async () => {
  const result = await loadWebsiteContentTuple({ ...options(), fetchImpl: remote() });
  expect(result?.source).toBe('remote');
  expect(result?.tuple.source.dataCommit).toBe(next.tuple.source.dataCommit);
  const tuple = result!.tuple,
    data = {
      document: tuple.directory,
      projection: tuple.directory,
      home: tuple.home,
      images: tuple.images,
    };
  const selected = selectAppHomeArticles(data, tuple.directory.articles);
  expect(selected.lead?.id).toBe(tuple.home.lead);
  expect(
    appArticleImage(selected.lead!, tuple.source.dataCommit, tuple.images)?.imageUrl,
  ).toContain('revision-2');
});
it('incomplete or hash-mismatched snapshots preserve all previous parts', async () => {
  const result = await loadWebsiteContentTuple({
    ...options(),
    fetchImpl: remote(next.pointer, new TextEncoder().encode('{}')),
  });
  expect(result?.source).toBe('saved');
  expect(result?.tuple.home.lead).toBe(old.tuple.home.lead);
  expect(mocks.save).not.toHaveBeenCalled();
});
it('quota and readback errors retain the old release; readback errors restore its activation', async () => {
  mocks.save.mockRejectedValueOnce(new DOMException('quota', 'QuotaExceededError'));
  expect(
    (await loadWebsiteContentTuple({ ...options(), fetchImpl: remote() }))?.tuple.home.lead,
  ).toBe(old.tuple.home.lead);
  mocks.read.mockResolvedValueOnce(state).mockRejectedValueOnce(Error('readback unavailable'));
  expect(
    (await loadWebsiteContentTuple({ ...options(), fetchImpl: remote() }))?.tuple.home.lead,
  ).toBe(old.tuple.home.lead);
  expect(mocks.rollback).toHaveBeenCalledWith(
    expect.objectContaining({ sha256: next.pointer.artifactSha256 }),
  );
});
it('offline and stale or lower sequence never replace a saved complete release', async () => {
  const fetchImpl = remote();
  expect((await loadWebsiteContentTuple({ ...options(), online: false, fetchImpl }))?.source).toBe(
    'saved',
  );
  expect(fetchImpl).not.toHaveBeenCalled();
  expect(
    (
      await loadWebsiteContentTuple({
        ...options(),
        now: Date.parse(next.tuple.observedAt) + 86400001,
        fetchImpl: remote(),
      })
    )?.tuple.sequence,
  ).toBe(old.tuple.sequence);
  expect(
    (
      await loadWebsiteContentTuple({
        ...options(),
        fetchImpl: remote({
          ...old.pointer,
          sequence: 99,
          artifactPath: `snapshots/website-99-${old.pointer.artifactSha256}.json`,
        }),
      })
    )?.tuple.sequence,
  ).toBe(old.tuple.sequence);
});
it('restrictive verified withdrawals remain observable even if activation cannot be stored', async () => {
  next = packets[2]!;
  expect(next.tuple.directory.sources.some((s) => s.id === raw.endpoint)).toBe(false);
  mocks.save.mockRejectedValueOnce(Error('quota'));
  await loadWebsiteContentTuple({ ...options(), fetchImpl: remote() });
  expect(observedWebsiteTupleWithdrawals().endpointIds).toContain(raw.endpoint);
  expect(state.restrictions.endpointIds).toContain(raw.endpoint);
  expect(state.restrictions.articleIds).toContain(old.tuple.home.lead);
});

it('a no-op refresh cannot roll back an already active release after readback failure', async () => {
  state = {
    ...state,
    active: { pointer: next.pointer, bytes: next.bytes },
    previous: { pointer: old.pointer, bytes: old.bytes },
  };
  mocks.read.mockResolvedValueOnce(state).mockRejectedValueOnce(Error('readback unavailable'));
  expect(
    (await loadWebsiteContentTuple({ ...options(), fetchImpl: remote() }))?.tuple.sequence,
  ).toBe(next.tuple.sequence);
  expect(state.active.pointer.sequence).toBe(next.tuple.sequence);
  expect(mocks.rollback).not.toHaveBeenCalled();
});
