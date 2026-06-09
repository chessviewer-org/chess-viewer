import { memo, useEffect } from 'react';

import { AlertTriangle, X } from 'lucide-react';

/** Props for the `ConfirmationModal` destructive-action dialog. */
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showDoNotAskAgain?: boolean;
  doNotAskAgain?: boolean;
  onDoNotAskAgainChange?: (checked: boolean) => void;
}

const ConfirmationModal = memo(function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showDoNotAskAgain = false,
  doNotAskAgain = false,
  onDoNotAskAgainChange
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-bg/95"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className="bg-surface-elevated border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
      >
        {}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-error/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-error/10 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <h2
              id="confirmation-modal-title"
              className="text-base sm:text-lg font-bold text-text-primary truncate"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-hover rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {}
        <div className="px-4 sm:px-6 py-5 overflow-y-auto min-h-0">
          <p className="text-text-secondary leading-relaxed">{message}</p>

          {showDoNotAskAgain && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={doNotAskAgain}
                  onChange={(e) => onDoNotAskAgainChange?.(e.target.checked)}
                  className="w-4 h-4 text-accent bg-surface border-border rounded focus:ring-2 focus:ring-accent"
                />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  Do not show this again
                </span>
              </label>
            </div>
          )}
        </div>

        {}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 bg-surface border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-10 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 min-h-10 text-sm font-semibold bg-error hover:bg-error/90 text-white rounded-lg transition-colors shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});
ConfirmationModal.displayName = 'ConfirmationModal';
export default ConfirmationModal;
