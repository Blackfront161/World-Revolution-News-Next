import {
  mobileKnowledgeRuntimeMaxBytes,
  projectMobileKnowledge,
  validateMobileKnowledge,
  type MobileKnowledgeV1,
} from '@wrn/content-contracts/mobile-knowledge-v1';
import assetUrl from './data/legacy-knowledge-v1.json?url';
import { readLocalJsonAsset } from '../../local-json-asset';

export type WebsiteKnowledge = Readonly<{
  document: MobileKnowledgeV1;
  projection: ReturnType<typeof projectMobileKnowledge>;
}>;

let verified: WebsiteKnowledge | null = null;

async function readJson(signal: AbortSignal): Promise<unknown> {
  return readLocalJsonAsset(assetUrl, signal, mobileKnowledgeRuntimeMaxBytes);
}

export async function loadWebsiteKnowledge(signal: AbortSignal): Promise<WebsiteKnowledge> {
  if (verified !== null) return verified;
  const candidate = await readJson(signal);
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  const result = validateMobileKnowledge(candidate);
  if (!result.ok || result.value === null) throw new TypeError('knowledge-asset-invalid');
  verified = Object.freeze({
    document: result.value,
    projection: projectMobileKnowledge(result.value),
  });
  return verified;
}

export function resetWebsiteKnowledgeCacheForTest() {
  verified = null;
}
