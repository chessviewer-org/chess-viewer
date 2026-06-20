import { type ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

/**
 * Shared presentation primitives for the Settings sections, matching the
 * document-style "heading → thin separator → airy content" rhythm used across
 * About and Settings (instead of wrapping everything in a single bordered card).
 * Functionality-bearing sections keep their own controls; these only frame the
 * heading and spacing so the page reads as one cohesive document.
 */

/** A section heading followed by a thin separator (GitHub-style block opener). */
export function SettingsHeading({
  icon: Icon,
  title,
  description
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="space-y-2 border-b border-border pb-3">
      <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold text-text-primary">
        <Icon className="h-6 w-6 text-text-secondary" aria-hidden="true" />
        {title}
      </h2>
      {description && (
        <p className="text-base leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
    </div>
  );
}

/** A sub-heading + separator inside a section, for grouping related controls. */
export function SettingsBlock({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: ReactNode;
  /** Optional control rendered on the right of the title row (e.g. a sort select). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1 pb-2">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {description && (
          <p className="text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
