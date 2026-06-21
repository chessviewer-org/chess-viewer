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
