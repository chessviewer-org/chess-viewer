import React, { memo, useEffect } from 'react';

import { AlertCircle, CheckCircle, Info, X, XCircle } from '@/assets/icons';

const MAX_NOTIFICATION_DURATION = 5000;

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
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
    joinBorder: string;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
  }
> = {
  success: {
    icon: (
      <CheckCircle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
    ),
    label: 'Success notification',
    title: 'Success',
    strip: 'bg-success',
    joinBorder: 'border-success',
    iconBg: 'bg-success/8',
    iconBorder: 'border-success/20',
    iconColor: 'text-success'
  },
  error: {
    icon: <XCircle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
    label: 'Error notification',
    title: 'Error',
    strip: 'bg-error',
    joinBorder: 'border-error',
    iconBg: 'bg-error/8',
    iconBorder: 'border-error/20',
    iconColor: 'text-error'
  },
  warning: {
    icon: (
      <AlertCircle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
    ),
    label: 'Warning notification',
    title: 'Warning',
    strip: 'bg-warning',
    joinBorder: 'border-warning',
    iconBg: 'bg-warning/8',
    iconBorder: 'border-warning/20',
    iconColor: 'text-warning'
  },
  info: {
    icon: <Info className="h-5 w-5" strokeWidth={2} aria-hidden="true" />,
    label: 'Information notification',
    title: 'Information',
    strip: 'bg-info',
    joinBorder: 'border-info',
    iconBg: 'bg-info/8',
    iconBorder: 'border-info/20',
    iconColor: 'text-info'
  }
};

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: number) => void;
}

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
      {latestNotification && (
        <Toast
          key={latestNotification.id}
          notification={latestNotification}
          onRemove={() => onRemove(latestNotification.id)}
        />
      )}
    </div>
  );
}

const Toast = memo(function Toast({
  notification,
  onRemove
}: {
  notification: Notification;
  onRemove: () => void;
}) {
  const { type, message } = notification;
  const durationMs = Math.min(
    Math.max(Number(notification.duration) || 0, 0),
    MAX_NOTIFICATION_DURATION
  );
  const style = NOTIFICATION_STYLES[type] ?? NOTIFICATION_STYLES.info;

  useEffect(() => {
    if (durationMs <= 0) return undefined;
    const timeoutId = setTimeout(onRemove, durationMs);
    return () => clearTimeout(timeoutId);
  }, [durationMs, onRemove]);

  return (
    <div
      role="alert"
      aria-label={style.label}
      tabIndex={0}
      className="group relative pointer-events-auto isolate overflow-hidden rounded-2xl border border-border/40 bg-surface-elevated p-4 pl-5 text-text-primary shadow-2xl flex items-center gap-4 select-none animate-notif-in
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-within:ring-offset-bg"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200 ${style.iconBg} ${style.iconBorder} ${style.iconColor}`}
      >
        {style.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-[0.65rem] font-bold uppercase tracking-widest ${style.iconColor} opacity-90`}
        >
          {style.title}
        </p>
        <p className="mt-0.5 truncate text-[0.9375rem] font-medium leading-snug text-text-primary/95">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 -mr-1 rounded-full p-2 text-text-muted/60 transition-colors duration-200 hover:bg-surface-hover hover:text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-90"
        aria-label="Dismiss notification"
      >
        <X className="w-4.5 h-4.5" aria-hidden="true" />
      </button>

      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute inset-0 rounded-2xl border-0 border-l-2 border-b-2 border-border/15" />
        <div
          className={`absolute inset-0 rounded-2xl border-0 border-l-2 border-b-2 ${style.joinBorder}`}
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, #000 1rem, transparent 1rem)',
            maskImage: 'linear-gradient(to right, #000 1rem, transparent 1rem)'
          }}
        />
        {durationMs > 0 && (
          <div
            className={`absolute bottom-0 left-4 right-0 h-0.5 origin-right ${style.strip}`}
            style={{ animation: `shrinkX ${durationMs}ms linear forwards` }}
          />
        )}
      </div>
    </div>
  );
});

Toast.displayName = 'Toast';
export { NotificationContainer };
