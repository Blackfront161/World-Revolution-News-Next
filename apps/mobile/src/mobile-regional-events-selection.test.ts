import { describe, expect, it } from 'vitest';
import {
  mobileRegionalEventsSelectionDatabaseName,
  mobileRegionalEventsSelectionKey,
} from './mobile-regional-events-selection';

describe('regional events selection isolation', () => {
  it('keeps the specified database and record key separate', () => {
    expect(mobileRegionalEventsSelectionDatabaseName).toBe(
      'wrn-mobile-regional-events-selection-v1',
    );
    expect(mobileRegionalEventsSelectionKey).toBe('wrn.mobile-regional-events-selection.v1');
  });
});
