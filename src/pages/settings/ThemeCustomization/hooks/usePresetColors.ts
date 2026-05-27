import { useCallback, useState } from 'react';
import { STORAGE_KEYS } from '@constants';
import { loadPresets, readSquare, savePresets } from '@utils';
import type { BoardPreset } from '@/shared/types';

export function usePresetColors() {
  const [savedLight, setSavedLight] = useState<string>(() =>
    readSquare(STORAGE_KEYS.LIGHT_SQUARE, '#f0d9b5')
  );
  const [savedDark, setSavedDark] = useState<string>(() =>
    readSquare(STORAGE_KEYS.DARK_SQUARE, '#b58863')
  );
  const [previewLight, setPreviewLight] = useState<string>(savedLight);
  const [previewDark, setPreviewDark] = useState<string>(savedDark);
  const [presets, setPresets] = useState<BoardPreset[]>(loadPresets);

  const persist = useCallback(
    (nextPresets: BoardPreset[], light: string, dark: string) => {
      localStorage.setItem(STORAGE_KEYS.LIGHT_SQUARE, light);
      localStorage.setItem(STORAGE_KEYS.DARK_SQUARE, dark);
      savePresets(nextPresets);
      setSavedLight(light);
      setSavedDark(dark);
      window.dispatchEvent(new Event('storage'));
    },
    []
  );

  const restoreSaved = useCallback(() => {
    setPreviewLight(savedLight);
    setPreviewDark(savedDark);
  }, [savedLight, savedDark]);

  return {
    savedLight,
    savedDark,
    previewLight,
    previewDark,
    setPreviewLight,
    setPreviewDark,
    presets,
    setPresets,
    persist,
    restoreSaved
  };
}
