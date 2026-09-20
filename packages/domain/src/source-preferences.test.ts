import { describe, expect, it } from 'vitest';

import {
  emptySourcePreferences,
  getSourcePreference,
  projectSourcePreferences,
  setSourcePreference,
} from './source-preferences';

const endpointA = `source-${'a'.repeat(64)}`;
const endpointB = `source-${'b'.repeat(64)}`;

describe('source preference domain operations', () => {
  it('replaces follow/hide for one exact scoped source and removes it with neutral', () => {
    const followed = setSourcePreference(emptySourcePreferences(), 'production', 'eff', 'follow')!;
    const hidden = setSourcePreference(followed, 'production', 'eff', 'hide')!;
    const neutral = setSourcePreference(hidden, 'production', 'eff', 'neutral')!;
    expect(getSourcePreference(followed, 'production', 'eff')).toBe('follow');
    expect(getSourcePreference(hidden, 'production', 'eff')).toBe('hide');
    expect(neutral.choices).toEqual([]);
    expect(setSourcePreference(emptySourcePreferences(), 'directory', 'eff', 'follow')).toBeNull();
  });

  it('keeps an unknown production ID reversible and never joins a same-name directory endpoint', () => {
    const state = setSourcePreference(
      emptySourcePreferences(),
      'production',
      'unknown-same-name',
      'hide',
    )!;
    expect(getSourcePreference(state, 'production', 'unknown-same-name')).toBe('hide');
    expect(getSourcePreference(state, 'directory', endpointA)).toBe('neutral');
  });

  it('moves visible followed entries first while preserving order and retaining the normal feed', () => {
    let state = setSourcePreference(emptySourcePreferences(), 'production', 'follow-me', 'follow')!;
    state = setSourcePreference(state, 'production', 'hide-me', 'hide')!;
    const items = [
      { id: 'first', sourceId: 'ordinary' },
      { id: 'second', sourceId: 'follow-me' },
      { id: 'third', sourceId: 'hide-me' },
      { id: 'fourth', sourceId: 'follow-me' },
    ];
    const result = projectSourcePreferences(items, state, 'production', (item) => [item.sourceId]);
    expect(result.map((item) => item.id)).toEqual(['second', 'fourth', 'first']);
    expect(items.map((item) => item.id)).toEqual(['first', 'second', 'third', 'fourth']);
  });

  it('lets a hidden directory endpoint dominate following and keeps hidden saved entries accessible without a rank boost', () => {
    let state = setSourcePreference(emptySourcePreferences(), 'directory', endpointA, 'follow')!;
    state = setSourcePreference(state, 'directory', endpointB, 'hide')!;
    const items = [
      { id: 'ordinary', endpointIds: [endpointA] },
      { id: 'hidden-saved', endpointIds: [endpointA, endpointB] },
    ];
    expect(
      projectSourcePreferences(items, state, 'directory', (item) => item.endpointIds).map(
        (item) => item.id,
      ),
    ).toEqual(['ordinary']);
    expect(
      projectSourcePreferences(items, state, 'directory', (item) => item.endpointIds, {
        includeHidden: true,
      }).map((item) => item.id),
    ).toEqual(['ordinary', 'hidden-saved']);
  });
});
