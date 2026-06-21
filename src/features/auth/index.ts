// Types
export type {
  AuthModalProps,
  AuthTab,
  SecurityLockModalProps,
  SignInProps,
  SignUpProps
} from './types';

// Components
export { AuthModal } from './components/AuthModal';
export { MfaVerification } from './components/MfaVerification';
export { SecurityLockModal } from './components/SecurityLockModal';
export { SignIn } from './components/SignIn';
export { SignUp } from './components/SignUp';
export { TwoFactorSetup } from './components/TwoFactorSetup';

// Hooks
export { ProfileProvider } from './hooks/ProfileContext';
export type { AuthContextValue } from './hooks/useAuth';
export { AuthProvider, useAuth } from './hooks/useAuth';
export { useProfile } from './hooks/useProfile';
export { useSecurityCheck } from './hooks/useSecurityCheck';

// Services
export { dataMigration } from './services/dataMigration';
export type {
  MembershipTier,
  MembershipTierId,
  MembershipTone
} from './services/membership';
export {
  getMembershipTier,
  isSupporterAmount,
  MEMBERSHIP_TIERS
} from './services/membership';
export { supabase } from './services/supabaseClient';
export type { SyncSetResult } from './services/syncStorage';
export { syncStorage } from './services/syncStorage';
export { SAFE_SYNC_PLAINTEXT_BUDGET } from './services/syncStorage';
