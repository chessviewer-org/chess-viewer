import { useEffect, useState } from 'react';

import { ImageIcon } from 'lucide-react';

const MAX_AVATAR_URL = 2048;

/** Accepts only http(s) image URLs — rejects javascript:/data: and junk. */
function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Avatar URL editor. Persists to the profile via `onSave`; clears on empty. */
export function AvatarCard({
  currentUrl,
  onSave
}: {
  currentUrl: string | null;
  onSave: (url: string | null) => void;
}) {
  const [draft, setDraft] = useState(currentUrl ?? '');

  useEffect(() => {
    setDraft(currentUrl ?? '');
  }, [currentUrl]);

  const trimmed = draft.trim().slice(0, MAX_AVATAR_URL);
  const valid = trimmed === '' || isSafeHttpUrl(trimmed);
  const isDirty = valid && trimmed !== (currentUrl ?? '');

  const handleSave = () => {
    if (!isDirty) return;
    onSave(trimmed === '' ? null : trimmed);
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-5">
      <label
        htmlFor="account-avatar"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary"
      >
        <ImageIcon className="h-4 w-4 text-text-muted" aria-hidden="true" />
        Avatar URL
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="account-avatar"
          type="url"
          inputMode="url"
          value={draft}
          maxLength={MAX_AVATAR_URL}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
          placeholder="https://example.com/avatar.png"
          aria-invalid={draft.length > 0 && !valid}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {trimmed === '' && currentUrl ? 'Remove' : 'Save'}
        </button>
      </div>
      <p className="text-xs text-text-muted">
        Link to an image hosted elsewhere (https only). Leave empty to use the
        default icon.
      </p>
    </section>
  );
}
