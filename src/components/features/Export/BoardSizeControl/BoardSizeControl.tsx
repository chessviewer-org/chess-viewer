import { useEffect, useMemo, useState } from 'react';

import { Input } from '@shared/ui';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function BoardSizeControl({ boardSize, setBoardSize }) {
  const [boardSizeInput, setBoardSizeInput] = useState(boardSize);
  const [boardSizeError, setBoardSizeError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const presets = useMemo(
    () => [
      {
        label: '4×4',
        value: 4
      },
      {
        label: '6×6',
        value: 6
      },
      {
        label: '8×8',
        value: 8
      }
    ],
    []
  );
  useEffect(() => {
    setBoardSizeInput(boardSize);
    const matchingPreset = presets.find((p) => p.value === boardSize);
    setSelectedPreset(matchingPreset ? matchingPreset.value : null);
  }, [boardSize, presets]);
  const handlePresetClick = (value) => {
    setSelectedPreset(value);
    setBoardSize(value);
    setBoardSizeInput(value);
    setBoardSizeError('');
  };
  const handleCustomInputChange = (e) => {
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
    <div className="space-y-3">
      <label className="text-sm font-semibold text-text-secondary">
        Board Size
      </label>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(5.75rem, 1fr))'
        }}
      >
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-[background-color,color,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${selectedPreset === preset.value ? 'bg-accent text-bg shadow-md shadow-accent/20' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border/50'}`}
          >
            {preset.label}
          </button>
        ))}
        <div className="relative">
          <Input
            value={boardSizeInput}
            onChange={handleCustomInputChange}
            placeholder="Custom"
            className="text-sm py-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
              }
            }}
          />
        </div>
      </div>
      {boardSizeError && <p className="text-xs text-error">{boardSizeError}</p>}
    </div>
  );
}
export default BoardSizeControl;
