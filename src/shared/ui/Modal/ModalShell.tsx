import React, { memo, useEffect } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { LucideIcon, X } from 'lucide-react';

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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full ${maxWidth} bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
                  <h3 className="text-lg font-bold text-text-primary">
                    {title}
                  </h3>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                )}
              </div>
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);

ModalShell.displayName = 'ModalShell';

export default ModalShell;
