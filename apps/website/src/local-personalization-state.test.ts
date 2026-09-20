import { afterEach, expect, it, vi } from 'vitest';
import { canonicalJson } from '@wrn/content-contracts';
import { createLocalPersonalizationState } from '@wrn/domain';
import { createLocalPersonalizationStore } from '../../../packages/browser-content/src/local-personalization-state';
import {
  createWebsitePersonalizationStore,
  websitePersonalizationStorageKey,
} from './local-personalization-state';

const mobileKey = 'wrn.mobile-local-personalization.v1';
const state = createLocalPersonalizationState({
  interestIds: ['movement-news'],
  regionIds: [],
  contentLanguageIds: ['en'],
})!;
afterEach(() => window.localStorage.clear());

it('isolates Website save, clear and storage-event conflicts from the Mobile key on the same origin', () => {
  const web = createWebsitePersonalizationStore();
  const mobile = createLocalPersonalizationStore(mobileKey);
  try {
    const webLoad = web.load();
    expect(mobile.save(mobile.load(), state).kind).toBe('saved');
    window.dispatchEvent(new StorageEvent('storage', { key: mobileKey }));
    expect(web.save(webLoad, state).kind).toBe('saved');
    expect(localStorage.getItem(websitePersonalizationStorageKey)).toBe(canonicalJson(state));
    expect(web.clear(web.load()).kind).toBe('cleared');
    expect(localStorage.getItem(mobileKey)).toBe(canonicalJson(state));
    expect(localStorage.getItem(websitePersonalizationStorageKey)).toBeNull();
  } finally {
    web.dispose();
    mobile.dispose();
  }
});

it('rejects foreign and consumed load receipts without writing', () => {
  const first = createWebsitePersonalizationStore();
  const second = createWebsitePersonalizationStore();
  try {
    const load = first.load();
    expect(second.save(load, state).kind).toBe('blocked');
    expect(localStorage.getItem(websitePersonalizationStorageKey)).toBeNull();
    expect(first.save(load, state).kind).toBe('saved');
    expect(first.clear(load).kind).toBe('blocked');
    expect(localStorage.getItem(websitePersonalizationStorageKey)).toBe(canonicalJson(state));
  } finally {
    first.dispose();
    second.dispose();
  }
});

it('preserves changed and malformed bytes on stale save/clear, then permits an explicit current clear', () => {
  const store = createWebsitePersonalizationStore();
  try {
    const load = store.load();
    const raw = '{future-version';
    localStorage.setItem(websitePersonalizationStorageKey, raw);
    expect(store.save(load, state).kind).toBe('conflict');
    const protectedLoad = store.load();
    expect(protectedLoad).toEqual({ kind: 'protected', raw });
    expect(store.save(protectedLoad, state).kind).toBe('blocked');
    expect(localStorage.getItem(websitePersonalizationStorageKey)).toBe(raw);
    const before = store.load();
    localStorage.setItem(websitePersonalizationStorageKey, '{newer');
    expect(store.clear(before).kind).toBe('conflict');
    expect(localStorage.getItem(websitePersonalizationStorageKey)).toBe('{newer');
    expect(store.clear(store.load()).kind).toBe('cleared');
  } finally {
    store.dispose();
  }
});

it('invalidates an observed same-key ABA change and removes its listener on dispose', () => {
  const events = new EventTarget();
  const remove = vi.spyOn(events, 'removeEventListener');
  const store = createWebsitePersonalizationStore(localStorage, events);
  const load = store.load();
  events.dispatchEvent(new StorageEvent('storage', { key: websitePersonalizationStorageKey }));
  expect(store.save(load, state).kind).toBe('conflict');
  store.dispose();
  expect(remove).toHaveBeenCalledWith('storage', expect.any(Function));
  expect(localStorage.getItem(websitePersonalizationStorageKey)).toBeNull();
});
