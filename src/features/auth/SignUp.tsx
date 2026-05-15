import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export function SignUp({ onSuccess }: { onSuccess?: () => void }) {
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
      setError(signUpError.message);
    } else {
      setSuccess(true);
      if (onSuccess) onSuccess();
    }
  };

  if (success) {
    return (
      <div className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-accent">Check your email</h3>
        <p className="text-sm text-text-secondary">
          We've sent a confirmation link to finish setting up your account.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">{error}</div>}
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Email</label>
          <input 
            type="email" 
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/35 outline-none transition-all"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Password</label>
          <input 
            type="password" 
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/35 outline-none transition-all"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={8}
          />
        </div>
        <button type="submit" className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-glow transition-colors hover:bg-accent-hover">
          Create Account
        </button>
      </form>
    </div>
  );
}
