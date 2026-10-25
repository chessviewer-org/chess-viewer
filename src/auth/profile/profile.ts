import { logger } from '@/shared/utils/logger';
import { safeJSONParse } from '@chessviewer-org/chess-viewer';
import { supabase } from '../core/Supabase';

// Types
export interface Profile {
  displayName: string;
}

// Constants
export const GUEST_PROFILE_KEY = 'chess_viewer_guest_profile';

export const DEFAULT_PROFILE: Profile = {
  displayName: 'User'
};

// Helpers
export function readGuestProfile(): Profile {
  try {
    const rawData = localStorage.getItem(GUEST_PROFILE_KEY);
    if (!rawData) return DEFAULT_PROFILE;

    const parsedData = safeJSONParse<Partial<Profile>>(rawData, {});

    return {
      displayName:
        typeof parsedData.displayName === 'string'
          ? parsedData.displayName
          : DEFAULT_PROFILE.displayName
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
      .select('display_name')
      .eq('user_id', userId)
      .returns<{
        display_name: string | null;
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
      displayName: data.display_name ?? DEFAULT_PROFILE.displayName
    };
  },

  async updateDisplayName(userId: string, newName: string): Promise<void> {
    await supabase
      .from('profiles')
      .upsert(
        { user_id: userId, display_name: newName },
        { onConflict: 'user_id' }
      );
  }
};
