import { memo } from 'react';
import { Plus, Wand2 } from 'lucide-react';

import type { BoardPreset } from '@/shared/types';

import ColorPickerPanel from './ColorPickerPanel';

interface CustomMixerPanelProps {
  previewLight: string;
  previewDark: string;
  editMode: boolean;
  isAddingNew: boolean;
  canAddPreset: boolean;
  editingPreset: BoardPreset | null;
  editingPresetId: string | null;
  draftPresetName: string;
  setDraftPresetName: (name: string) => void;
  onPresetNameCommit: () => void;
  onCustomColorChange: (light: string, dark: string) => void;
  onEditColorChange: (light: string, dark: string) => void;
  onAddPreset: () => void;
  onConfirmAdd: () => void;
  onDoneClick: () => void;
}

const CustomMixerPanel = memo(function CustomMixerPanel({
  previewLight,
  previewDark,
  editMode,
  isAddingNew,
  canAddPreset,
  editingPreset,
  editingPresetId,
  draftPresetName,
  setDraftPresetName,
  onPresetNameCommit,
  onCustomColorChange,
  onEditColorChange,
  onAddPreset,
  onConfirmAdd,
  onDoneClick
}: CustomMixerPanelProps) {
  const colorChangeHandler =
    editMode && editingPresetId !== null ? onEditColorChange : onCustomColorChange;

  return (
    <div className="rounded-xl border border-border/50 bg-surface-elevated p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg border border-border/40 bg-surface">
        <div
          className="w-5 h-5 rounded border border-border/50"
          style={{ backgroundColor: previewLight }}
        />
        <div
          className="w-5 h-5 rounded border border-border/50"
          style={{ backgroundColor: previewDark }}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-primary truncate">
            {isAddingNew
              ? 'Creating New Preset'
              : editingPreset
                ? `Editing ${editingPreset.name}`
                : 'Custom Color Mixer'}
          </p>
          <p className="text-[11px] text-text-muted truncate">
            Hue slider and canvas are active for both squares.
          </p>
        </div>
      </div>

      {editMode && (
        <div className="mb-3">
          <label className="block text-[11px] font-semibold text-text-secondary mb-1.5">
            Theme Name
          </label>
          <input
            value={draftPresetName}
            onChange={(event) => setDraftPresetName(event.target.value.slice(0, 20))}
            onBlur={onPresetNameCommit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onPresetNameCommit();
              }
            }}
            placeholder="Custom theme name"
            className="w-full h-9 px-3 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60"
          />
        </div>
      )}

      <ColorPickerPanel
        currentLight={previewLight}
        currentDark={previewDark}
        onColorChange={colorChangeHandler}
      />

      {editMode && (
        <div className="mt-4 flex gap-2">
          {isAddingNew ? (
            <button
              onClick={onConfirmAdd}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-accent hover:bg-accent-hover text-bg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Add Theme
            </button>
          ) : (
            <button
              onClick={onAddPreset}
              disabled={!canAddPreset}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors duration-200 flex items-center justify-center gap-2 ${canAddPreset ? 'bg-accent hover:bg-accent-hover text-bg shadow-md' : 'bg-surface-elevated text-text-muted opacity-60 cursor-not-allowed'}`}
            >
              <Plus className="w-4 h-4" />
              New Theme
            </button>
          )}

          <button
            onClick={onDoneClick}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary transition-colors duration-200"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
});

CustomMixerPanel.displayName = 'CustomMixerPanel';
export default CustomMixerPanel;
