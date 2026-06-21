import type { LucideIcon } from 'lucide-react';

export function InfoRow({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
        {label}
      </span>
      <span className="min-w-0 wrap-break-word text-right text-sm font-medium text-text-primary">
        {value}
      </span>
    </div>
  );
}
