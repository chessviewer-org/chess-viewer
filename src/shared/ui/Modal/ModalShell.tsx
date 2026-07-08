import React, { memo, useRef } from 'react';

import { LucideIcon, X } from '@/assets/icons';

import { useFocusTrap, useScrollLock } from '@/shared/hooks';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  disableBackdropClick?: boolean;
}

const ModalShell = memo(
  ({
    isOpen,
    onClose,
    title,
    icon: Icon,
    iconColor = 'text-accent',
    children,
    maxWidth = 'max-w-lg',
    showCloseButton = true,
    disableBackdropClick = false
  }: ModalShellProps) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    useFocusTrap(dialogRef, isOpen);
    useScrollLock(isOpen);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-90 h-dvh flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-modal-backdrop-in"
          onClick={disableBackdropClick ? undefined : onClose}
        />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-shell-title"
          className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-modal-in`}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <Icon
                  className={`w-5 h-5 shrink-0 ${iconColor}`}
                  aria-hidden="true"
                />
              )}
              <h3
                id="modal-shell-title"
                className="text-base sm:text-lg font-bold text-text-primary truncate"
              >
                {title}
              </h3>
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-2 -mr-1 min-h-11 min-w-11 flex items-center justify-center hover:bg-surface-hover rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="w-5 h-5 text-text-muted" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto min-h-0">{children}</div>
        </div>
      </div>
    );
  }
);

ModalShell.displayName = 'ModalShell';

export default ModalShell;
