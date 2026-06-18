import { memo, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  FileText,
  Image as ImageIcon,
  Link2,
  Mail,
  Megaphone,
  MessageCircle,
  Send,
  Share2,
  X
} from 'lucide-react';

import type { ShareMode, ShareTarget } from './useShareBoard';

/** Props for the {@link ShareDialog} board-sharing modal. */
export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fen: string;
  positionUrl?: string;
  targets: ShareTarget[];
  onOpenTarget: (target: ShareTarget) => void;
  onCopyLink: () => void;
  onShareImage: () => void;
  /** True while the board image is rendering. */
  isBusy: boolean;
}

/** Maps a text-share target id to its brand glyph. */
const TARGET_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="w-5 h-5" />,
  telegram: <Send className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
  twitter: <Megaphone className="w-5 h-5" />
};

const modeTab =
  'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200';

const ShareDialog = memo(function ShareDialog({
  isOpen,
  onClose,
  fen,
  positionUrl,
  targets,
  onOpenTarget,
  onCopyLink,
  onShareImage,
  isBusy
}: ShareDialogProps) {
  const [mode, setMode] = useState<ShareMode>('fen');

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

  // Reset to the default mode each time the dialog reopens.
  useEffect(() => {
    if (isOpen) setMode('fen');
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-md bg-surface-elevated border border-border rounded-2xl shadow-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                id="share-dialog-title"
                className="flex items-center gap-2 text-base font-semibold text-text-primary"
              >
                <Share2 className="w-5 h-5 text-text-secondary" />
                Share position
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close share dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode switch — FEN text vs. board image. */}
            <div
              className="flex gap-1 p-1 mb-4 bg-surface rounded-xl"
              role="tablist"
              aria-label="Share format"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'fen'}
                onClick={() => setMode('fen')}
                className={`${modeTab} ${
                  mode === 'fen'
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileText className="w-4 h-4" />
                FEN code
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'image'}
                onClick={() => setMode('image')}
                className={`${modeTab} ${
                  mode === 'image'
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Board image
              </button>
            </div>

            {mode === 'fen' ? (
              <div className="space-y-4">
                <div className="px-3 py-2 bg-surface rounded-lg border border-border flex flex-col gap-2">
                  {positionUrl && (
                    <div className="flex flex-col gap-1 pb-2 border-b border-border/50">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                        Shareable Link
                      </span>
                      <p className="text-xs font-medium text-accent break-all">
                        {positionUrl}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                      FEN Code
                    </span>
                    <p className="text-xs font-mono text-text-secondary break-all">
                      {fen}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {targets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => onOpenTarget(target)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      title={`Share via ${target.label}`}
                      aria-label={`Share via ${target.label}`}
                    >
                      {TARGET_ICONS[target.id] ?? (
                        <Share2 className="w-5 h-5" />
                      )}
                      <span className="text-[11px] leading-tight text-center">
                        {target.label}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-text-primary hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Link2 className="w-4 h-4" />
                  Copy link
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Render the current board as a PNG and share it through your
                  device — WhatsApp, Telegram, Mail and more.
                </p>
                <button
                  type="button"
                  onClick={onShareImage}
                  disabled={isBusy}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {isBusy ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Rendering…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Share board image
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

ShareDialog.displayName = 'ShareDialog';
export default ShareDialog;
