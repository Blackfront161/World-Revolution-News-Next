import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { WebsiteSupportWelcome, websiteSupportSeenKey } from './website-support-welcome';
import { getWebsiteSupportCopy } from '../../../packages/ui-language/src/website-support';
import { uiLanguageIds } from '@wrn/ui-language';

beforeEach(() => {
  sessionStorage.clear();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  sessionStorage.clear();
});
it('offers reading first, has no provider request and remembers dismissal only for this session', () => {
  const request = vi.spyOn(globalThis, 'fetch');
  const view = render(<WebsiteSupportWelcome language="de" />);
  expect(screen.getByRole('button', { name: 'Weiterlesen' })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true });
  expect(screen.getByRole('link')).toHaveFocus();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Weiterlesen' })).toHaveFocus();
  const support = screen.getByRole('link');
  expect(support).toHaveAttribute('href', 'https://www.paypal.com/ncp/payment/6FSV9FEN4X7VS');
  expect(support).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Weiterlesen' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(sessionStorage.getItem(websiteSupportSeenKey)).toBe('dismissed');
  view.unmount();
  render(<WebsiteSupportWelcome language="de" />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('allows Escape dismissal even when session storage is blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('blocked');
  });
  render(<WebsiteSupportWelcome language="en" />);
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('has complete copy in all nine UI languages', () => {
  for (const language of uiLanguageIds) {
    const copy = getWebsiteSupportCopy(language);
    expect(Object.values(copy).every((value) => value.trim().length > 0)).toBe(true);
  }
});
it('remains readable and dismissible without native dialog methods', () => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  render(<WebsiteSupportWelcome language="de" />);
  expect(screen.getByRole('dialog')).toHaveAttribute('open');
  expect(screen.getByRole('button', { name: 'Weiterlesen' })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
