import { logger } from '@utils';

/**
 * Maps a Supabase auth error to a neutral, user-facing message. Raw backend
 * strings (rate-limit phrasing, validation internals) are kept out of the UI and
 * sent to the logger instead, so we never leak implementation detail or
 * inconsistent copy. Supabase already returns a generic "Invalid login
 * credentials" for bad sign-ins, so this does not introduce user enumeration.
 */
export function getAuthErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : '';

  logger.error('Auth error:', error);

  const normalized = raw.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  if (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests')
  ) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (normalized.includes('password') && normalized.includes('least')) {
    return 'Your password does not meet the minimum requirements.';
  }
  if (normalized.includes('unable to validate email')) {
    return 'Please enter a valid email address.';
  }

  return 'Something went wrong. Please try again.';
}
