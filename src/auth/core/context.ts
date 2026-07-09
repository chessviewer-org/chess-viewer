import { createContext } from 'react';
import type { Session, User } from './Supabase';
import type { MembershipTier } from '../profile/membership';
import type { Profile } from '../profile/profile';

// Types
export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: Profile;
  isSupporter: boolean;
  membershipTier: MembershipTier;
  signOut: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  setSupporter: (months?: number) => void;
  refreshProfile: () => void;
}

// Context
export const AuthContext = createContext<AuthContextValue | null>(null);
