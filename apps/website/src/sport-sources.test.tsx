import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebsiteContentDirectoryRoute } from './features/directory/WebsiteContentDirectoryRoute';
import snapshot from './features/directory/data/content-directory-v1.json';

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(snapshot), {
      headers: { 'content-type': 'application/json' },
    }),
  );
});
afterEach(cleanup);
afterEach(() => vi.restoreAllMocks());

describe('website sport source directory integration', () => {
  it('integrates a closed source section and an open sport section', async () => {
    const { rerender } = render(
      <WebsiteContentDirectoryRoute
        language="en"
        section="sources"
        headingRef={{ current: null }}
        onSectionChange={() => {}}
      />,
    );
    const summary = await screen.findByTestId('sport-sources-summary');
    expect(summary.closest('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Sport sources', level: 2 })).toBeVisible();
    rerender(
      <WebsiteContentDirectoryRoute
        language="en"
        section="sport"
        headingRef={{ current: null }}
        onSectionChange={() => {}}
      />,
    );
    expect(await screen.findByTestId('sport-sources-summary')).toHaveTextContent(
      'Sport sources (9)',
    );
    expect(screen.getByTestId('sport-sources-summary').closest('details')).toHaveAttribute('open');
  });
});
