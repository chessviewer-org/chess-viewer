import { memo } from 'react';

import { Checkbox } from '@shared/ui';

/** Props for the `DisplayOptions` checkbox group. */
interface DisplayOptionsProps {
  showCoords: boolean;
  setShowCoords: (show: boolean) => void;
  showThinFrame: boolean;
  setShowThinFrame: (show: boolean) => void;
  /** Hide the "Display Options" section label (compact contexts). */
  hideLabel?: boolean;
}

/**
 * Coordinate and board-frame display toggles.
 *
 * The board frame is only offered once coordinates are enabled, since the frame
 * exists to host the coordinate labels.
 */
function DisplayOptions({
  showCoords,
  setShowCoords,
  showThinFrame,
  setShowThinFrame,
  hideLabel = false
}: DisplayOptionsProps) {
  return (
    <div className="space-y-3">
      {!hideLabel && (
        <label className="block text-sm font-semibold text-text-secondary mb-3">
          Display Options
        </label>
      )}

      <Checkbox
        checked={showCoords}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setShowCoords(e.target.checked)
        }
        label="Show Coordinates"
      />

      <Checkbox
        checked={showThinFrame}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setShowThinFrame(e.target.checked)
        }
        label="Board Frame"
      />
    </div>
  );
}

export default memo(DisplayOptions);
