import { memo } from 'react';

import { AlertTriangle, X } from '@/assets/icons';
import { useScrollLock } from '@/shared/hooks';
import uiStyles from '@/shared/styles/ui.module.scss';

interface ConfirmationModalProps {
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

export const ConfirmationModal = memo(function ConfirmationModal({
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
  useScrollLock(isOpen);

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
    <div className={uiStyles['modalBackdrop']} onClick={handleBackdropClick}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className={uiStyles['modalContainer']}
      >
        <div className={uiStyles['modalHeaderDanger']}>
          <div className={uiStyles['modalTitleContainer']}>
            <div className={uiStyles['modalTitleIconDanger']}>
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <h2
              id="confirmation-modal-title"
              className={uiStyles['modalTitle']}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={uiStyles['modalCloseBtn']}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className={uiStyles['modalBody']}>
          <p className="text-text-secondary leading-relaxed">{message}</p>

          {showDoNotAskAgain && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className={uiStyles['checkboxLabel']}>
                <input
                  type="checkbox"
                  checked={doNotAskAgain}
                  onChange={(e) => onDoNotAskAgainChange?.(e.target.checked)}
                  className={uiStyles['checkboxInput']}
                />
                <span className={uiStyles['checkboxText']}>
                  Do not show this again
                </span>
              </label>
            </div>
          )}
        </div>

        <div className={uiStyles['modalFooter']}>
          <button
            type="button"
            onClick={onClose}
            className={uiStyles['btnSecondary']}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={uiStyles['btnDanger']}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});
ConfirmationModal.displayName = 'ConfirmationModal';
