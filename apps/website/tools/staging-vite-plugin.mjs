function normalizedOrigin(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || parsed.origin !== value)
    throw new Error('Staging Vite plugin requires an exact HTTPS origin');
  return parsed.origin;
}

function replaceExactlyOnce(source, marker, replacement, label) {
  const first = source.indexOf(marker);
  if (first < 0 || source.indexOf(marker, first + marker.length) >= 0)
    throw new Error(`Staging Vite ${label} marker changed`);
  return source.slice(0, first) + replacement + source.slice(first + marker.length);
}

export function createStagingIsolationPlugin(value) {
  const stagingOrigin = normalizedOrigin(value);
  return {
    name: 'wrn-staging-origin-and-cache-isolation',
    enforce: 'pre',
    transform(source, id) {
      const normalizedId = id.split('\\').join('/').split('?')[0];
      if (normalizedId.endsWith('/src/offline-shell/protocol.mjs')) {
        if (!source.includes('wrn.website-shell'))
          throw new Error('Staging Vite protocol namespace marker changed');
        return {
          code: source.replaceAll('wrn.website-shell', 'wrn.website-staging-shell'),
          map: null,
        };
      }
      if (normalizedId.endsWith('/src/offline-shell/browser-platform.ts')) {
        let code = replaceExactlyOnce(
          source.replaceAll('\r\n', '\n'),
          "const workerPath = '/website-shell-sw.js';",
          "const workerPath = '/website-staging-shell-sw.js';",
          'worker path',
        );
        code = replaceExactlyOnce(
          code,
          "    typeof window !== 'undefined' &&\n",
          `    typeof window !== 'undefined' &&\n    window.location.origin === ${JSON.stringify(stagingOrigin)} &&\n`,
          'origin pin',
        );
        return { code, map: null };
      }
      return null;
    },
  };
}
