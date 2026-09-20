import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import snapshot from './data/content-directory-v1.json';

beforeEach(() =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(snapshot))),
);
afterEach(() => vi.restoreAllMocks());

describe('MobileContentDirectoryRoute', () => {
  it('renders the three sections, local filters and safe external links', async () => {
    const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
    render(<MobileContentDirectoryRoute language="en" headingRef={{ current: null }} />);
    expect(await screen.findByText('Showing 30 of 493')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'it' } });
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
    const link = screen.getAllByRole('link').at(0)!;
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  });
  it('keeps source HTTP endpoints nonclickable and exposes each selected section', async () => {
    const { MobileContentDirectoryRoute } = await import('./MobileContentDirectoryRoute');
    const { rerender } = render(<MobileContentDirectoryRoute language="en" section="sources" />);
    expect(await screen.findByRole('heading', { name: 'Sources' })).toBeInTheDocument();
    expect(
      screen.getAllByText('Historical HTTP endpoint; not opened here.').length,
    ).toBeGreaterThan(0);
    rerender(<MobileContentDirectoryRoute language="en" section="sport" />);
    expect(await screen.findByRole('heading', { name: 'Sport reading notes' })).toBeInTheDocument();
  });
});
