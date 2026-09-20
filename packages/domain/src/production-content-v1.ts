/** Client-neutral projection helpers for already validated production core releases. */
import {
  resolveProductionContentLifecycleV1,
  type ProductionContentResolutionV1,
} from '@wrn/content-contracts';

export type ProductionContentResolutionProjectionV1 = ProductionContentResolutionV1;

export interface ProductionContentLifecycleProjectionInputV1 {
  readonly requestedArticleId: unknown;
  readonly articleIds: readonly `wrn-art-${string}`[];
  readonly activeArticleIds: readonly `wrn-art-${string}`[];
  readonly aliases: readonly {
    readonly sourceId: `wrn-art-${string}`;
    readonly targetId: `wrn-art-${string}`;
  }[];
  readonly goneIds: readonly `wrn-art-${string}`[];
  readonly revokedIds: readonly `wrn-art-${string}`[];
}
export function projectProductionContentResolutionV1(
  input: ProductionContentLifecycleProjectionInputV1,
): ProductionContentResolutionProjectionV1 {
  return resolveProductionContentLifecycleV1(input);
}
