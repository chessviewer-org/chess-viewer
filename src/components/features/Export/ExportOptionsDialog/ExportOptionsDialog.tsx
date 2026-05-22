import { Printer, Settings, Share2 } from 'lucide-react';

import { Button, Input, Modal } from '@shared/ui';
import { QUALITY_PRESETS } from '@/constants';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function ExportOptionsDialog({
  isOpen,
  onClose,
  fileName,
  setFileName,
  exportQuality,
  setExportQuality
}) {
  const printPresets = QUALITY_PRESETS.filter((p) => p.mode === 'print');
  const socialPresets = QUALITY_PRESETS.filter((p) => p.mode === 'social');
  const currentPreset = QUALITY_PRESETS.find((p) => p.value === exportQuality);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Settings"
      icon={Settings}
      iconColor="text-accent"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-text-primary">
            Export Quality
          </label>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Printer className="w-3.5 h-3.5" />
              <span>Print Quality</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {printPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setExportQuality(preset.value)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${exportQuality === preset.value ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                  title={preset.description}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{preset.label}</span>
                    <span className="text-xs opacity-70 font-normal">
                      {preset.value === 8 ? 'Standard' : 'High'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Share2 className="w-3.5 h-3.5" />
              <span>Social / Zoom</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {socialPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setExportQuality(preset.value)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${exportQuality === preset.value ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                  title={preset.description}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{preset.label}</span>
                    <span className="text-xs opacity-70 font-normal">
                      {preset.value === 24 ? 'Ultra' : 'Maximum'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {currentPreset && (
            <div className="p-3 rounded-lg bg-surface-elevated border border-border">
              <p className="text-xs text-text-secondary leading-relaxed">
                {currentPreset.mode === 'print' ? (
                  <>
                    <strong className="text-accent font-semibold">
                      Print:
                    </strong>{' '}
                    Board size preserved, pixel density increased for sharp
                    prints.
                  </>
                ) : (
                  <>
                    <strong className="text-accent font-semibold">
                      Social:
                    </strong>{' '}
                    Keeps board size and increases export detail.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Input
            label="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="board"
          />
          <p className="text-xs text-text-muted">
            <span className="font-data font-semibold text-text-secondary">
              {fileName || 'board'}
            </span>
            .png or .jpeg
          </p>
        </div>

        <Button onClick={onClose} variant="primary" fullWidth>
          Done
        </Button>
      </div>
    </Modal>
  );
}
export default ExportOptionsDialog;
