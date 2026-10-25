import { createContext } from 'react';
import type { Session, User } from './Supabase';
import type { Profile } from '../profile/profile';

// Types
export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: Profile;
  signOut: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  refreshProfile: () => void;
}

// Context
export const AuthContext = createContext<AuthContextValue | null>(null);
