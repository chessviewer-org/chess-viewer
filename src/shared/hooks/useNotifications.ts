import { useCallback, useEffect, useRef, useState } from 'react';

import { SYNC_TRUNCATED_EVENT, type SyncTruncatedDetail } from '@constants';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

const NOTIFICATION_DURATIONS: Record<Notification['type'], number> = {
  success: 2500,
  info: 2500,
  warning: 4000,
  error: 4500
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  const removeNotification = useCallback((id: number): void => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timeout = timeoutRefs.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutRefs.current[id];
    }
  }, []);

  const addNotification = useCallback(
    (message: string, type: Notification['type']): void => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      timeoutRefs.current = {};

      const id = Date.now() + Math.random();
      const duration = NOTIFICATION_DURATIONS[type];
      setNotifications([{ id, message, type, duration }]);
      timeoutRefs.current[id] = setTimeout(
        () => removeNotification(id),
        duration
      );
    },
    [removeNotification]
  );

  const success = useCallback(
    (message: string): void => addNotification(message, 'success'),
    [addNotification]
  );

  const error = useCallback(
    (message: string): void => addNotification(message, 'error'),
    [addNotification]
  );

  const info = useCallback(
    (message: string): void => addNotification(message, 'info'),
    [addNotification]
  );

  const warning = useCallback(
    (message: string): void => addNotification(message, 'warning'),
    [addNotification]
  );

  useEffect(() => {
    const onTruncated = (event: Event): void => {
      const { dataset } = (event as CustomEvent<SyncTruncatedDetail>).detail;
      const label = dataset === 'archive' ? 'archive' : 'history';
      addNotification(`Cloud full — only recent ${label} synced.`, 'warning');
    };
    window.addEventListener(SYNC_TRUNCATED_EVENT, onTruncated);
    return () => window.removeEventListener(SYNC_TRUNCATED_EVENT, onTruncated);
  }, [addNotification]);

  return { notifications, success, error, info, warning, removeNotification };
}
