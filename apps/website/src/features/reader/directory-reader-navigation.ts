import { createContext } from 'react';
export const DirectoryReaderNavigation = createContext<
  ((id: string, trigger: HTMLElement) => void) | null
>(null);
