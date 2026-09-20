import { openProductionUserActivityStore, type ActivityClient, type ActivityStore } from './store';
import {
  acknowledgeActivity,
  emptyActivityState,
  freezeActivityState,
  isActivityQuietTime,
  nextActivityState,
  projectActivity,
  recordActivityVisit,
  ProductionUserActivityError,
  type ActivityArticle,
  type ActivityState,
} from './state';

export type ActivityContext = Readonly<{
  key: string;
  active: boolean;
  following: boolean;
  personalized: boolean;
  articles: readonly ActivityArticle[];
}>;
export type ActivityNotificationPort = Readonly<{
  supported: boolean;
  permission(): NotificationPermission;
  request(): Promise<NotificationPermission>;
  show(): { close(): void };
}>;
export type ActivityView = Readonly<{
  phase: 'loading' | 'ready' | 'error' | 'disposed';
  value: ActivityState | null;
  failure: string | null;
  firstVisit: boolean;
  newIds: readonly string[];
  changedIds: readonly string[];
  busy: boolean;
  contentAvailable: boolean;
}>;
type Ports = {
  client: ActivityClient;
  context(): ActivityContext;
  visible(): boolean;
  now(): Date;
  notifications: ActivityNotificationPort;
  onChange(view: ActivityView): void;
  open?: (client: ActivityClient, signal: AbortSignal) => Promise<ActivityStore>;
};

export function createActivityController(ports: Ports) {
  let value: ActivityState | null = null;
  let phase: ActivityView['phase'] = 'loading';
  let failure: string | null = null;
  let busy = false;
  let priorIds: readonly string[] | null | undefined;
  let store: ActivityStore | null = null;
  let epoch = 0;
  let pending: AbortController | null = null;
  let mounted = false;
  const lifetime = new AbortController();
  const notices = new Set<{ close(): void }>();
  const closeNotices = () => {
    for (const notice of notices) {
      try {
        notice.close();
      } catch {
        /* Best effort after disposal. */
      }
    }
    notices.clear();
  };
  const view = (): ActivityView => {
    const context = ports.context();
    let hints: ReturnType<typeof projectActivity> = {
      firstVisit: true,
      newIds: [],
      changedIds: [],
    };
    let projectionFailure = false;
    try {
      if (value?.enabled && context.active && phase === 'ready')
        hints = projectActivity(
          value,
          context.articles,
          priorIds === undefined ? (value.visited ? value.availableIds : null) : priorIds,
        );
    } catch {
      projectionFailure = true;
    }
    return Object.freeze({
      phase: projectionFailure ? 'error' : phase,
      value,
      failure: projectionFailure ? 'capacity' : failure,
      busy,
      contentAvailable: context.active && ports.visible(),
      firstVisit: hints.firstVisit,
      newIds: context.following && context.personalized ? hints.newIds : [],
      changedIds: hints.changedIds,
    });
  };
  const emit = () => {
    try {
      ports.onChange(view());
    } catch {
      /* Observers cannot acquire operation ownership. */
    }
  };
  const invalidate = () => {
    epoch++;
    pending?.abort();
    pending = null;
    busy = false;
    closeNotices();
  };
  const begin = () => {
    invalidate();
    const id = epoch;
    const abort = new AbortController();
    pending = abort;
    const key = ports.context().key;
    const current = (requireContent = true) =>
      phase !== 'disposed' &&
      epoch === id &&
      !abort.signal.aborted &&
      ports.visible() &&
      (!requireContent || (ports.context().active && ports.context().key === key));
    return { id, abort, current };
  };
  const install = (next: ActivityState) => {
    value = freezeActivityState(next);
    phase = 'ready';
    failure = null;
    if (!next.enabled) {
      priorIds = null;
      closeNotices();
    }
  };
  const fail = (error: unknown) => {
    failure = error instanceof ProductionUserActivityError ? error.code : 'unavailable';
    phase = 'error';
    busy = false;
    closeNotices();
    emit();
  };
  const bounded = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> =>
    new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal.removeEventListener('abort', aborted);
        callback();
      };
      const aborted = () => finish(() => reject(new ProductionUserActivityError('aborted')));
      const timer = setTimeout(
        () => finish(() => reject(new ProductionUserActivityError('timeout'))),
        5000,
      );
      signal.addEventListener('abort', aborted, { once: true });
      if (signal.aborted) aborted();
      void promise.then(
        (next) => finish(() => resolve(next)),
        (error: unknown) => finish(() => reject(error)),
      );
    });
  const mount = async () => {
    if (mounted || phase === 'disposed') return;
    mounted = true;
    try {
      const opening = (ports.open ?? openProductionUserActivityStore)(
        ports.client,
        lifetime.signal,
      );
      void opening.then(
        (handle) => {
          if (lifetime.signal.aborted) handle.close();
        },
        () => undefined,
      );
      const handle = await bounded(opening, lifetime.signal);
      if (lifetime.signal.aborted) {
        handle.close();
        return;
      }
      store = handle;
      const next = await bounded(handle.snapshot(lifetime.signal), lifetime.signal);
      if (lifetime.signal.aborted) return;
      install(next);
      emit();
    } catch (error) {
      if (!lifetime.signal.aborted) {
        lifetime.abort();
        store?.close();
        fail(error);
      }
    }
  };
  const mutate = async (
    change: (current: ActivityState) => ActivityState,
    requireContent = true,
    expectedGeneration?: number,
  ): Promise<boolean> => {
    if (!store || phase === 'disposed') return false;
    const job = begin();
    if (!job.current(requireContent)) return false;
    busy = true;
    failure = null;
    emit();
    try {
      const before = await bounded(store.snapshot(job.abort.signal), job.abort.signal);
      if (!job.current(requireContent)) return false;
      if (expectedGeneration !== undefined && before.generation !== expectedGeneration)
        throw new ProductionUserActivityError('conflict');
      const next = change(before);
      if (!job.current(requireContent)) return false;
      if (next !== before) {
        const saved = await bounded(
          store.save(next, before.generation, job.abort.signal),
          job.abort.signal,
        );
        if (!job.current(requireContent)) return false;
        install(saved);
      } else {
        install(before);
        busy = false;
        emit();
        return false;
      }
      busy = false;
      emit();
      return job.current(requireContent);
    } catch (error) {
      if (job.current(requireContent)) {
        fail(error);
        job.abort.abort();
      }
      return false;
    } finally {
      if (epoch === job.id) busy = false;
    }
  };
  const refresh = async () => {
    if (!store || phase === 'disposed') return;
    const job = begin();
    try {
      const next = await bounded(store.snapshot(job.abort.signal), job.abort.signal);
      if (job.current(false)) {
        install(next);
        emit();
      }
    } catch (error) {
      if (job.current(false)) fail(error);
    }
  };
  const visit = () =>
    mutate((current) => {
      const context = ports.context();
      if (!context.following || !context.personalized || !current.enabled) return current;
      priorIds = current.visited ? current.availableIds : null;
      return recordActivityVisit(current, context.articles);
    });
  const enable = () =>
    mutate((current) => {
      const context = ports.context();
      if (!context.following || !context.personalized || current.enabled) return current;
      priorIds = null;
      const initial = recordActivityVisit({ ...current, enabled: true }, context.articles);
      return initial;
    });
  const clear = () => {
    const expected = value?.generation;
    if (expected === undefined) return Promise.resolve(false);
    return mutate((current) => emptyActivityState(current.generation + 1), false, expected);
  };
  const acknowledge = (id: string, digest: string) =>
    mutate((current) => {
      const article = ports
        .context()
        .articles.find((entry) => entry.id === id && entry.admittedContentSha256 === digest);
      if (!article) throw new ProductionUserActivityError('conflict');
      return acknowledgeActivity(current, article);
    });
  const setQuietHours = (start: number, end: number) =>
    mutate((current) =>
      current.enabled &&
      (current.notifications.quietStart !== start || current.notifications.quietEnd !== end)
        ? nextActivityState(current, {
            notifications: { ...current.notifications, quietStart: start, quietEnd: end },
          })
        : current,
    );
  const disableNotifications = () =>
    mutate(
      (current) =>
        current.enabled && current.notifications.enabled
          ? nextActivityState(current, {
              notifications: { ...current.notifications, enabled: false },
            })
          : current,
      false,
    );
  const enableNotifications = async () => {
    if (
      !ports.notifications.supported ||
      !value?.enabled ||
      !ports.context().active ||
      !ports.context().following ||
      !ports.context().personalized ||
      !ports.visible()
    )
      return false;
    const job = begin();
    try {
      // Invoke in the actual click call stack, before the first await.
      const request = ports.notifications.request();
      busy = true;
      failure = null;
      emit();
      const permission = await bounded(request, job.abort.signal);
      if (
        !job.current() ||
        !value?.enabled ||
        !ports.context().following ||
        !ports.context().personalized
      )
        return false;
      if (permission !== 'granted') {
        busy = false;
        failure = 'permission-denied';
        emit();
        return false;
      }
      return await mutate((current) =>
        current.enabled &&
        !current.notifications.enabled &&
        ports.context().following &&
        ports.context().personalized
          ? nextActivityState(current, {
              notifications: { ...current.notifications, enabled: true },
            })
          : current,
      );
    } catch (error) {
      if (job.current()) fail(error);
      return false;
    } finally {
      if (epoch === job.id) busy = false;
    }
  };
  const notifyNew = async () => {
    const context = ports.context();
    if (
      busy ||
      !value?.enabled ||
      !value.notifications.enabled ||
      !context.following ||
      !context.personalized ||
      !context.active ||
      !ports.visible() ||
      !ports.notifications.supported ||
      ports.notifications.permission() !== 'granted' ||
      isActivityQuietTime(value.notifications, ports.now())
    )
      return;
    const ids = view().newIds.filter((id) => !value!.notifications.notifiedIds.includes(id));
    if (ids.length === 0) return;
    const key = context.key;
    let claimed = false;
    const saved = await mutate((current) => {
      if (
        !current.enabled ||
        !current.notifications.enabled ||
        !ports.context().following ||
        !ports.context().personalized ||
        isActivityQuietTime(current.notifications, ports.now())
      )
        return current;
      const selected = new Set(
        ports
          .context()
          .articles.filter((article) => article.selected)
          .map((article) => article.id),
      );
      const pendingIds = ids.filter(
        (id) => selected.has(id) && !current.notifications.notifiedIds.includes(id),
      );
      if (pendingIds.length === 0) return current;
      claimed = true;
      return nextActivityState(current, {
        notifications: {
          ...current.notifications,
          notifiedIds: [...new Set([...current.notifications.notifiedIds, ...pendingIds])].sort(),
        },
      });
    });
    if (
      !saved ||
      !claimed ||
      !value?.notifications.enabled ||
      ports.context().key !== key ||
      !ports.context().active ||
      !ports.context().following ||
      !ports.context().personalized ||
      !ports.visible() ||
      ports.notifications.permission() !== 'granted' ||
      isActivityQuietTime(value.notifications, ports.now())
    )
      return;
    try {
      notices.add(ports.notifications.show());
    } catch {
      failure = 'notification-unavailable';
      emit();
    }
  };
  const rememberRead = () => {
    if (
      busy ||
      !value?.enabled ||
      !ports.context().active ||
      !ports
        .context()
        .articles.some(
          (article) =>
            article.readOrSaved &&
            article.admittedContentSha256 !== null &&
            value!.fingerprints[article.id] === undefined,
        )
    )
      return Promise.resolve(false);
    return mutate((current) => {
      if (!current.enabled) return current;
      const fingerprints = { ...current.fingerprints };
      for (const article of ports.context().articles)
        if (
          article.readOrSaved &&
          article.admittedContentSha256 !== null &&
          fingerprints[article.id] === undefined
        )
          fingerprints[article.id] = article.admittedContentSha256;
      return Object.keys(fingerprints).length === Object.keys(current.fingerprints).length
        ? current
        : nextActivityState(current, { fingerprints });
    });
  };
  return Object.freeze({
    mount,
    refresh,
    view,
    visit,
    enable,
    clear,
    acknowledge,
    setQuietHours,
    enableNotifications,
    disableNotifications,
    notifyNew,
    rememberRead,
    contextChanged() {
      invalidate();
      emit();
    },
    dispose() {
      if (phase === 'disposed') return;
      invalidate();
      phase = 'disposed';
      value = null;
      lifetime.abort();
      store?.close();
      store = null;
    },
  });
}
