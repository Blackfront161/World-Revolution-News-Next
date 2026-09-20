import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import snapshot from './data/content-directory-v1.json';
import { WebsiteContentDirectoryRoute } from './WebsiteContentDirectoryRoute';

afterEach(() => vi.restoreAllMocks());

it('finds the existing Direkte Aktion source by domain and name', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(snapshot), {
      headers: { 'content-type': 'application/json' },
    }),
  );
  render(
    <WebsiteContentDirectoryRoute
      language="en"
      section="sources"
      headingRef={{ current: null }}
      onSectionChange={() => {}}
    />,
  );
  await screen.findByText('Showing 30 of 532');
  for (const query of [' DIREKTEAKTION.ORG ', 'Direkte Aktion']) {
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: query } });
    expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Direkte Aktion (DE)' })).toHaveAttribute(
      'href',
      'https://direkteaktion.org/',
    );
  }
});
