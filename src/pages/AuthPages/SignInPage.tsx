import { type FormEvent, useState } from 'react';

import { Eye, EyeOff, Loader2 } from '@/assets/icons';
import { Link, useLocation } from 'wouter';

import { getAuthErrorMessage, supabase } from '@/auth';

import { AuthPage } from './AuthPage';
import { EMAIL_PATTERN } from './utils/authUtils';
import styles from './styles/auth-forms.module.scss';

function SignInPage() {
  // State
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers
  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

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
        email: email.trim(),
        password
      });

      if (signInError) {
        setFormError(getAuthErrorMessage(signInError));
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

      <form
        id="signin-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error"
          >
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="signin-email" className="form-label">
            Email
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            className={styles['fieldClass']}
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
          <label htmlFor="signin-password" className="form-label">
            Password
          </label>
          <div className="relative">
            <input
              id="signin-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${styles['fieldClass']} pr-10`}
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
            href="/auth/forgot-password"
            className="text-xs font-medium text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles['submitButtonClass']}
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
          href="/auth/sign-up"
          className="font-medium text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Create an account
        </Link>
      </p>
    </AuthPage>
  );
}

export default SignInPage;
