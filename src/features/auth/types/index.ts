/** Row shape of the `user_security` Supabase table. */
export interface UserSecurity {
  id: string;
  user_id: string;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

/** Row shape of the `user_data` KV table. */
export interface UserData {
  id: string;
  user_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

/** Minimal auth response shape used internally. */
export interface AuthResponse {
  user: {
    id: string;
    email?: string;
  } | null;
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
}

/** Valid tab identifiers for the `AuthModal`. */
export type AuthTab = 'signin' | 'signup' | 'security';

/** Props for the `AuthModal` dialog. */
export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthTab;
}

/** Props for the `SecurityLockModal`. */
export interface SecurityLockModalProps {
  onUnlock: () => void;
}

/** Props for the `SignIn` form component. */
export interface SignInProps {
  onSuccess?: () => void;
  onMfaRequired?: () => void;
}

/** Props for the `SignUp` form component. */
export interface SignUpProps {
  onSuccess?: () => void;
}
