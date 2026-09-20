import { canonicalJson, utf8ByteLength } from '@wrn/content-contracts';
import {
  productionMediaDocumentsV1,
  compileProductionMediaProviderPolicyV1,
  productionMediaLimitsV1,
  validateProductionMediaSafetyV1,
  validateProductionMediaReleaseV1,
  type ProductionMediaSafetyV1,
  type ProductionMediaProviderPolicyV1,
} from '@wrn/content-contracts/production-media-v1';
import type {
  ProductionMediaRawRelease,
  ProductionMediaSafetyCommit,
  ProductionMediaSourceResult,
} from './production-media-release';

const failed = Object.freeze({ kind: 'failed' as const });
function rawSnapshot(raw: ProductionMediaRawRelease): ProductionMediaRawRelease {
  const keys = (value: object, expected: readonly string[]) =>
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key));
  const boundedText = (value: string, limit: number) => {
    if (typeof value !== 'string' || value.length > limit || utf8ByteLength(value) > limit)
      throw new Error('Invalid local media bytes');
    return value;
  };
  if (
    !keys(raw, ['pointerRaw', 'descriptorRaw', 'documentsRaw']) ||
    !keys(raw.documentsRaw, productionMediaDocumentsV1)
  )
    throw new Error('Invalid local media packet');
  const documentsRaw = Object.fromEntries(
    productionMediaDocumentsV1.map((name) => [
      name,
      boundedText(raw.documentsRaw[name], productionMediaLimitsV1.document),
    ]),
  ) as ProductionMediaRawRelease['documentsRaw'];
  if (
    Object.values(documentsRaw).reduce((sum, value) => sum + utf8ByteLength(value), 0) >
    productionMediaLimitsV1.aggregate
  )
    throw new Error('Invalid local media aggregate');
  return Object.freeze({
    pointerRaw: boundedText(raw.pointerRaw, productionMediaLimitsV1.pointer),
    descriptorRaw: boundedText(raw.descriptorRaw, productionMediaLimitsV1.descriptor),
    documentsRaw: Object.freeze(documentsRaw),
  });
}

/** Raw build data only. No transport, fabricated Response or direct Ready installation. */
export function createProductionMediaInitialSource(
  options: Readonly<{
    raw: ProductionMediaRawRelease;
    allowedOrigins: ReadonlySet<string>;
    providerPolicy?: ProductionMediaProviderPolicyV1;
    now?: () => number;
  }>,
) {
  const clock = options.now ?? Date.now;
  let raw: ProductionMediaRawRelease | null = null;
  let origins: ReadonlySet<string> = new Set();
  let providerPolicy: ProductionMediaProviderPolicyV1 | null = null;
  try {
    raw = rawSnapshot(options.raw);
    origins = new Set(options.allowedOrigins);
    providerPolicy = compileProductionMediaProviderPolicyV1(options.providerPolicy, origins);
    if (!providerPolicy) raw = null;
  } catch {
    raw = null;
  }
  return Object.freeze({
    async load(
      input: Readonly<{
        signal: AbortSignal;
        knownSafety: ProductionMediaSafetyV1;
        commitSafety: ProductionMediaSafetyCommit;
      }>,
    ): Promise<ProductionMediaSourceResult> {
      if (!raw || !providerPolicy) return failed;
      const signal = input.signal;
      let lastTime = -1;
      const check = () => {
        const now = clock();
        if (signal.aborted || !Number.isFinite(now) || now < 0 || now < lastTime)
          throw new Error('Local media no longer current');
        lastTime = now;
        return now;
      };
      const wait = <T>(promise: Promise<T>) =>
        new Promise<T>((resolve, reject) => {
          let settled = false;
          const finish = (action: () => void) => {
            if (settled) return;
            settled = true;
            signal.removeEventListener('abort', abort);
            action();
          };
          const abort = () => finish(() => reject(new Error('Local media aborted')));
          signal.addEventListener('abort', abort, { once: true });
          if (signal.aborted) abort();
          void promise.then(
            (value) => finish(() => resolve(value)),
            (error) => finish(() => reject(error)),
          );
        });
      try {
        const commit = input.commitSafety;
        const knownSafety = JSON.parse(canonicalJson(input.knownSafety)) as ProductionMediaSafetyV1;
        const safety = await wait(
          validateProductionMediaSafetyV1({ ...raw, knownSafety, now: check() }),
        );
        check();
        if (!safety) return failed;
        const durable = JSON.parse(
          canonicalJson(await wait(commit(safety, signal))),
        ) as ProductionMediaSafetyV1;
        check();
        if (canonicalJson(durable) !== canonicalJson(safety)) return failed;
        // Revalidate hash-bound safety after the durable callback, before ordinary payload validation.
        if (
          !(await wait(
            validateProductionMediaSafetyV1({ ...raw, knownSafety: durable, now: check() }),
          ))
        )
          return failed;
        check();
        const ready = await wait(
          validateProductionMediaReleaseV1({
            ...raw,
            knownSafety: durable,
            allowedOrigins: origins,
            providerPolicy,
            now: check(),
          }),
        );
        check();
        return ready ? Object.freeze({ kind: 'ready' as const, ready, raw }) : failed;
      } catch {
        return failed;
      }
    },
  });
}
