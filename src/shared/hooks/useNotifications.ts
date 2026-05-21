import { useCallback, useEffect, useRef, useState } from 'react';

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

  /** 
   * Removes a specific notification by its ID and clears its auto-dismiss timer. 
   * 
   * @param id - The unique ID of the notification
   */
  const removeNotification = useCallback((id: number): void => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timeout = timeoutRefs.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutRefs.current[id];
    }
  }, []);

  /** 
   * Internal helper to add a notification to the stack. 
   * 
   * @param message - Text to display
   * @param type - Severity level
   * @param duration - Auto-dismiss delay in ms
   */
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

  /** 
   * Shows a success notification. 
   * 
   * @param message - Text to display
   * @param duration - Auto-dismiss delay in ms
   */
  const success = useCallback(
    (message: string, duration = 5000): void => {
      addNotification(message, 'success', duration);
    },
    [addNotification]
  );

  /** 
   * Shows an error notification. 
   * 
   * @param message - Text to display
   * @param duration - Auto-dismiss delay in ms
   */
  const error = useCallback(
    (message: string, duration = 5000): void => {
      addNotification(message, 'error', duration);
    },
    [addNotification]
  );

  /** 
   * Shows an informational notification. 
   * 
   * @param message - Text to display
   * @param duration - Auto-dismiss delay in ms
   */
  const info = useCallback(
    (message: string, duration = 5000): void => {
      addNotification(message, 'info', duration);
    },
    [addNotification]
  );

  /** 
   * Shows a warning notification. 
   * 
   * @param message - Text to display
   * @param duration - Auto-dismiss delay in ms
   */
  const warning = useCallback(
    (message: string, duration = 5000): void => {
      addNotification(message, 'warning', duration);
    },
    [addNotification]
  );

  return {
    notifications,
    success,
    error,
    info,
    warning,
    removeNotification
  };
}
