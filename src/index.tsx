import { hydrate, render } from 'preact';
import { StrictMode } from 'react';

import { AuthProvider } from '@/auth/core/AuthProvider';
import { loadAnalyticsBeacon } from '@utils/analytics';
import { duringHydration } from '@/shared/utils/hydration';
import { suppressTransitionsUntilPainted } from '@/shared/utils/viewTransition';
import {
  inlineDocumentPieces,
  restoreSnapshot,
  snapshotOnHide
} from '@/shared/utils/pageSnapshot';
import { prefetchOnIntent, prefetchPages, preloadPage } from './routes/pages';

import App from './App';

import './index.css';
import './styles/_patterns.scss';

const root = document.getElementById('root') as HTMLElement;
const app = (
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

const PRERENDER_MISMATCH = [
  'prerender-stale',
  'prerender-dirty',
  'prerender-restored'
];

function canHydrate(): boolean {
  const { classList } = document.documentElement;
  return (
    root.hasChildNodes() &&
    !PRERENDER_MISMATCH.some((c) => classList.contains(c))
  );
}

async function mount() {
  await preloadPage(window.location.pathname).catch(() => {});
  inlineDocumentPieces();
  const restored = restoreSnapshot(root);
  const prerendered = !restored && canHydrate();
  document.documentElement.classList.remove(...PRERENDER_MISMATCH);
  suppressTransitionsUntilPainted();
  if (restored) hydrate(app, root);
  else if (prerendered) duringHydration(() => hydrate(app, root));
  else render(app, root);
  for (const event of ['pointerover', 'focusin', 'touchstart'])
    document.addEventListener(event, prefetchOnIntent, { passive: true });
  if ('requestIdleCallback' in window)
    requestIdleCallback(prefetchPages, { timeout: 5000 });
  else setTimeout(prefetchPages, 2000);
}

void mount();

if (import.meta.env.PROD) {
  window.addEventListener('vite:preloadError', () => window.location.reload());
  snapshotOnHide(root);
  loadAnalyticsBeacon();
}
