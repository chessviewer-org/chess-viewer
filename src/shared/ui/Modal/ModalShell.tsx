import React, { memo, useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { LucideIcon, X } from 'lucide-react';

import { useFocusTrap } from '@hooks';

export interface ModalShellProps {
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

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-90 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={disableBackdropClick ? undefined : onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-shell-title"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden`}
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
              <div className="p-4 sm:p-6 overflow-y-auto min-h-0">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);

ModalShell.displayName = 'ModalShell';

export default ModalShell;
