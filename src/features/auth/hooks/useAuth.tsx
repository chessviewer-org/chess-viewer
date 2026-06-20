import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import type { Session, User } from '@supabase/supabase-js';

import { dataMigration } from '@/features/auth/services/dataMigration';
import { supabase } from '@/features/auth/services/supabaseClient';

import { logger } from '@utils/logger';

/** Shape of the value provided by `AuthContext`. */
export interface AuthContextValue {
  /** Current Supabase session (null for guests). */
  session: Session | null;
  /** Shortcut to session.user (null for guests). */
  user: User | null;
  /** True while the initial session is being resolved. */
  isLoading: boolean;
  /** True when a valid session exists. */
  isAuthenticated: boolean;
  /** Sign out and clear session state. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Resolves the initial Supabase session, subscribes to auth state changes, and
 * triggers the `localStorage → Supabase` data migration on first login.
 *
 * Wrap the application root with this provider before any component calls `useAuth`.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Circuit breaker for the data migration. Supabase emits a fresh `session`
   * object on every auth event (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED),
   * so triggering off the session reference would re-fire on every token
   * refresh. Tracking migrated user ids in a ref keeps migration at most once
   * per user per mount without participating in render.
   */
  const migratedUserIds = useRef<Set<string>>(new Set());

  const runMigration = useCallback((userId: string) => {
    if (migratedUserIds.current.has(userId)) return;
    migratedUserIds.current.add(userId);
    void dataMigration.migrateToCloud(userId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    async function init() {
      try {
        const {
          data: { session: currentSession }
        } = await supabase.auth.getSession();
        if (!cancelled) {
          setSession(currentSession);
          if (currentSession?.user) runMigration(currentSession.user.id);
        }
      } catch (error) {
        logger.warn('Failed to get initial session:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      if (cancelled) return;

      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (cancelled) return;
        setSession(newSession);
        if (newSession?.user) runMigration(newSession.user.id);
      });
      subscription = data.subscription;
    }

    init();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [runMigration]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (error) {
      logger.warn('Sign out failed:', error);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: !!session?.user,
      signOut
    }),
    [session, isLoading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Provides the current auth session, user, loading state, and `signOut` action.
 *
 * @throws If used outside of `<AuthProvider>`
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
