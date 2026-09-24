import { describe, expect, it } from 'vitest';

import type { PodcastQuotaReservation } from '../src/contracts.js';
import { PodcastQuotaDurableObject } from '../src/quota-do.js';

type Reservation = {
  operation_id: string;
  lease_key: string | null;
  month_key: string;
  characters: number;
  reserved_storage_bytes: number;
  actual_storage_bytes: number;
  state:
    'reserved' | 'dispatching' | 'committing' | 'stored' | 'orphaned' | 'ambiguous' | 'deleting';
  lease_expires_at: number;
  deletion_bytes: number;
};

class MemorySql {
  budget = { month: '', characters: 0, storage: 0 };
  schema = '';
  readonly reservations = new Map<string, Reservation>();
  readonly releases = new Map<string, { leaseKey: string; actualBytes: number }>();

  transactionSync<T>(callback: () => T): T {
    const budget = { ...this.budget };
    const reservations = new Map([...this.reservations].map(([key, value]) => [key, { ...value }]));
    const releases = new Map(this.releases);
    try {
      return callback();
    } catch (error) {
      this.budget = budget;
      this.reservations.clear();
      for (const [key, value] of reservations) this.reservations.set(key, value);
      this.releases.clear();
      for (const [key, value] of releases) this.releases.set(key, value);
      throw error;
    }
  }

  exec<T extends Record<string, unknown>>(query: string, ...values: (string | number)[]) {
    let rows: T[] = [];
    if (query.startsWith('CREATE TABLE')) {
      this.schema = query;
    } else if (
      query.startsWith('SELECT operation_id, lease_key') &&
      query.includes('lease_expires_at <= ?')
    ) {
      const [now, limit] = values as [number, number];
      rows = [...this.reservations.values()]
        .filter(
          (value) =>
            value.lease_expires_at <= now &&
            ['reserved', 'dispatching', 'committing', 'ambiguous'].includes(value.state),
        )
        .sort(
          (left, right) =>
            left.lease_expires_at - right.lease_expires_at ||
            left.operation_id.localeCompare(right.operation_id),
        )
        .slice(0, limit)
        .map((value) => ({ ...value }) as unknown as T);
    } else if (query.startsWith('SELECT operation_id, lease_key')) {
      const value = this.reservations.get(values[0] as string);
      if (value) rows = [{ ...value } as unknown as T];
    } else if (query.startsWith('SELECT operation_id FROM podcast_storage_release')) {
      const released = this.releases.get(values[0] as string);
      if (released && released.leaseKey === values[1] && released.actualBytes === values[2])
        rows = [{ operation_id: values[0] as string } as unknown as T];
    } else if (query.startsWith('SELECT operation_id FROM')) {
      const value = [...this.reservations.values()].find(
        (reservation) => reservation.lease_key === values[0],
      );
      if (value) rows = [{ operation_id: value.operation_id } as unknown as T];
    } else if (query.startsWith('INSERT INTO podcast_budget')) {
      const [, month, characters, storage, maxCharacters, maxStorage] = values as [
        string,
        string,
        number,
        number,
        number,
        number,
      ];
      const nextCharacters =
        this.budget.month !== month ? characters : this.budget.characters + characters;
      const nextStorage = this.budget.storage + storage;
      if (nextCharacters <= maxCharacters && nextStorage <= maxStorage) {
        this.budget = { month, characters: nextCharacters, storage: nextStorage };
        rows = [{ scope: String(values[0]) } as unknown as T];
      }
    } else if (query.startsWith('INSERT INTO podcast_reservation')) {
      const [operationId, leaseKey, month, characters, reserved, actual, expires] = values as [
        string,
        string,
        string,
        number,
        number,
        number,
        number,
      ];
      if (
        this.reservations.has(operationId) ||
        [...this.reservations.values()].some((value) => value.lease_key === leaseKey)
      )
        throw new Error('unique');
      this.reservations.set(operationId, {
        operation_id: operationId,
        lease_key: leaseKey,
        month_key: month,
        characters,
        reserved_storage_bytes: reserved,
        actual_storage_bytes: actual,
        state: 'reserved',
        lease_expires_at: expires,
        deletion_bytes: 0,
      });
    } else if (query.includes("SET state = 'dispatching'")) {
      const [expires, operationId, leaseKey, characters, reserved] = values;
      const held = this.reservations.get(operationId as string);
      if (
        held?.state === 'reserved' &&
        held.lease_key === leaseKey &&
        held.characters === characters &&
        held.reserved_storage_bytes === reserved
      ) {
        held.state = 'dispatching';
        held.lease_expires_at = expires as number;
        rows = [{ operation_id: held.operation_id } as unknown as T];
      }
    } else if (query.includes("SET state = 'committing'")) {
      const [expires, operationId, leaseKey, characters, reserved] = values;
      const held = this.reservations.get(operationId as string);
      if (
        held?.state === 'dispatching' &&
        held.lease_key === leaseKey &&
        held.characters === characters &&
        held.reserved_storage_bytes === reserved
      ) {
        held.state = 'committing';
        held.lease_expires_at = expires as number;
        rows = [{ operation_id: held.operation_id } as unknown as T];
      }
    } else if (
      query.startsWith('DELETE FROM podcast_reservation') &&
      query.includes("state = 'reserved'") &&
      query.includes('RETURNING')
    ) {
      const [operationId, leaseKey, characters, reserved] = values;
      const held = this.reservations.get(operationId as string);
      if (
        held?.state === 'reserved' &&
        held.lease_key === leaseKey &&
        held.characters === characters &&
        held.reserved_storage_bytes === reserved
      ) {
        this.reservations.delete(operationId as string);
        rows = [
          {
            month_key: held.month_key,
            characters: held.characters,
            actual_storage_bytes: held.actual_storage_bytes,
          } as unknown as T,
        ];
      }
    } else if (query.includes("actual_storage_bytes = ?, state = 'stored'")) {
      const [actual, operationId, leaseKey] = values;
      const held = this.reservations.get(operationId as string);
      if (
        held?.state === 'committing' &&
        held.lease_key === leaseKey &&
        held.actual_storage_bytes === held.reserved_storage_bytes
      ) {
        held.actual_storage_bytes = actual as number;
        held.state = 'stored';
        rows = [{ reserved_storage_bytes: held.reserved_storage_bytes } as unknown as T];
      }
    } else if (query.includes("SET state = 'deleting'")) {
      const [actualBytes, operationId, leaseKey] = values;
      const held = this.reservations.get(operationId as string);
      if (
        held &&
        held.lease_key === leaseKey &&
        ['stored', 'committing', 'ambiguous'].includes(held.state)
      ) {
        held.state = 'deleting';
        held.deletion_bytes = actualBytes as number;
        rows = [{ operation_id: held.operation_id } as unknown as T];
      }
    } else if (
      query.startsWith('DELETE FROM podcast_reservation') &&
      query.includes("state = 'deleting'")
    ) {
      const [operationId, leaseKey, actualBytes] = values;
      const held = this.reservations.get(operationId as string);
      if (
        held?.state === 'deleting' &&
        held.lease_key === leaseKey &&
        held.deletion_bytes === actualBytes
      ) {
        this.reservations.delete(operationId as string);
        rows = [{ actual_storage_bytes: held.actual_storage_bytes } as unknown as T];
      }
    } else if (query.startsWith('DELETE FROM podcast_reservation')) {
      const held = this.reservations.get(values[0] as string);
      if (held?.state === 'reserved') this.reservations.delete(values[0] as string);
    } else if (query.includes('SET lease_key = NULL')) {
      const held = this.reservations.get(values[0] as string);
      const eligible =
        held?.state === 'dispatching' ||
        (held?.state === 'ambiguous' &&
          query.includes("state = 'ambiguous'") &&
          held.lease_expires_at <= (values[1] as number));
      if (held && eligible) {
        held.lease_key = null;
        held.reserved_storage_bytes = 0;
        held.actual_storage_bytes = 0;
        held.state = 'orphaned';
        rows = [{ operation_id: held.operation_id } as unknown as T];
      }
    } else if (query.includes("SET state = 'ambiguous'")) {
      const [expires, operationId] = values;
      const held = this.reservations.get(operationId as string);
      if (held?.state === 'committing') {
        held.state = 'ambiguous';
        held.lease_expires_at = expires as number;
      }
    } else if (query.startsWith('INSERT INTO podcast_storage_release')) {
      this.releases.set(values[0] as string, {
        leaseKey: values[1] as string,
        actualBytes: values[2] as number,
      });
    } else if (query.includes('characters = CASE')) {
      const [month, characters, storage] = values as [string, number, number, string];
      if (this.budget.month === month)
        this.budget.characters = Math.max(0, this.budget.characters - characters);
      this.budget.storage = Math.max(0, this.budget.storage - storage);
    } else if (query.includes('active_storage_bytes = MAX')) {
      this.budget.storage = Math.max(0, this.budget.storage - (values[0] as number));
    }
    return Object.assign(rows.values(), { toArray: () => rows });
  }
}

const resourceId = 'azure-speech-f0-shared-podcast-v1';
const operation = (number: number) =>
  `00000000-0000-4000-8000-${number.toString(16).padStart(12, '0')}`;
const lease = (number: number) => `wrn:podcast:v1:${number.toString(16).padStart(64, '0')}`;
const reservation = (
  number: number,
  characters = 1,
  storage = 1,
  leaseNumber = number,
): PodcastQuotaReservation => ({
  sharedResourceId: resourceId,
  operationId: operation(number),
  leaseKey: lease(leaseNumber),
  utf16CodeUnits: characters,
  storageBytes: storage,
});

function quotaFor() {
  const sql = new MemorySql();
  let now = Date.parse('2026-09-21T00:00:00.000Z');
  const quota = new PodcastQuotaDurableObject({
    storage: { sql, transactionSync: (callback) => sql.transactionSync(callback) },
    now: () => now,
  });
  return {
    sql,
    quota,
    advance: (milliseconds: number) => {
      now += milliseconds;
    },
  };
}

describe('PodcastQuotaDurableObject', () => {
  it('shares one 475k character budget and one 8 GiB active-storage budget', async () => {
    const { quota } = quotaFor();
    for (let index = 0; index < 39; index += 1)
      expect(await quota.acquire(reservation(index, 12_000))).toBe('leader');
    await expect(quota.acquire(reservation(40, 12_000))).resolves.toBe('denied');

    const { quota: storageQuota } = quotaFor();
    for (let index = 0; index < 327; index += 1)
      expect(await storageQuota.acquire(reservation(index, 1, 25 * 1024 * 1024))).toBe('leader');
    await expect(storageQuota.acquire(reservation(328, 1, 25 * 1024 * 1024))).resolves.toBe(
      'denied',
    );
  });

  it('returns idempotent leader, busy and ambiguous statuses and fences dispatch once', async () => {
    const { quota, sql } = quotaFor();
    expect(sql.schema).toContain('lease_key TEXT UNIQUE');
    const value = reservation(1, 100, 1000);
    await expect(quota.acquire(value)).resolves.toBe('leader');
    await expect(quota.acquire(value)).resolves.toBe('leader');
    await expect(quota.acquire(reservation(2, 100, 1000, 1))).resolves.toBe('busy');
    await expect(quota.acquire({ ...value, leaseKey: lease(2) })).resolves.toBe('ambiguous');
    await expect(quota.beginDispatch(value)).resolves.toBe('proceed');
    await expect(quota.beginDispatch(value)).resolves.toBe('ambiguous');
    await expect(quota.beginStorageCommit(value)).resolves.toBe('proceed');
    await expect(quota.beginStorageCommit(value)).resolves.toBe('committed');
  });

  it('settles once after both fences and frees active storage only after deletion', async () => {
    const { quota, sql } = quotaFor();
    const value = reservation(1, 100, 1000);
    await quota.acquire(value);
    await quota.beginDispatch(value);
    await quota.beginStorageCommit(value);
    await quota.settleStorage(value, 200);
    await quota.settleStorage(value, 200);
    expect(sql.budget.storage).toBe(200);
    const deletion = { leaseKey: value.leaseKey, operationId: value.operationId, actualBytes: 200 };
    await expect(quota.beginStorageDelete({ ...deletion, actualBytes: 201 })).resolves.toBe(
      'ambiguous',
    );
    expect(sql.budget.storage).toBe(200);
    await expect(quota.beginStorageDelete(deletion)).resolves.toBe('proceed');
    await expect(quota.completeStorageDelete(deletion)).resolves.toBe('released');
    await expect(quota.completeStorageDelete(deletion)).resolves.toBe('released');
    expect(sql.budget.storage).toBe(0);
  });

  it('releases only an exact pre-dispatch lease and never refunds into a new month', async () => {
    const { quota, sql } = quotaFor();
    const value = reservation(1, 100, 1000);
    await quota.acquire(value);
    const held = sql.reservations.get(value.operationId);
    if (!held) throw new Error('missing test reservation');
    held.month_key = '2000-01';
    sql.budget = { month: '2026-09', characters: 250, storage: 1000 };
    await quota.releaseDefinitePreDispatch({ ...value, leaseKey: lease(2) });
    expect(sql.budget.storage).toBe(1000);
    await quota.releaseDefinitePreDispatch(value);
    expect(sql.budget).toEqual({ month: '2026-09', characters: 250, storage: 0 });
  });

  it('recovers expired leases without refunding possible Azure dispatches', async () => {
    const preDispatch = quotaFor();
    const reserved = reservation(1, 100, 1000);
    await preDispatch.quota.acquire(reserved);
    preDispatch.advance(301_000);
    await expect(preDispatch.quota.recoverExpiredLease(reserved)).resolves.toBe(
      'released-pre-dispatch',
    );
    expect(preDispatch.sql.budget).toMatchObject({ characters: 0, storage: 0 });

    const postDispatch = quotaFor();
    await postDispatch.quota.acquire(reserved);
    await postDispatch.quota.beginDispatch(reserved);
    postDispatch.advance(301_000);
    await expect(postDispatch.quota.recoverExpiredLease(reserved)).resolves.toBe(
      'released-post-dispatch-storage',
    );
    expect(postDispatch.sql.budget).toMatchObject({ characters: 100, storage: 0 });
    await expect(postDispatch.quota.beginStorageCommit(reserved)).resolves.toBe('ambiguous');

    const possibleStorage = quotaFor();
    await possibleStorage.quota.acquire(reserved);
    await possibleStorage.quota.beginDispatch(reserved);
    await possibleStorage.quota.beginStorageCommit(reserved);
    possibleStorage.advance(301_000);
    await expect(possibleStorage.quota.recoverExpiredLease(reserved)).resolves.toBe('ambiguous');
    expect(possibleStorage.sql.budget).toMatchObject({ characters: 100, storage: 1000 });
    await expect(
      possibleStorage.quota.releaseAmbiguousStorageAfterNoObject(reserved),
    ).resolves.toBe('busy');
    possibleStorage.advance(301_000);
    await expect(
      possibleStorage.quota.releaseAmbiguousStorageAfterNoObject(reserved),
    ).resolves.toBe('released-post-dispatch-storage');
    expect(possibleStorage.sql.budget).toMatchObject({ characters: 100, storage: 0 });
  });

  it('discovers and safely reconciles a bounded batch of exact expired leases', async () => {
    const { quota, sql, advance } = quotaFor();
    const reserved = reservation(1, 100, 1000);
    const dispatched = reservation(2, 100, 1000);
    const committing = reservation(3, 100, 1000);
    await quota.acquire(reserved);
    await quota.acquire(dispatched);
    await quota.beginDispatch(dispatched);
    await quota.acquire(committing);
    await quota.beginDispatch(committing);
    await quota.beginStorageCommit(committing);
    advance(301_000);

    await expect(quota.recoverExpiredLeases(10)).resolves.toEqual({
      releasedPreDispatch: 1,
      releasedPostDispatchStorage: 1,
      reviewRequired: [committing],
    });
    expect(sql.budget).toMatchObject({ characters: 200, storage: 1000 });
    expect(sql.reservations.get(committing.operationId)?.state).toBe('ambiguous');
  });

  it('exposes only exact internal POST RPC-over-fetch operations', async () => {
    const { quota } = quotaFor();
    const accepted = await quota.fetch(
      new Request('https://podcast-quota.internal/acquire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reservation: reservation(1) }),
      }),
    );
    await expect(accepted.json()).resolves.toEqual({ status: 'leader' });
    const rejected = await quota.fetch(
      new Request('https://podcast-quota.internal/acquire', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reservation: reservation(2), extra: true }),
      }),
    );
    expect(rejected.status).toBe(404);
  });
});
