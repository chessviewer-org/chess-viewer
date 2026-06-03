/** Dependency-free profile constants shared by ProfileContext and dataMigration
 *  (kept separate to avoid a context↔migration import cycle). */

/** localStorage key holding a guest's profile (display name, avatar, supporter window). */
export const GUEST_PROFILE_KEY = 'cv_profile';

/** Window event the migration dispatches once a guest profile is seeded into the cloud. */
export const PROFILE_REFRESH_EVENT = 'cv:profile-refresh';
