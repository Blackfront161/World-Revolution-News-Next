import type { ActivityNotificationPort } from './controller';

export function browserActivityNotifications(
  copy: () => { title: string; body: string },
  enabled = true,
): ActivityNotificationPort {
  const supported =
    enabled &&
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof Notification === 'function';
  return Object.freeze({
    supported,
    permission: () => (supported ? Notification.permission : 'denied'),
    request: () =>
      supported ? Notification.requestPermission() : Promise.resolve('denied' as const),
    show() {
      if (!supported || Notification.permission !== 'granted')
        throw new Error('Notification unavailable');
      const text = copy();
      return new Notification(text.title, {
        body: text.body,
        tag: 'wrn-local-updates',
        silent: true,
      });
    },
  });
}
