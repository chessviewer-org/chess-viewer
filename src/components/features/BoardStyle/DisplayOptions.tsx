import { memo } from 'react';

import { Checkbox } from '@shared/ui';

interface DisplayOptionsProps {
  showCoords: boolean;
  setShowCoords: (show: boolean) => void;
  showThinFrame: boolean;
  setShowThinFrame: (show: boolean) => void;

  hideLabel?: boolean;

  applyToAll?: boolean;
  setApplyToAll?: (apply: boolean) => void;
}

function DisplayOptionsComponent({
  showCoords,
  setShowCoords,
  showThinFrame,
  setShowThinFrame,
  hideLabel = false,
  applyToAll,
  setApplyToAll
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

      {applyToAll !== undefined && setApplyToAll !== undefined && (
        <Checkbox
          checked={applyToAll}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setApplyToAll(e.target.checked)
          }
          label="Apply to All Positions"
        />
      )}
    </div>
  );
}

export const DisplayOptions = memo(DisplayOptionsComponent);
DisplayOptions.displayName = 'DisplayOptions';
