/**
 * Returns `true` when the error carries HTTP status 422, indicating that MFA
 * is not enabled in the Supabase project settings.
 *
 * @param error - Unknown thrown value.
 */
export function isMfa422Error(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if (!('status' in error)) return false;
  const record = error as { status?: unknown; message?: unknown };
  return Number(record.status) === 422;
}

/**
 * Extracts a user-facing message from an MFA operation error.
 *
 * Surfaces a project-settings hint for 422 errors so users know why setup failed.
 *
 * @param error - Unknown thrown value.
 * @returns A human-readable error string.
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
    const record = error as { status?: unknown; message?: unknown };
    msg = String(record.message);
  }

  if (isMfa422Error(error)) {
    if (msg.toLowerCase().includes('email')) {
      return msg;
    }
    return `2FA setup failed (${msg}). Please ensure MFA/TOTP is enabled in your Supabase project settings.`;
  }

  return msg;
}

/**
 * Generates cryptographically random hex backup codes.
 *
 * @param count - Number of codes to generate (default 10).
 * @returns Array of uppercase 8-character hex strings.
 */
export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  });
}
