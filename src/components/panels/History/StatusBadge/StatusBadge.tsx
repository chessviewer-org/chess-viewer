import { memo } from 'react';

import { AlertCircle, Circle, Zap } from 'lucide-react';

import { calculateStatus } from '@utils';

/** Props for the `StatusBadge` freshness indicator. */
export interface StatusBadgeProps {
  lastActiveAt: number;
  className?: string;
}

const StatusBadge = memo(function StatusBadge({
  lastActiveAt,
  className = ''
}: StatusBadgeProps) {
  const status = calculateStatus(lastActiveAt);
  const statusConfig = {
    green: {
      bg: 'bg-success/15',
      text: 'text-success',
      label: 'Fresh',
      icon: Circle,
      iconClass: 'fill-current'
    },
    yellow: {
      bg: 'bg-warning/15',
      text: 'text-warning',
      label: 'Aging',
      icon: Zap,
      iconClass: ''
    },
    red: {
      bg: 'bg-error/15',
      text: 'text-error',
      label: 'Stale',
      icon: AlertCircle,
      iconClass: ''
    }
  };
  const config = statusConfig[status];
  const IconComponent = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold ${config.bg} ${config.text} ${className}`}
      title={config.label}
    >
      <IconComponent className={`w-3 h-3 ${config.iconClass}`} />
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';
export default StatusBadge;
