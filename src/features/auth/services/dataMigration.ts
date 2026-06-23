import { logger, safeJSONParse } from '@utils';
import { GUEST_PROFILE_KEY, PROFILE_REFRESH_EVENT } from './profileConstants';
import {
  isActiveSupporter,
  type Profile,
  profileService
} from './profileService';
import { syncStorage } from './syncStorage';

const MIGRATION_LOCK_KEY = 'supabase_migration_complete';

/**
 * Carries a guest's localStorage profile (display name + supporter window) into
 * the `profiles` TABLE on first login. Profiles are relational, not KV, so this
 * goes through profileService — NOT syncStorage/user_data. Only fills the DB
 * profile when it is still at defaults, so we never clobber an existing cloud
 * profile (last-write-wins toward the already-registered identity).
 */
async function migrateGuestProfile(userId: string): Promise<boolean> {
  const raw = localStorage.getItem(GUEST_PROFILE_KEY);
  if (!raw) return false;

  const local = safeJSONParse<Partial<Profile>>(raw, {});
  const localName = local.displayName?.trim();
  const localSupporter = isActiveSupporter(local.supporterUntil ?? null);
  if ((!localName || localName === 'User') && !localSupporter) return false;

  const remote = await profileService.get(userId);
  // Only seed the cloud profile if it is still default/empty.
  if (remote && (remote.displayName !== 'User' || remote.supporterUntil)) {
    return false;
  }

  let wrote = false;
  if (localName && localName !== 'User') {
    await profileService.updateDisplayName(userId, localName);
    wrote = true;
  }
  if (localSupporter && local.supporterUntil) {
    const remainingMs = new Date(local.supporterUntil).getTime() - Date.now();
    const months = Math.max(
      1,
      Math.ceil(remainingMs / (30 * 24 * 60 * 60 * 1000))
    );
    await profileService.setSupporter(months);
    wrote = true;
  }
  if (wrote) logger.log('Migrated guest profile to cloud.');
  return wrote;
}

/**
 * Migration service to move local anonymous data to Supabase after login.
 */
export const dataMigration = {
  /**
   * Pushes all relevant localStorage data to Supabase.
   * Runs only once per user session after login.
   */
  migrateToCloud: async (userId: string) => {
    const isMigrated = localStorage.getItem(`${MIGRATION_LOCK_KEY}_${userId}`);
    if (isMigrated === 'true') return;

    logger.log('Starting data migration to Supabase...');

    const keysToMigrate = ['fen-history', 'chess-theme', 'fen-history-archive'];

    try {
      for (const key of keysToMigrate) {
        const localData = localStorage.getItem(key);
        if (localData) {
          const cloudData = await syncStorage.get(key);

          // get() returns an object even for an empty value, so test the value
          // itself — otherwise an empty cloud entry would block migration.
          if (!cloudData?.value) {
            await syncStorage.set(key, localData);
            logger.log(`Migrated key: ${key}`);
          }
        }
      }

      const profileSeeded = await migrateGuestProfile(userId);
      if (profileSeeded) {
        // Tell the shared ProfileProvider to re-fetch so the migrated name /
        // supporter status appears immediately, without a page reload.
        window.dispatchEvent(new Event(PROFILE_REFRESH_EVENT));
      }

      localStorage.setItem(`${MIGRATION_LOCK_KEY}_${userId}`, 'true');
      logger.log('Data migration completed successfully.');
    } catch (error: unknown) {
      logger.error('Data migration failed:', error);
    }
  }
};
