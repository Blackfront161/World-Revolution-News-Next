import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

it('swipes between adjacent mobile areas without taking vertical or horizontal-list gestures', () => {
  vi.stubGlobal('innerWidth', 390);
  render(<App initialState="loading" />);
  const main = screen.getByRole('main');
  const home = screen.getAllByRole('link', { name: 'Home' })[0]!;
  const following = screen.getAllByRole('link', { name: 'For me' })[0]!;
  const content = document.createElement('p');
  content.textContent = 'News excerpt';
  main.append(content);
  const swipe = (startTarget: Element, endX: number, endY = 360) => {
    fireEvent.touchStart(startTarget, { touches: [{ clientX: 320, clientY: 350 }] });
    fireEvent.touchEnd(startTarget, { changedTouches: [{ clientX: endX, clientY: endY }] });
  };

  swipe(content, 290, 550);
  expect(home).toHaveAttribute('aria-current', 'page');

  const horizontalList = document.createElement('div');
  horizontalList.style.overflowX = 'auto';
  Object.defineProperties(horizontalList, {
    scrollWidth: { value: 500 },
    clientWidth: { value: 250 },
  });
  main.append(horizontalList);
  swipe(horizontalList, 120);
  expect(home).toHaveAttribute('aria-current', 'page');

  const button = document.createElement('button');
  main.append(button);
  swipe(button, 120);
  expect(home).toHaveAttribute('aria-current', 'page');

  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  document.body.append(dialog);
  swipe(content, 120);
  expect(home).toHaveAttribute('aria-current', 'page');
  dialog.remove();

  fireEvent.touchStart(content, { touches: [{ clientX: 320, clientY: 350 }] });
  fireEvent.touchMove(content, {
    touches: [{ clientX: 220, clientY: 350 }, { clientX: 230, clientY: 360 }],
  });
  fireEvent.touchEnd(content, { changedTouches: [{ clientX: 120, clientY: 360 }] });
  expect(home).toHaveAttribute('aria-current', 'page');

  swipe(content, 120);
  expect(following).toHaveAttribute('aria-current', 'page');
  fireEvent.touchStart(main, { touches: [{ clientX: 100, clientY: 350 }] });
  fireEvent.touchEnd(main, { changedTouches: [{ clientX: 310, clientY: 360 }] });
  expect(home).toHaveAttribute('aria-current', 'page');
});

it('keeps desktop and tablet horizontal gestures unchanged', () => {
  vi.stubGlobal('innerWidth', 768);
  render(<App initialState="loading" />);
  const main = screen.getByRole('main');
  fireEvent.touchStart(main, { touches: [{ clientX: 320, clientY: 350 }] });
  fireEvent.touchEnd(main, { changedTouches: [{ clientX: 120, clientY: 360 }] });
  expect(screen.getAllByRole('link', { name: 'Home' })[0]).toHaveAttribute('aria-current', 'page');
});
