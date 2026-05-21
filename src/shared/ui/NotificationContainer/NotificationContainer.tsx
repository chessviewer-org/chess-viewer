import React, { memo, useEffect } from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

const MAX_NOTIFICATION_DURATION = 5000;

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  duration?: number;
}

const NOTIFICATION_STYLES: Record<
  NotificationType,
  {
    icon: React.ReactNode;
    label: string;
    title: string;
    strip: string;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    progress: string;
  }
> = {
  success: {
    icon: (
      <CheckCircle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
    ),
    label: 'Success notification',
    title: 'Success',
    strip: 'bg-success/80',
    iconBg: 'bg-success/8',
    iconBorder: 'border-success/20',
    iconColor: 'text-success',
    progress: 'bg-success/60'
  },
  error: {
    icon: <XCircle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
    label: 'Error notification',
    title: 'Error',
    strip: 'bg-error/80',
    iconBg: 'bg-error/8',
    iconBorder: 'border-error/20',
    iconColor: 'text-error',
    progress: 'bg-error/60'
  },
  warning: {
    icon: (
      <AlertCircle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
    ),
    label: 'Warning notification',
    title: 'Warning',
    strip: 'bg-warning/80',
    iconBg: 'bg-warning/8',
    iconBorder: 'border-warning/20',
    iconColor: 'text-warning',
    progress: 'bg-warning/60'
  },
  info: {
    icon: <Info className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
    label: 'Information notification',
    title: 'Information',
    strip: 'bg-accent/80',
    iconBg: 'bg-accent/8',
    iconBorder: 'border-accent/20',
    iconColor: 'text-accent',
    progress: 'bg-accent/60'
  }
};

export interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: number) => void;
}

/**
 * @param {NotificationContainerProps} props
 * @returns {JSX.Element}
 */
function NotificationContainer({
  notifications,
  onRemove
}: NotificationContainerProps) {
  const latestNotification =
    Array.isArray(notifications) && notifications.length > 0
      ? notifications[notifications.length - 1]
      : null;

  return (
    <div
      className="fixed top-6 right-6 z-100 w-[calc(100%-3rem)] max-w-100 pointer-events-none sm:top-8 sm:right-8"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {latestNotification && (
          <Toast
            key={latestNotification.id}
            notification={latestNotification}
            onRemove={() => onRemove(latestNotification.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const Toast = memo(function Toast({
  notification,
  onRemove
}: {
  notification: Notification;
  onRemove: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { type, message } = notification;
  const durationMs = Math.min(
    Math.max(Number(notification.duration) || 0, 0),
    MAX_NOTIFICATION_DURATION
  );
  const style = NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.info;

  useEffect(() => {
    if (durationMs <= 0) return undefined;
    const timeoutId = setTimeout(() => {
      onRemove();
    }, durationMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [durationMs, onRemove]);

  return (
    <motion.div
      layout
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.95, y: -10, x: 10 }
      }
      animate={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 1, scale: 1, y: 0, x: 0 }
      }
      exit={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
      }
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }}
      role="alert"
      aria-label={style.label}
      tabIndex={0}
      className="group relative pointer-events-auto isolate overflow-hidden rounded-2xl border border-border/40 bg-surface-elevated p-4 text-text-primary shadow-2xl flex items-center gap-4 select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-within:ring-offset-bg"
    >
      {/* Dynamic colored accent strip */}
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${style.strip} opacity-70`}
        aria-hidden="true"
      />

      {/* Icon Container */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 ${style.iconBg} ${style.iconBorder} ${style.iconColor}`}
      >
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[0.65rem] font-bold uppercase tracking-widest ${style.iconColor} opacity-90`}
        >
          {style.title}
        </p>
        <p className="mt-0.5 text-[0.9375rem] font-medium leading-snug text-text-primary/95 wrap-break-word">
          {message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onRemove}
        className="shrink-0 -mr-1 rounded-full p-2 text-text-muted/60 transition-all duration-300 hover:bg-surface-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 active:scale-90"
        aria-label="Dismiss notification"
      >
        <X className="w-4.5 h-4.5" />
      </button>

      {/* Progress Bar */}
      {durationMs > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden bg-border/10">
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: durationMs / 1000, ease: 'linear' }}
            className={`h-full ${style.progress} origin-left`}
          />
        </div>
      )}
    </motion.div>
  );
});
Toast.displayName = 'Toast';
export default NotificationContainer;
