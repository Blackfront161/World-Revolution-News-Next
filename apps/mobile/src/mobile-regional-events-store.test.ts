import { describe, expect, it } from 'vitest';
import { mobileRegionalEventsDatabaseName } from './mobile-regional-events-store';

describe('regional events event store boundary', () => {
  it('uses its own versioned database name', () =>
    expect(mobileRegionalEventsDatabaseName).toBe('wrn-mobile-regional-events-v1'));
});
