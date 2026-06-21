import { useEffect, useState } from 'react';

import { Mail } from 'lucide-react';

import { profileService } from '@/features/auth/services/profileService';
import { supabase } from '@/features/auth/services/supabaseClient';

import { logger } from '@utils/logger';

const MAX_EMAIL = 320;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Change-email card. Updates Supabase auth (sends confirmation) + the profile row. */
export function EmailCard({
  userId,
  currentEmail,
  showAlert
}: {
  userId: string;
  currentEmail: string;
  showAlert: (title: string, message: string, type?: 'info' | 'danger') => void;
}) {
  const [draft, setDraft] = useState(currentEmail);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDraft(currentEmail);
  }, [currentEmail]);

  const next = draft.trim().slice(0, MAX_EMAIL);
  const valid = EMAIL_RE.test(next);
  const isDirty = valid && next.toLowerCase() !== currentEmail.toLowerCase();

  const handleSubmit = async () => {
    if (!isDirty || submitting) return;
    setSubmitting(true);
    try {
      // Authoritative change via Supabase auth — sends a confirmation email to
      // the NEW address; the change only lands once confirmed.
      const { error } = await supabase.auth.updateUser({ email: next });
      if (error) throw error;
      // Mirror onto the relational profile row immediately (best-effort).
      await profileService.updateEmail(userId, next);
      showAlert(
        'Confirm your new email',
        `We sent a confirmation link to ${next}. Your email changes once you click that link. Until then you keep signing in with your current address.`,
        'info'
      );
    } catch (error) {
      logger.warn('Email update failed:', error);
      showAlert(
        'Could not update email',
        'Something went wrong updating your email. Please try again in a moment.',
        'danger'
      );
      setDraft(currentEmail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="account-email"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary"
        >
          <Mail className="h-4 w-4 text-text-muted" aria-hidden="true" />
          Email Address
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="account-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={draft}
            maxLength={MAX_EMAIL}
            disabled={submitting}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSubmit();
            }}
            placeholder="you@example.com"
            aria-invalid={draft.length > 0 && !valid}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isDirty || submitting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Update Email'}
          </button>
        </div>
      </div>
      <p className="text-xs text-text-muted">
        Changing your email sends a confirmation link to the new address. The
        change takes effect only after you confirm it.
      </p>
    </section>
  );
}
