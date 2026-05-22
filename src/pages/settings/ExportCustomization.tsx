import { memo, useEffect, useMemo, useState } from 'react';

import { FileText, Printer, Ruler, Share2 } from 'lucide-react';

import { Input } from '@shared/ui';
import { QUALITY_PRESETS } from '@constants';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
interface BoardSizeSectionProps {
  boardSize: number;
  setBoardSize: (size: number) => void;
}

const BoardSizeSection = memo(function BoardSizeSection({
  boardSize,
  setBoardSize
}: BoardSizeSectionProps) {
  const [boardSizeInput, setBoardSizeInput] = useState<number | string>(boardSize);
  const [boardSizeError, setBoardSizeError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const presets = useMemo(
    () => [
      {
        label: '4×4',
        value: 4,
        desc: 'Small'
      },
      {
        label: '6×6',
        value: 6,
        desc: 'Medium'
      },
      {
        label: '8×8',
        value: 8,
        desc: 'Large'
      }
    ],
    []
  );
  useEffect(() => {
    setBoardSizeInput(boardSize);
    const matchingPreset = presets.find((p) => p.value === boardSize);
    setSelectedPreset(matchingPreset ? matchingPreset.value : null);
  }, [boardSize, presets]);
  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setBoardSize(value);
    setBoardSizeInput(value);
    setBoardSizeError('');
  };
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedPreset(null);
    if (value === '') {
      setBoardSizeInput('');
      setBoardSizeError('');
      return;
    }
    if (!/^\d*\.?\d*$/.test(value)) {
      setBoardSizeInput(value);
      setBoardSizeError('Numbers only');
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setBoardSizeInput(numValue);
      if (numValue < 4) {
        setBoardSizeError('Min 4 cm');
      } else if (numValue > 16) {
        setBoardSizeError('Max 16 cm');
      } else {
        setBoardSizeError('');
        setBoardSize(numValue);
      }
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Ruler className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-primary">Board Size</h3>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(6.5rem, 1fr))'
        }}
      >
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-3 text-sm font-medium rounded-lg transition-[background-color,color,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${selectedPreset === preset.value ? 'bg-accent text-bg shadow-sm' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border'}`}
          >
            <span className="font-semibold">{preset.label}</span>
            <span className="text-xs opacity-75">{preset.desc}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-text-secondary">
          Custom Size (cm)
        </label>
        <Input
          value={boardSizeInput}
          onChange={handleCustomInputChange}
          placeholder="Enter size (4-16 cm)"
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        {boardSizeError && (
          <p className="text-xs text-error font-medium">{boardSizeError}</p>
        )}
      </div>
    </div>
  );
});
BoardSizeSection.displayName = 'BoardSizeSection';
interface ExportCustomizationProps {
  boardSize: number;
  setBoardSize: (size: number) => void;
  fileName: string;
  setFileName: (name: string) => void;
  exportQuality: number;
  setExportQuality: (quality: number) => void;
}

/**
 * @param {ExportCustomizationProps} props
 * @returns {JSX.Element}
 */
const ExportCustomization = memo(function ExportCustomization({
  boardSize,
  setBoardSize,
  fileName,
  setFileName,
  exportQuality,
  setExportQuality
}: ExportCustomizationProps) {
  const printPresets = QUALITY_PRESETS.filter((p) => p.mode === 'print');
  const socialPresets = QUALITY_PRESETS.filter((p) => p.mode === 'social');
  const currentPreset = QUALITY_PRESETS.find((p) => p.value === exportQuality);
  return (
    <div className="h-full flex flex-col lg:flex-row gap-0 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <div className="flex-1 p-4 lg:p-6 lg:border-r border-border flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <BoardSizeSection boardSize={boardSize} setBoardSize={setBoardSize} />

          <div className="h-px bg-border" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">
                File Name
              </h3>
            </div>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="chess-position"
            />
            <p className="text-xs text-text-muted">
              Output:{' '}
              <span className="font-mono font-medium text-text-secondary">
                {fileName || 'board'}
              </span>
              .png / .jpeg
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">
                Print Quality
              </h3>
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))'
              }}
            >
              {printPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setExportQuality(preset.value)}
                  className={`px-3 py-3 rounded-lg text-sm font-semibold transition-[background-color,color,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${exportQuality === preset.value ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border/50'}`}
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

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">
                Social
              </h3>
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))'
              }}
            >
              {socialPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setExportQuality(preset.value)}
                  className={`px-3 py-3 rounded-lg text-sm font-semibold transition-[background-color,color,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${exportQuality === preset.value ? 'bg-accent text-bg shadow-lg shadow-accent/20' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border/50'}`}
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
            <div className="p-3 rounded-lg bg-surface border border-border">
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
      </div>
    </div>
  );
});
ExportCustomization.displayName = 'ExportCustomization';
export default ExportCustomization;
