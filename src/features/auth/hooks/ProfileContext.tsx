import { useCallback, useEffect, useMemo, useState } from 'react';

import { logger, safeJSONParse } from '@utils';
import { getMembershipTier } from '../services/membership';
import {
  GUEST_PROFILE_KEY,
  PROFILE_REFRESH_EVENT
} from '../services/profileConstants';
import {
  DEFAULT_PROFILE,
  isActiveSupporter,
  type Profile,
  profileService
} from '../services/profileService';
import { ProfileContext, type ProfileContextValue } from './profileContextDef';
import { useAuth } from './useAuth';

/**
 * Single shared source of profile truth. Unified model: guests read/write the
 * `cv_profile` localStorage key; registered users read/write the `profiles`
 * table via profileService — only sync differs. Sharing one state (vs a
 * per-component hook) means a name/supporter change in one place is seen
 * everywhere, and the post-signup migration can push a refresh.
 */

function readGuestProfile(): Profile {
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = safeJSONParse<Partial<Profile>>(raw, {});
    return {
      displayName: parsed.displayName ?? DEFAULT_PROFILE.displayName,
      supporterUntil: parsed.supporterUntil ?? null,
      supporterMonthlyUsd:
        typeof parsed.supporterMonthlyUsd === 'number' &&
        Number.isFinite(parsed.supporterMonthlyUsd)
          ? parsed.supporterMonthlyUsd
          : 0
    };
  } catch (error: unknown) {
    logger.error('readGuestProfile error:', error);
    return DEFAULT_PROFILE;
  }
}

function writeGuestProfile(profile: Profile): void {
  try {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch (error: unknown) {
    logger.error('writeGuestProfile error:', error);
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState<boolean>(isAuthenticated);

  const load = useCallback(async () => {
    if (isAuthenticated && userId) {
      setLoading(true);
      const remote = await profileService.get(userId);
      setProfile(remote ?? DEFAULT_PROFILE);
      setLoading(false);
    } else {
      setProfile(readGuestProfile());
      setLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Cross-tab/instance guest sync + post-migration refresh.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === GUEST_PROFILE_KEY && !(isAuthenticated && userId)) {
        setProfile(readGuestProfile());
      }
    };
    const onRefresh = () => void load();
    window.addEventListener('storage', onStorage);
    window.addEventListener(PROFILE_REFRESH_EVENT, onRefresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(PROFILE_REFRESH_EVENT, onRefresh);
    };
  }, [load, isAuthenticated, userId]);

  const setDisplayName = useCallback(
    async (name: string): Promise<void> => {
      const trimmed = name.trim() || 'User';
      const prev = await new Promise<Profile>((resolve) => {
        setProfile((p) => {
          resolve(p);
          return p;
        });
      });
      setProfile({ ...prev, displayName: trimmed });
      if (isAuthenticated && userId) {
        try {
          await profileService.updateDisplayName(userId, trimmed);
        } catch {
          setProfile(prev);
          throw new Error('Failed to save display name. Please try again.');
        }
      } else {
        writeGuestProfile({ ...prev, displayName: trimmed });
      }
    },
    [isAuthenticated, userId]
  );

  const setSupporter = useCallback(
    (months: number = 1) => {
      if (isAuthenticated && userId) {
        void profileService.setSupporter(months).then((until) => {
          setProfile((prev) => ({ ...prev, supporterUntil: until }));
        });
      } else {
        setProfile((prev) => {
          const until =
            months > 0
              ? new Date(
                  Date.now() + months * 30 * 24 * 60 * 60 * 1000
                ).toISOString()
              : null;
          const next = { ...prev, supporterUntil: until };
          writeGuestProfile(next);
          return next;
        });
      }
    },
    [isAuthenticated, userId]
  );

  const refresh = useCallback(() => void load(), [load]);

  const value: ProfileContextValue = useMemo(
    () => ({
      displayName: profile.displayName,
      isSupporter: isActiveSupporter(profile.supporterUntil),
      supporterMonthlyUsd: profile.supporterMonthlyUsd,
      membershipTier: getMembershipTier(profile.supporterMonthlyUsd),
      loading,
      setDisplayName,
      setSupporter,
      refresh
    }),
    [profile, loading, setDisplayName, setSupporter, refresh]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
