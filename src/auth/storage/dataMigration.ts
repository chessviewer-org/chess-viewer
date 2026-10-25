import { logger } from '@/shared/utils/logger';
import { safeJSONParse } from '@chessviewer-org/chess-viewer';
import { profileService, GUEST_PROFILE_KEY } from '../profile/profile';
import type { Profile } from '../profile/profile';
import { syncStorage } from './syncStorage';

// Constants
const MIGRATION_LOCK_KEY = 'supabase_migration_complete';
const DEFAULT_USER_NAME = 'User';

const SETTINGS_KEYS_TO_MIGRATE = [
  'fen-history',
  'chess-theme',
  'fen-history-archive'
];

// Helpers
async function syncSettingsToCloud(): Promise<void> {
  await Promise.all(
    SETTINGS_KEYS_TO_MIGRATE.map(async (key) => {
      const localValue = localStorage.getItem(key);
      if (!localValue) return;

      const cloudData = await syncStorage.get(key);
      if (!cloudData?.value) {
        await syncStorage.set(key, localValue);
      }
    })
  );
}

async function migrateGuestProfileToCloud(userId: string): Promise<void> {
  const rawGuestData = localStorage.getItem(GUEST_PROFILE_KEY);
  if (!rawGuestData) return;

  const guestProfile = safeJSONParse<Partial<Profile>>(rawGuestData, {});
  const guestName = guestProfile.displayName?.trim();
  if (!guestName || guestName === DEFAULT_USER_NAME) return;

  const remoteProfile = await profileService.get(userId);
  if (!remoteProfile) return;

  if (remoteProfile.displayName !== DEFAULT_USER_NAME) return;
  await profileService.updateDisplayName(userId, guestName);
}

// Service
export const dataMigration = {
  async migrateToCloud(userId: string): Promise<void> {
    const lockKey = `${MIGRATION_LOCK_KEY}_${userId}`;
    if (localStorage.getItem(lockKey) === 'true') return;

    try {
      await syncSettingsToCloud();
      await migrateGuestProfileToCloud(userId);
      localStorage.setItem(lockKey, 'true');
    } catch (error) {
      logger.error('Failed to migrate local data to cloud:', error);
    }
  }
};
