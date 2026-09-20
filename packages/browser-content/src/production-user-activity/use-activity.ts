import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  createActivityController,
  type ActivityContext,
  type ActivityNotificationPort,
  type ActivityView,
} from './controller';
import { openProductionUserActivityStore, type ActivityClient } from './store';

export function useProductionUserActivity(
  client: ActivityClient | null,
  context: ActivityContext,
  notifications: ActivityNotificationPort,
) {
  const latest = useRef({ context, notifications });
  latest.current = { context, notifications };
  const [controller, setController] = useState<ReturnType<typeof createActivityController> | null>(
    null,
  );
  const [snapshot, setSnapshot] = useState<ActivityView | null>(null);
  const visited = useRef(false);
  const visiting = useRef<object | null>(null);
  const [visitRetry, setVisitRetry] = useState(0);
  useEffect(() => {
    if (client === null) return;
    visited.current = false;
    visiting.current = null;
    let active = true;
    const instance = createActivityController({
      client,
      context: () => latest.current.context,
      visible: () => document.visibilityState === 'visible',
      now: () => new Date(),
      notifications: {
        supported: latest.current.notifications.supported,
        permission: () => latest.current.notifications.permission(),
        request: () => latest.current.notifications.request(),
        show: () => latest.current.notifications.show(),
      },
      open: openProductionUserActivityStore,
      onChange: (next) => {
        if (active) setSnapshot(next);
      },
    });
    setController(instance);
    void instance.mount();
    const resume = () => {
      if (document.visibilityState === 'visible') void instance.refresh();
      else instance.contextChanged();
    };
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      active = false;
      visiting.current = null;
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', resume);
      instance.dispose();
    };
  }, [client]);
  const view = snapshot && controller ? controller.view() : null;
  useLayoutEffect(() => {
    if (client !== null) controller?.contextChanged();
  }, [client, controller, context.key, context.active, context.following, context.personalized]);
  useEffect(() => {
    if (!context.following) {
      visited.current = false;
      visiting.current = null;
      return;
    }
    if (
      !visited.current &&
      visiting.current === null &&
      context.active &&
      context.personalized &&
      view?.phase === 'ready' &&
      view.contentAvailable &&
      view.value?.enabled &&
      !view.busy &&
      controller
    ) {
      const attempt = {};
      visiting.current = attempt;
      void controller.visit().then((saved) => {
        if (visiting.current !== attempt) return;
        visiting.current = null;
        visited.current = saved;
        setVisitRetry((retry) => retry + 1);
      });
    }
  }, [
    controller,
    context.following,
    context.key,
    context.active,
    context.personalized,
    view?.phase,
    view?.value?.enabled,
    view?.busy,
    view?.contentAvailable,
    visitRetry,
  ]);
  const newKey = view?.newIds.join(',');
  const readKey = context.articles
    .filter((article) => article.readOrSaved)
    .map((article) => `${article.id}:${article.admittedContentSha256}`)
    .join(',');
  useEffect(() => {
    if (client !== null && view?.phase === 'ready' && !view.busy && view.value?.enabled)
      void controller?.rememberRead();
  }, [client, controller, readKey, view?.phase, view?.busy, view?.value?.enabled]);
  useEffect(() => {
    if (
      client !== null &&
      view?.phase === 'ready' &&
      !view.busy &&
      view.value?.notifications.enabled
    )
      void controller?.notifyNew();
  }, [client, controller, newKey, view?.phase, view?.busy, view?.value?.notifications.enabled]);
  return {
    controller,
    view: client === null ? null : view,
    enable: () => {
      visited.current = true;
      const attempt = {};
      visiting.current = attempt;
      void controller?.enable().then((saved) => {
        if (visiting.current !== attempt) return;
        visiting.current = null;
        visited.current = saved;
        setVisitRetry((retry) => retry + 1);
      });
    },
  };
}
