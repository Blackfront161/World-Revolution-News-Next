import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acknowledgeActivity,
  emptyActivityState,
  freezeActivityState,
  isActivityQuietTime,
  isActivityState,
  nextActivityState,
  projectActivity,
  recordActivityVisit,
  ProductionUserActivityError,
  type ActivityArticle,
  type ActivityState,
} from '../../../packages/browser-content/src/production-user-activity';
import {
  createActivityController,
  type ActivityContext,
  type ActivityView,
} from '../../../packages/browser-content/src/production-user-activity/controller';
import type { ActivityStore } from '../../../packages/browser-content/src/production-user-activity/store';

const id = (n: number) => `wrn-art-${n.toString(16).padStart(32, '0')}`;
const digest = (n: number) => n.toString(16).padStart(64, '0');
const article = (n: number, overrides: Partial<ActivityArticle> = {}): ActivityArticle => ({
  id: id(n),
  admittedContentSha256: digest(n),
  selected: true,
  readOrSaved: false,
  ...overrides,
});
const enabled = (articles: readonly ActivityArticle[]) =>
  recordActivityVisit({ ...emptyActivityState(), enabled: true }, articles);
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const disposals: Array<() => void> = [];
afterEach(() => {
  disposals.splice(0).forEach((dispose) => dispose());
  vi.useRealTimers();
});

function runtime(
  initial: ActivityState = emptyActivityState(),
  rows: readonly ActivityArticle[] = [article(1)],
) {
  let persisted = freezeActivityState(initial);
  let context: ActivityContext = {
    key: 'following:release-1',
    active: true,
    following: true,
    personalized: true,
    articles: rows,
  };
  let visible = true;
  let permission: NotificationPermission = 'default';
  const changes: ActivityView[] = [];
  const closeNotice = vi.fn();
  const show = vi.fn(() => ({ close: closeNotice }));
  const request = vi.fn(async () => permission);
  const store: ActivityStore = {
    snapshot: vi.fn(async () => persisted),
    save: vi.fn(async (next, generation, signal) => {
      if (signal?.aborted) throw new ProductionUserActivityError('aborted');
      if (generation !== persisted.generation) throw new ProductionUserActivityError('conflict');
      persisted = freezeActivityState(next);
      return persisted;
    }),
    clear: vi.fn(async (generation) => {
      if (generation !== persisted.generation) throw new ProductionUserActivityError('conflict');
      persisted = emptyActivityState(generation + 1);
      return persisted;
    }),
    close: vi.fn(),
  };
  const open = vi.fn(async () => store);
  const controller = createActivityController({
    client: 'mobile',
    context: () => context,
    visible: () => visible,
    now: () => new Date(2026, 8, 12, 12),
    notifications: { supported: true, permission: () => permission, request, show },
    onChange: (view) => changes.push(view),
    open,
  });
  disposals.push(controller.dispose);
  return {
    controller,
    store,
    open,
    changes,
    request,
    show,
    closeNotice,
    persisted: () => persisted,
    rows: (next: readonly ActivityArticle[]) => {
      context = { ...context, articles: next };
    },
    context: (patch: Partial<ActivityContext>) => {
      context = { ...context, ...patch };
    },
    visible: (next: boolean) => {
      visible = next;
    },
    permission: (next: NotificationPermission) => {
      permission = next;
    },
    concurrent: (next: ActivityState) => {
      persisted = next;
    },
  };
}

describe('local production activity rules', () => {
  it('first visit has no fabricated new items; a filter change does not create novelty', () => {
    const first = enabled([article(1, { selected: false })]);
    expect(projectActivity(first, [article(1)], null).newIds).toEqual([]);
    expect(
      projectActivity(first, [article(1), article(2), article(3, { selected: false })]).newIds,
    ).toEqual([id(2)]);
  });
  it('retains older read fingerprints over repeated visits until exact acknowledgement', () => {
    const first = enabled([article(1, { readOrSaved: true })]);
    const changed = article(1, { readOrSaved: true, admittedContentSha256: digest(99) });
    const second = recordActivityVisit(first, [changed]);
    expect(second.fingerprints[id(1)]).toBe(digest(1));
    expect(projectActivity(recordActivityVisit(second, [changed]), [changed]).changedIds).toEqual([
      id(1),
    ]);
    expect(projectActivity(acknowledgeActivity(second, changed), [changed]).changedIds).toEqual([]);
  });
  it('does not invent change history for existing read rows, or for a new release with identical content', () => {
    const read = article(1, { readOrSaved: true });
    expect(projectActivity(enabled([read]), [read]).changedIds).toEqual([]);
    expect(projectActivity(enabled([article(2)]), [read]).changedIds).toEqual([]);
    expect(projectActivity(enabled([read]), []).changedIds).toEqual([]);
  });
  it('does not silently evict when bounds would be exceeded', () => {
    expect(() =>
      recordActivityVisit(
        { ...emptyActivityState(), enabled: true },
        Array.from({ length: 201 }, (_, n) => article(n)),
      ),
    ).toThrow();
    const state = enabled(Array.from({ length: 200 }, (_, n) => article(n, { readOrSaved: true })));
    expect(() => recordActivityVisit(state, [article(999)])).toThrow('capacity');
    expect(Object.keys(state.fingerprints)).toHaveLength(200);
  });
  it.each([
    { ...emptyActivityState(), version: 2 },
    { ...emptyActivityState(), unknown: true },
    { ...emptyActivityState(), generation: -1 },
    { ...emptyActivityState(), availableIds: ['article-a'] },
    {
      ...emptyActivityState(),
      notifications: { ...emptyActivityState().notifications, quietStart: 1440 },
    },
    { ...emptyActivityState(), enabled: false, visited: true },
  ])('protects future and malformed state', (value) => expect(isActivityState(value)).toBe(false));
  it('handles midnight quiet hours and invalid clocks conservatively', () => {
    const settings = emptyActivityState().notifications;
    expect(isActivityQuietTime(settings, new Date(2026, 8, 12, 22, 0))).toBe(true);
    expect(isActivityQuietTime(settings, new Date(2026, 8, 13, 7, 59))).toBe(true);
    expect(isActivityQuietTime(settings, new Date(2026, 8, 13, 8, 0))).toBe(false);
    expect(isActivityQuietTime({ ...settings, quietStart: 500, quietEnd: 500 }, new Date())).toBe(
      true,
    );
    expect(isActivityQuietTime(settings, new Date(NaN))).toBe(true);
  });
});

describe('production activity ownership and notification flow', () => {
  it('never treats an unchanged visit or acknowledgement as a confirmed write', async () => {
    const r = runtime(enabled([article(1)]));
    await r.controller.mount();
    r.context({ following: false });
    expect(await r.controller.visit()).toBe(false);
    expect(await r.controller.acknowledge(id(1), digest(1))).toBe(false);
    expect(await r.controller.disableNotifications()).toBe(false);
    expect(await r.controller.setQuietHours(1320, 480)).toBe(false);
    expect(r.store.save).not.toHaveBeenCalled();
  });
  it.each(['following', 'personalized'] as const)(
    'rejects notification permission if %s is removed before or during the prompt',
    async (field) => {
      const r = runtime(enabled([article(1)]));
      await r.controller.mount();
      r.context({ [field]: false });
      expect(await r.controller.enableNotifications()).toBe(false);
      expect(r.request).not.toHaveBeenCalled();
      r.context({ [field]: true });
      const request = deferred<NotificationPermission>();
      r.request.mockImplementation(() => request.promise);
      const enabling = r.controller.enableNotifications();
      expect(r.request).toHaveBeenCalledTimes(1);
      r.context({ [field]: false });
      request.resolve('granted');
      expect(await enabling).toBe(false);
      expect(r.persisted().notifications.enabled).toBe(false);
      expect(r.store.save).not.toHaveBeenCalled();
    },
  );
  it('keeps the article UI available when the overview capacity is exceeded', async () => {
    const r = runtime(enabled([article(1)]));
    await r.controller.mount();
    const before = r.persisted();
    r.rows(Array.from({ length: 201 }, (_, n) => article(n)));
    expect(() => r.controller.view()).not.toThrow();
    expect(r.controller.view()).toMatchObject({ phase: 'error', failure: 'capacity', newIds: [] });
    expect(r.persisted()).toEqual(before);
    expect(r.store.save).not.toHaveBeenCalled();
  });
  it('silences actual notification delivery in quiet hours and after a denied or default permission', async () => {
    const r = runtime(enabled([article(1)]), [article(1), article(2)]);
    await r.controller.mount();
    await r.controller.visit();
    r.permission('granted');
    await r.controller.enableNotifications();
    await r.controller.setQuietHours(0, 1439);
    await r.controller.notifyNew();
    expect(r.show).not.toHaveBeenCalled();
    await r.controller.setQuietHours(1320, 480);
    for (const permission of ['denied', 'default'] as const) {
      r.permission(permission);
      await r.controller.notifyNew();
      expect(r.show).not.toHaveBeenCalled();
    }
    r.permission('granted');
    await r.controller.notifyNew();
    expect(r.show).toHaveBeenCalledTimes(1);
  });
  it('mounts disabled without storing article history; enables only after explicit action', async () => {
    const r = runtime();
    await r.controller.mount();
    expect(r.store.save).not.toHaveBeenCalled();
    expect(r.request).not.toHaveBeenCalled();
    expect(await r.controller.enable()).toBe(true);
    expect(r.persisted().availableIds).toEqual([id(1)]);
    expect(r.controller.view().firstVisit).toBe(true);
  });
  it('keeps a visit comparison through filter/language updates and hides it off Following', async () => {
    const r = runtime(enabled([article(1)]), [article(1), article(2)]);
    await r.controller.mount();
    await r.controller.visit();
    expect(r.controller.view().newIds).toEqual([id(2)]);
    r.rows([article(1), article(2, { selected: false })]);
    expect(r.controller.view().newIds).toEqual([]);
    r.rows([article(1), article(2)]);
    expect(r.controller.view().newIds).toEqual([id(2)]);
    r.context({ following: false });
    expect(r.controller.view().newIds).toEqual([]);
    r.context({ following: true, active: false });
    expect(r.controller.view().newIds).toEqual([]);
  });
  it('records newly marked read items once without overwriting an older changed version', async () => {
    const r = runtime(enabled([article(1)]), [article(1, { readOrSaved: true })]);
    await r.controller.mount();
    await r.controller.rememberRead();
    r.rows([article(1, { readOrSaved: true, admittedContentSha256: digest(99) })]);
    await r.controller.rememberRead();
    expect(r.controller.view().changedIds).toEqual([id(1)]);
    expect(await r.controller.acknowledge(id(1), digest(98))).toBe(false);
    expect(r.persisted().fingerprints[id(1)]).toBe(digest(1));
    await r.controller.refresh();
    await r.controller.acknowledge(id(1), digest(99));
    expect(r.persisted().fingerprints[id(1)]).toBe(digest(99));
  });
  it('requests permission in the click call stack and respects denial', async () => {
    const r = runtime(enabled([article(1)]));
    await r.controller.mount();
    r.permission('denied');
    const action = r.controller.enableNotifications();
    expect(r.request).toHaveBeenCalledTimes(1);
    await action;
    expect(r.persisted().notifications.enabled).toBe(false);
    expect(r.controller.view().failure).toBe('permission-denied');
    expect(r.show).not.toHaveBeenCalled();
  });
  it('deduplicates generic notices and closes them on disable', async () => {
    const initial = enabled([article(1)]);
    const r = runtime(
      nextActivityState(initial, { notifications: { ...initial.notifications, enabled: true } }),
      [article(1), article(2)],
    );
    r.permission('granted');
    await r.controller.mount();
    await r.controller.visit();
    await r.controller.notifyNew();
    await r.controller.notifyNew();
    expect(r.show).toHaveBeenCalledTimes(1);
    expect(r.persisted().notifications.notifiedIds).toEqual([id(2)]);
    await r.controller.disableNotifications();
    expect(r.closeNotice).toHaveBeenCalled();
    expect(r.persisted().notifications.enabled).toBe(false);
  });
  it('clear wins over a pending permission result', async () => {
    const r = runtime(enabled([article(1)]));
    const pending = deferred<NotificationPermission>();
    r.request.mockImplementation(() => pending.promise);
    await r.controller.mount();
    const enabling = r.controller.enableNotifications();
    await r.controller.clear();
    pending.resolve('granted');
    await enabling;
    expect(r.persisted().enabled).toBe(false);
    expect(r.persisted().availableIds).toEqual([]);
    expect(r.show).not.toHaveBeenCalled();
  });
  it('does not clear a concurrent newer state', async () => {
    const r = runtime(enabled([article(1)]));
    await r.controller.mount();
    const concurrent = nextActivityState(r.persisted(), { availableIds: [id(1), id(2)] });
    r.concurrent(concurrent);
    expect(await r.controller.clear()).toBe(false);
    expect(r.persisted()).toEqual(concurrent);
  });
  it('hidden or disposed commands do not save or notify', async () => {
    const r = runtime(enabled([article(1)]));
    await r.controller.mount();
    r.visible(false);
    await r.controller.visit();
    await r.controller.notifyNew();
    expect(r.store.save).not.toHaveBeenCalled();
    r.controller.dispose();
    expect(r.store.close).toHaveBeenCalled();
    expect(await r.controller.enable()).toBe(false);
    expect(r.controller.view().phase).toBe('disposed');
  });
  it('bounds and closes an abandoned late opening handle', async () => {
    vi.useFakeTimers();
    const late = deferred<ActivityStore>();
    const r = runtime();
    r.open.mockImplementation(() => late.promise);
    const mounting = r.controller.mount();
    await vi.advanceTimersByTimeAsync(5001);
    await mounting;
    expect(r.controller.view().phase).toBe('error');
    late.resolve(r.store);
    await Promise.resolve();
    expect(r.store.close).toHaveBeenCalled();
    expect(r.store.save).not.toHaveBeenCalled();
  });
});
