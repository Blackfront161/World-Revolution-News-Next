import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('mobile foundation shell', () => {
  it('renders semantic landmarks and the ready state', () => {
    render(<App initialState="ready" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Mobile foundation navigation' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Ready');
  });

  it('supports keyboard activation of a local error state', async () => {
    const user = userEvent.setup();
    render(<App initialState="ready" />);
    const errorButton = screen.getByRole('button', { name: 'error' });
    errorButton.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('local preview error');
    expect(errorButton).toHaveAttribute('aria-pressed', 'true');
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
