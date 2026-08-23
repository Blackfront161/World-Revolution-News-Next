import { useEffect, useState } from 'react';
import { shellCopy } from '@wrn/brand-tokens';
import { parseShellState, type ShellState } from '@wrn/domain';

const states: readonly ShellState[] = ['ready', 'loading', 'error', 'offline'];

function stateMessage(state: ShellState): string {
  switch (state) {
    case 'loading':
      return 'The local foundation is loading its preview state.';
    case 'error':
      return 'A local preview error is shown. No request was sent.';
    case 'offline':
      return 'Offline preview: no remote content is available in this foundation.';
    default:
      return 'Ready for the first approved local content slice.';
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  return (
    <div className="mobile-shell">
      <a className="skip-link" href="#mobile-main">
        Skip to foundation preview
      </a>
      <header className="mobile-header">
        <p className="eyebrow">WRN · local mobile shell</p>
        <div className="header-row">
          <h1>Foundation preview</h1>
          <button
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            Theme
          </button>
        </div>
      </header>
      <nav aria-label="Mobile foundation navigation" className="mobile-nav">
        <a href="#mobile-main" aria-current="page">
          Preview
        </a>
        <a href="#state-controls">States</a>
      </nav>
      <main id="mobile-main" tabIndex={-1}>
        <section aria-labelledby="mobile-state-title" className="preview-card">
          <p className="foundation-note">
            {shellCopy.previewLabel} · {shellCopy.noParityClaim}
          </p>
          <h2 id="mobile-state-title">{state.charAt(0).toUpperCase() + state.slice(1)} state</h2>
          <p
            role={state === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            aria-busy={state === 'loading'}
            className={`state-message state-${state}`}
          >
            {stateMessage(state)}
          </p>
        </section>
        <section
          id="state-controls"
          aria-labelledby="state-controls-title"
          className="preview-card"
        >
          <h2 id="state-controls-title">Local state controls</h2>
          <p>These controls change only this in-memory preview.</p>
          <div className="state-controls" aria-label="Select preview state">
            {states.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-pressed={state === candidate}
                onClick={() => setState(candidate)}
              >
                {candidate}
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer>Mobile and website are separate applications. No remote service is connected.</footer>
    </div>
  );
}
