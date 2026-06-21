import React, { memo, useRef, useState } from 'react';

import {
  CheckCircle2,
  Download,
  HardDrive,
  type LucideIcon,
  RotateCcw,
  Upload
} from 'lucide-react';

import { useModal } from '@contexts';

import { safeJSONParse } from '@utils';

/** localStorage keys grouped by the user-facing data category they belong to. */
const STORAGE_CATEGORIES = [
  {
    id: 'board',
    label: 'Board & display',
    keys: [
      'chess-fen',
      'chess-piece-style',
      'chess-show-coords',
      'chess-show-coordinate-border',
      'chess-show-thin-frame',
      'chess-light-square',
      'chess-dark-square',
      'chess-board-size',
      'chess-flipped',
      'chess-file-name',
      'chess-export-quality'
    ]
  },
  {
    id: 'history',
    label: 'History & favorites',
    keys: [
      'fen-history',
      'fen-history-archive',
      'favoriteFens',
      'fenBatchList',
      'advancedFENFavorites',
      'advanced-fen-position-settings'
    ]
  },
  {
    id: 'themes',
    label: 'Custom themes',
    keys: ['custom-theme-presets']
  }
] as const;

const STORAGE_KEYS = STORAGE_CATEGORIES.flatMap((c) => c.keys);

/** Total bytes held under a set of keys (UTF-16 string length ≈ bytes). */
function bytesForKeys(keys: readonly string[]): number {
  let total = 0;
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value !== null) total += key.length + value.length;
  }
  return total;
}

/** Formats a byte count as a compact human label. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DataManagement = memo(function DataManagement() {
  const { showConfirm, showAlert } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  // Per-category byte usage, held in state and recomputed after any mutation.
  const computeUsage = () =>
    STORAGE_CATEGORIES.map((cat) => ({
      ...cat,
      bytes: bytesForKeys(cat.keys)
    }));
  const [usage, setUsage] = useState(computeUsage);
  const totalBytes = usage.reduce((sum, c) => sum + c.bytes, 0);
  const refreshUsage = () => setUsage(computeUsage());

  async function handleClearCategory(
    category: (typeof STORAGE_CATEGORIES)[number]
  ) {
    const confirmed = await showConfirm(
      `Clear ${category.label}`,
      `Remove all "${category.label}" data from this browser? This cannot be undone.`,
      'danger'
    );
    if (!confirmed) return;
    category.keys.forEach((key) => localStorage.removeItem(key));
    refreshUsage();
    setMessage(`${category.label} cleared. Refresh the page to see changes.`);
  }

  function handleExportData() {
    const data: Record<string, string> = {};
    STORAGE_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        data[key] = value;
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chess-vision-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('Data exported');
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = safeJSONParse(text, null) as Record<string, unknown> | null;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      showAlert('Import Failed', 'Invalid backup file format.', 'danger');
      return;
    }
    STORAGE_KEYS.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(data, key)) return;
      const raw = data[key];
      if (typeof raw !== 'string') return;
      if (raw.length > 1_000_000) return;
      const reparsed = safeJSONParse<unknown>(raw, null);
      const safeValue = reparsed === null ? raw : JSON.stringify(reparsed);
      localStorage.setItem(key, safeValue);
    });
    refreshUsage();
    setMessage('Data imported. Refresh the page to see all changes.');
    event.target.value = '';
  }

  async function handleResetData() {
    const confirmed = await showConfirm(
      'Reset Data',
      'Reset saved app data on this browser? This will delete all settings and history.',
      'danger'
    );
    if (!confirmed) return;
    STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    refreshUsage();
    setMessage('Data reset. Refresh the page to start clean.');
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface-elevated p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-sm font-bold text-text-primary">
            <HardDrive className="h-4 w-4 text-text-muted" aria-hidden="true" />
            Storage used on this browser
          </h4>
          <span className="shrink-0 text-sm font-semibold text-text-secondary">
            {formatBytes(totalBytes)}
          </span>
        </div>
        <ul className="divide-y divide-border/60">
          {usage.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <span className="min-w-0 text-sm text-text-primary">
                {cat.label}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-xs font-medium text-text-secondary">
                  {formatBytes(cat.bytes)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleClearCategory(cat)}
                  disabled={cat.bytes === 0}
                  className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated divide-y divide-border/60">
        <DataRow
          icon={Download}
          title="Export Data"
          description="Download a JSON backup of your boards, history, and preferences from this browser."
          actionLabel="Export"
          onAction={handleExportData}
          variant="primary"
        />
        <DataRow
          icon={Upload}
          title="Import Data"
          description="Restore from a previously exported backup file. Existing keys are overwritten."
          actionLabel="Choose File"
          onAction={() => fileInputRef.current?.click()}
          variant="neutral"
        />
        <DataRow
          icon={RotateCcw}
          title="Reset Local Data"
          description="Clear all ChessVision data stored in this browser. This cannot be undone."
          actionLabel="Reset"
          onAction={handleResetData}
          variant="danger"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportFile}
        className="hidden"
      />

      {message && (
        <div
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-text-primary"
        >
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-success"
            aria-hidden="true"
          />
          {message}
        </div>
      )}
    </div>
  );
});

type DataRowVariant = 'primary' | 'neutral' | 'danger';

const ROW_BUTTON_CLASSES: Record<DataRowVariant, string> = {
  primary:
    'bg-accent text-bg hover:bg-accent-hover focus-visible:ring-accent focus-visible:ring-offset-bg',
  neutral:
    'border border-border bg-surface text-text-primary hover:bg-surface-hover focus-visible:ring-accent focus-visible:ring-offset-bg',
  danger:
    'border border-error/30 bg-error/10 text-error hover:bg-error/20 focus-visible:ring-error focus-visible:ring-offset-bg'
};

const ROW_ICON_CLASSES: Record<DataRowVariant, string> = {
  primary: 'bg-accent/10 text-accent',
  neutral: 'bg-surface text-text-secondary',
  danger: 'bg-error/10 text-error'
};

function DataRow({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  variant: DataRowVariant;
}) {
  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ROW_ICON_CLASSES[variant]}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-text-primary">{title}</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto ${ROW_BUTTON_CLASSES[variant]}`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

DataManagement.displayName = 'DataManagement';
export default DataManagement;
