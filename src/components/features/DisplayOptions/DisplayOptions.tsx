import { Checkbox } from '@shared/ui';
import { QUALITY_PRESETS } from '@constants';

export interface DisplayOptionsProps {
  showCoords: boolean;
  setShowCoords: (show: boolean) => void;
  showCoordinateBorder: boolean;
  setShowCoordinateBorder: (show: boolean) => void;
  showThinFrame: boolean;
  setShowThinFrame: (show: boolean) => void;
  exportQuality?: number;
}

/**
 * @param {DisplayOptionsProps} props
 * @returns {JSX.Element}
 */
function DisplayOptions({
  showCoords,
  setShowCoords,
  showCoordinateBorder,
  setShowCoordinateBorder,
  showThinFrame,
  setShowThinFrame,
  exportQuality = 16
}: DisplayOptionsProps) {
  const preset = QUALITY_PRESETS.find((p) => p.value === exportQuality);
  const isBorderForced = preset?.forceCoordinateBorder || false;
  const isSocialMode = preset?.mode === 'social';
  const isPrintMode = preset?.mode === 'print';
  const canShowFrame =
    isPrintMode && (exportQuality === 8 || exportQuality === 16);
  const effectiveBorderState = isBorderForced || showCoordinateBorder;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-text-secondary mb-3">
        Display Options
      </label>

      <Checkbox
        checked={showCoords}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setShowCoords(e.target.checked)
        }
        label="Show Coordinates"
      />

      {showCoords && (
        <div className="ml-0">
          <Checkbox
            checked={effectiveBorderState}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (!isBorderForced) {
                setShowCoordinateBorder(e.target.checked);
              }
            }}
            disabled={isBorderForced}
            label={
              <span className="flex items-center gap-2">
                Coordinate Border
                {isBorderForced && (
                  <span className="text-xs text-warning font-normal">
                    (Required for {exportQuality}× export)
                  </span>
                )}
              </span>
            }
          />
          {isSocialMode && (
            <p className="text-xs text-text-muted mt-1 ml-6">
              Border is required for social/zoom export modes (24×, 32×)
            </p>
          )}
        </div>
      )}

      {canShowFrame && (
        <Checkbox
          checked={showThinFrame || false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setShowThinFrame(e.target.checked)
          }
          label={
            <span className="flex items-center gap-2">
              Thin Frame
              <span className="text-xs text-text-muted font-normal">
                (8× and 16× only)
              </span>
            </span>
          }
        />
      )}
    </div>
  );
}

export default DisplayOptions;
