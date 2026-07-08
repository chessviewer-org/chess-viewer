import React, { useCallback, useEffect, useState } from 'react';

import { supabase } from './Supabase';
import type { Session, User } from './Supabase';
import { getMembershipTier } from '../profile/membership';
import { dataMigration } from '../storage/dataMigration';
import { AuthContext } from './context';
import type { AuthContextValue } from './context';
import {
  DEFAULT_PROFILE,
  isActiveSupporter,
  profileService,
  readGuestProfile,
  writeGuestProfile,
  type Profile
} from '../profile/profile';

// -----------------------------------------------------------------------------
// Provider Component
// -----------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialSession = supabase.auth.getCurrentSession();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(() =>
    initialSession?.user ? DEFAULT_PROFILE : readGuestProfile()
  );

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(readGuestProfile());
      return;
    }

    const remoteProfile = await profileService.get(user.id);
    setProfile(remoteProfile ?? DEFAULT_PROFILE);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (!mounted) return;

      setSession(currentSession);
      await loadProfile(currentSession?.user ?? null);

      if (currentSession?.user) {
        dataMigration.migrateToCloud(currentSession.user.id);
      }

      setIsLoading(false);
    }

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, newSession) => {
        setSession(newSession);
        await loadProfile(newSession?.user ?? null);

        if (newSession?.user) {
          dataMigration.migrateToCloud(newSession.user.id);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // -----------------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------------
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const setDisplayName = async (name: string) => {
    const trimmedName = name.trim() || DEFAULT_PROFILE.displayName;

    setProfile((prev) => ({ ...prev, displayName: trimmedName }));

    if (session?.user) {
      await profileService.updateDisplayName(session.user.id, trimmedName);
    } else {
      writeGuestProfile({ ...profile, displayName: trimmedName });
    }
  };

  const setSupporter = async (months = 1) => {
    if (session?.user) {
      const until = await profileService.setSupporter(months);
      setProfile((prev) => ({ ...prev, supporterUntil: until }));
      return;
    }

    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    const until =
      months > 0
        ? new Date(Date.now() + months * msPerMonth).toISOString()
        : null;

    setProfile((prev) => {
      const nextProfile = { ...prev, supporterUntil: until };
      writeGuestProfile(nextProfile);
      return nextProfile;
    });
  };

  const refreshProfile = useCallback(() => {
    loadProfile(session?.user ?? null);
  }, [loadProfile, session]);

  // -----------------------------------------------------------------------------
  // Context Value
  // -----------------------------------------------------------------------------
  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    isAuthenticated: Boolean(session?.user),
    profile,
    isSupporter: isActiveSupporter(profile.supporterUntil),
    membershipTier: getMembershipTier(profile.supporterMonthlyUsd),
    signOut,
    setDisplayName,
    setSupporter,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
