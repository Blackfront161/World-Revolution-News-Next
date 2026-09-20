import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMobileKnowledgeCopy } from '@wrn/ui-language';
import { MobileKnowledgeRoute } from './MobileKnowledgeRoute';
import * as knowledgeLoader from './knowledge-loader';
import snapshot from './data/legacy-knowledge-v1.json';

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async () => new Response(JSON.stringify(snapshot)),
  );
});
afterEach(() => vi.restoreAllMocks());

describe('MobileKnowledgeRoute', () => {
  it.each([
    ['anarchist-library-en', 'de'],
    ['anarchist-library-de', 'de'],
    ['anarchist-library-es', 'es'],
    ['anarchist-library-fr', 'fr'],
    ['anarchist-library-it', 'it'],
    ['libcom-library', 'de'],
    ['kate-sharpley-library', 'de'],
    ['zabalaza-books', 'de'],
    ['anarchist-archive', 'de'],
  ])(
    'marks the actual description language of %s independently of UI and catalogue language',
    async (id, descriptionLanguage) => {
      render(<MobileKnowledgeRoute language="en" headingRef={{ current: null }} />);
      const source = snapshot.library.sources.find((entry) => entry.id === id)!;
      expect(await screen.findByText(source.description)).toHaveAttribute(
        'lang',
        descriptionLanguage,
      );
    },
  );
  it('renders real data, source catalogues and language fallback', async () => {
    const headingRef = { current: null };
    const copy = getMobileKnowledgeCopy('fr');
    render(<MobileKnowledgeRoute language="fr" headingRef={headingRef} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: copy.library })).toBeInTheDocument(),
    );
    expect(screen.getByText(/609/)).toBeInTheDocument();
    expect(screen.getAllByText('The Anarchist Library').length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole('button', { name: copy.lexicon }));
    expect(await screen.findByText(copy.fallback)).toBeInTheDocument();
  });
  it('combines filters, preserves empty source catalogues, and offers only actual formats', async () => {
    const copy = getMobileKnowledgeCopy('en');
    render(<MobileKnowledgeRoute language="en" headingRef={{ current: null }} />);
    await screen.findByText(/of 609/);
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: 'anarchist-library-de' },
    });
    expect(screen.getByText(copy.noResults)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open catalogue' })).toHaveLength(9);
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'it' } });
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'epub' } });
    fireEvent.change(screen.getByLabelText(copy.search), {
      target: { value: 'A chi non si dissocia' },
    });
    expect(screen.getByText(/of 1/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: copy.read })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'EPUB' })).toHaveAttribute(
      'referrerpolicy',
      'no-referrer',
    );
  });
  it('recovers from a failed data load without replacing it with unvalidated data', async () => {
    const copy = getMobileKnowledgeCopy('en');
    const original = knowledgeLoader.loadMobileKnowledge;
    const load = vi
      .spyOn(knowledgeLoader, 'loadMobileKnowledge')
      .mockRejectedValueOnce(new Error('chunk unavailable'))
      .mockImplementation(original);
    try {
      render(<MobileKnowledgeRoute language="en" headingRef={{ current: null }} />);
      expect(await screen.findByText(copy.error)).toBeInTheDocument();
      expect(screen.queryByText(/of 609/)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: copy.retry }));
      expect(await screen.findByText(/of 609/)).toBeInTheDocument();
      expect(load).toHaveBeenCalledTimes(2);
    } finally {
      load.mockRestore();
    }
  });
  it('clears unrelated selections on empty search and navigates related terms', async () => {
    const copy = getMobileKnowledgeCopy('en');
    render(<MobileKnowledgeRoute language="en" headingRef={{ current: null }} />);
    fireEvent.click(await screen.findByRole('button', { name: copy.lexicon }));
    fireEvent.click(screen.getByRole('button', { name: copy.mutualAid }));
    expect(screen.getByRole('heading', { name: 'Mutual aid' })).toBeInTheDocument();
    const detail = screen.getByRole('article');
    const related = within(detail).getAllByRole('button')[0]!;
    const name = related.textContent!;
    fireEvent.click(related);
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(copy.search), { target: { value: 'zz-no-match' } });
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: copy.mutualAid }));
    expect(screen.getByLabelText(copy.search)).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'Mutual aid' })).toBeInTheDocument();
  });
});
