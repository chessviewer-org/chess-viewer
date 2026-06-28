import React, { memo, useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Info, X, XCircle } from 'lucide-react';

import { useFocusTrap } from '@hooks';

/** Visual severity variant for the `Modal` component. */
export type ModalType = 'warning' | 'info' | 'danger';

/** Props for the `Modal` component. */
interface ModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  type?: ModalType;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Animated, theme-aware modal dialog used as a replacement for native `alert`/`confirm`.
 *
 * Locks `<body>` scroll while open and animates in/out via Framer Motion.
 */
const Modal = memo(
  ({
    isOpen,
    title,
    message,
    children,
    type = 'info',
    onConfirm,
    onCancel
  }: ModalProps) => {
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

    const icons = {
      info: <Info className="w-6 h-6 text-blue-500" aria-hidden="true" />,
      warning: (
        <AlertTriangle className="w-6 h-6 text-amber-500" aria-hidden="true" />
      ),
      danger: <XCircle className="w-6 h-6 text-red-500" aria-hidden="true" />
    };

    const buttonStyles = {
      info: 'bg-blue-600 hover:bg-blue-700',
      warning: 'bg-amber-600 hover:bg-amber-700',
      danger: 'bg-red-600 hover:bg-red-700'
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-100 h-[100dvh] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCancel}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 p-2 bg-surface-elevated rounded-xl">
                    {icons[type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      id="modal-title"
                      className="text-lg font-bold text-text-primary mb-1"
                    >
                      {title}
                    </h3>
                    <div
                      id="modal-description"
                      className="text-sm text-text-secondary leading-relaxed"
                    >
                      {children || message}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Close dialog"
                    className="shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${buttonStyles[type]}`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);

Modal.displayName = 'Modal';

export default Modal;
