import { logger } from '@utils/logger';
import { supabase } from './supabaseClient';

/**
 * Relational profile access for REGISTERED users (the `profiles` table).
 *
 * NOTE — deliberate exception to the CLAUDE.md "all user data via syncStorage /
 * user_data KV" rule: profiles are relational (typed columns, server-side
 * supporter expiry, signup trigger), not a KV blob, so they cannot be expressed
 * through syncStorage. This file is the SINGLE sanctioned place that queries
 * `public.profiles` directly. Guests do NOT use this — their profile lives in
 * localStorage (see useProfile). The unified profile experience is assembled in
 * the useProfile hook; this service is only the registered-user backend.
 */

/** Canonical profile shape shared by the guest (localStorage) and user (DB) paths. */
export interface Profile {
  displayName: string;
  avatarUrl: string | null;
  /** ISO timestamp; current supporter iff this is in the future. Null = not a supporter. */
  supporterUntil: string | null;
}

/** Default profile for a brand-new guest or an unmigrated/empty registered profile. */
export const DEFAULT_PROFILE: Profile = {
  displayName: 'User',
  avatarUrl: null,
  supporterUntil: null
};

interface ProfileRow {
  display_name: string | null;
  avatar_url: string | null;
  supporter_until: string | null;
}

/** Treats "table or column missing" as empty rather than fatal — keeps the UI alive pre-migration. */
const isMissingSchemaError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object' || !('code' in err)) return false;
  const code = (err as { code: string }).code;
  // 42P01 = undefined_table, 42703 = undefined_column, PGRST* = PostgREST schema cache.
  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST116' ||
    code === 'PGRST204'
  );
};

/** Pure: is the supporter window currently active? Safe on null/garbage input. */
export function isActiveSupporter(supporterUntil: string | null): boolean {
  if (!supporterUntil) return false;
  const until = new Date(supporterUntil).getTime();
  return Number.isFinite(until) && until > Date.now();
}

export const profileService = {
  /** Fetch a registered user's profile. Returns null on missing row/schema (UI falls back). */
  get: async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, supporter_until')
        .eq('user_id', userId)
        .maybeSingle<ProfileRow>();

      if (error) {
        if (isMissingSchemaError(error)) return null;
        throw error;
      }
      if (!data) return null;

      return {
        displayName: data.display_name ?? 'User',
        avatarUrl: data.avatar_url ?? null,
        supporterUntil: data.supporter_until ?? null
      };
    } catch (error: unknown) {
      logger.error('profileService.get error:', error);
      return null;
    }
  },

  /** Update the caller's display name (RLS: users can update own profile). */
  updateDisplayName: async (userId: string, name: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('user_id', userId);
      if (error && !isMissingSchemaError(error)) throw error;
    } catch (error: unknown) {
      logger.error('profileService.updateDisplayName error:', error);
    }
  },

  /** Set/clear supporter window via the server RPC. months <= 0 clears it. */
  setSupporter: async (months: number): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('set_supporter_status', {
        months
      });
      if (error) throw error;
      return typeof data === 'string' ? data : null;
    } catch (error: unknown) {
      logger.error('profileService.setSupporter error:', error);
      return null;
    }
  }
};
