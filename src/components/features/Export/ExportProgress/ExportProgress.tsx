import { memo, useEffect, useState } from 'react';

import { FileImage, Pause, Play, XCircle } from 'lucide-react';

import {
  type ExportConfig,
  type ExportInfo,
  type FileSizeEstimates,
  getExportInfo
} from '@utils';
import { ModalShell } from '@shared/ui';

/** Props for the `ExportProgress` modal overlay. */
interface ExportProgressProps {
  isExporting: boolean;
  progress: number;
  currentFormat: string | null;
  config: ExportConfig | null;
  statusText?: string;
  onClose?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  isPaused?: boolean;
}

/**
 * Modal progress overlay for active export operations.
 *
 * Smoothly interpolates the progress bar and surfaces pause/resume/cancel controls.
 * Returns `null` when no export is in progress.
 */
const ExportProgress = memo(function ExportProgress({
  isExporting,
  progress,
  currentFormat,
  config,
  statusText,
  onClose,
  onPause,
  onResume,
  onCancel,
  isPaused
}: ExportProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (!isExporting || isPaused) return;
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= progress) return progress;
        const diff = progress - prev;
        const increment = Math.max(2, Math.min(10, diff / 3));
        return Math.min(progress, prev + increment);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [progress, isExporting, isPaused]);

  useEffect(() => {
    if (!isExporting) {
      setDisplayProgress(0);
    }
  }, [isExporting]);

  if (!isExporting) return null;

  const format = (currentFormat || 'png') as keyof FileSizeEstimates;
  let exportInfo: ExportInfo | null = null;
  try {
    exportInfo = config ? getExportInfo(config) : null;
  } catch {
    exportInfo = null;
  }

  return (
    <ModalShell
      isOpen={isExporting}
      onClose={onClose || (() => {})}
      title={`Exporting ${String(format).toUpperCase()}`}
      icon={FileImage}
      iconColor="text-text-secondary"
      maxWidth="max-w-md"
      showCloseButton={!!onClose}
      disableBackdropClick={true}
    >
      <div className="space-y-5">
        <p className="text-sm text-text-secondary">
          {isPaused ? 'Paused' : statusText || 'Creating image...'}
        </p>

        {exportInfo && (
          <div className="text-xs text-text-muted bg-surface-elevated border border-border rounded-lg px-3 py-2 space-y-1">
            <div>Resolution: {exportInfo.displaySize}</div>
            <div>
              File size estimate:{' '}
              {exportInfo.fileSizeEstimates[format] ||
                exportInfo.fileSizeEstimates['png']}
            </div>
            {exportInfo.isLargeExport && (
              <div className="text-warning mt-1">
                Large export (RAM: {exportInfo.memoryEstimateMB} MB). May take
                longer.
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div
            className="relative h-2 bg-surface-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={displayProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute inset-y-0 left-0 bg-accent rounded-full transition-all duration-150 ease-linear overflow-hidden"
              style={{
                width: `${displayProgress}%`
              }}
            >
              {!isPaused && (
                <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-white/25 to-transparent" />
              )}
            </div>
          </div>
          <p className="text-center text-sm font-semibold text-text-primary">
            {Math.round(displayProgress)}% complete
          </p>
        </div>

        <div className="flex gap-3">
          {onPause && onResume && (
            <button
              type="button"
              onClick={isPaused ? onResume : onPause}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg transition-colors text-text-primary font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={isPaused ? 'Resume export' : 'Pause export'}
            >
              {isPaused ? (
                <>
                  <Play
                    className="w-4 h-4"
                    strokeWidth={2.5}
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause
                    className="w-4 h-4"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  <span>Pause</span>
                </>
              )}
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-error/10 hover:bg-error/20 border border-error/30 rounded-lg transition-colors text-error font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Cancel export"
            >
              <XCircle
                className="w-4 h-4"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
});

ExportProgress.displayName = 'ExportProgress';
export default ExportProgress;
