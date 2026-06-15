import React from 'react';
import ReactDOM from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';

import { ProfileProvider } from '@/features/auth/hooks/ProfileContext';
import { AuthProvider } from '@/features/auth/hooks/useAuth';

import App from './App';

import './index.css';

// Self-hosted Inter (variable wght axis, Latin + Latin-ext incl. Azerbaijani
// glyphs). Bundled — no Google Fonts request, no FOUC, privacy-first. The
// @font-face family name is 'Inter Variable' (referenced by --font-ui in
// index.css).
import '@fontsource-variable/inter';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register the Service Worker (production builds only). `autoUpdate` activates
// a new SW in the background; precached assets let hard refresh load from cache
// instead of re-downloading the bundle over the network.
if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
