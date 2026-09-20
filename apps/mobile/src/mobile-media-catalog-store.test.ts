import { describe, expect, it } from 'vitest';
import {
  mobileMediaCatalogDatabaseName,
  openMobileMediaCatalogStore,
} from './mobile-media-catalog-store';
describe('media catalog store boundary', () =>
  it('uses an isolated versioned IDB database and keeps the API local', () => {
    expect(mobileMediaCatalogDatabaseName).toBe('wrn-mobile-media-catalog-v1');
    expect(typeof openMobileMediaCatalogStore).toBe('function');
  }));
