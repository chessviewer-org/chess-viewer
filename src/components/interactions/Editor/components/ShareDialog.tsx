import { memo, useEffect, useRef } from 'react';

import { Link2, Share2, X } from '@/assets/icons';

import { useFocusTrap, useScrollLock } from '@hooks';
import uiStyles from '@/shared/styles/ui.module.scss';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fen: string;
  positionUrl: string;
  onCopyLink: () => void;
}

export const ShareDialog = memo(function ShareDialog({
  isOpen,
  onClose,
  fen,
  positionUrl,
  onCopyLink
}: ShareDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={uiStyles['modalBackdrop']} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className={uiStyles['modalContainer'] + ' p-5'}
        onClick={(e) => e.stopPropagation()}
      >
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
            className={uiStyles['modalCloseBtn'] + ' p-1.5'}
            aria-label="Close share dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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

        <button
          type="button"
          onClick={onCopyLink}
          className={`${uiStyles['btnPrimary']} w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm`}
        >
          <Link2 className="w-4 h-4" aria-hidden="true" />
          Copy link
        </button>

        <p className="mt-3 text-center text-[11px] text-text-muted leading-snug">
          Anyone who opens this link will see the position loaded on the board.
        </p>
      </div>
    </div>
  );
});

ShareDialog.displayName = 'ShareDialog';
