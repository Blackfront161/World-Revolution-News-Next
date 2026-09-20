import { afterEach, expect, it, vi } from 'vitest';
import { mobileProductionContentDeliveryProfile as profile } from './production-content-delivery-profile';

afterEach(() => vi.unstubAllGlobals());
it('binds distinct immutable bootstrap and refresh transports to compiled origins', async () => {
  const fetch = vi.fn<(url: RequestInfo | URL) => Promise<Response>>(
    async () => new Response('{}', { headers: { 'content-type': 'application/json' } }),
  );
  vi.stubGlobal('fetch', fetch);
  localStorage.setItem('wrn.production-update-origin', 'https://attacker.example');
  try {
    const signal = new AbortController().signal;
    await profile.bootstrapSource.verifySafety(signal, { revision: 0, revokedIds: [] });
    await profile.refreshSource.verifySafety(signal, { revision: 0, revokedIds: [] });
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      '/wrn-production-content/current.json',
      'https://solinaridao.com/wrn-production-content/current.json',
    ]);
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.refreshSource)).toBe(true);
    expect(profile.refreshSource).not.toBe(profile.bootstrapSource);
  } finally {
    localStorage.removeItem('wrn.production-update-origin');
  }
});
