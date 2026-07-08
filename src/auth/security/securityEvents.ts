import { supabase } from '../core/Supabase';

export interface SecurityEvent {
  id: string;
  eventType: string;
  createdAt: string;
}

const TABLE_MISSING_ERROR = '42P01';

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
      console.error('Failed to fetch recent security events:', err);
      return [];
    }
  }
};
