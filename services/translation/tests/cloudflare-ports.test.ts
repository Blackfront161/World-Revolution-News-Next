import { describe, expect, it, vi } from 'vitest';
import {
  composeCloudflarePorts,
  createKvCachePort,
  createDurableQuotaPort,
  parseQuotaPolicies,
  quotaDay,
  TranslationQuotaCoordinator,
} from '../src/cloudflare-ports.js';

const policy = {
  requestsPerMinute: 5,
  requestsPerDay: 20,
  utf16PerMinute: 30000,
  utf16PerDay: 120000,
};
const revision = JSON.stringify({ read: policy, provider: policy, write: policy });
const key = `translation:v2:${'a'.repeat(64)}`;

describe('native Cloudflare boundaries', () => {
  it('requires explicit bounded policies for every lane', () => {
    expect(parseQuotaPolicies(revision)).toBeDefined();
    for (const value of [
      undefined,
      '{}',
      JSON.stringify({ read: policy }),
      revision.replace('"requestsPerMinute":5', '"requestsPerMinute":0'),
      revision.replace('"requestsPerMinute":5', '"requestsPerMinute":1001'),
    ])
      expect(parseQuotaPolicies(value)).toBeUndefined();
    expect(
      composeCloudflarePorts({
        TRANSLATION_V2_ENABLED: 'true',
        TRANSLATION_KV: { get: vi.fn(), put: vi.fn() },
      }).TRANSLATION_V2_ENABLED,
    ).toBe('false');
  });

  it('keeps the combined reservation policy below the free SQLite row-write budget', () => {
    const productionRevision = JSON.stringify({
      read: { ...policy, requestsPerDay: 20000 },
      provider: { ...policy, requestsPerDay: 450 },
      write: { ...policy, requestsPerDay: 900 },
    });
    const overBudgetRevision = JSON.stringify({
      read: { ...policy, requestsPerDay: 50000 },
      provider: { ...policy, requestsPerDay: 450 },
      write: { ...policy, requestsPerDay: 900 },
    });
    expect(parseQuotaPolicies(productionRevision)).toBeDefined();
    expect(parseQuotaPolicies(overBudgetRevision)).toBeUndefined();
  });

  it('guards native KV writes against stale runs, invalid keys and unsupported TTL', async () => {
    const kv = { get: vi.fn(async () => null), put: vi.fn(async () => {}) };
    const port = createKvCachePort(kv);
    const signal = new AbortController().signal;
    const guard = { signal, mayCommit: () => false };
    // This boundary rejects before serializing or dispatching an entry.
    await expect(port.put(key, {} as never, 60, guard)).rejects.toThrow();
    await expect(
      port.put(key, {} as never, 59, { ...guard, mayCommit: () => true }),
    ).rejects.toThrow();
    await expect(port.get('raw article text', { signal })).rejects.toThrow();
    expect(kv.put).not.toHaveBeenCalled();
    expect(kv.get).not.toHaveBeenCalled();
    await expect(port.get(key, { signal })).resolves.toBeUndefined();
  });

  it('discards a native KV result arriving after cancellation', async () => {
    const controller = new AbortController();
    const kv = {
      get: vi.fn(async () => {
        controller.abort();
        return '{}';
      }),
      put: vi.fn(),
    };
    await expect(createKvCachePort(kv).get(key, { signal: controller.signal })).rejects.toThrow();
  });

  it('carries policy revision to a single quota actor and rejects rollout skew', async () => {
    const sql = { exec: vi.fn(() => []) };
    const state = { storage: { sql, transactionSync: vi.fn() } };
    const coordinator = new TranslationQuotaCoordinator(state, {
      TRANSLATION_QUOTA_POLICY: revision,
    });
    const idFromName = vi.fn((name) => name);
    const namespace = {
      idFromName,
      get: vi.fn(() => ({ fetch: (request: Request) => coordinator.fetch(request) })),
    };
    const port = createDurableQuotaPort(
      namespace,
      'provider',
      revision.replace('"requestsPerDay":20', '"requestsPerDay":10'),
    );
    expect(
      await port.reserve(
        { requests: 1, utf16CodeUnits: 12 },
        { signal: new AbortController().signal },
      ),
    ).toBe(false);
    expect(idFromName).toHaveBeenCalledWith('wrn-next-translation-global-v1');
    expect(state.storage.transactionSync).not.toHaveBeenCalled();
  });

  it('uses Pacific provider day boundaries including DST, separately from UTC storage quotas', () => {
    expect(quotaDay('provider', Date.parse('2026-07-01T06:59:59Z'))).toBe('2026-06-30');
    expect(quotaDay('provider', Date.parse('2026-07-01T07:00:00Z'))).toBe('2026-07-01');
    expect(quotaDay('provider', Date.parse('2026-01-01T07:59:59Z'))).toBe('2025-12-31');
    expect(quotaDay('provider', Date.parse('2026-01-01T08:00:00Z'))).toBe('2026-01-01');
    expect(quotaDay('read', Date.parse('2026-07-01T06:59:59Z'))).toBe('2026-07-01');
  });
});
