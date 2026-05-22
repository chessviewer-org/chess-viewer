import { memo } from 'react';

import { AlertTriangle } from 'lucide-react';

export interface DuplicateWarningDialogProps {
  light: string;
  dark: string;
  onRename: () => void;
  onMerge: () => void;
  onCancel: () => void;
}

/**
 * Modal dialog shown when a duplicate theme color combination is detected.
 *
 * @param {DuplicateWarningDialogProps} props
 * @returns {JSX.Element}
 */
const DuplicateWarningDialog = memo(function DuplicateWarningDialog({
  light,
  dark,
  onRename,
  onMerge,
  onCancel
}: DuplicateWarningDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95">
      <div className="bg-surface rounded-xl border border-border p-6 max-w-sm w-full mx-4 shadow-xl animate-scaleIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Duplicate Theme
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              A theme with this color combination already exists.
            </p>
          </div>
        </div>
        <div className="flex gap-2 mb-5">
          <div
            className="flex-1 h-8 rounded"
            style={{
              backgroundColor: light
            }}
          />
          <div
            className="flex-1 h-8 rounded"
            style={{
              backgroundColor: dark
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onRename}
            className="w-full py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-bg text-sm font-semibold transition-all"
          >
            Keep Both (Rename)
          </button>
          <button
            onClick={onMerge}
            className="w-full py-2.5 px-4 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary text-sm font-semibold transition-all"
          >
            Merge into Existing
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 rounded-lg text-text-muted text-xs font-medium hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});
DuplicateWarningDialog.displayName = 'DuplicateWarningDialog';
export default DuplicateWarningDialog;
