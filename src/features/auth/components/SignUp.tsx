import React, { useState } from 'react';

import { supabase } from '@/features/auth/services/supabaseClient';

import type { SignUpProps } from '../types';
import { getAuthErrorMessage } from './authErrors';

export function SignUp({ onSuccess }: SignUpProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      setError(getAuthErrorMessage(signUpError));
    } else {
      setSuccess(true);
      if (onSuccess) onSuccess();
    }
  };

  if (success) {
    return (
      <div className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-text-primary">
          Check your email
        </h3>
        <p className="text-sm text-text-secondary">
          We've sent a confirmation link to finish setting up your account.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
          {error}
        </div>
      )}
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="signup-email"
            className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="signup-password"
            className="text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
