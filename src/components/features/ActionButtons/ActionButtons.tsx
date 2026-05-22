import { memo, useEffect, useRef, useState } from 'react';
import { useModal } from '@/contexts';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Download, Heart, Image, RefreshCcw } from 'lucide-react';

export interface ActionButtonsProps {
  /** Callback fired to download board state as a PNG */
  onDownloadPNG: () => void;
  /** Callback fired to download board state as a JPEG */
  onDownloadJPEG: () => void;
  /** Callback fired to copy the board render to system clipboard */
  onCopyImage: () => void;
  /** Callback fired to flip board files and ranks orientation */
  onFlip: () => void;
  /** Callback fired to trigger batch exports in designated formats */
  onBatchExport: (formats: string[]) => void;
  /** Callback fired to add current FEN to favorites */
  onAddToFavorites?: () => void;
  /** State indicator disabling interactions if an export task is active */
  isExporting: boolean;
  /** The currently active FEN string */
  currentFen?: string;
  /** Whether the current FEN is in favorites */
  isFavorite?: boolean;
}

/**
 * ActionButtons component renders the dashboard primary action controls:
 * PNG/JPEG download triggers, batch format config drawers, orientation flipping,
 * and board image clipboard copy buttons.
 *
 * Designed with a strict minimalist philosophy, omitting heavy transformations
 * in favor of fast, responsive click feedback.
 *
 * @param props - Component configuration properties
 * @returns Clean, minimalist action bar row
 */
const ActionButtons = memo(function ActionButtons({
  onDownloadPNG,
  onDownloadJPEG,
  onCopyImage,
  onFlip,
  onBatchExport,
  onAddToFavorites,
  isExporting,
  isFavorite
}: ActionButtonsProps) {
  const { showAlert } = useModal();
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<{
    png: boolean;
    jpeg: boolean;
  }>({
    png: true,
    jpeg: false
  });

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const toggleFormat = (format: keyof typeof selectedFormats) => {
    setSelectedFormats((prev) => ({ ...prev, [format]: !prev[format] }));
  };

  const handleBatchExport = () => {
    const formats = (
      Object.keys(selectedFormats) as Array<keyof typeof selectedFormats>
    ).filter((key) => selectedFormats[key]);
    if (formats.length === 0) {
      showAlert('Selection Required', 'Please select at least one format', 'warning');
      return;
    }
    onBatchExport(formats);
    setShowBatchMenu(false);
  };

  const handleCopy = async () => {
    await onCopyImage();
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="space-y-4 w-full"
      role="group"
      aria-label="Export and board actions"
    >
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3"
        role="group"
        aria-label="Download options"
      >
        <button
          onClick={onDownloadPNG}
          disabled={isExporting}
          aria-label="Download PNG"
          className="group px-3 sm:px-4 py-2.5 sm:py-3.5 min-h-11 rounded-xl font-semibold text-xs sm:text-sm transition duration-200 ease-out flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-accent hover:bg-accent-hover text-bg shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>PNG</span>
        </button>

        <button
          onClick={onDownloadJPEG}
          disabled={isExporting}
          aria-label="Download JPEG"
          className="group px-3 sm:px-4 py-2.5 sm:py-3.5 min-h-11 rounded-xl font-semibold text-xs sm:text-sm transition duration-200 ease-out flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-accent hover:bg-accent-hover text-bg shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>JPEG</span>
        </button>

        <button
          onClick={() => setShowBatchMenu(!showBatchMenu)}
          disabled={isExporting}
          aria-label="Batch export"
          aria-expanded={showBatchMenu}
          className="col-span-2 sm:col-span-1 group px-3 sm:px-4 py-2.5 sm:py-3.5 min-h-11 rounded-xl font-semibold text-xs sm:text-sm transition duration-200 ease-out flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Image className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>Batch Export</span>
        </button>
      </div>

      <AnimatePresence>
        {showBatchMenu && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="bg-surface-elevated rounded-xl p-4 sm:p-5 space-y-4 border border-border origin-top"
            role="region"
            aria-label="Batch export options"
          >
            <div className="flex items-center gap-2.5 text-sm font-semibold text-text-primary">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Image className="w-3.5 h-3.5 text-accent" />
              </div>
              <span>Select Formats</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {(
                Object.keys(selectedFormats) as Array<keyof typeof selectedFormats>
              ).map((format) => (
                <label
                  key={format}
                  className={`group flex items-center gap-2.5 cursor-pointer px-3.5 py-2.5 sm:py-3 min-h-11 rounded-lg border-2 transition duration-200 active:scale-[0.98] ${
                    selectedFormats[format]
                      ? 'bg-accent/10 border-accent text-accent shadow-sm'
                      : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFormats[format]}
                    onChange={() => toggleFormat(format)}
                    className="w-4 h-4 accent-accent cursor-pointer rounded focus:ring-accent"
                  />
                  <span className="text-sm font-semibold uppercase">
                    {format}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={handleBatchExport}
              className="w-full py-2.5 sm:py-3 px-4 min-h-11 bg-accent hover:bg-accent-hover text-bg rounded-xl font-semibold shadow-md active:scale-[0.98] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Export Selected Formats
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={handleCopy}
          disabled={isExporting}
          aria-label="Copy to clipboard"
          className="group px-2 sm:px-3 py-2 sm:py-3 min-h-11 rounded-lg font-medium text-xs sm:text-sm transition duration-200 ease-out flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-success" />
              <span className="text-success font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Copy</span>
            </>
          )}
        </button>

        <button
          onClick={onFlip}
          disabled={isExporting}
          aria-label="Flip board"
          className="group px-2 sm:px-3 py-2 sm:py-3 min-h-11 rounded-lg font-medium text-xs sm:text-sm transition duration-200 ease-out flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <RefreshCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>Flip</span>
        </button>

        <button
          onClick={onAddToFavorites}
          disabled={isExporting}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="col-span-2 sm:col-span-1 group px-2 sm:px-3 py-2 sm:py-3 min-h-11 rounded-lg font-medium text-xs sm:text-sm transition duration-200 ease-out flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-elevated hover:bg-surface-hover border border-border active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Heart
            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
              isFavorite ? 'text-error fill-error' : 'text-text-secondary'
            }`}
          />
          <span>{isFavorite ? 'Favorite' : 'Add Favorite'}</span>
        </button>
      </div>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
