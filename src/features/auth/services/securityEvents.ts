import { logger } from '@utils';
import { isRecord } from '@utils';
import { supabase } from './supabaseClient';

/**
 * Read-only access to the caller's `security_events` audit log. The table is
 * append-only and SELECT-scoped to the owner by RLS (writes happen only inside
 * SECURITY DEFINER functions — never from the client). This service therefore
 * only ever reads.
 */

/** A single audit-log entry surfaced to the UI. */
export interface SecurityEvent {
  id: string;
  eventType: string;
  createdAt: string;
}

interface SecurityEventRow {
  id: string;
  event_type: string;
  created_at: string;
}

/** Treats "table missing" as an empty list rather than fatal (pre-migration UI). */
const isMissingSchemaError = (err: unknown): boolean => {
  if (!isRecord(err)) return false;
  const code = err['code'];
  return code === '42P01' || code === 'PGRST116' || code === 'PGRST204';
};

export const securityEventsService = {
  /** Fetch the caller's most recent security events (newest first). */
  recent: async (limit = 5): Promise<SecurityEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('id, event_type, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
        .returns<SecurityEventRow[]>();

      if (error) {
        if (isMissingSchemaError(error)) return [];
        throw error;
      }
      if (!data) return [];

      return data.map((row) => ({
        id: row.id,
        eventType: row.event_type,
        createdAt: row.created_at
      }));
    } catch (error: unknown) {
      logger.error('securityEventsService.recent error:', error);
      return [];
    }
  }
};
