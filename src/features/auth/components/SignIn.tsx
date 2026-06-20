import React, { useState } from 'react';

import { supabase } from '@/features/auth/services/supabaseClient';

import type { SignInProps } from '../types';
import { getAuthErrorMessage } from './authErrors';

export function SignIn({ onSuccess, onMfaRequired }: SignInProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(getAuthErrorMessage(signInError));
      return;
    }

    // Password verified the session at AAL1. If the account has a verified MFA
    // factor, Supabase reports nextLevel = 'aal2' while currentLevel is still
    // 'aal1' — the session is NOT fully authenticated until the TOTP step-up
    // completes. Route to the MFA challenge instead of treating sign-in as done.
    const { data: aal, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (
      !aalError &&
      aal &&
      aal.nextLevel === 'aal2' &&
      aal.nextLevel !== aal.currentLevel
    ) {
      if (onMfaRequired) onMfaRequired();
      return;
    }

    if (onSuccess) onSuccess();
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
          {error}
        </div>
      )}
      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="signin-email"
            className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 outline-none transition-colors duration-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="signin-password"
            className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 outline-none transition-colors duration-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
