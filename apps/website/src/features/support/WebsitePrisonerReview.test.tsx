import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PrisonerReviewBadge,
  PrisonerSupportLinks,
  useWebsitePrisonerReviewClock,
} from './WebsitePrisonerReview';
import { websitePrisonerReview } from './prisoner-review';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function Cards() {
  const states = useWebsitePrisonerReviewClock();
  return (
    <>
      {websitePrisonerReview.profiles.map((p) => (
        <PrisonerReviewBadge key={p.id} profileId={p.id} language="de" state={states.get(p.id)} />
      ))}
    </>
  );
}
describe('prisoner review website', () => {
  it('shows five original support links with privacy attributes and no automatic action controls', () => {
    render(<PrisonerSupportLinks language="de" />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
    for (const link of links) {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.getAttribute('referrerpolicy')).toBe('no-referrer');
    }
    expect(screen.queryByRole('button')).toBeNull();
    expect(links.find((l) => l.textContent === 'Prison Radio')?.getAttribute('href')).toBe(
      'https://www.prisonradio.org/',
    );
  });
  it('refreshes an open route at local midnight and on focus while keeping all 17 unreviewed profiles blocked', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 8, 23, 59, 59));
    const { container } = render(<Cards />);
    expect(
      container.querySelectorAll('[data-prisoner-review-state="dated-address-match"]'),
    ).toHaveLength(13);
    expect(container.querySelectorAll('[data-prisoner-review-state="needs-review"]')).toHaveLength(
      17,
    );
    expect(container.querySelector('time[datetime="2026-10-03"]')?.textContent).toBe('2026-10-03');
    act(() => vi.advanceTimersByTime(1100));
    expect(container.querySelectorAll('[data-prisoner-review-state="expired"]')).toHaveLength(13);
    expect(container.querySelectorAll('[data-prisoner-review-state="needs-review"]')).toHaveLength(
      17,
    );
    vi.setSystemTime(new Date(2026, 10, 8, 23, 59));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(container.querySelectorAll('[data-prisoner-review-state="expired"]')).toHaveLength(13);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
