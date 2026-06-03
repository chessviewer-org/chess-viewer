import React from 'react';
import ReactDOM from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';

import { ProfileProvider } from '@/features/auth/hooks/ProfileContext';
import { AuthProvider } from '@/features/auth/hooks/useAuth';

import App from './App';

import './index.css';

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
