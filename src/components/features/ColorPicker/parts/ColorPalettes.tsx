import { memo, useCallback, useMemo } from 'react';
import { ColorSwatch } from '@/components/features/ColorPicker/parts';

/** Props for the `ColorPalettes` preset swatch grid. */
export interface ColorPalettesProps {
  activePalette: string;
  setActivePalette: (palette: string) => void;
  tempColor: string;
  onColorSelect: (color: string) => void;
}

/** Tabbed palette grid with named color groups (basic, grays, warm, cool, etc.). */
const ColorPalettes = memo(
  function ColorPalettes({
    activePalette,
    setActivePalette,
    tempColor,
    onColorSelect
  }: ColorPalettesProps) {
    const COLOR_PALETTES = useMemo(
      () => ({
        basic: [
          '#FFFFFF',
          '#000000',
          '#FF0000',
          '#00FF00',
          '#0000FF',
          '#FFFF00',
          '#FF00FF',
          '#00FFFF'
        ],
        grays: [
          '#FFFFFF',
          '#F5F5F5',
          '#E0E0E0',
          '#BDBDBD',
          '#9E9E9E',
          '#757575',
          '#424242',
          '#212121'
        ],
        warm: [
          '#FFEBEE',
          '#FFCDD2',
          '#EF5350',
          '#E53935',
          '#D32F2F',
          '#C62828',
          '#B71C1C',
          '#8B0000'
        ],
        cool: [
          '#E3F2FD',
          '#90CAF9',
          '#42A5F5',
          '#2196F3',
          '#1976D2',
          '#1565C0',
          '#0D47A1',
          '#001F3F'
        ],
        nature: [
          '#E8F5E9',
          '#A5D6A7',
          '#66BB6A',
          '#4CAF50',
          '#388E3C',
          '#2E7D32',
          '#1B5E20',
          '#004D40'
        ],
        sunset: [
          '#FFF3E0',
          '#FFE082',
          '#FFB74D',
          '#FF9800',
          '#F57C00',
          '#E65100',
          '#BF360C',
          '#3E2723'
        ],
        ocean: [
          '#E0F7FA',
          '#80DEEA',
          '#26C6DA',
          '#00BCD4',
          '#00ACC1',
          '#0097A7',
          '#00838F',
          '#006064'
        ],
        royal: [
          '#F3E5F5',
          '#CE93D8',
          '#AB47BC',
          '#9C27B0',
          '#8E24AA',
          '#7B1FA2',
          '#6A1B9A',
          '#4A148C'
        ]
      } as Record<string, string[]>),
      []
    );

    const handleTabClick = useCallback(
      (palette: string) => {
        setActivePalette(palette);
      },
      [setActivePalette]
    );

    const handleColorClick = useCallback(
      (color: string) => {
        onColorSelect(color);
      },
      [onColorSelect]
    );

    const paletteColors = COLOR_PALETTES[activePalette] || COLOR_PALETTES['basic'] || [];

    return (
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {Object.keys(COLOR_PALETTES).map((palette) => (
            <button
              key={palette}
              onClick={() => handleTabClick(palette)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activePalette === palette ? 'bg-accent text-bg shadow-lg' : 'bg-surface-elevated/50 text-text-muted hover:bg-surface-elevated hover:text-text-secondary'}`}
            >
              {palette.charAt(0).toUpperCase() + palette.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-8 gap-2">
          {paletteColors.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              isSelected={tempColor === color}
              onClick={() => handleColorClick(color)}
              size="md"
            />
          ))}
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.activePalette === nextProps.activePalette &&
      prevProps.tempColor === nextProps.tempColor
    );
  }
);

ColorPalettes.displayName = 'ColorPalettes';
export default ColorPalettes;
