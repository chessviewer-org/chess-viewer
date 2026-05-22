import { useCallback, useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from 'lucide-react';

import ChessBoard from '@/components/board/ChessBoard/ChessBoard';
import { BOARD_THEMES } from '@constants';
import { useThemePresets } from '@hooks';

import { useExportWizard } from '../hooks/useExportWizard';

import ExportSettingsStep from './ExportSettingsStep';
import PieceDisplayStep from './PieceDisplayStep';
import ThemeStudioStep from './ThemeStudioStep';
import {
  type BatchExportOverrides,
  type CustomThemeDraft,
  type HomeStateForExport,
  MAX_THEMES,
  type ThemeCard,
  THEMES_PER_PAGE,
  type ThemePresetLike
} from './ExportStudio.types';

interface ExportStudioProps {
  homeState: HomeStateForExport;
  onClose: () => void;
}

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getPreviewBoardSize(sizeSm: number): number {
  const clamped = clamp(sizeSm, 4, 16);
  const ratio = (clamped - 4) / 12;
  return Math.round(260 + ratio * 320);
}

function getCoordinateBorder(boardSize: number, showCoords: boolean): number {
  if (!showCoords) return 0;
  return Math.round(Math.max(18, Math.min(800, boardSize * 0.05))) * 2;
}

const ExportStudio = ({ homeState, onClose }: ExportStudioProps) => {
  const wizard = useExportWizard();
  const { customPresets, savePreset, replacePresets } = useThemePresets();

  const [themeTab, setThemeTab] = useState<'main' | 'custom'>('main');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [draggingThemeId, setDraggingThemeId] = useState<number | null>(null);
  const [draftCustomThemes, setDraftCustomThemes] = useState<CustomThemeDraft[]>([]);

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
      setDraftCustomThemes(customPresets.map((preset) => mapPresetToDraft(preset)));
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

  const totalPages = Math.max(1, Math.ceil(visibleThemes.length / THEMES_PER_PAGE));

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

  const previewBoardSize = useMemo(
    () => getPreviewBoardSize(wizard.activeBoardSize),
    [wizard.activeBoardSize]
  );
  const previewFrameSize = useMemo(
    () => previewBoardSize + getCoordinateBorder(previewBoardSize, homeState.showCoords),
    [homeState.showCoords, previewBoardSize]
  );

  const beginEditMode = useCallback(() => {
    setDraftCustomThemes(customPresets.map((preset) => mapPresetToDraft(preset)));
    setIsEditMode(true);
  }, [customPresets]);

  const cancelEditMode = useCallback(() => {
    setDraftCustomThemes(customPresets.map((preset) => mapPresetToDraft(preset)));
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
      setDraftCustomThemes((prev) => reorderThemes(prev, draggingThemeId, targetId));
      setDraggingThemeId(null);
    },
    [draggingThemeId]
  );

  const handleThemeSelect = useCallback(
    (theme: ThemeCard) => {
      homeState.setLightSquare(theme.light);
      homeState.setDarkSquare(theme.dark);
    },
    [homeState]
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

  const handlePrimaryNavigation = useCallback(() => {
    if (wizard.currentStep < 3) {
      wizard.handleNext();
      return;
    }

    const selectedFormats = [...wizard.selectedFormats];
    const names = selectedFormats.map((format) => wizard.resolvedFileNames[format]);
    const overrides: BatchExportOverrides = {
      boardSize: wizard.activeBoardSize,
      exportQuality: wizard.resolution
    };

    homeState.setBoardSize(wizard.activeBoardSize);
    homeState.setExportQuality(wizard.resolution);
    void homeState.handleBatchExport(selectedFormats, names, overrides);
    onClose();
  }, [homeState, onClose, wizard]);

  const canAddTheme =
    !isEditMode &&
    customThemes.length < MAX_THEMES &&
    currentPage === totalPages - 1;

  return (
    <div className="fixed inset-x-0 top-16 sm:top-20 lg:top-24 z-60 h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] lg:h-[calc(100dvh-6rem)] bg-bg border-t border-border/40 overflow-hidden">
      <div className="h-full flex flex-col overflow-hidden">
        <header className="h-14 shrink-0 border-b border-border/40 bg-surface px-4 sm:px-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            &lt; Back Editor
          </button>

          <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            {wizard.currentStep > 1 && (
              <>
                <button
                  type="button"
                  onClick={wizard.handleBack}
                  className="hover:text-text-primary transition-colors"
                >
                  &lt; Back
                </button>
                <span className="text-text-muted">|</span>
              </>
            )}

            <button
              type="button"
              onClick={handlePrimaryNavigation}
              className="text-accent hover:text-accent-hover transition-colors"
            >
              {wizard.currentStep < 3 ? `${wizard.currentStep}/3 Next >` : 'Finish'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,1fr)] h-full min-h-0 overflow-hidden">
          <div className="min-h-0 border-r border-border/40 bg-surface overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              {wizard.currentStep === 1 && (
                <motion.section
                  key="wizard-step-1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full relative"
                >
                  <ThemeStudioStep
                    themeTab={themeTab}
                    setThemeTab={setThemeTab}
                    isEditMode={isEditMode}
                    beginEditMode={beginEditMode}
                    cancelEditMode={cancelEditMode}
                    saveEditMode={saveEditMode}
                    isAddingTheme={isAddingTheme}
                    setIsAddingTheme={setIsAddingTheme}
                    paginatedThemes={paginatedThemes}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                    canAddTheme={canAddTheme}
                    onThemeSelect={handleThemeSelect}
                    selectedLight={homeState.lightSquare}
                    selectedDark={homeState.darkSquare}
                    onRenameDraft={handleRenameDraft}
                    onDeleteDraft={handleDeleteDraft}
                    onDragStart={setDraggingThemeId}
                    onDragEnd={() => setDraggingThemeId(null)}
                    onDropTheme={handleDropTheme}
                    onSaveNewTheme={handleSaveNewTheme}
                  />
                </motion.section>
              )}

              {wizard.currentStep === 2 && (
                <motion.section
                  key="wizard-step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  <PieceDisplayStep homeState={homeState} />
                </motion.section>
              )}

              {wizard.currentStep === 3 && (
                <motion.section
                  key="wizard-step-3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  <ExportSettingsStep wizard={wizard} />
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex min-h-0 self-start md:sticky md:top-0 h-[calc(100dvh-5rem-1px)] lg:h-[calc(100dvh-6rem-1px)] w-full bg-surface-muted/40 p-4 sm:p-6 lg:p-8 items-center justify-center overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="relative transition-all duration-300 ease-out"
                style={{
                  width: `min(${previewFrameSize}px, 100%)`,
                  height: `min(${previewFrameSize}px, 100%)`,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                <div className="absolute -top-6 left-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/60">
                  <Layout className="w-3 h-3" />
                  Live Preview
                </div>
                <ChessBoard
                  fen={homeState.fen}
                  pieceStyle={homeState.pieceStyle}
                  showCoords={homeState.showCoords}
                  lightSquare={homeState.lightSquare}
                  darkSquare={homeState.darkSquare}
                  boardSize={previewBoardSize}
                  flipped={homeState.flipped}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportStudio;
