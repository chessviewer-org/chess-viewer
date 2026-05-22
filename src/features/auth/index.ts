// ─── Components ───────────────────────────────────────────────────────────────
export { AuthModal } from './components/AuthModal';
export { SecurityLockModal } from './components/SecurityLockModal';
export { SignIn } from './components/SignIn';
export { SignUp } from './components/SignUp';
export { TwoFactorSetup } from './components/TwoFactorSetup';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { AuthProvider, useAuth } from './hooks/useAuth';
export { useSecurityCheck } from './hooks/useSecurityCheck';
export { useSupabaseSync } from './hooks/useSupabaseSync';

// ─── Services ─────────────────────────────────────────────────────────────────
export { supabase } from './services/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  AuthContextValue,
} from './hooks/useAuth';
export type {
  AuthModalProps,
  AuthResponse,
  AuthTab,
  SecurityLockModalProps,
  SignInProps,
  SignUpProps,
  UserData,
  UserSecurity,
} from './types';
