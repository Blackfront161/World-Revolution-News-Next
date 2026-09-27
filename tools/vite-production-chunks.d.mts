export type ProductionChunkGroup = Readonly<{
  name: string;
  test: RegExp;
  priority: number;
}>;

export type ProductionCodeSplitting = Readonly<{
  groups: ProductionChunkGroup[];
}>;

export declare function createProductionCodeSplitting(): ProductionCodeSplitting;
