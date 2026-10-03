import {
  mobileKnowledgeRuntimeMaxBytes,
  projectMobileKnowledge,
  validateMobileKnowledge,
  type MobileKnowledgeV1,
} from '@wrn/content-contracts/mobile-knowledge-v1';
import assetUrl from './packed/legacy-knowledge-v1.json?url';
import { readLocalJsonAsset } from '../../local-json-asset';
import { draftKnowledgeTermIds } from './lexicon-editorial-status';

export type WebsiteKnowledge = Readonly<{
  document: MobileKnowledgeV1;
  projection: ReturnType<typeof projectMobileKnowledge>;
  glossaryDocument: MobileKnowledgeV1;
  draftTermIds: ReadonlySet<string>;
}>;

let verified: WebsiteKnowledge | null = null;

async function readJson(signal: AbortSignal): Promise<unknown> {
  return readLocalJsonAsset(assetUrl, signal, mobileKnowledgeRuntimeMaxBytes);
}

export async function loadWebsiteKnowledge(signal: AbortSignal): Promise<WebsiteKnowledge> {
  signal.throwIfAborted();
  if (verified !== null) return verified;
  const candidate = await readJson(signal);
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  if (
    typeof candidate !== 'object' ||
    candidate === null ||
    Array.isArray(candidate) ||
    Object.keys(candidate).length !== 3 ||
    !('schema' in candidate) ||
    candidate.schema !== 'wrn.website-knowledge-package.v2' ||
    !('history' in candidate) ||
    !('currentKnowledge' in candidate)
  )
    throw new TypeError('knowledge-package-invalid');
  const result = validateMobileKnowledge(candidate.history);
  const glossary = validateMobileKnowledge(candidate.currentKnowledge);
  if (!glossary.ok || glossary.value === null) throw new TypeError('glossary-asset-invalid');
  if (!result.ok || result.value === null) throw new TypeError('knowledge-asset-invalid');
  verified = Object.freeze({
    document: glossary.value,
    projection: projectMobileKnowledge(glossary.value),
    glossaryDocument: glossary.value,
    draftTermIds: draftKnowledgeTermIds(glossary.value),
  });
  return verified;
}

export function resetWebsiteKnowledgeCacheForTest() {
  verified = null;
}
