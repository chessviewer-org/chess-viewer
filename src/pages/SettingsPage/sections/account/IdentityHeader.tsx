import { useEffect, useRef, useState } from 'react';

import { Check, Pencil, User as UserIcon, X } from 'lucide-react';

import { sanitizeInput } from '@utils';

const MAX_DISPLAY_NAME = 60;

/** User identity header with an inline edit affordance for the display name. */
export function IdentityHeader({
  displayName,
  email,
  loading,
  onSaveName,
  isAuthenticated
}: {
  displayName: string;
  email: string | null;
  loading: boolean;
  onSaveName: (name: string) => void;
  isAuthenticated: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the draft whenever editing opens or the upstream name resolves.
  useEffect(() => {
    if (editing) {
      setDraft(displayName);
      inputRef.current?.focus();
    }
  }, [editing, displayName]);

  const trimmed = sanitizeInput(draft).slice(0, MAX_DISPLAY_NAME).trim();
  const canSave = trimmed.length > 0 && trimmed !== displayName;
  const commit = () => {
    if (canSave) onSaveName(trimmed);
    setEditing(false);
  };
  const cancel = () => setEditing(false);

  return (
    <section className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-lg uppercase">
        {displayName ? (
          displayName.charAt(0)
        ) : (
          <UserIcon className="h-7 w-7" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="account-display-name" className="sr-only">
              Display name
            </label>
            <input
              ref={inputRef}
              id="account-display-name"
              type="text"
              value={draft}
              maxLength={MAX_DISPLAY_NAME}
              disabled={loading}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 disabled:opacity-60"
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={commit}
                disabled={!canSave}
                aria-label="Save display name"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Save
              </button>
              <button
                type="button"
                onClick={cancel}
                aria-label="Cancel editing display name"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="truncate text-base font-bold text-text-primary">
              {displayName ||
                (isAuthenticated ? 'ChessVision user' : 'Local user')}
            </p>
            {isAuthenticated && email ? (
              <p className="truncate text-sm text-text-secondary">{email}</p>
            ) : (
              <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-text-muted border border-border">
                Not synchronized
              </span>
            )}
          </>
        )}
      </div>
      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit display name"
          className="ml-auto shrink-0 rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
