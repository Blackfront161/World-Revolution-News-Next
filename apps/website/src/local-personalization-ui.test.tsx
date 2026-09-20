import { createRef } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getUiCopy } from '@wrn/ui-language';
import { WebsitePersonalizationArea } from './local-personalization-ui';
import {
  createWebsitePersonalizationStore,
  websitePersonalizationStorageKey,
} from './local-personalization-state';

const copy = getUiCopy('en');
const descriptors = ['showModal', 'close'].map(
  (key) => [key, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, key)] as const,
);
beforeEach(() => {
  for (const key of ['showModal', 'close'])
    Object.defineProperty(HTMLDialogElement.prototype, key, {
      configurable: true,
      value(this: HTMLDialogElement) {
        if (key === 'showModal') this.setAttribute('open', '');
        else this.removeAttribute('open');
      },
    });
});
afterEach(() => {
  localStorage.removeItem(websitePersonalizationStorageKey);
  vi.restoreAllMocks();
  for (const [key, value] of descriptors) {
    if (value) Object.defineProperty(HTMLDialogElement.prototype, key, value);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
  }
});
const props = () => ({
  language: 'en' as const,
  headingRef: createRef<HTMLHeadingElement>(),
  results: vi.fn(() => <p>Saved results</p>),
});

it('saves only confirmed nonempty preferences, retains drafts on language change, restores saved values and confirms clear', async () => {
  const input = props();
  const view = render(<WebsitePersonalizationArea {...input} />);
  const save = await screen.findByRole('button', { name: copy.personalizationSave });
  expect(save).toBeDisabled();
  fireEvent.click(
    screen.getByRole('checkbox', { name: copy.personalizationInterestMediaTechnology }),
  );
  expect(localStorage.getItem(websitePersonalizationStorageKey)).toBeNull();
  view.rerender(<WebsitePersonalizationArea {...input} language="de" />);
  expect(
    screen.getByRole('checkbox', { name: getUiCopy('de').personalizationInterestMediaTechnology }),
  ).toBeChecked();
  view.rerender(<WebsitePersonalizationArea {...input} />);
  fireEvent.click(save);
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', { name: copy.cancel }),
  );
  await waitFor(() => expect(save).toHaveFocus());
  expect(localStorage.getItem(websitePersonalizationStorageKey)).toBeNull();
  expect(input.results).not.toHaveBeenCalled();
  fireEvent.click(save);
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: copy.personalizationSave,
    }),
  );
  await screen.findByText('Saved results');
  expect(input.results).toHaveBeenLastCalledWith(
    expect.objectContaining({ interestIds: ['media-technology'] }),
  );
  view.unmount();
  render(<WebsitePersonalizationArea {...input} />);
  expect(
    await screen.findByRole('checkbox', { name: copy.personalizationInterestMediaTechnology }),
  ).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: copy.personalizationClear }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(localStorage.getItem(websitePersonalizationStorageKey)).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: copy.personalizationClear }));
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: copy.personalizationClear,
    }),
  );
  expect(localStorage.getItem(websitePersonalizationStorageKey)).toBeNull();
  expect(screen.queryByText('Saved results')).not.toBeInTheDocument();
});

it('preserves opaque state until explicit clear and returns a current selection after conflict/reload', async () => {
  localStorage.setItem(websitePersonalizationStorageKey, '{future');
  render(<WebsitePersonalizationArea {...props()} />);
  expect(await screen.findByText(copy.personalizationProtected)).toBeVisible();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(localStorage.getItem(websitePersonalizationStorageKey)).toBe('{future');
  fireEvent.click(screen.getByRole('button', { name: copy.personalizationClear }));
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: copy.personalizationClear,
    }),
  );
  fireEvent.click(screen.getByRole('checkbox', { name: copy.personalizationInterestSport }));
  fireEvent.click(screen.getByRole('button', { name: copy.personalizationSave }));
  localStorage.setItem(websitePersonalizationStorageKey, '{newer');
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: copy.personalizationSave,
    }),
  );
  expect(screen.getByText(copy.personalizationConflict)).toBeVisible();
  expect(localStorage.getItem(websitePersonalizationStorageKey)).toBe('{newer');
  fireEvent.click(screen.getByRole('button', { name: copy.personalizationReload }));
  expect(screen.getByText(copy.personalizationProtected)).toBeVisible();
});

it('retries unavailable storage construction and disposes the accepted store on unmount', async () => {
  const store = createWebsitePersonalizationStore();
  const dispose = vi.fn(store.dispose);
  const createStore = vi
    .fn()
    .mockImplementationOnce(() => {
      throw new Error('storage disabled');
    })
    .mockReturnValue({ ...store, dispose });
  const view = render(<WebsitePersonalizationArea {...props()} createStore={createStore} />);
  expect(await screen.findByText(copy.personalizationUnavailable)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: copy.personalizationReload }));
  expect(
    await screen.findByRole('checkbox', { name: copy.personalizationInterestSport }),
  ).toBeVisible();
  view.unmount();
  expect(dispose).toHaveBeenCalledOnce();
});
