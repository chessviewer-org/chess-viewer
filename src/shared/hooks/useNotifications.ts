import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** A single in-app notification message. */
export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

/**
 * Manages a stack of in-app notifications with auto-dismiss support.
 * Ensures a maximum of one notification is shown at a time by clearing the stack 
 * before adding a new one.
 * 
 * @returns Object with the notification list and methods to add or remove them
 */
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
    (message: string, type: Notification['type'] = 'info', duration = 5000): void => {
      setNotifications([]);
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      timeoutRefs.current = {};

      const id = Date.now() + Math.random();
      const notification: Notification = {
        id,
        message,
        type,
        duration
      };
      setNotifications([notification]);
      if (duration > 0) {
        timeoutRefs.current[id] = setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const success = useCallback(
    (message: string, duration = 5000): void => {
      addNotification(message, 'success', duration);
    },
    [addNotification]
  );

  const error = useCallback(
    (message: string, duration = 5000): void => {
      addNotification(message, 'error', duration);
    },
    [addNotification]
  );

  const info = useCallback(
    (message: string, duration = 5000): void => {
      addNotification(message, 'info', duration);
    },
    [addNotification]
  );

  const warning = useCallback(
    (message: string, duration = 5000): void => {
      addNotification(message, 'warning', duration);
    },
    [addNotification]
  );

  return useMemo(
    () => ({
      notifications,
      success,
      error,
      info,
      warning,
      removeNotification
    }),
    [notifications, success, error, info, warning, removeNotification]
  );
}
