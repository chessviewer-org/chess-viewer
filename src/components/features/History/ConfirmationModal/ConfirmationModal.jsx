import { memo } from 'react';

import { AlertTriangle, X } from 'lucide-react';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
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
}) {
  if (!isOpen) return null;
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-bg/95"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-error/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {}
        <div className="px-6 py-5">
          <p className="text-text-secondary leading-relaxed">{message}</p>

          {showDoNotAskAgain && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={doNotAskAgain}
                  onChange={(e) => onDoNotAskAgainChange(e.target.checked)}
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold bg-error hover:bg-error/90 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
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
