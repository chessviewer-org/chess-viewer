import { type FormEvent, useState } from 'react';

import { Loader2, MailCheck } from '@/assets/icons';
import { Link } from 'wouter';

import { getAuthErrorMessage, supabase } from '@/auth';

import { AuthPage } from './AuthPage';
import { EMAIL_PATTERN } from './utils/authUtils';
import styles from './styles/auth-forms.module.scss';

function ForgotPasswordPage() {
  // State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Handlers
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
            href="/auth/sign-in"
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
          <label htmlFor="forgot-email" className="form-label">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            className={styles['fieldClass']}
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
          className={styles['submitButtonClass']}
        >
          {isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link
          href="/auth/sign-in"
          className="font-medium text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to Sign In
        </Link>
      </p>
    </AuthPage>
  );
}

export default ForgotPasswordPage;
