import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import descriptor from '../../public/wrn-local-release/v1/release-descriptor.json';
import manifest from '../../public/wrn-local-release/v1/manifest.json';
import articles from '../../public/wrn-local-release/v1/articles.json';
import supplementalItems from '../../public/wrn-local-release/v1/supplemental-items.json';
import discoverIndex from '../../public/wrn-local-release/v1/discover-index.json';
import readerDetails from '../../public/wrn-local-release/v1/reader-details.json';
import archiveLifecycle from '../../public/wrn-local-release/v1/archive-lifecycle.json';
import websitePublication from '../../public/wrn-local-release/v1/website-publication.json';

const localReleaseDocuments: Readonly<Record<string, unknown>> = Object.freeze({
  '/wrn-local-release/v1/release-descriptor.json': descriptor,
  '/wrn-local-release/v1/manifest.json': manifest,
  '/wrn-local-release/v1/articles.json': articles,
  '/wrn-local-release/v1/supplemental-items.json': supplementalItems,
  '/wrn-local-release/v1/discover-index.json': discoverIndex,
  '/wrn-local-release/v1/reader-details.json': readerDetails,
  '/wrn-local-release/v1/archive-lifecycle.json': archiveLifecycle,
  '/wrn-local-release/v1/website-publication.json': websitePublication,
});

const originalLocks = navigator.locks;

function jsonResponse(value: unknown, status = 200): Response {
  const body = JSON.stringify(value);
  return new Response(body, {
    status,
    headers: {
      'content-type': 'application/json',
      'content-length': String(new TextEncoder().encode(body).byteLength),
    },
  });
}

beforeEach(() => {
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: async <T>(
        _name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => T | PromiseLike<T>,
      ) => callback(null),
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const path = new URL(
        typeof input === 'string' ? input : input.toString(),
        'https://wrn.local',
      ).pathname;
      const document = localReleaseDocuments[path];
      return document === undefined ? jsonResponse({}, 404) : jsonResponse(document);
    }),
  );
});

afterEach(() => {
  cleanup();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: originalLocks,
  });
});
