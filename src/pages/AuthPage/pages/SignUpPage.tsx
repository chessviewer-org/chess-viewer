import { type FormEvent, useMemo, useState } from 'react';

import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { getAuthErrorMessage } from '@/features/auth/components/authErrors';
import { supabase } from '@/features/auth/services/supabaseClient';

import { AuthPage } from '../AuthPage';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const fieldClass =
  'w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors duration-200';

/** Each rule has a label shown as a hint when not yet met. */
interface StrengthRule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: StrengthRule[] = [
  {
    label: 'At least 8 characters',
    test: (v) => v.length >= MIN_PASSWORD_LENGTH
  },
  { label: 'Uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { label: 'Number (0–9)', test: (v) => /[0-9]/.test(v) },
  { label: 'Special character (!@#…)', test: (v) => /[^A-Za-z0-9]/.test(v) }
];

/** Segment colours for scores 1–4 (index = score - 1). */
const BAR_COLORS = [
  'bg-red-500',
  'bg-orange-400',
  'bg-yellow-400',
  'bg-green-500'
] as const;

const LABELS = ['Weak', 'Fair', 'Good', 'Strong'] as const;
const LABEL_COLORS = [
  'text-red-500',
  'text-orange-400',
  'text-yellow-400',
  'text-green-500'
] as const;

interface PasswordStrength {
  score: number;
  passedRules: boolean[];
}

function analysePassword(value: string): PasswordStrength {
  const passedRules = RULES.map((r) => r.test(value));
  const score = passedRules.filter(Boolean).length;
  return { score, passedRules };
}

interface StrengthMeterProps {
  value: string;
}

function StrengthMeter({ value }: StrengthMeterProps) {
  const { score, passedRules } = useMemo(() => analysePassword(value), [value]);

  if (!value) return null;

  const barColor = BAR_COLORS[score - 1] ?? 'bg-border';
  const labelText = LABELS[score - 1] ?? '';
  const labelColor = LABEL_COLORS[score - 1] ?? 'text-text-muted';
  const failedRules = RULES.filter((_, i) => !passedRules[i]);

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {/* 4-segment bar */}
      <div
        className="flex gap-0.5"
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? barColor : 'bg-border/50'
            }`}
          />
        ))}
      </div>

      {/* Label + failed hints */}
      <div className="flex items-start justify-between gap-2">
        {labelText && (
          <span className={`text-xs font-semibold ${labelColor}`}>
            {labelText}
          </span>
        )}
        {failedRules.length > 0 && score < 4 && (
          <span className="text-xs text-text-muted text-right leading-tight">
            Missing: {failedRules.map((r) => r.label).join(' · ')}
          </span>
        )}
      </div>
    </div>
  );
}

export function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmError('');

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
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      valid = false;
    }

    if (confirm !== password) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (signUpError) {
        setEmailError(getAuthErrorMessage(signUpError));
        return;
      }

      // Supabase returns identities: [] when email confirmation is disabled AND
      // the email is already registered — no error is thrown, so we detect it here.
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setEmailError('An account with this email already exists.');
        return;
      }

      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
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
            We sent a confirmation link to finish setting up your account.
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
          Create your account
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Save your boards to the cloud and sync everywhere.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="signup-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'signup-email-error' : undefined}
          />
          {emailError && (
            <p id="signup-email-error" className="mt-1 text-xs text-error">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`${fieldClass} pr-10`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={
                passwordError ? 'signup-password-error' : undefined
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

          <StrengthMeter value={password} />

          {passwordError && (
            <p id="signup-password-error" className="mt-1 text-xs text-error">
              {passwordError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-confirm"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              className={`${fieldClass} pr-10`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={confirmError ? true : undefined}
              aria-describedby={
                confirmError ? 'signup-confirm-error' : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={
                showConfirm ? 'Hide confirm password' : 'Show confirm password'
              }
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {confirmError && (
            <p id="signup-confirm-error" className="mt-1 text-xs text-error">
              {confirmError}
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
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link
          to="/auth/sign-in"
          className="font-medium text-accent transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Sign in
        </Link>
      </p>
    </AuthPage>
  );
}

export default SignUpPage;
