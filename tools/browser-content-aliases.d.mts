export type BrowserContentAlias = Readonly<{ find: RegExp; replacement: string }>;
export declare function createBrowserContentAliases(
  consumingAppPath: string,
): BrowserContentAlias[];
