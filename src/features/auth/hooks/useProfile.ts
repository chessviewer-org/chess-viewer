import { useContext } from 'react';

import { ProfileContext, type ProfileContextValue } from './profileContextDef';

/**
 * Consumer for the shared profile state (see ProfileProvider). Unified across
 * guests (localStorage) and registered users (profiles table); all consumers
 * share one state so edits + post-signup migration propagate without a reload.
 *
 * @throws If used outside of `<ProfileProvider>`.
 */
export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
}
