import { memo, useState } from 'react';

import { Check, Copy, Download, Image, RefreshCcw } from 'lucide-react';

/**
 * Export action toolbar: PNG/JPEG download, batch export, flip, and clipboard copy.
 * @param {Object} props
 * @param {Function} props.onDownloadPNG - Triggers PNG download
 * @param {Function} props.onDownloadJPEG - Triggers JPEG download
 * @param {Function} props.onCopyImage - Copies board image to clipboard
 * @param {Function} props.onFlip - Flips the board orientation
 * @param {Function} props.onBatchExport - Called with an array of format strings for batch export
 * @param {boolean} props.isExporting - Whether an export is currently in progress (disables buttons)
 * @returns {JSX.Element}
 */
const ActionButtons = memo(function ActionButtons({
  onDownloadPNG,
  onDownloadJPEG,
  onCopyImage,
  onFlip,
  onBatchExport,
  isExporting
}) {
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState({
    png: true,
    jpeg: false
  });

  /**
   * Toggles a format key in the batch-export selection state.
   * @param {'png'|'jpeg'} format - Format key to toggle
   */
  const toggleFormat = (format) => {
    setSelectedFormats((prev) => ({ ...prev, [format]: !prev[format] }));
  };

  /**
   * Validates format selection and fires `onBatchExport` with the chosen formats.
   */
  const handleBatchExport = () => {
    const formats = Object.keys(selectedFormats).filter(
      (key) => selectedFormats[key]
    );
    if (formats.length === 0) {
      alert('Please select at least one format');
      return;
    }
    onBatchExport(formats);
    setShowBatchMenu(false);
  };

  /**
   * Copies the board image to the clipboard, then briefly shows a success indicator.
   * @returns {Promise<void>}
   */
  const handleCopy = async () => {
    await onCopyImage();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="group px-3 sm:px-4 py-2.5 sm:py-3.5 min-h-[44px] rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-accent hover:bg-accent-hover text-bg shadow-sm hover:shadow-md hover:scale-[1.02]"
        >
          <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>PNG</span>
        </button>

        <button
          onClick={onDownloadJPEG}
          disabled={isExporting}
          aria-label="Download JPEG"
          className="group px-3 sm:px-4 py-2.5 sm:py-3.5 min-h-[44px] rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-accent hover:bg-accent-hover text-bg shadow-sm hover:shadow-md hover:scale-[1.02]"
        >
          <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>JPEG</span>
        </button>

        <button
          onClick={() => setShowBatchMenu(!showBatchMenu)}
          disabled={isExporting}
          aria-label="Batch export"
          aria-expanded={showBatchMenu}
          className="col-span-2 sm:col-span-1 group px-3 sm:px-4 py-2.5 sm:py-3.5 min-h-[44px] rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border shadow-sm hover:shadow-md hover:scale-[1.02]"
        >
          <Image className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>Batch Export</span>
        </button>
      </div>

      {showBatchMenu && (
        <div
          className="bg-surface-elevated rounded-xl p-4 sm:p-5 space-y-4 border border-border"
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
            {Object.keys(selectedFormats).map((format) => (
              <label
                key={format}
                className={`group flex items-center gap-2.5 cursor-pointer px-3.5 py-2.5 sm:py-3 min-h-[44px] rounded-lg border-2 transition-colors duration-200 ${
                  selectedFormats[format]
                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                    : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFormats[format]}
                  onChange={() => toggleFormat(format)}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
                <span className="text-sm font-semibold uppercase">
                  {format}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={handleBatchExport}
            className="w-full py-2.5 sm:py-3 px-4 min-h-[44px] bg-accent hover:bg-accent-hover text-bg rounded-xl font-semibold shadow-md hover:shadow-lg transition-colors duration-200"
          >
            Export Selected Formats
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          onClick={handleCopy}
          disabled={isExporting}
          aria-label="Copy to clipboard"
          className="group px-2 sm:px-3 py-2 sm:py-3 min-h-[44px] rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border hover:border-accent/50 hover:shadow-sm hover:scale-[1.02]"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Copied!</span>
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
          className="group px-2 sm:px-3 py-2 sm:py-3 min-h-[44px] rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border hover:border-accent/50 hover:shadow-sm hover:scale-[1.02]"
        >
          <RefreshCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>Flip</span>
        </button>
      </div>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
