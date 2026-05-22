// ─── Database Table Interfaces ────────────────────────────────────────────────

export interface UserSecurity {
  id: string;
  user_id: string;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserData {
  id: string;
  user_id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// ─── Auth Response Types ──────────────────────────────────────────────────────

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

// ─── Component Props ──────────────────────────────────────────────────────────

export type AuthTab = 'signin' | 'signup' | 'security';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthTab;
}

export interface SecurityLockModalProps {
  onUnlock: () => void;
}

export interface SignInProps {
  onSuccess?: () => void;
  onMfaRequired?: () => void;
}

export interface SignUpProps {
  onSuccess?: () => void;
}
