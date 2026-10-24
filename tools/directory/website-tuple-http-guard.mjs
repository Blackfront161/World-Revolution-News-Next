import { createHash } from 'node:crypto';

const commonHeaders = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'cross-origin',
  'strict-transport-security': 'max-age=31536000',
  'access-control-allow-origin': '*',
});
const requireValue = (ok, code) => {
  if (!ok) throw Error(code);
};

function validateCsp(value) {
  requireValue(typeof value === 'string' && value.length < 16000, 'tuple-http-csp');
  const directives = new Map();
  for (const part of value
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean)) {
    const [name, ...sources] = part.split(/\s+/);
    requireValue(!directives.has(name), 'tuple-http-csp-duplicate');
    directives.set(name, sources);
  }
  for (const key of ['base-uri', 'form-action', 'frame-ancestors', 'object-src'])
    requireValue(JSON.stringify(directives.get(key)) === '["\'none\'"]', 'tuple-http-csp-' + key);
  for (const key of ['default-src', 'worker-src'])
    requireValue(JSON.stringify(directives.get(key)) === '["\'self\'"]', 'tuple-http-csp-' + key);
  const scripts = directives.get('script-src');
  requireValue(
    scripts?.includes("'self'") &&
      scripts.every(
        (source) => source === "'self'" || /^'sha256-[A-Za-z0-9+/]{43}='$/.test(source),
      ),
    'tuple-http-csp-script',
  );
}

/** Capture the current owner's CSP for this publication, then require the same policy throughout it. */
export function createWebsiteTupleHttpGuard(fetchImpl = fetch) {
  let csp = null;
  let checked = 0;
  const fetchChecked = async (input, init = {}) => {
    const url = new URL(input);
    const pointer = url.pathname === '/wrn-website-content/current.json';
    requireValue(
      url.origin === 'https://solinaridao.com' &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        (pointer ||
          /^\/wrn-website-content\/snapshots\/website-[0-9]{12}-[a-f0-9]{64}\.json$/.test(
            url.pathname,
          )),
      'tuple-http-path',
    );
    requireValue(pointer || csp !== null, 'tuple-http-pointer-first');
    const requestHeaders = new Headers(init.headers);
    requireValue(
      !requestHeaders.has('authorization') && !requestHeaders.has('cookie'),
      'tuple-http-credentials',
    );
    const response = await fetchImpl(url, {
      ...init,
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    });
    requireValue(response.status === 200 && !response.redirected, 'tuple-http-response');
    for (const [name, expected] of Object.entries(commonHeaders))
      requireValue(response.headers.get(name) === expected, 'tuple-http-' + name);
    requireValue(
      response.headers.get('cache-control') ===
        (pointer ? 'no-store' : 'public, max-age=31536000, immutable'),
      'tuple-http-cache-control',
    );
    const currentCsp = response.headers.get('content-security-policy');
    validateCsp(currentCsp);
    if (csp === null) csp = currentCsp;
    requireValue(currentCsp === csp, 'tuple-http-csp-changed');
    checked++;
    return response;
  };
  return Object.freeze({
    fetch: fetchChecked,
    receipt: () => ({
      checked,
      cspSha256: csp === null ? null : createHash('sha256').update(csp).digest('hex'),
    }),
  });
}
