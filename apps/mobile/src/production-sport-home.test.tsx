import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptySourcePreferences, setSourcePreference } from '@wrn/domain';
import { getUiCopy, type UiLanguage } from '@wrn/ui-language';
import { getDirectoryCopy } from '@wrn/ui-language/directory';
import type { MobileContentDirectory } from '@wrn/content-contracts/mobile-content-directory-v1';
import { ProductionHome } from '../../../packages/browser-content/src/production-home';
import snapshot from './features/directory/data/content-directory-v1.json';
import { productionTestResult } from './production-content-test-data';

const document = snapshot as MobileContentDirectory;
const loadDirectory = async () => ({ document, projection: document });
const base = {
  articles: [],
  sourcePreferences: emptySourcePreferences(),
  renderCard: () => null,
  loadDirectory,
};

describe('productive sport entry point', () => {
  it.each(['de', 'en', 'es', 'fr', 'it', 'pt', 'ru', 'el', 'tr'] as UiLanguage[])(
    'filters existing source notes and exposes the sport directory in %s',
    async (language) => {
      const browse = vi.fn(),
        ui = getUiCopy(language),
        copy = getDirectoryCopy(language);
      const { container } = render(
        <ProductionHome
          {...base}
          language={language}
          onBrowseSport={browse}
          regionalEvents={<section data-testid="events">Events</section>}
        />,
      );
      const heading = await screen.findByRole('heading', { name: ui.sportAndFanculture });
      const section = heading.closest('section')!;
      await within(section).findByText(document.sports[0]!.title);
      expect(section.querySelectorAll('[data-home-sport-note]')).toHaveLength(3);
      expect(section.querySelectorAll('[data-sport-role="feature"]')).toHaveLength(1);
      expect(section.querySelectorAll('[data-sport-role="secondary"]')).toHaveLength(2);
      expect(section.querySelector('dl dd:last-child')).toHaveTextContent(ui.sportFootball);
      expect(
        section.compareDocumentPosition(screen.getByTestId('events')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      fireEvent.click(within(section).getByRole('button', { name: ui.sportFanculture }));
      expect(section.querySelectorAll('[data-home-sport-note]')).toHaveLength(1);
      expect(section.querySelector('dl dd:last-child')).toHaveTextContent(ui.sportFanculture);
      expect(within(section).getByRole('button', { name: ui.sportFanculture })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      fireEvent.click(within(section).getByRole('button', { name: ui.sportWomen }));
      expect(within(section).getByRole('status')).toHaveTextContent(copy.noResults);
      expect(section.querySelectorAll('[data-home-sport-note]')).toHaveLength(0);
      fireEvent.click(within(section).getByRole('button', { name: copy.all }));
      expect(section.querySelectorAll('[data-home-sport-note]')).toHaveLength(3);
      fireEvent.click(within(section).getByRole('button', { name: ui.allSportNews }));
      expect(browse).toHaveBeenCalledOnce();
      for (const link of within(section).getAllByRole('link')) {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
      }
      expect(container.querySelector('img')).toBeNull();
      expect(document.sports).toHaveLength(3);
    },
  );

  it('respects hidden source endpoints and does not repeat a news article as a sport note', async () => {
    const result = await productionTestResult();
    const duplicate = {
      ...result.runtime!.documents.articles.articles[0]!,
      originalUrl: document.sports[0]!.url,
    };
    const sourcePreferences = setSourcePreference(
      emptySourcePreferences(),
      'directory',
      document.sports[1]!.endpointIds[0]!,
      'hide',
    )!;
    const { container } = render(
      <ProductionHome
        {...base}
        articles={[duplicate]}
        sourcePreferences={sourcePreferences}
        language="de"
      />,
    );
    await screen.findByText(document.sports[2]!.title);
    expect(container.querySelectorAll('[data-home-sport-note]')).toHaveLength(1);
    expect(screen.queryByText(document.sports[0]!.title)).toBeNull();
    expect(screen.queryByText(document.sports[1]!.title)).toBeNull();
  });
});
