import { hydrate, render } from 'preact';
import { StrictMode } from 'react';

import { AuthProvider } from '@/auth';
import { loadAnalyticsBeacon } from '@utils';

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

function canHydrate(): boolean {
  return (
    root.hasChildNodes() &&
    !document.documentElement.classList.contains('prerender-stale')
  );
}

if (canHydrate()) {
  hydrate(app, root);
} else {
  render(app, root);
}

document.documentElement.classList.remove('prerender-stale');

if (import.meta.env.PROD) {
  window.addEventListener('vite:preloadError', () => window.location.reload());
  loadAnalyticsBeacon();
}
