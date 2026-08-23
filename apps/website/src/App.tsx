import { useEffect, useState } from 'react';
import { shellCopy } from '@wrn/brand-tokens';
import { parseShellState, type ShellState } from '@wrn/domain';

const states: readonly ShellState[] = ['ready', 'loading', 'error', 'offline'];

function stateContent(state: ShellState): { title: string; detail: string } {
  switch (state) {
    case 'loading':
      return {
        title: 'Loading preview',
        detail: 'The local website shell is preparing a deterministic state.',
      };
    case 'error':
      return {
        title: 'Preview error',
        detail: 'This is a local error demonstration. No network request was made.',
      };
    case 'offline':
      return {
        title: 'Offline preview',
        detail: 'No remote content is connected to this foundation.',
      };
    default:
      return {
        title: 'Ready for an approved slice',
        detail: 'This neutral shell has separate website navigation and layout.',
      };
  }
}

export function App({ initialState }: { initialState?: ShellState } = {}) {
  const [state, setState] = useState<ShellState>(
    () =>
      initialState ??
      parseShellState(new URLSearchParams(window.location.search).get('state')) ??
      'ready',
  );
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const copy = stateContent(state);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  return (
    <div className="website-shell">
      <a className="skip-link" href="#website-main">
        Skip to foundation preview
      </a>
      <header className="site-header">
        <div className="site-bar">
          <p className="site-name">
            WRN / Solinaridao <span>foundation</span>
          </p>
          <button
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            Theme
          </button>
        </div>
        <nav aria-label="Website foundation navigation">
          <a href="#website-main" aria-current="page">
            Preview
          </a>
          <a href="#website-states">States</a>
          <a href="#foundation-notes">Notes</a>
        </nav>
      </header>
      <main id="website-main" tabIndex={-1}>
        <section className="hero" aria-labelledby="preview-title">
          <p className="foundation-note">{shellCopy.previewLabel}</p>
          <h1 id="preview-title">Responsive website shell</h1>
          <p>{shellCopy.noParityClaim}</p>
        </section>
        <div className="website-grid">
          <section className="preview-card" aria-labelledby="website-state-title">
            <h2 id="website-state-title">{copy.title}</h2>
            <p
              role={state === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              aria-busy={state === 'loading'}
              className={`state-message state-${state}`}
            >
              {copy.detail}
            </p>
          </section>
          <aside className="preview-card" aria-labelledby="foundation-notes">
            <h2 id="foundation-notes">Foundation boundary</h2>
            <p>There are no articles, assets, providers, analytics, or live requests here.</p>
          </aside>
        </div>
        <section
          id="website-states"
          className="preview-card"
          aria-labelledby="website-state-controls"
        >
          <h2 id="website-state-controls">Preview states</h2>
          <div className="state-controls" aria-label="Select website preview state">
            {states.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={state === candidate}
                onClick={() => setState(candidate)}
              >
                Show {candidate}
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer className="site-footer">
        Local foundation only · independent website release and rollback path
      </footer>
    </div>
  );
}
