import { type FormEvent, useState } from 'react';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { getAuthErrorMessage } from '@/features/auth/components/authErrors';
import { supabase } from '@/features/auth/services/supabaseClient';

import { AuthPage } from '../AuthPage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  'w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors duration-200';

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setPasswordError(getAuthErrorMessage(signInError));
        return;
      }

      const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (
        !aalError &&
        aal &&
        aal.nextLevel === 'aal2' &&
        aal.nextLevel !== aal.currentLevel
      ) {
        navigate('/auth/mfa');
        return;
      }

      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPage>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in to sync your boards across devices.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="signin-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'signin-email-error' : undefined}
          />
          {emailError && (
            <p id="signin-email-error" className="mt-1 text-xs text-error">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="signin-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${fieldClass} pr-10`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={
                passwordError ? 'signin-password-error' : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {passwordError && (
            <p id="signin-password-error" className="mt-1 text-xs text-error">
              {passwordError}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            to="/auth/forgot-password"
            className="text-xs font-medium text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        >
          {isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        New here?{' '}
        <Link
          to="/auth/sign-up"
          className="font-medium text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Create an account
        </Link>
      </p>
    </AuthPage>
  );
}

export default SignInPage;
