import {
  projectMobileKnowledge,
  validateMobileKnowledge,
  mobileKnowledgeRuntimeMaxBytes,
  type MobileKnowledgeV1,
} from '@wrn/content-contracts/mobile-knowledge-v1';

export type LoadedMobileKnowledge = Readonly<{
  document: MobileKnowledgeV1;
  projection: ReturnType<typeof projectMobileKnowledge>;
}>;
let successful: LoadedMobileKnowledge | null = null;
let pending: Promise<LoadedMobileKnowledge> | null = null;
async function readLocalDocument(): Promise<unknown> {
  const response = await fetch(new URL('./data/legacy-knowledge-v1.json', import.meta.url), {
    credentials: 'omit',
    redirect: 'error',
  });
  if (!response.ok || response.body === null) throw new Error('knowledge request failed');
  if (Number(response.headers.get('content-length')) > mobileKnowledgeRuntimeMaxBytes) {
    await response.body.cancel();
    throw new Error('knowledge size');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > mobileKnowledgeRuntimeMaxBytes) {
        await reader.cancel();
        throw new Error('knowledge size');
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer)) as unknown;
}
export async function loadMobileKnowledge(): Promise<LoadedMobileKnowledge> {
  if (successful !== null) return successful;
  if (pending !== null) return pending;
  pending = readLocalDocument()
    .then((document) => {
      const validation = validateMobileKnowledge(document);
      if (!validation.ok || validation.value === null)
        throw new Error(`knowledge validation: ${validation.errors.join(',')}`);
      successful = Object.freeze({
        document: validation.value,
        projection: projectMobileKnowledge(validation.value),
      });
      return successful;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
