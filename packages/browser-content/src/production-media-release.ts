import { canonicalJson, sha256Utf8 } from '@wrn/content-contracts';
import {
  isProductionMediaPointerV1,
  isProductionMediaDescriptorV1,
  compileProductionMediaProviderPolicyV1,
  productionMediaLimitsV1,
  validateProductionMediaSafetyV1,
  validateProductionMediaReleaseV1,
  type ProductionMediaInputV1,
  type ProductionMediaProviderPolicyV1,
  type ProductionMediaReadyV1,
  type ProductionMediaSafetyV1,
} from '@wrn/content-contracts/production-media-v1';
import { createProductionMediaRawTransport } from './production-media-transport';

export type ProductionMediaRawRelease = Readonly<
  Pick<ProductionMediaInputV1, 'pointerRaw' | 'descriptorRaw' | 'documentsRaw'>
>;
export type ProductionMediaSourceResult =
  | Readonly<{ kind: 'failed' }>
  | Readonly<{ kind: 'ready'; ready: ProductionMediaReadyV1; raw: ProductionMediaRawRelease }>;
export type ProductionMediaSafetyCommit = (
  safety: ProductionMediaSafetyV1,
  signal: AbortSignal,
) => Promise<ProductionMediaSafetyV1>;
const failed = Object.freeze({ kind: 'failed' as const });
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const snapshot = <T>(value: T): T => freeze(JSON.parse(canonicalJson(value)) as T);

/** The trusted commit port must resolve only after durable, exact safety readback. */
export function createProductionMediaSource(
  options: Readonly<{
    metadataOrigin: string;
    allowedOrigins: ReadonlySet<string>;
    providerPolicy?: ProductionMediaProviderPolicyV1;
    fetch?: typeof fetch;
    now?: () => number;
  }>,
) {
  const clock = options.now ?? Date.now;
  const origins = new Set(options.allowedOrigins);
  const providerPolicy = compileProductionMediaProviderPolicyV1(options.providerPolicy, origins);
  if (!providerPolicy) throw new Error('provider-policy');
  const transport = createProductionMediaRawTransport(options.metadataOrigin, {
    ...(options.fetch ? { fetch: options.fetch } : {}),
    now: clock,
  });
  return Object.freeze({
    async load(
      input: Readonly<{
        signal: AbortSignal;
        knownSafety: ProductionMediaSafetyV1;
        commitSafety: ProductionMediaSafetyCommit;
      }>,
    ): Promise<ProductionMediaSourceResult> {
      let session: ReturnType<typeof transport.begin> | null = null;
      try {
        const signal = input.signal;
        const commit = input.commitSafety;
        const known = snapshot(input.knownSafety);
        session = transport.begin(signal);
        const active = session;
        const pointerRaw = (
          await active.read('/content/media/v1/current.json', productionMediaLimitsV1.pointer)
        ).rawText;
        const pointer: unknown = JSON.parse(pointerRaw);
        if (!isProductionMediaPointerV1(pointer)) return failed;
        const descriptorResult = await active.read(pointer.descriptorPath, pointer.descriptorBytes);
        const descriptorRaw = descriptorResult.rawText;
        const descriptor: unknown = JSON.parse(descriptorRaw);
        if (
          !isProductionMediaDescriptorV1(descriptor) ||
          descriptorResult.byteLength !== pointer.descriptorBytes ||
          descriptor.releaseRevision !== pointer.releaseRevision ||
          descriptor.sequence !== pointer.sequence ||
          descriptor.revocationFloor !== pointer.revocationFloor ||
          (await active.wait(() => sha256Utf8(descriptorRaw))) !== pointer.descriptorSha256
        )
          return failed;
        const revocation = descriptor.documents.find((row) => row.name === 'revocation')!;
        const revocationRaw = (await active.read(revocation.path, revocation.bytes)).rawText;
        // A1 safety reads only revocation. No ordinary payload exists in this phase.
        const documentsRaw = {
          revocation: revocationRaw,
          manifest: '',
          admission: '',
          rights: '',
          consent: '',
        };
        const safety = await active.wait(() =>
          validateProductionMediaSafetyV1({
            pointerRaw,
            descriptorRaw,
            documentsRaw,
            now: clock(),
            knownSafety: known,
          }),
        );
        if (!safety) return failed;
        const durable = snapshot(await active.wait(() => commit(safety, active.signal)));
        if (canonicalJson(durable) !== canonicalJson(safety)) return failed;
        // Recheck expiry and hash-bound safety after the durable wait, before payload requests.
        if (
          !(await active.wait(() =>
            validateProductionMediaSafetyV1({
              pointerRaw,
              descriptorRaw,
              documentsRaw,
              now: clock(),
              knownSafety: durable,
            }),
          ))
        )
          return failed;
        for (const name of ['manifest', 'admission', 'rights', 'consent'] as const) {
          const binding = descriptor.documents.find((row) => row.name === name)!;
          documentsRaw[name] = (await active.read(binding.path, binding.bytes)).rawText;
        }
        const raw = freeze({ pointerRaw, descriptorRaw, documentsRaw });
        const ready = await active.wait(() =>
          validateProductionMediaReleaseV1({
            ...raw,
            now: clock(),
            allowedOrigins: origins,
            knownSafety: durable,
            providerPolicy,
          }),
        );
        active.check();
        return ready ? Object.freeze({ kind: 'ready', ready, raw }) : failed;
      } catch {
        return failed;
      } finally {
        session?.close();
      }
    },
  });
}
