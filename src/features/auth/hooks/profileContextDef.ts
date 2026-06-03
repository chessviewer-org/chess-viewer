import { createContext } from 'react';

/** Shared profile state contract (see ProfileProvider in ProfileContext.tsx). */
export interface ProfileContextValue {
  displayName: string;
  avatarUrl: string | null;
  isSupporter: boolean;
  loading: boolean;
  setDisplayName: (name: string) => void;
  /** months <= 0 clears supporter status. Defaults to a 1-month window. */
  setSupporter: (months?: number) => void;
  refresh: () => void;
}

/** Kept in a component-free module so ProfileContext.tsx exports only a component
 *  (satisfies react-refresh/only-export-components for Fast Refresh). */
export const ProfileContext = createContext<ProfileContextValue | null>(null);
