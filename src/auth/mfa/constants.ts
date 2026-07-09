// Constants
export const STATUS_VERIFIED = 'verified';
export const STATUS_UNVERIFIED = 'unverified';
export const STATUS_DISABLED = 'disabled';
export const STATUS_ENABLED = 'enabled';
export const FACTOR_TYPE_TOTP = 'totp';
export const ISSUER_NAME = 'ChessViewer';

// Error messages
export const ERR_SIGN_IN = 'Please sign in.';
export const ERR_NO_SETUP = 'No active 2FA setup found. Please start over.';
export const ERR_6_DIGITS = 'Code must be 6 digits.';
export const ERR_ONLY_TOTP = 'Only TOTP is supported.';
export const ERR_GENERIC =
  'Two-factor authentication (2FA) operation failed. Please try again.';
