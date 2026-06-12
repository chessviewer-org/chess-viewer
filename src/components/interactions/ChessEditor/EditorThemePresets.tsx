import { memo, useCallback } from 'react';

import { MOST_USED_THEME_GROUPS } from '@constants';

export interface EditorThemePresetsProps {
  /** Active light square colour — used to mark the selected swatch. */
  selectedLight: string;
  /** Active dark square colour — used to mark the selected swatch. */
  selectedDark: string;
  /** Apply a preset's light/dark pair to the board. */
  onSelect: (light: string, dark: string) => void;
}

/**
 * Compact, read-only preset picker for the ChessEditor settings panel.
 *
 * Shows only the curated "most-used" presets (`MOST_USED_THEME_GROUPS`),
 * grouped by board style family (2D · 3D). No edit mode, no add button, no
 * pagination — that full theme-studio capability lives in the export flow
 * (`ThemeStudioStep`). Swatches are intentionally small for a dense grid.
 */
const EditorThemePresets = memo(function EditorThemePresets({
  selectedLight,
  selectedDark,
  onSelect
}: EditorThemePresetsProps) {
  const handleSelect = useCallback(
    (light: string, dark: string) => () => onSelect(light, dark),
    [onSelect]
  );

  return (
    <div className="flex flex-col gap-3 px-1 py-1">
      {MOST_USED_THEME_GROUPS.map((group) => (
        <section key={group.family} aria-label={group.label}>
          <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            {group.label}
          </h3>
          <ul className="grid grid-cols-5 gap-x-2 gap-y-2.5">
            {group.presets.map((preset) => {
              const isSelected =
                selectedLight === preset.light && selectedDark === preset.dark;
              return (
                <li
                  key={preset.key}
                  className="flex flex-col items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={handleSelect(preset.light, preset.dark)}
                    aria-pressed={isSelected}
                    title={preset.name}
                    aria-label={`Apply ${preset.name} theme`}
                    className={`h-8 w-8 overflow-hidden rounded-md border transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isSelected
                        ? 'border-accent ring-2 ring-accent/30'
                        : 'border-border/60 hover:border-text-muted'
                    }`}
                  >
                    <span
                      className="block h-1/2 w-full"
                      style={{ backgroundColor: preset.light }}
                    />
                    <span
                      className="block h-1/2 w-full"
                      style={{ backgroundColor: preset.dark }}
                    />
                  </button>
                  <span className="w-full truncate text-center text-[9px] uppercase tracking-wide text-text-muted">
                    {preset.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
});

EditorThemePresets.displayName = 'EditorThemePresets';
export default EditorThemePresets;
