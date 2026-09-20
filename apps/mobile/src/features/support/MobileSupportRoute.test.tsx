import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import supportData from './data/legacy-support-v1.json';
import { MobileSupportRoute, type MobileSupportNavigationGuard } from './MobileSupportRoute.js';

const loader = vi.fn(async () => supportData);

describe('MobileSupportRoute', () => {
  it('shows an overdue help entry without a direct contact action or a network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(
      <MobileSupportRoute
        section="help"
        language="en"
        loader={loader}
        now={() => new Date('2026-12-01T00:00:00.000Z')}
      />,
    );
    await screen.findByRole('heading', { name: 'Help directory' });
    expect(screen.getAllByText(/Review overdue/u).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Official contact' })).toBeNull();
    expect(screen.getAllByRole('link', { name: 'Official website' }).length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('filters historical profiles locally and never renders excluded legacy fields', async () => {
    const user = userEvent.setup();
    render(
      <MobileSupportRoute
        section="solidarity"
        language="de"
        loader={loader}
        now={() => new Date('2026-09-09T00:00:00.000Z')}
      />,
    );
    await screen.findByRole('heading', { name: 'Solidaritätsverzeichnis' });
    const search = screen.getByRole('textbox', { name: 'Suche' });
    await user.type(search, 'Hridindu');
    expect(screen.getByText('Hridindu Roychowdhury')).toBeVisible();
    expect(screen.queryByText('Malik Muhammed')).toBeNull();
    expect(document.body.textContent).not.toMatch(
      /mailingAddress|prisonerId|birthday|pronouns|movementTags|politicalOrientation/iu,
    );
    expect(screen.queryByText(/Adresse/u)).toBeNull();
  });

  it('preserves a user draft against template replacement and completes a typed navigation guard only after discard', async () => {
    const user = userEvent.setup();
    let guard: MobileSupportNavigationGuard | null = null;
    const firstContinuation = vi.fn();
    const latestContinuation = vi.fn();
    render(
      <MobileSupportRoute
        section="solidarity"
        language="en"
        loader={loader}
        onNavigationGuardChange={(value) => {
          guard = value;
        }}
      />,
    );
    await screen.findByRole('heading', { name: 'Solidarity directory' });
    expect(guard).toBeNull();
    await user.type(screen.getByRole('textbox', { name: 'Letter text' }), 'My local draft');
    await user.click(screen.getByRole('button', { name: 'Use neutral template' }));
    expect(screen.getByRole('textbox', { name: 'Letter text' })).toHaveValue('My local draft');
    await waitFor(() => expect(guard).not.toBeNull());
    await act(async () => {
      expect(guard!(firstContinuation)).toBe(false);
      expect(guard!(latestContinuation)).toBe(false);
    });
    expect(screen.getByRole('dialog', { name: 'Discard this unexported draft?' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Discard and continue' }));
    expect(firstContinuation).not.toHaveBeenCalled();
    expect(latestContinuation).toHaveBeenCalledOnce();
    expect(guard).toBeNull();
  });

  it('keeps the draft after native dialog escape and returns focus to its cancel action', async () => {
    const user = userEvent.setup();
    let guard: MobileSupportNavigationGuard | null = null;
    render(
      <MobileSupportRoute
        section="solidarity"
        language="en"
        loader={loader}
        onNavigationGuardChange={(value) => {
          guard = value;
        }}
      />,
    );
    await screen.findByRole('heading', { name: 'Solidarity directory' });
    await user.type(screen.getByRole('textbox', { name: 'Letter text' }), 'Keep this draft');
    await waitFor(() => expect(guard).not.toBeNull());
    await act(async () => {
      expect(guard!(vi.fn())).toBe(false);
    });
    const continueButton = screen.getByRole('button', { name: 'Continue editing' });
    await waitFor(() => expect(continueButton).toHaveFocus());
    const dialog = screen.getByRole('dialog', { name: 'Discard this unexported draft?' });
    await act(async () => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(screen.queryByRole('dialog', { name: 'Discard this unexported draft?' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Letter text' })).toHaveValue('Keep this draft');
  });

  it('rechecks direct contact at click time and does not restore a contact after the clock moves backward', async () => {
    const user = userEvent.setup();
    let instant = new Date('2026-09-10T00:00:00.000Z');
    render(<MobileSupportRoute section="help" language="en" loader={loader} now={() => instant} />);
    await screen.findByRole('heading', { name: 'Help directory' });
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Access Now');
    const contact = screen.getByRole('link', { name: 'Official contact' });
    instant = new Date('2026-10-09T00:00:00.000Z');
    expect(fireEvent.click(contact)).toBe(false);
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Official contact' })).toBeNull(),
    );
    instant = new Date('2026-09-10T00:00:00.000Z');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(screen.queryByRole('link', { name: 'Official contact' })).toBeNull();
  });

  it('prints only the explicit letter text and exports a selected region without a query or draft', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:support-export');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    render(<MobileSupportRoute section="solidarity" language="en" loader={loader} />);
    await screen.findByRole('heading', { name: 'Solidarity directory' });
    await user.type(screen.getByRole('textbox', { name: 'Letter text' }), 'Only this letter text');
    await user.click(screen.getByRole('button', { name: 'Print draft' }));
    await waitFor(() => expect(print).toHaveBeenCalledOnce());
    expect(document.querySelector('.support-print-only')?.textContent).toBe(
      'Only this letter text',
    );
    window.dispatchEvent(new Event('afterprint'));

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Hridindu');
    expect(screen.getByRole('button', { name: 'Export regional list' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Region for list export'), 'Europe');
    await user.click(screen.getByRole('button', { name: 'Export regional list' }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    print.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it('retries a failed local load without accepting a stale failed run', async () => {
    const retryingLoader = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk'))
      .mockResolvedValue(supportData);
    const user = userEvent.setup();
    render(<MobileSupportRoute section="help" language="en" loader={retryingLoader} />);
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByRole('heading', { name: 'Help directory' });
    expect(retryingLoader).toHaveBeenCalledTimes(2);
  });
});
