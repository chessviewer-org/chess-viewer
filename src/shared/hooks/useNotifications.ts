import { useCallback, useEffect, useRef, useState } from 'react';

import { SYNC_TRUNCATED_EVENT, type SyncTruncatedDetail } from '@constants';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  function removeNotification(id: number): void {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timeout = timeoutRefs.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutRefs.current[id];
    }
  }

  const addNotification = useCallback(
    (
      message: string,
      type: Notification['type'] = 'info',
      duration = 5000
    ): void => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      timeoutRefs.current = {};

      const id = Date.now() + Math.random();
      setNotifications([{ id, message, type, duration }]);
      if (duration > 0) {
        timeoutRefs.current[id] = setTimeout(
          () => removeNotification(id),
          duration
        );
      }
    },
    []
  );

  function success(message: string, duration = 5000): void {
    addNotification(message, 'success', duration);
  }

  function error(message: string, duration = 5000): void {
    addNotification(message, 'error', duration);
  }

  function info(message: string, duration = 5000): void {
    addNotification(message, 'info', duration);
  }

  function warning(message: string, duration = 5000): void {
    addNotification(message, 'warning', duration);
  }

  useEffect(() => {
    const onTruncated = (event: Event): void => {
      const { dataset } = (event as CustomEvent<SyncTruncatedDetail>).detail;
      const label = dataset === 'archive' ? 'archive' : 'history';
      addNotification(
        `Cloud full — only recent ${label} synced.`,
        'warning',
        7000
      );
    };
    window.addEventListener(SYNC_TRUNCATED_EVENT, onTruncated);
    return () => window.removeEventListener(SYNC_TRUNCATED_EVENT, onTruncated);
  }, [addNotification]);

  return { notifications, success, error, info, warning, removeNotification };
}
