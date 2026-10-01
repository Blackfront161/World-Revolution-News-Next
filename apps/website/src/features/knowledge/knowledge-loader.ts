import {
  mobileKnowledgeRuntimeMaxBytes,
  projectMobileKnowledge,
  validateMobileKnowledge,
  type MobileKnowledgeV1,
} from '@wrn/content-contracts/mobile-knowledge-v1';
import assetUrl from './packed/legacy-knowledge-v1.json?url';
import { readLocalJsonAsset } from '../../local-json-asset';

export type WebsiteKnowledge = Readonly<{
  document: MobileKnowledgeV1;
  projection: ReturnType<typeof projectMobileKnowledge>;
  glossaryDocument: MobileKnowledgeV1;
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
    candidate.schema !== 'wrn.website-knowledge-package.v1' ||
    !('history' in candidate) ||
    !('currentGlossary' in candidate)
  )
    throw new TypeError('knowledge-package-invalid');
  const result = validateMobileKnowledge(candidate.history);
  const glossary = validateMobileKnowledge(candidate.currentGlossary);
  if (
    !glossary.ok ||
    glossary.value === null ||
    glossary.value.library.books.length !== 0 ||
    glossary.value.library.sources.length !== 0
  )
    throw new TypeError('glossary-asset-invalid');
  if (!result.ok || result.value === null) throw new TypeError('knowledge-asset-invalid');
  verified = Object.freeze({
    document: result.value,
    projection: {
      ...projectMobileKnowledge(result.value),
      terms: projectMobileKnowledge(glossary.value).terms,
      lexiconSources: projectMobileKnowledge(glossary.value).lexiconSources,
    },
    glossaryDocument: glossary.value,
  });
  return verified;
}

export function resetWebsiteKnowledgeCacheForTest() {
  verified = null;
}
