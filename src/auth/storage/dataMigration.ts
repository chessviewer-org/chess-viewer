import { logger, safeJSONParse } from '@utils';
import {
  isActiveSupporter,
  profileService,
  GUEST_PROFILE_KEY
} from '../profile/profile';
import type { Profile } from '../profile/profile';
import { syncStorage } from './syncStorage';

// Constants
const MIGRATION_LOCK_KEY = 'supabase_migration_complete';
const DEFAULT_USER_NAME = 'User';
const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

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
  const guestIsSupporter = isActiveSupporter(
    guestProfile.supporterUntil ?? null
  );

  const hasCustomName = guestName && guestName !== DEFAULT_USER_NAME;
  if (!hasCustomName && !guestIsSupporter) return;

  const remoteProfile = await profileService.get(userId);
  if (!remoteProfile) return;

  const isCloudProfileBrandNew =
    remoteProfile.displayName === DEFAULT_USER_NAME &&
    !remoteProfile.supporterUntil;
  if (!isCloudProfileBrandNew) return;

  if (hasCustomName) {
    await profileService.updateDisplayName(userId, guestName);
  }

  if (guestIsSupporter && guestProfile.supporterUntil) {
    const timeRemainingMs =
      new Date(guestProfile.supporterUntil).getTime() - Date.now();
    const monthsRemaining = Math.max(
      1,
      Math.ceil(timeRemainingMs / MS_PER_MONTH)
    );
    await profileService.setSupporter(monthsRemaining);
  }
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
