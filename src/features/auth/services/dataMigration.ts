import { logger } from '@utils/logger';
import { syncStorage } from './syncStorage';

const MIGRATION_LOCK_KEY = 'supabase_migration_complete';

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

          if (!cloudData) {
            await syncStorage.set(key, localData);
            logger.log(`Migrated key: ${key}`);
          }
        }
      }

      localStorage.setItem(`${MIGRATION_LOCK_KEY}_${userId}`, 'true');
      logger.log('Data migration completed successfully.');
    } catch (error) {
      logger.error('Data migration failed:', error);
    }
  }
};
