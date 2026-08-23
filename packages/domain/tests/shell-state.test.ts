import { describe, expect, it } from 'vitest';

import {
  hasResolvedShellState,
  isRecoverableShellState,
  isShellState,
  parseShellState,
  shellStates,
} from '../src/index.js';

describe('ShellState', () => {
  it('exports the complete, stable Foundation state set', () => {
    expect(shellStates).toEqual(['ready', 'loading', 'error', 'offline']);
  });

  it('accepts only exact supported string values', () => {
    for (const state of shellStates) {
      expect(isShellState(state)).toBe(true);
      expect(parseShellState(state)).toBe(state);
    }

    expect(isShellState('READY')).toBe(false);
    expect(isShellState(' loading ')).toBe(false);
    expect(isShellState(null)).toBe(false);
    expect(isShellState({ state: 'ready' })).toBe(false);
  });

  it('fails closed to null for unsupported values without coercion', () => {
    expect(parseShellState('unknown')).toBeNull();
    expect(parseShellState('READY')).toBeNull();
    expect(parseShellState(1)).toBeNull();
    expect(parseShellState(undefined)).toBeNull();
  });

  it('classifies recovery and resolution deterministically', () => {
    expect(isRecoverableShellState('error')).toBe(true);
    expect(isRecoverableShellState('offline')).toBe(true);
    expect(isRecoverableShellState('ready')).toBe(false);
    expect(hasResolvedShellState('loading')).toBe(false);
    expect(hasResolvedShellState('ready')).toBe(true);
    expect(hasResolvedShellState('error')).toBe(true);
    expect(hasResolvedShellState('offline')).toBe(true);
  });
});
