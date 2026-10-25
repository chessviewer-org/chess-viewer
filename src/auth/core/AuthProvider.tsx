import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { supabase, type Session, type User } from './Supabase';
import { dataMigration } from '../storage/dataMigration';
import { AuthContext, type AuthContextValue } from './context';
import {
  DEFAULT_PROFILE,
  profileService,
  readGuestProfile,
  writeGuestProfile,
  type Profile
} from '../profile/profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(readGuestProfile);

  const profileRequest = useRef(0);
  const loadProfile = useCallback(async (user: User | null) => {
    const request = ++profileRequest.current;
    const next = user
      ? ((await profileService.get(user.id)) ?? DEFAULT_PROFILE)
      : readGuestProfile();
    if (request === profileRequest.current) setProfile(next);
  }, []);

  useLayoutEffect(() => {
    let mounted = true;
    const requestState = profileRequest;
    let previousUserId: string | null | undefined;
    // INITIAL_SESSION is delivered immediately by the client. A second manual
    // initialization previously fetched the same profile and ran migration twice.
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        const userId = newSession?.user?.id ?? null;
        if (userId === previousUserId && event !== 'USER_UPDATED') return;
        previousUserId = userId;
        try {
          await loadProfile(newSession?.user ?? null);
          if (
            mounted &&
            userId &&
            supabase.auth.getCurrentSession()?.user.id === userId
          ) {
            void dataMigration.migrateToCloud(userId);
          }
        } finally {
          if (mounted) setIsLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
      requestState.current++;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Actions
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const setDisplayName = useCallback(
    async (name: string) => {
      const trimmedName = name.trim() || DEFAULT_PROFILE.displayName;

      setProfile((prev) => ({ ...prev, displayName: trimmedName }));

      if (session?.user) {
        await profileService.updateDisplayName(session.user.id, trimmedName);
      } else {
        writeGuestProfile({ ...profile, displayName: trimmedName });
      }
    },
    [session, profile]
  );

  const refreshProfile = useCallback(() => {
    loadProfile(session?.user ?? null);
  }, [loadProfile, session]);

  // Context value
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: Boolean(session?.user),
      profile,
      signOut,
      setDisplayName,
      refreshProfile
    }),
    [session, isLoading, profile, signOut, setDisplayName, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
