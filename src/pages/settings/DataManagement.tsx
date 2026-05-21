import React, { memo, useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { safeJSONParse } from '@utils/validation';
import { useModal } from '@/contexts';

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
  'themeSettings',
  'recentColors',
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
    const data = safeJSONParse(text, null);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      showAlert('Import Failed', 'Invalid backup file format.', 'danger');
      return;
    }
    STORAGE_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = (data as any)[key];
        localStorage.setItem(
          key,
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      }
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
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Data Management
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Export, import, or reset local browser data.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent-hover text-bg rounded-lg font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-elevated hover:bg-surface-hover border border-border text-text-primary rounded-lg font-semibold transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-lg font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Local Data
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />

        {message && <p className="text-sm text-text-secondary">{message}</p>}
      </div>
    </div>
  );
});

DataManagement.displayName = 'DataManagement';
export default DataManagement;
