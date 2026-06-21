/**
 * Returns `true` when the error carries HTTP status 422, indicating that MFA
 * is not enabled in the Supabase project settings.
 */
export function isMfa422Error(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if (!('status' in error)) return false;
  return Number((error as { status: unknown }).status) === 422;
}

/**
 * Extracts a user-facing message from an MFA operation error.
 *
 * Surfaces a project-settings hint for 422 errors so users know why setup failed.
 */
export function getMfaErrorMessage(error: unknown): string {
  let msg = '2FA operation failed. Please try again.';

  if (error instanceof Error && error.message) {
    msg = error.message;
  } else if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    msg = String((error as { message: unknown }).message);
  }

  if (isMfa422Error(error)) {
    if (msg.toLowerCase().includes('email')) return msg;
    return `2FA setup failed (${msg}). Please ensure MFA/TOTP is enabled in your Supabase project settings.`;
  }

  return msg;
}
