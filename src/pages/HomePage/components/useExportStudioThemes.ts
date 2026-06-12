import { useCallback, useEffect, useMemo, useState } from 'react';

import { useThemePresets } from '@hooks';
import { BOARD_THEMES } from '@constants';

import {
  type CustomThemeDraft,
  MAX_THEMES,
  type ThemeCard,
  type ThemePresetLike,
  THEMES_PER_PAGE
} from './ExportStudio.types';

function mapPresetToDraft(preset: ThemePresetLike): CustomThemeDraft {
  return {
    id: preset.id,
    name: preset.name,
    light: preset.light,
    dark: preset.dark,
    timestamp: preset.timestamp
  };
}

function reorderThemes(
  themes: CustomThemeDraft[],
  draggedId: number,
  targetId: number
): CustomThemeDraft[] {
  const fromIndex = themes.findIndex((theme) => theme.id === draggedId);
  const toIndex = themes.findIndex((theme) => theme.id === targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return themes;

  const nextThemes = [...themes];
  const [moved] = nextThemes.splice(fromIndex, 1);
  if (!moved) return themes;
  nextThemes.splice(toIndex, 0, moved);
  return nextThemes;
}

/** Manages system and custom theme lists with pagination, edit mode, drag-reorder, and save lifecycle. */
export function useExportStudioThemes() {
  const { customPresets, savePreset, replacePresets } = useThemePresets();

  const [themeTab, setThemeTab] = useState<'main' | 'custom'>('main');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [draggingThemeId, setDraggingThemeId] = useState<number | null>(null);
  const [draftCustomThemes, setDraftCustomThemes] = useState<
    CustomThemeDraft[]
  >([]);

  const systemThemes = useMemo<ThemeCard[]>(
    () =>
      Object.entries(BOARD_THEMES).map(([key, theme]) => ({
        id: key,
        name: theme.name,
        light: theme.light,
        dark: theme.dark,
        isSystem: true
      })),
    []
  );

  useEffect(() => {
    if (!isEditMode) {
      setDraftCustomThemes(customPresets.map(mapPresetToDraft));
    }
  }, [customPresets, isEditMode]);

  const customThemes = useMemo<ThemeCard[]>(
    () =>
      (isEditMode ? draftCustomThemes : customPresets).map((theme) => ({
        id: String(theme.id),
        rawId: theme.id,
        name: theme.name,
        light: theme.light,
        dark: theme.dark,
        timestamp: theme.timestamp,
        isSystem: false
      })),
    [customPresets, draftCustomThemes, isEditMode]
  );

  const visibleThemes = useMemo(() => {
    const source = themeTab === 'main' ? systemThemes : customThemes;
    return source.slice(0, MAX_THEMES);
  }, [customThemes, systemThemes, themeTab]);

  const totalPages = Math.max(
    1,
    Math.ceil(visibleThemes.length / THEMES_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages - 1) setCurrentPage(0);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(0);
  }, [themeTab]);

  const paginatedThemes = useMemo(() => {
    const start = currentPage * THEMES_PER_PAGE;
    return visibleThemes.slice(start, start + THEMES_PER_PAGE);
  }, [currentPage, visibleThemes]);

  const beginEditMode = useCallback(() => {
    setDraftCustomThemes(customPresets.map(mapPresetToDraft));
    setIsEditMode(true);
  }, [customPresets]);

  const cancelEditMode = useCallback(() => {
    setDraftCustomThemes(customPresets.map(mapPresetToDraft));
    setDraggingThemeId(null);
    setIsEditMode(false);
  }, [customPresets]);

  const saveEditMode = useCallback(() => {
    const next = draftCustomThemes.map((theme) => ({
      ...theme,
      name: theme.name.trim() || 'Untitled Theme'
    }));
    replacePresets(next);
    setDraggingThemeId(null);
    setIsEditMode(false);
  }, [draftCustomThemes, replacePresets]);

  const handleRenameDraft = useCallback((id: number, name: string) => {
    setDraftCustomThemes((prev) =>
      prev.map((theme) => (theme.id === id ? { ...theme, name } : theme))
    );
  }, []);

  const handleDeleteDraft = useCallback((id: number) => {
    setDraftCustomThemes((prev) => prev.filter((theme) => theme.id !== id));
  }, []);

  const handleDropTheme = useCallback(
    (targetId: number) => {
      if (draggingThemeId === null) return;
      setDraftCustomThemes((prev) =>
        reorderThemes(prev, draggingThemeId, targetId)
      );
      setDraggingThemeId(null);
    },
    [draggingThemeId]
  );

  const handleSaveNewTheme = useCallback(
    (name: string, light: string, dark: string) => {
      if (customPresets.length >= MAX_THEMES) return;
      savePreset(name, light, dark);
      setIsAddingTheme(false);
      setThemeTab('custom');
    },
    [customPresets.length, savePreset]
  );

  // The "Add" tile lives in the Custom theme list and is gated behind edit
  // mode: it appears only while editing the custom presets, on the last page,
  // and below the catalogue cap. (The compact ChessEditor settings panel has no
  // edit mode and therefore never shows it.)
  const canAddTheme =
    isEditMode &&
    themeTab === 'custom' &&
    customThemes.length < MAX_THEMES &&
    currentPage === totalPages - 1;

  return {
    themeTab,
    setThemeTab,
    isEditMode,
    isAddingTheme,
    setIsAddingTheme,
    paginatedThemes,
    currentPage,
    setCurrentPage,
    totalPages,
    canAddTheme,
    customThemes,
    beginEditMode,
    cancelEditMode,
    saveEditMode,
    handleRenameDraft,
    handleDeleteDraft,
    setDraggingThemeId,
    handleDropTheme,
    handleSaveNewTheme
  };
}
