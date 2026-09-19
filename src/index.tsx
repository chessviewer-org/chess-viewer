import { hydrate, render } from 'preact';
import { StrictMode } from 'react';

import { AuthProvider } from '@/auth';

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
    !document.documentElement.classList.contains('route-mismatch')
  );
}

if (canHydrate()) {
  hydrate(app, root);
} else {
  render(app, root);
}

document.documentElement.classList.remove('route-mismatch');

if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
