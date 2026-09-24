import type {
  PodcastLeaseAcquireStatus,
  PodcastLeaseBarrierStatus,
  PodcastLeaseRecoverySummary,
  PodcastLeaseRecoveryStatus,
  PodcastQuotaReservation,
  PodcastStorageDeletion,
  PodcastStorageDeleteStatus,
  PodcastStorageCommitStatus,
} from './contracts.js';

interface SqlStorage {
  exec<T extends Record<string, unknown>>(
    query: string,
    ...values: (string | number)[]
  ): Iterable<T> & { toArray(): T[] };
}
interface DurableObjectStateLike {
  readonly storage: {
    readonly sql: SqlStorage;
    transactionSync<T>(callback: () => T): T;
  };
  /** Test-only clock seam. Cloudflare state does not supply it. */
  readonly now?: () => number;
}

type HeldReservation = {
  readonly operation_id: string;
  readonly lease_key: string | null;
  readonly month_key: string;
  readonly characters: number;
  readonly reserved_storage_bytes: number;
  readonly actual_storage_bytes: number;
  readonly state:
    'reserved' | 'dispatching' | 'committing' | 'stored' | 'orphaned' | 'ambiguous' | 'deleting';
  readonly lease_expires_at: number;
  readonly deletion_bytes: number;
};

const maxCharactersPerMonth = 475_000;
const maxActiveStorageBytes = 8 * 1024 * 1024 * 1024;
const resourceId = 'azure-speech-f0-shared-podcast-v1';
const maxAudioBytes = 25 * 1024 * 1024;
const leaseMilliseconds = 5 * 60 * 1000;
const leaseKeyPattern = /^wrn:podcast:v1:[a-f0-9]{64}$/u;
const operationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const monthKey = (milliseconds = Date.now()) => new Date(milliseconds).toISOString().slice(0, 7);

const valid = (reservation: PodcastQuotaReservation) =>
  reservation.sharedResourceId === resourceId &&
  operationIdPattern.test(reservation.operationId) &&
  leaseKeyPattern.test(reservation.leaseKey) &&
  Number.isSafeInteger(reservation.utf16CodeUnits) &&
  reservation.utf16CodeUnits > 0 &&
  reservation.utf16CodeUnits <= 12_000 &&
  Number.isSafeInteger(reservation.storageBytes) &&
  reservation.storageBytes > 0 &&
  reservation.storageBytes <= maxAudioBytes;
const validDeletion = (deletion: PodcastStorageDeletion) =>
  operationIdPattern.test(deletion.operationId) &&
  leaseKeyPattern.test(deletion.leaseKey) &&
  Number.isSafeInteger(deletion.actualBytes) &&
  deletion.actualBytes > 0 &&
  deletion.actualBytes <= maxAudioBytes;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
const plainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exactKeys = (value: Record<string, unknown>, expected: readonly string[]) => {
  const keys = Object.keys(value).sort();
  const sorted = [...expected].sort();
  return keys.length === sorted.length && keys.every((key, index) => key === sorted[index]);
};
const reservationFrom = (value: unknown): PodcastQuotaReservation | null =>
  plainRecord(value) &&
  exactKeys(value, [
    'leaseKey',
    'operationId',
    'sharedResourceId',
    'storageBytes',
    'utf16CodeUnits',
  ]) &&
  typeof value.operationId === 'string' &&
  typeof value.leaseKey === 'string' &&
  typeof value.sharedResourceId === 'string' &&
  typeof value.storageBytes === 'number' &&
  typeof value.utf16CodeUnits === 'number'
    ? {
        operationId: value.operationId,
        leaseKey: value.leaseKey,
        sharedResourceId: value.sharedResourceId,
        storageBytes: value.storageBytes,
        utf16CodeUnits: value.utf16CodeUnits,
      }
    : null;
const deletionFrom = (value: unknown): PodcastStorageDeletion | null =>
  plainRecord(value) &&
  exactKeys(value, ['actualBytes', 'leaseKey', 'operationId']) &&
  typeof value.operationId === 'string' &&
  typeof value.leaseKey === 'string' &&
  typeof value.actualBytes === 'number'
    ? {
        operationId: value.operationId,
        leaseKey: value.leaseKey,
        actualBytes: value.actualBytes,
      }
    : null;

function sameReservation(held: HeldReservation, reservation: PodcastQuotaReservation): boolean {
  return (
    held.operation_id === reservation.operationId &&
    held.lease_key === reservation.leaseKey &&
    held.characters === reservation.utf16CodeUnits &&
    held.reserved_storage_bytes === reservation.storageBytes
  );
}

/** Resource-scoped SQLite coordinator for quota, a distributed cache-key lease, and write fences. */
export class PodcastQuotaDurableObject {
  readonly sql: SqlStorage;
  readonly state: DurableObjectStateLike;
  readonly now: () => number;

  public constructor(state: DurableObjectStateLike) {
    this.state = state;
    this.sql = state.storage.sql;
    this.now = state.now ?? Date.now;
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS podcast_budget (scope TEXT PRIMARY KEY, month_key TEXT NOT NULL, characters INTEGER NOT NULL, active_storage_bytes INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS podcast_reservation (operation_id TEXT PRIMARY KEY, lease_key TEXT UNIQUE, month_key TEXT NOT NULL, characters INTEGER NOT NULL, reserved_storage_bytes INTEGER NOT NULL, actual_storage_bytes INTEGER NOT NULL, state TEXT NOT NULL CHECK(state IN ('reserved','dispatching','committing','stored','orphaned','ambiguous','deleting')), lease_expires_at INTEGER NOT NULL, deletion_bytes INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS podcast_storage_release (operation_id TEXT PRIMARY KEY, lease_key TEXT NOT NULL, actual_bytes INTEGER NOT NULL);",
    );
  }

  public async acquire(reservation: PodcastQuotaReservation): Promise<PodcastLeaseAcquireStatus> {
    if (!valid(reservation)) return 'denied';
    try {
      return this.state.storage.transactionSync(() => {
        const existing = this.sql
          .exec<HeldReservation>(
            'SELECT operation_id, lease_key, month_key, characters, reserved_storage_bytes, actual_storage_bytes, state, lease_expires_at, deletion_bytes FROM podcast_reservation WHERE operation_id = ?;',
            reservation.operationId,
          )
          .toArray()[0];
        if (existing) {
          return sameReservation(existing, reservation) && existing.state === 'reserved'
            ? 'leader'
            : 'ambiguous';
        }
        const lease = this.sql
          .exec<{ operation_id: string }>(
            'SELECT operation_id FROM podcast_reservation WHERE lease_key = ?;',
            reservation.leaseKey,
          )
          .toArray()[0];
        if (lease) return 'busy';

        const month = monthKey(this.now());
        const rows = this.sql
          .exec<{ scope: string }>(
            'INSERT INTO podcast_budget (scope, month_key, characters, active_storage_bytes) VALUES (?, ?, ?, ?) ON CONFLICT(scope) DO UPDATE SET month_key = excluded.month_key, characters = CASE WHEN podcast_budget.month_key <> excluded.month_key THEN excluded.characters ELSE podcast_budget.characters + excluded.characters END, active_storage_bytes = podcast_budget.active_storage_bytes + excluded.active_storage_bytes WHERE (CASE WHEN podcast_budget.month_key <> excluded.month_key THEN excluded.characters ELSE podcast_budget.characters + excluded.characters END) <= ? AND podcast_budget.active_storage_bytes + excluded.active_storage_bytes <= ? RETURNING scope;',
            resourceId,
            month,
            reservation.utf16CodeUnits,
            reservation.storageBytes,
            maxCharactersPerMonth,
            maxActiveStorageBytes,
          )
          .toArray();
        if (rows.length !== 1) return 'denied';
        this.sql.exec(
          "INSERT INTO podcast_reservation (operation_id, lease_key, month_key, characters, reserved_storage_bytes, actual_storage_bytes, state, lease_expires_at) VALUES (?, ?, ?, ?, ?, ?, 'reserved', ?);",
          reservation.operationId,
          reservation.leaseKey,
          month,
          reservation.utf16CodeUnits,
          reservation.storageBytes,
          reservation.storageBytes,
          this.now() + leaseMilliseconds,
        );
        return 'leader';
      });
    } catch {
      // Transaction rollback is safer than guessing whether either quota counter committed.
      return 'ambiguous';
    }
  }

  public async beginDispatch(
    reservation: PodcastQuotaReservation,
  ): Promise<PodcastLeaseBarrierStatus> {
    if (!valid(reservation)) return 'ambiguous';
    const changed = this.sql
      .exec<{ operation_id: string }>(
        "UPDATE podcast_reservation SET state = 'dispatching', lease_expires_at = ? WHERE operation_id = ? AND lease_key = ? AND characters = ? AND reserved_storage_bytes = ? AND state = 'reserved' RETURNING operation_id;",
        this.now() + leaseMilliseconds,
        reservation.operationId,
        reservation.leaseKey,
        reservation.utf16CodeUnits,
        reservation.storageBytes,
      )
      .toArray();
    return changed.length === 1 ? 'proceed' : 'ambiguous';
  }

  public async beginStorageCommit(
    reservation: PodcastQuotaReservation,
  ): Promise<PodcastStorageCommitStatus> {
    if (!valid(reservation)) return 'ambiguous';
    return this.state.storage.transactionSync(() => {
      const changed = this.sql
        .exec<{ operation_id: string }>(
          "UPDATE podcast_reservation SET state = 'committing', lease_expires_at = ? WHERE operation_id = ? AND lease_key = ? AND characters = ? AND reserved_storage_bytes = ? AND state = 'dispatching' RETURNING operation_id;",
          this.now() + leaseMilliseconds,
          reservation.operationId,
          reservation.leaseKey,
          reservation.utf16CodeUnits,
          reservation.storageBytes,
        )
        .toArray();
      if (changed.length === 1) return 'proceed';
      const held = this.sql
        .exec<HeldReservation>(
          'SELECT operation_id, lease_key, month_key, characters, reserved_storage_bytes, actual_storage_bytes, state, lease_expires_at, deletion_bytes FROM podcast_reservation WHERE operation_id = ?;',
          reservation.operationId,
        )
        .toArray()[0];
      // The same exact operation may safely resolve a lost barrier response: no R2 write can
      // start until this caller receives proceed.
      return held && sameReservation(held, reservation) && held.state === 'committing'
        ? 'committed'
        : 'ambiguous';
    });
  }

  public async releaseDefinitePreDispatch(reservation: PodcastQuotaReservation): Promise<void> {
    if (!valid(reservation)) return;
    this.state.storage.transactionSync(() => {
      const held = this.sql
        .exec<{
          month_key: string;
          characters: number;
          actual_storage_bytes: number;
        }>(
          "DELETE FROM podcast_reservation WHERE operation_id = ? AND lease_key = ? AND characters = ? AND reserved_storage_bytes = ? AND state = 'reserved' RETURNING month_key, characters, actual_storage_bytes;",
          reservation.operationId,
          reservation.leaseKey,
          reservation.utf16CodeUnits,
          reservation.storageBytes,
        )
        .toArray()[0];
      if (held) this.refund(held.month_key, held.characters, held.actual_storage_bytes);
    });
  }

  public async settleStorage(
    reservation: PodcastQuotaReservation,
    actualBytes: number,
  ): Promise<void> {
    if (
      !valid(reservation) ||
      !Number.isSafeInteger(actualBytes) ||
      actualBytes < 1 ||
      actualBytes > reservation.storageBytes
    )
      return;
    this.state.storage.transactionSync(() => {
      const held = this.sql
        .exec<{ reserved_storage_bytes: number }>(
          "UPDATE podcast_reservation SET actual_storage_bytes = ?, state = 'stored' WHERE operation_id = ? AND lease_key = ? AND state = 'committing' AND actual_storage_bytes = reserved_storage_bytes RETURNING reserved_storage_bytes;",
          actualBytes,
          reservation.operationId,
          reservation.leaseKey,
        )
        .toArray()[0];
      if (held && held.reserved_storage_bytes > actualBytes)
        this.releaseStorage(held.reserved_storage_bytes - actualBytes);
    });
  }

  public async beginStorageDelete(
    deletion: PodcastStorageDeletion,
  ): Promise<PodcastStorageDeleteStatus> {
    if (!validDeletion(deletion)) return 'ambiguous';
    return this.state.storage.transactionSync(() => {
      const released = this.sql
        .exec<{ operation_id: string }>(
          'SELECT operation_id FROM podcast_storage_release WHERE operation_id = ? AND lease_key = ? AND actual_bytes = ?;',
          deletion.operationId,
          deletion.leaseKey,
          deletion.actualBytes,
        )
        .toArray()[0];
      if (released) return 'released';
      const held = this.sql
        .exec<HeldReservation>(
          'SELECT operation_id, lease_key, month_key, characters, reserved_storage_bytes, actual_storage_bytes, state, lease_expires_at, deletion_bytes FROM podcast_reservation WHERE operation_id = ?;',
          deletion.operationId,
        )
        .toArray()[0];
      if (!held || held.lease_key !== deletion.leaseKey) return 'ambiguous';
      if (held.state === 'deleting')
        return held.deletion_bytes === deletion.actualBytes ? 'proceed' : 'ambiguous';
      const exactStored =
        held.state === 'stored' && held.actual_storage_bytes === deletion.actualBytes;
      const observedBeforeSettlement =
        (held.state === 'committing' || held.state === 'ambiguous') &&
        deletion.actualBytes <= held.actual_storage_bytes;
      if (!exactStored && !observedBeforeSettlement) return 'ambiguous';
      const changed = this.sql
        .exec<{ operation_id: string }>(
          "UPDATE podcast_reservation SET state = 'deleting', deletion_bytes = ? WHERE operation_id = ? AND lease_key = ? AND state IN ('stored','committing','ambiguous') RETURNING operation_id;",
          deletion.actualBytes,
          deletion.operationId,
          deletion.leaseKey,
        )
        .toArray();
      return changed.length === 1 ? 'proceed' : 'ambiguous';
    });
  }

  public async completeStorageDelete(
    deletion: PodcastStorageDeletion,
  ): Promise<'released' | 'ambiguous'> {
    if (!validDeletion(deletion)) return 'ambiguous';
    return this.state.storage.transactionSync(() => {
      const released = this.sql
        .exec<{ operation_id: string }>(
          'SELECT operation_id FROM podcast_storage_release WHERE operation_id = ? AND lease_key = ? AND actual_bytes = ?;',
          deletion.operationId,
          deletion.leaseKey,
          deletion.actualBytes,
        )
        .toArray()[0];
      if (released) return 'released';
      const held = this.sql
        .exec<{ actual_storage_bytes: number }>(
          "DELETE FROM podcast_reservation WHERE operation_id = ? AND lease_key = ? AND state = 'deleting' AND deletion_bytes = ? RETURNING actual_storage_bytes;",
          deletion.operationId,
          deletion.leaseKey,
          deletion.actualBytes,
        )
        .toArray()[0];
      if (!held) return 'ambiguous';
      this.sql.exec(
        'INSERT INTO podcast_storage_release (operation_id, lease_key, actual_bytes) VALUES (?, ?, ?);',
        deletion.operationId,
        deletion.leaseKey,
        deletion.actualBytes,
      );
      this.releaseStorage(held.actual_storage_bytes);
      return 'released';
    });
  }

  public async recoverExpiredLease(
    reservation: PodcastQuotaReservation,
  ): Promise<PodcastLeaseRecoveryStatus> {
    if (!valid(reservation)) return 'ambiguous';
    return this.state.storage.transactionSync(() => {
      const held = this.sql
        .exec<HeldReservation>(
          'SELECT operation_id, lease_key, month_key, characters, reserved_storage_bytes, actual_storage_bytes, state, lease_expires_at, deletion_bytes FROM podcast_reservation WHERE operation_id = ?;',
          reservation.operationId,
        )
        .toArray()[0];
      if (!held || !sameReservation(held, reservation)) return 'ambiguous';
      return this.recoverHeld(held);
    });
  }

  public async recoverExpiredLeases(limit = 50): Promise<PodcastLeaseRecoverySummary> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
      return { releasedPreDispatch: 0, releasedPostDispatchStorage: 0, reviewRequired: [] };
    return this.state.storage.transactionSync(() => {
      const expired = this.sql
        .exec<HeldReservation>(
          "SELECT operation_id, lease_key, month_key, characters, reserved_storage_bytes, actual_storage_bytes, state, lease_expires_at, deletion_bytes FROM podcast_reservation WHERE lease_expires_at <= ? AND state IN ('reserved','dispatching','committing','ambiguous') ORDER BY lease_expires_at, operation_id LIMIT ?;",
          this.now(),
          limit,
        )
        .toArray();
      let releasedPreDispatch = 0;
      let releasedPostDispatchStorage = 0;
      const reviewRequired: PodcastQuotaReservation[] = [];
      for (const held of expired) {
        if (held.lease_key === null) continue;
        const exact: PodcastQuotaReservation = {
          sharedResourceId: resourceId,
          operationId: held.operation_id,
          leaseKey: held.lease_key,
          utf16CodeUnits: held.characters,
          storageBytes: held.reserved_storage_bytes,
        };
        const status = this.recoverHeld(held);
        if (status === 'released-pre-dispatch') releasedPreDispatch += 1;
        else if (status === 'released-post-dispatch-storage') releasedPostDispatchStorage += 1;
        else if (status === 'ambiguous') reviewRequired.push(exact);
      }
      return { releasedPreDispatch, releasedPostDispatchStorage, reviewRequired };
    });
  }

  public async releaseAmbiguousStorageAfterNoObject(
    reservation: PodcastQuotaReservation,
  ): Promise<PodcastLeaseRecoveryStatus> {
    if (!valid(reservation)) return 'ambiguous';
    return this.state.storage.transactionSync(() => {
      const held = this.sql
        .exec<HeldReservation>(
          'SELECT operation_id, lease_key, month_key, characters, reserved_storage_bytes, actual_storage_bytes, state, lease_expires_at, deletion_bytes FROM podcast_reservation WHERE operation_id = ?;',
          reservation.operationId,
        )
        .toArray()[0];
      if (!held || !sameReservation(held, reservation)) return 'ambiguous';
      if (held.state !== 'ambiguous' || held.lease_expires_at > this.now()) return 'busy';
      const changed = this.sql
        .exec<{ operation_id: string }>(
          "UPDATE podcast_reservation SET lease_key = NULL, reserved_storage_bytes = 0, actual_storage_bytes = 0, state = 'orphaned' WHERE operation_id = ? AND state = 'ambiguous' AND lease_expires_at <= ? RETURNING operation_id;",
          held.operation_id,
          this.now(),
        )
        .toArray();
      if (changed.length !== 1) return 'ambiguous';
      // Azure characters remain charged. The caller proved R2 absence after two full lease windows.
      this.releaseStorage(held.actual_storage_bytes);
      return 'released-post-dispatch-storage';
    });
  }

  private recoverHeld(held: HeldReservation): PodcastLeaseRecoveryStatus {
    if (held.lease_expires_at > this.now()) return 'busy';
    if (held.state === 'reserved') {
      this.sql.exec(
        "DELETE FROM podcast_reservation WHERE operation_id = ? AND state = 'reserved';",
        held.operation_id,
      );
      this.refund(held.month_key, held.characters, held.actual_storage_bytes);
      return 'released-pre-dispatch';
    }
    if (held.state === 'dispatching') {
      // The storage fence never committed: no current or delayed writer can pass it after this
      // transition. Keep Azure characters charged, free only the provably unused R2 reservation.
      this.sql.exec(
        "UPDATE podcast_reservation SET lease_key = NULL, reserved_storage_bytes = 0, actual_storage_bytes = 0, state = 'orphaned' WHERE operation_id = ? AND state = 'dispatching';",
        held.operation_id,
      );
      this.releaseStorage(held.actual_storage_bytes);
      return 'released-post-dispatch-storage';
    }
    if (held.state === 'committing') {
      // R2 may already contain bytes. Preserve the lease and storage until an exact reconciliation.
      this.sql.exec(
        "UPDATE podcast_reservation SET state = 'ambiguous', lease_expires_at = ? WHERE operation_id = ? AND state = 'committing';",
        this.now() + leaseMilliseconds,
        held.operation_id,
      );
    }
    return 'ambiguous';
  }

  private refund(reservationMonth: string, characters: number, storageBytes: number): void {
    const currentMonth = monthKey(this.now());
    this.sql.exec(
      'UPDATE podcast_budget SET characters = CASE WHEN month_key = ? THEN MAX(0, characters - ?) ELSE characters END, active_storage_bytes = MAX(0, active_storage_bytes - ?) WHERE scope = ?;',
      currentMonth,
      reservationMonth === currentMonth ? characters : 0,
      storageBytes,
      resourceId,
    );
  }

  private releaseStorage(storageBytes: number): void {
    this.sql.exec(
      'UPDATE podcast_budget SET active_storage_bytes = MAX(0, active_storage_bytes - ?) WHERE scope = ?;',
      storageBytes,
      resourceId,
    );
  }

  /** Durable Object HTTP contract used by the bound stub; no public route mounts this class. */
  public async fetch(request: Request): Promise<Response> {
    if (
      request.method !== 'POST' ||
      request.headers.get('content-type')?.split(';', 1)[0] !== 'application/json'
    )
      return json(404, { ok: false });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(400, { ok: false });
    }
    const path = new URL(request.url).pathname;
    if (
      (path === '/acquire' ||
        path === '/begin-dispatch' ||
        path === '/begin-storage-commit' ||
        path === '/release-definite-pre-dispatch' ||
        path === '/recover-expired-lease' ||
        path === '/release-ambiguous-storage-after-no-object') &&
      plainRecord(body) &&
      exactKeys(body, ['reservation'])
    ) {
      const reservation = reservationFrom(body.reservation);
      if (!reservation) return json(400, { ok: false });
      if (path === '/acquire') return json(200, { status: await this.acquire(reservation) });
      if (path === '/begin-dispatch')
        return json(200, { status: await this.beginDispatch(reservation) });
      if (path === '/begin-storage-commit')
        return json(200, { status: await this.beginStorageCommit(reservation) });
      if (path === '/recover-expired-lease')
        return json(200, { status: await this.recoverExpiredLease(reservation) });
      if (path === '/release-ambiguous-storage-after-no-object')
        return json(200, {
          status: await this.releaseAmbiguousStorageAfterNoObject(reservation),
        });
      await this.releaseDefinitePreDispatch(reservation);
      return json(200, { ok: true });
    }
    if (
      path === '/settle-storage' &&
      plainRecord(body) &&
      exactKeys(body, ['actualBytes', 'reservation'])
    ) {
      const reservation = reservationFrom(body.reservation);
      if (!reservation || typeof body.actualBytes !== 'number') return json(400, { ok: false });
      await this.settleStorage(reservation, body.actualBytes);
      return json(200, { ok: true });
    }
    if (
      (path === '/begin-storage-delete' || path === '/complete-storage-delete') &&
      plainRecord(body) &&
      exactKeys(body, ['deletion'])
    ) {
      const deletion = deletionFrom(body.deletion);
      if (!deletion) return json(400, { ok: false });
      return json(200, {
        status:
          path === '/begin-storage-delete'
            ? await this.beginStorageDelete(deletion)
            : await this.completeStorageDelete(deletion),
      });
    }
    if (
      path === '/recover-expired-leases' &&
      plainRecord(body) &&
      exactKeys(body, ['limit']) &&
      typeof body.limit === 'number'
    ) {
      const summary = await this.recoverExpiredLeases(body.limit);
      return json(200, { ...summary });
    }
    return json(404, { ok: false });
  }
}
