import React, { memo, useRef, useState } from 'react';

import {
  CheckCircle2,
  Download,
  type LucideIcon,
  RotateCcw,
  Upload
} from 'lucide-react';

import { useModal } from '@/contexts';

import { safeJSONParse } from '@utils/validation';

const STORAGE_KEYS = [
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
  'chess-export-quality',
  'fen-history',
  'fen-history-archive',
  'favoriteFens',
  'fenClipboardHistory',
  'fenBatchList',
  'advancedFENFavorites',
  'advanced-fen-position-settings',
  'customThemePresets'
];

const DataManagement = memo(function DataManagement() {
  const { showConfirm, showAlert } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

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
    setMessage('Data reset. Refresh the page to start clean.');
  }

  return (
    <div className="space-y-4">
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
