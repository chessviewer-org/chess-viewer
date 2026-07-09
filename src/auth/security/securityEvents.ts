import { logger } from '@utils';
import { supabase } from '../core/Supabase';

// Types
export interface SecurityEvent {
  id: string;
  eventType: string;
  createdAt: string;
}

// Constants
const TABLE_MISSING_ERROR = '42P01';

// Service
export const securityEventsService = {
  async recent(limit = 5): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('id, event_type, created_at')
        .order('created_at', { ascending: false })
        .returns<{ id: string; event_type: string; created_at: string }[]>()
        .limit(limit);

      if (error && error.code !== TABLE_MISSING_ERROR) {
        throw error;
      }

      if (!data) return [];

      return data.map((row) => ({
        id: row.id,
        eventType: row.event_type,
        createdAt: row.created_at
      }));
    } catch (err) {
      logger.error('Failed to fetch recent security events:', err);
      return [];
    }
  }
};
