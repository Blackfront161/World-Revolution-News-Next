import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@wrn/brand-tokens/styles.css';
import './styles.css';
import { App } from './App';
import { createNativePlatformSession } from './native-platform';

const nativePlatform = createNativePlatformSession();
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App
      shareAdapter={nativePlatform.shareAdapter}
      onHistorySessionChange={nativePlatform.setHistorySession}
      onNavigationReady={nativePlatform.start}
    />
  </StrictMode>,
);
window.addEventListener('pagehide', nativePlatform.dispose, { once: true });
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('pagehide', nativePlatform.dispose);
    nativePlatform.dispose();
    root.unmount();
  });
}
