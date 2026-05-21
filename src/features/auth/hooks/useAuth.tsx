import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../services/supabaseClient';
import { dataMigration } from '../services/dataMigration';
import { logger } from '@utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Resolve the current session on mount.
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
      })
      .catch((error) => {
        logger.warn('Failed to get initial session:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Subscribe to auth state changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        dataMigration.migrateToCloud(newSession.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      dataMigration.migrateToCloud(session.user.id);
    }
  }, [session]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (error) {
      logger.warn('Sign out failed:', error);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: !!session?.user,
      signOut,
    }),
    // signOut is stable (no captured state that changes its identity)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the global auth context.
 * Must be used inside `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
