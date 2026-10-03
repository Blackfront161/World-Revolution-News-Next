import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { uiLanguageIds } from '@wrn/ui-language';
import { WebsiteGuide } from './WebsiteGuide';
import { websiteGuideCopy, websiteGuideActions } from './website-guide-copy';
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.removeAttribute('open');
    },
  });
});
afterEach(cleanup);
it.each(uiLanguageIds)(
  'opens six local tasks and canonical actions without provider, speech or media effects in %s',
  async (language) => {
    const fetch = vi.mocked(globalThis.fetch);
    fetch.mockClear();
    render(<WebsiteGuide language={language} />);
    const trigger = screen.getByRole('button', { name: websiteGuideCopy[language].title });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: websiteGuideCopy[language].title });
    expect(dialog).toHaveAttribute('lang', language);
    expect(dialog.querySelectorAll('details')).toHaveLength(6);
    for (const [title, text] of websiteGuideCopy[language].tasks) {
      expect(screen.getByText(title)).toBeVisible();
      fireEvent.click(screen.getByText(title));
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: websiteGuideActions[language][1] })).toHaveAttribute(
      'href',
      `/?lang=${language}#media/radio`,
    );
    expect(screen.getByRole('link', { name: websiteGuideActions[language][2] })).toHaveAttribute(
      'href',
      `/?lang=${language}#media/podcasts`,
    );
    expect(screen.getByRole('link', { name: websiteGuideActions[language][3] })).toHaveAttribute(
      'href',
      `/?lang=${language}#knowledge/library`,
    );
    expect(dialog.querySelectorAll('audio,video,iframe,form')).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  },
);
