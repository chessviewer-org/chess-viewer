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

if (root.hasChildNodes()) {
  hydrate(app, root);
} else {
  render(app, root);
}

if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
