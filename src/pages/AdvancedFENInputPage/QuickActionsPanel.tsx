import { memo, useCallback } from 'react';

import { Copy, FlipVertical2 } from 'lucide-react';

import { downloadJPEG, downloadPNG, downloadSVG, logger } from '@/utils';

/**
 * @typedef {Object} QuickActionsPanelProps
 * @property {string} currentFen - The currently active FEN string.
 * @property {Object} exportConfig - Configuration object passed to export utilities.
 * @property {string} fileName - Base file name used for exported files.
 * @property {string[]} validFens - Array of valid FEN strings available for batch export.
 * @property {Function} onFlip - Callback invoked when the user clicks "Flip Board".
 * @property {Function} onExportStart - Called when an export starts.
 * @property {Function} onExportProgress - Called with progress updates.
 * @property {Function} onExportFinish - Called when export work ends.
 */

/**
 * Renders quick-action buttons for flipping the board, copying the FEN,
 * single-format exports (PNG / JPEG / SVG) and batch exports.
 *
 * @param {QuickActionsPanelProps} props
 * @returns {JSX.Element}
 */
const QuickActionsPanel = memo(function QuickActionsPanel({
  currentFen,
  exportConfig,
  fileName,
  validFens,
  onFlip,
  onExportStart,
  onExportProgress,
  onExportFinish
}) {
  /**
   * Copies the current FEN string to the clipboard.
   *
   * @returns {Promise<void>}
   */
  const handleCopyFen = useCallback(
    async function handleCopyFen() {
      try {
        await navigator.clipboard.writeText(currentFen);
      } catch (err) {
        logger.error('Copy failed:', err);
      }
    },
    [currentFen]
  );

  /**
   * Exports the current position as a PNG.
   *
   * @returns {Promise<void>}
   */
  const handleExportPng = useCallback(
    async function handleExportPng() {
      try {
        onExportStart?.('png');
        await downloadPNG(exportConfig, fileName, (progress, label) => {
          onExportProgress?.(progress, 'png', label);
        });
      } catch (err) {
        logger.error('PNG export failed:', err);
      } finally {
        onExportFinish?.();
      }
    },
    [exportConfig, fileName, onExportFinish, onExportProgress, onExportStart]
  );

  /**
   * Exports the current position as a JPEG.
   *
   * @returns {Promise<void>}
   */
  const handleExportJpeg = useCallback(
    async function handleExportJpeg() {
      try {
        onExportStart?.('jpeg');
        await downloadJPEG(exportConfig, fileName, (progress, label) => {
          onExportProgress?.(progress, 'jpeg', label);
        });
      } catch (err) {
        logger.error('JPEG export failed:', err);
      } finally {
        onExportFinish?.();
      }
    },
    [exportConfig, fileName, onExportFinish, onExportProgress, onExportStart]
  );

  /**
   * Exports the current position as an SVG.
   *
   * @returns {Promise<void>}
   */
  const handleExportSvg = useCallback(
    async function handleExportSvg() {
      try {
        onExportStart?.('svg');
        await downloadSVG(exportConfig, fileName, (progress, label) => {
          onExportProgress?.(progress, 'svg', label);
        });
      } catch (err) {
        logger.error('SVG export failed:', err);
      } finally {
        onExportFinish?.();
      }
    },
    [exportConfig, fileName, onExportFinish, onExportProgress, onExportStart]
  );

  /**
   * Runs a batch export for all valid positions in a single format.
   *
   * @param {'png'|'jpeg'|'svg'} format - Output format for the batch
   * @param {string} label - Label used in error logging
   * @returns {Promise<void>}
   */
  const handleBatchExport = useCallback(
    async function handleBatchExport(format, label) {
      try {
        onExportStart?.(format);
        for (let i = 0; i < validFens.length; i++) {
          const fen = validFens[i];
          const numberedName =
            validFens.length > 1 ? `${fileName}-${i + 1}` : fileName;
          const config = {
            ...exportConfig,
            fen
          };
          const reportProgress = (progress, _label) => {
            const totalProgress =
              ((i + progress / 100) / validFens.length) * 100;
            onExportProgress?.(
              totalProgress,
              format,
              `${i + 1}/${validFens.length}`
            );
          };
          if (format === 'png') {
            await downloadPNG(config, numberedName, reportProgress);
          } else if (format === 'jpeg') {
            await downloadJPEG(config, numberedName, reportProgress);
          } else if (format === 'svg') {
            await downloadSVG(config, numberedName, reportProgress);
          }
        }
      } catch (err) {
        logger.error(`${label} failed:`, err);
      } finally {
        onExportFinish?.();
      }
    },
    [
      exportConfig,
      fileName,
      onExportFinish,
      onExportProgress,
      onExportStart,
      validFens
    ]
  );

  return (
    <div className="w-full flex flex-col gap-4 2xl:w-[280px] 2xl:max-w-[280px]">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Quick Actions
        </span>
        <button
          onClick={onFlip}
          className="w-full px-3 py-2 bg-surface-elevated hover:bg-surface-hover border border-border text-text-primary rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
        >
          <FlipVertical2 className="w-4 h-4" />
          Flip Board
        </button>
        <button
          onClick={handleCopyFen}
          className="w-full px-3 py-2 bg-surface-elevated hover:bg-surface-hover border border-border text-text-primary rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy FEN
        </button>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Single Export
        </span>
        <button
          onClick={handleExportPng}
          className="w-full px-3 py-2.5 bg-warning hover:bg-warning/90 text-bg rounded-lg font-semibold transition-colors text-sm"
        >
          Export PNG
        </button>
        <button
          onClick={handleExportJpeg}
          className="w-full px-3 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border text-text-primary rounded-lg font-semibold transition-colors text-sm"
        >
          Export JPEG
        </button>
        <button
          onClick={handleExportSvg}
          className="w-full px-3 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-semibold transition-colors text-sm"
        >
          Export SVG
        </button>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Batch Export
          </span>
          <span className="px-1.5 py-0.5 bg-surface-elevated rounded text-[10px] leading-none">
            {validFens.length}
          </span>
        </div>
        <button
          onClick={() => handleBatchExport('png', 'Batch PNG')}
          className="w-full px-3 py-2.5 bg-warning/20 hover:bg-warning/30 border border-warning/30 text-warning rounded-lg font-semibold transition-colors text-sm"
        >
          Batch PNG
        </button>
        <button
          onClick={() => handleBatchExport('jpeg', 'Batch JPEG')}
          className="w-full px-3 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-semibold transition-colors text-sm"
        >
          Batch JPEG
        </button>
        <button
          onClick={() => handleBatchExport('svg', 'Batch SVG')}
          className="w-full px-3 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary rounded-lg font-semibold transition-colors text-sm"
        >
          Batch SVG
        </button>
      </div>
    </div>
  );
});
QuickActionsPanel.displayName = 'QuickActionsPanel';

export default QuickActionsPanel;
