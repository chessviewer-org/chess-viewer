import { useState } from 'react';

import { Check, Copy, type LucideIcon } from 'lucide-react';

/** A detail row whose value can be copied to the clipboard (e.g. for support). */
export function CopyRow({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — no-op.
    }
  };
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
        {label}
      </span>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-0.5 text-right font-mono text-xs text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        title="Copy to clipboard"
      >
        <span className="truncate">{value}</span>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
        ) : (
          <Copy
            className="h-3.5 w-3.5 shrink-0 text-text-muted"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
