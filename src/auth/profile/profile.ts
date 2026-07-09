import { logger, safeJSONParse } from '@utils';
import { supabase } from '../core/Supabase';

// Types
export interface Profile {
  displayName: string;
  supporterUntil: string | null;
  supporterMonthlyUsd: number;
}

// Constants
export const GUEST_PROFILE_KEY = 'chess_viewer_guest_profile';

export const DEFAULT_PROFILE: Profile = {
  displayName: 'User',
  supporterUntil: null,
  supporterMonthlyUsd: 0
};

// Helpers
export function isActiveSupporter(supporterUntil: string | null): boolean {
  if (!supporterUntil) return false;
  const expirationTime = new Date(supporterUntil).getTime();
  return !Number.isNaN(expirationTime) && expirationTime > Date.now();
}

export function readGuestProfile(): Profile {
  try {
    const rawData = localStorage.getItem(GUEST_PROFILE_KEY);
    if (!rawData) return DEFAULT_PROFILE;

    const parsedData = safeJSONParse<Partial<Profile>>(rawData, {});

    return {
      displayName:
        typeof parsedData.displayName === 'string'
          ? parsedData.displayName
          : DEFAULT_PROFILE.displayName,
      supporterUntil:
        typeof parsedData.supporterUntil === 'string'
          ? parsedData.supporterUntil
          : null,
      supporterMonthlyUsd:
        typeof parsedData.supporterMonthlyUsd === 'number'
          ? parsedData.supporterMonthlyUsd
          : 0
    };
  } catch (error) {
    logger.error('Failed to read local guest profile:', error);
    return DEFAULT_PROFILE;
  }
}

export function writeGuestProfile(profile: Profile): void {
  try {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    logger.error('Failed to save guest profile to localStorage:', error);
  }
}

// Service
export const profileService = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, supporter_until')
      .eq('user_id', userId)
      .returns<{
        display_name: string | null;
        supporter_until: string | null;
      }>()
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch user profile:', error);
      return null;
    }

    if (!data) {
      await supabase
        .from('profiles')
        .upsert(
          { user_id: userId, display_name: DEFAULT_PROFILE.displayName },
          { onConflict: 'user_id' }
        );
      return DEFAULT_PROFILE;
    }

    return {
      displayName: data.display_name ?? DEFAULT_PROFILE.displayName,
      supporterUntil: data.supporter_until ?? null,
      supporterMonthlyUsd: 0
    };
  },

  async updateDisplayName(userId: string, newName: string): Promise<void> {
    await supabase
      .from('profiles')
      .upsert(
        { user_id: userId, display_name: newName },
        { onConflict: 'user_id' }
      );
  },

  async setSupporter(months: number): Promise<string | null> {
    const { data } = await supabase.rpc('set_supporter_status', { months });
    return typeof data === 'string' ? data : null;
  }
};
