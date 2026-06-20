import { memo } from 'react';

import { Checkbox } from '@shared/ui';

/** Props for the `DisplayOptions` checkbox group. */
export interface DisplayOptionsProps {
  showCoords: boolean;
  setShowCoords: (show: boolean) => void;
  showCoordinateBorder: boolean;
  setShowCoordinateBorder: (show: boolean) => void;
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
  showCoordinateBorder,
  setShowCoordinateBorder,
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
        checked={showCoordinateBorder}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setShowCoordinateBorder(e.target.checked)
        }
        label="Board Frame"
      />
    </div>
  );
}

export default memo(DisplayOptions);
