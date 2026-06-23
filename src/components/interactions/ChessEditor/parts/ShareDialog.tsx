import { memo, useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Link2, Share2, X } from 'lucide-react';

import { useFocusTrap } from '@hooks';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fen: string;
  positionUrl: string;
  onCopyLink: () => void;
}

const ShareDialog = memo(function ShareDialog({
  isOpen,
  onClose,
  fen,
  positionUrl,
  onCopyLink
}: ShareDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-sm bg-surface-elevated border border-border rounded-2xl shadow-xl p-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2
                id="share-dialog-title"
                className="flex items-center gap-2 text-base font-semibold text-text-primary"
              >
                <Share2
                  className="w-4 h-4 text-text-secondary"
                  aria-hidden="true"
                />
                Share position
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close share dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Position info */}
            <div className="rounded-xl border border-border bg-surface px-3 py-3 mb-4 flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                  Shareable link
                </span>
                <p className="text-xs font-medium text-accent break-all leading-relaxed">
                  {positionUrl}
                </p>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                  FEN
                </span>
                <p className="text-xs font-mono text-text-secondary break-all leading-relaxed">
                  {fen}
                </p>
              </div>
            </div>

            {/* Copy button */}
            <button
              type="button"
              onClick={onCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Link2 className="w-4 h-4" aria-hidden="true" />
              Copy link
            </button>

            <p className="mt-3 text-center text-[11px] text-text-muted leading-snug">
              Anyone who opens this link will see the position loaded on the
              board.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

ShareDialog.displayName = 'ShareDialog';
export default ShareDialog;
