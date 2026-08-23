import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('website foundation shell', () => {
  it('renders semantic website landmarks and a neutral boundary note', () => {
    render(<App initialState="ready" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Website foundation navigation' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(
      screen.getByText(
        'There are no articles, assets, providers, analytics, or live requests here.',
      ),
    ).toBeInTheDocument();
  });

  it('supports keyboard activation of the offline preview', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);
    const offlineButton = screen.getByRole('button', { name: 'Show offline' });
    offlineButton.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('No remote content');
    expect(offlineButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('announces the next theme target and marks loading as busy', async () => {
    const user = userEvent.setup();
    render(<App initialState="loading" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    const themeButton = screen.getByRole('button', { name: 'Switch to dark theme' });
    await user.click(themeButton);
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });
});
