import { describe, expect, it } from 'vitest';

import { isLocalSourcePreferencesV1, sourcePreferencesMaxBytes } from './source-preferences-v1';

const directoryId = `source-${'a'.repeat(64)}`;
const valid = {
  contractVersion: '1.0.0',
  schema: 'wrn.local-source-preferences.v1',
  choices: [
    { catalog: 'production', sourceId: 'same-name', action: 'follow' },
    { catalog: 'directory', sourceId: directoryId, action: 'hide' },
  ],
};

describe('local source preferences V1 contract', () => {
  it('accepts opaque scoped identities without requiring a catalog snapshot', () => {
    expect(isLocalSourcePreferencesV1(valid)).toBe(true);
    expect(
      isLocalSourcePreferencesV1({
        ...valid,
        choices: [{ catalog: 'production', sourceId: 'unknown-but-retained', action: 'hide' }],
      }),
    ).toBe(true);
  });

  it.each([
    ['extra document key', { ...valid, foreign: true }],
    ['extra choice key', { ...valid, choices: [{ ...valid.choices[0], sourceName: 'same-name' }] }],
    ['future version', { ...valid, contractVersion: '2.0.0' }],
    [
      'duplicate scoped identity',
      { ...valid, choices: [valid.choices[0], { ...valid.choices[0], action: 'hide' }] },
    ],
    [
      'bad production whitespace',
      { ...valid, choices: [{ catalog: 'production', sourceId: ' source ', action: 'follow' }] },
    ],
    [
      'production control character',
      {
        ...valid,
        choices: [{ catalog: 'production', sourceId: 'source\nunsafe', action: 'follow' }],
      },
    ],
    [
      'wrong directory namespace',
      { ...valid, choices: [{ catalog: 'directory', sourceId: 'same-name', action: 'follow' }] },
    ],
  ])('rejects %s', (_label, value) => {
    expect(isLocalSourcePreferencesV1(value)).toBe(false);
  });

  it('enforces the UTF-8 document ceiling and catalog-scoped identity', () => {
    const oversizedId = 'x'.repeat(sourcePreferencesMaxBytes);
    expect(
      isLocalSourcePreferencesV1({
        ...valid,
        choices: [{ catalog: 'production', sourceId: oversizedId, action: 'follow' }],
      }),
    ).toBe(false);
    expect(
      isLocalSourcePreferencesV1({
        ...valid,
        choices: [
          { catalog: 'production', sourceId: 'shared', action: 'follow' },
          { catalog: 'directory', sourceId: directoryId, action: 'hide' },
        ],
      }),
    ).toBe(true);
  });
});
