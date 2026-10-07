import { useCallback, useEffect, useState } from 'react';
import {
  loadWebsiteContentDirectory,
  subscribeWebsiteContentDirectory,
} from '../directory/directory-loader';
export function useWebsiteDirectoryLoader() {
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeWebsiteContentDirectory(() => setRevision((n) => n + 1)), []);
  return useCallback(
    (signal: AbortSignal) => {
      void revision; // Reload shared Home when the central restrictive view changes.
      return loadWebsiteContentDirectory(signal);
    },
    [revision],
  );
}
