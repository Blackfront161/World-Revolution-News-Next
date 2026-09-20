import { translationCacheTtlSeconds } from '@wrn/api-contracts/translation-v1';
import type { TranslationCachePort, TranslationQuotaPort } from './handler.js';
import type { TranslationRuntimeEnvironment } from './runtime.js';

interface KvNamespace {
  get(key: string, type: 'text'): Promise<string | null>;
  put(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
}
interface QuotaNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}
export interface CloudflareTranslationEnvironment extends TranslationRuntimeEnvironment {
  readonly TRANSLATION_KV?: KvNamespace;
  readonly TRANSLATION_QUOTAS?: QuotaNamespace;
  readonly TRANSLATION_QUOTA_POLICY?: unknown;
}
type Lane = 'read' | 'provider' | 'write';
interface Policy {
  requestsPerMinute: number;
  requestsPerDay: number;
  utf16PerMinute: number;
  utf16PerDay: number;
}
type Policies = Record<Lane, Policy>;
const lanes: readonly Lane[] = ['read', 'provider', 'write'];
const keyPattern = /^translation:v2:[a-f0-9]{64}$/u;

export function parseQuotaPolicies(input: unknown): Policies | undefined {
  if (typeof input !== 'string' || input.length > 2048) return undefined;
  try {
    const value = JSON.parse(input) as Policies;
    if (!value || Object.keys(value).sort().join(',') !== 'provider,read,write') return undefined;
    for (const lane of lanes) {
      const policy = value[lane];
      if (
        !policy ||
        Object.keys(policy).sort().join(',') !==
          'requestsPerDay,requestsPerMinute,utf16PerDay,utf16PerMinute'
      )
        return undefined;
      if (!Object.values(policy).every((n) => Number.isSafeInteger(n) && n > 0)) return undefined;
      if (
        policy.requestsPerMinute > 1000 ||
        policy.requestsPerDay > 100000 ||
        policy.utf16PerMinute > 6000000 ||
        policy.utf16PerDay > 600000000
      )
        return undefined;
    }
    return value;
  } catch {
    return undefined;
  }
}

export function createKvCachePort(kv: KvNamespace): TranslationCachePort {
  return {
    async get(key, { signal }) {
      if (signal.aborted || !keyPattern.test(key)) throw new Error('Cache unavailable');
      const raw = await kv.get(key, 'text');
      if (signal.aborted) throw new Error('Cache unavailable');
      if (raw === null) return undefined;
      if (raw.length > 65536) throw new Error('Cache unavailable');
      return JSON.parse(raw) as unknown;
    },
    async put(key, entry, ttl, { signal, mayCommit }) {
      if (
        !keyPattern.test(key) ||
        !Number.isSafeInteger(ttl) ||
        ttl < 60 ||
        ttl > translationCacheTtlSeconds
      )
        throw new Error('Cache unavailable');
      const body = JSON.stringify(entry);
      if (body.length > 65536 || signal.aborted || !mayCommit())
        throw new Error('Cache unavailable');
      // KV has no abortable commit API. Check the guard immediately before dispatch;
      // no deferred write, waitUntil, retry, raw input text, or request metadata.
      await kv.put(key, body, { expirationTtl: ttl });
    },
  };
}

export function createDurableQuotaPort(
  namespace: QuotaNamespace,
  lane: Lane,
  policyRevision: string,
): TranslationQuotaPort {
  return {
    async reserve(reservation, { signal }) {
      if (signal.aborted) return false;
      try {
        const stub = namespace.get(namespace.idFromName('wrn-next-translation-global-v1'));
        const response = await stub.fetch(
          new Request('https://quota.internal/reserve', {
            method: 'POST',
            signal,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ lane, ...reservation, policyRevision }),
          }),
        );
        return !signal.aborted && response.status === 204;
      } catch {
        return false;
      }
    },
  };
}

export function composeCloudflarePorts(
  env: CloudflareTranslationEnvironment,
): TranslationRuntimeEnvironment {
  if (env.TRANSLATION_V2_ENABLED !== 'true') return env;
  // Keep explicit manually injected test/platform ports supported.
  if (!env.TRANSLATION_KV && !env.TRANSLATION_QUOTAS) return env;
  const kv = env.TRANSLATION_KV;
  const quota = env.TRANSLATION_QUOTAS;
  if (
    !kv ||
    typeof kv.get !== 'function' ||
    typeof kv.put !== 'function' ||
    !quota ||
    typeof quota.get !== 'function' ||
    typeof quota.idFromName !== 'function' ||
    !parseQuotaPolicies(env.TRANSLATION_QUOTA_POLICY) ||
    typeof env.TRANSLATION_CACHE_TTL_SECONDS !== 'string' ||
    Number(env.TRANSLATION_CACHE_TTL_SECONDS) < 60
  )
    return { TRANSLATION_V2_ENABLED: 'false' };
  return {
    ...env,
    TRANSLATION_CACHE: createKvCachePort(kv),
    TRANSLATION_READ_QUOTA: createDurableQuotaPort(
      quota,
      'read',
      env.TRANSLATION_QUOTA_POLICY as string,
    ),
    TRANSLATION_PROVIDER_QUOTA: createDurableQuotaPort(
      quota,
      'provider',
      env.TRANSLATION_QUOTA_POLICY as string,
    ),
    TRANSLATION_WRITE_QUOTA: createDurableQuotaPort(
      quota,
      'write',
      env.TRANSLATION_QUOTA_POLICY as string,
    ),
  };
}

interface SqlStorage {
  exec<T extends Record<string, unknown>>(
    query: string,
    ...values: (string | number)[]
  ): Iterable<T>;
}
interface QuotaState {
  storage: { sql: SqlStorage; transactionSync<T>(operation: () => T): T };
}
const pacificDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
export function quotaDay(lane: Lane, now: number): string {
  return lane === 'provider'
    ? pacificDay.format(new Date(now))
    : new Date(now).toISOString().slice(0, 10);
}

/** Binding-only SQLite Durable Object. No provider credentials, article text or IPs are stored. */
export class TranslationQuotaCoordinator {
  private readonly state: QuotaState;
  private readonly policies: Policies | undefined;
  private readonly policyRevision: unknown;
  constructor(state: QuotaState, env: CloudflareTranslationEnvironment) {
    this.state = state;
    this.policies = parseQuotaPolicies(env.TRANSLATION_QUOTA_POLICY);
    this.policyRevision = env.TRANSLATION_QUOTA_POLICY;
    if (this.policies) {
      state.storage.sql.exec(
        'CREATE TABLE IF NOT EXISTS day_counts (lane TEXT PRIMARY KEY, day TEXT NOT NULL, requests INTEGER NOT NULL, units INTEGER NOT NULL, last_now INTEGER NOT NULL)',
      );
      state.storage.sql.exec(
        'CREATE TABLE IF NOT EXISTS recent (lane TEXT NOT NULL, at INTEGER NOT NULL, units INTEGER NOT NULL)',
      );
      state.storage.sql.exec('CREATE INDEX IF NOT EXISTS recent_lane_at ON recent(lane, at)');
    }
  }
  async fetch(request: Request): Promise<Response> {
    if (!this.policies || request.method !== 'POST' || new URL(request.url).pathname !== '/reserve')
      return new Response(null, { status: 503 });
    try {
      const bytes = await request.arrayBuffer();
      if (bytes.byteLength > 4096) return new Response(null, { status: 400 });
      const value = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
      const { lane, requests, utf16CodeUnits: units } = value;
      if (
        Object.keys(value).sort().join(',') !== 'lane,policyRevision,requests,utf16CodeUnits' ||
        value.policyRevision !== this.policyRevision ||
        !lanes.includes(lane as Lane) ||
        requests !== 1 ||
        typeof units !== 'number' ||
        !Number.isSafeInteger(units) ||
        units < 0 ||
        units > 6000
      )
        return new Response(null, { status: 400 });
      const bucket = lane as Lane;
      const policy = this.policies[bucket];
      const now = Date.now();
      const day = quotaDay(bucket, now);
      const sql = this.state.storage.sql;
      const allowed = this.state.storage.transactionSync(() => {
        const previous = [
          ...sql.exec<{ day: string; requests: number; units: number; last_now: number }>(
            'SELECT day, requests, units, last_now FROM day_counts WHERE lane = ?',
            bucket,
          ),
        ][0];
        if (previous && now < previous.last_now) return false;
        sql.exec('DELETE FROM recent WHERE at <= ?', now - 60000);
        const minute = [
          ...sql.exec<{ requests: number; units: number }>(
            'SELECT COUNT(*) AS requests, COALESCE(SUM(units), 0) AS units FROM recent WHERE lane = ?',
            bucket,
          ),
        ][0];
        const dayRequests = previous?.day === day ? previous.requests : 0;
        const dayUnits = previous?.day === day ? previous.units : 0;
        if (
          !minute ||
          minute.requests + 1 > policy.requestsPerMinute ||
          dayRequests + 1 > policy.requestsPerDay ||
          minute.units + units > policy.utf16PerMinute ||
          dayUnits + units > policy.utf16PerDay
        )
          return false;
        sql.exec('INSERT INTO recent(lane, at, units) VALUES (?, ?, ?)', bucket, now, units);
        sql.exec(
          'INSERT INTO day_counts(lane, day, requests, units, last_now) VALUES (?, ?, ?, ?, ?) ON CONFLICT(lane) DO UPDATE SET day=excluded.day, requests=excluded.requests, units=excluded.units, last_now=excluded.last_now',
          bucket,
          day,
          dayRequests + 1,
          dayUnits + units,
          now,
        );
        return true;
      });
      return new Response(null, { status: allowed ? 204 : 429 });
    } catch {
      return new Response(null, { status: 503 });
    }
  }
}
