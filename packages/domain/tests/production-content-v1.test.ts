import { describe, expect, it } from 'vitest';
import { resolveProductionContentLifecycleV1 } from '@wrn/content-contracts';
import { projectProductionContentResolutionV1 } from '../src/production-content-v1.js';

const articleId = 'wrn-art-0123456789abcdef0123456789abcdef' as const;
const aliasId = 'wrn-art-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

describe('production content projection v1', () => {
  it('uses the core lifecycle rule and rejects aliases to a revoked target', () => {
    const input = {
      requestedArticleId: aliasId,
      articleIds: [articleId],
      activeArticleIds: [articleId],
      aliases: [{ sourceId: aliasId, targetId: articleId }],
      goneIds: [],
      revokedIds: [articleId],
    } as const;
    expect(projectProductionContentResolutionV1(input)).toEqual(
      resolveProductionContentLifecycleV1(input),
    );
    expect(projectProductionContentResolutionV1(input)).toMatchObject({ kind: 'invalid' });
  });
});
