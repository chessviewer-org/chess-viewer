import { render } from 'preact';
import { StrictMode } from 'react';

import { AuthProvider } from '@/auth';

import App from './App';

import './index.css';

render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
  document.getElementById('root') as HTMLElement
);

if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
