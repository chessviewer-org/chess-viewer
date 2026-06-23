import { type FormEvent, useState } from 'react';

import { Loader2, MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { getAuthErrorMessage } from '@/features/auth/components/authErrors';
import { supabase } from '@/features/auth/services/supabaseClient';

import { AuthPage } from '../AuthPage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  'w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors duration-200';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/auth/reset-password` }
      );

      if (resetError) {
        setEmailError(getAuthErrorMessage(resetError));
        return;
      }

      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthPage>
        <div className="rounded-xl border border-border bg-surface-elevated px-5 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <MailCheck className="h-6 w-6 text-accent" aria-hidden="true" />
          </div>
          <h1 className="mb-2 font-display text-xl font-bold text-text-primary">
            Check your email
          </h1>
          <p className="text-sm text-text-secondary">
            If an account exists for that address, we sent a reset link.
          </p>
          <Link
            to="/auth/sign-in"
            className="mt-6 inline-block text-sm font-medium text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="forgot-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'forgot-email-error' : undefined}
          />
          {emailError && (
            <p id="forgot-email-error" className="mt-1 text-xs text-error">
              {emailError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
        >
          {isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link
          to="/auth/sign-in"
          className="font-medium text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to Sign In
        </Link>
      </p>
    </AuthPage>
  );
}

export default ForgotPasswordPage;
