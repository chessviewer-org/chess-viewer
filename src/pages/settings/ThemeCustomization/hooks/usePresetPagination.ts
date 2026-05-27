import { useEffect, useMemo, useState } from 'react';
import { MAX_TOTAL_PRESETS } from '@constants';
import type { BoardPreset } from '@/shared/types';

export const PAGE_SIZE = 40;
export const TOTAL_PRESET_PAGES = 2;

export function usePresetPagination(presets: BoardPreset[]) {
  const [presetPage, setPresetPage] = useState<number>(0);

  const sortedPresets = useMemo(() => {
    const defaults = presets.filter((p) => p.isDefault);
    const customs = presets.filter((p) => !p.isDefault);
    return [...defaults, ...customs];
  }, [presets]);

  const visiblePresets = useMemo(
    () => sortedPresets.slice(0, MAX_TOTAL_PRESETS),
    [sortedPresets]
  );

  const presetPages = useMemo(
    () => [
      { id: 'page-1', items: visiblePresets.slice(0, PAGE_SIZE) },
      { id: 'page-2', items: visiblePresets.slice(PAGE_SIZE, PAGE_SIZE * 2) }
    ],
    [visiblePresets]
  );

  const hasSecondPresetPage = (presetPages[1]?.items.length ?? 0) > 0;
  const currentPresetPage = hasSecondPresetPage ? presetPage : 0;

  useEffect(() => {
    if (!hasSecondPresetPage && presetPage !== 0) setPresetPage(0);
  }, [hasSecondPresetPage, presetPage]);

  return {
    visiblePresets,
    presetPages,
    hasSecondPresetPage,
    currentPresetPage,
    presetPage,
    setPresetPage
  };
}
