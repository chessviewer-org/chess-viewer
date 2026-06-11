import { memo, useCallback } from 'react';

import { Download, X } from 'lucide-react';

import ExportSettingsStep from '@/pages/HomePage/components/ExportSettingsStep';
import {
  type BatchExportOverrides,
  type HomeStateForExport,
  type ThemeCard
} from '@/pages/HomePage/components/ExportStudio.types';
import PieceDisplayStep from '@/pages/HomePage/components/PieceDisplayStep';
import ThemeStudioStep from '@/pages/HomePage/components/ThemeStudioStep';
import { useExportStudioThemes } from '@/pages/HomePage/components/useExportStudioThemes';
import { useExportWizard } from '@/pages/HomePage/hooks/useExportWizard';

export interface ExportSettingsPanelProps {
  homeState: HomeStateForExport;
  onBack: () => void;
}

export const ExportSettingsPanel = memo(function ExportSettingsPanel({
  homeState,
  onBack
}: ExportSettingsPanelProps) {
  const wizard = useExportWizard();
  const themes = useExportStudioThemes();

  const handleThemeSelect = useCallback(
    (theme: ThemeCard) => {
      homeState.setLightSquare(theme.light);
      homeState.setDarkSquare(theme.dark);
    },
    [homeState]
  );

  const handleExport = useCallback(() => {
    const selectedFormats = [...wizard.selectedFormats];
    const names = selectedFormats.map(
      (format) => wizard.resolvedFileNames[format]
    );
    const overrides: BatchExportOverrides = {
      boardSize: wizard.activeBoardSize,
      exportQuality: wizard.resolution
    };

    homeState.setBoardSize(wizard.activeBoardSize);
    homeState.setExportQuality(wizard.resolution);
    void homeState.handleBatchExport(selectedFormats, names, overrides);
  }, [homeState, wizard]);

  return (
    <div className="h-full flex flex-col bg-surface border border-border/40 rounded-xl overflow-hidden w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 text-text-primary">
          <Download className="w-4 h-4" />
          <h3 className="text-sm font-bold tracking-wide">Export Settings</h3>
        </div>
        <button
          onClick={onBack}
          className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Step 1: Theme Studio (Height adjustments to let it fit inline) */}
        <div className="shrink-0">
          <ThemeStudioStep
            themeTab={themes.themeTab}
            setThemeTab={themes.setThemeTab}
            isEditMode={themes.isEditMode}
            beginEditMode={themes.beginEditMode}
            cancelEditMode={themes.cancelEditMode}
            saveEditMode={themes.saveEditMode}
            isAddingTheme={themes.isAddingTheme}
            setIsAddingTheme={themes.setIsAddingTheme}
            paginatedThemes={themes.paginatedThemes}
            currentPage={themes.currentPage}
            setCurrentPage={themes.setCurrentPage}
            totalPages={themes.totalPages}
            canAddTheme={themes.canAddTheme}
            onThemeSelect={handleThemeSelect}
            selectedLight={homeState.lightSquare}
            selectedDark={homeState.darkSquare}
            onRenameDraft={themes.handleRenameDraft}
            onDeleteDraft={themes.handleDeleteDraft}
            onDragStart={themes.setDraggingThemeId}
            onDragEnd={() => themes.setDraggingThemeId(null)}
            onDropTheme={themes.handleDropTheme}
            onSaveNewTheme={themes.handleSaveNewTheme}
          />
        </div>

        <div className="h-px bg-border/40 mx-4 my-2 shrink-0" />

        {/* Step 2: Piece Display */}
        <div className="shrink-0">
          <PieceDisplayStep homeState={homeState} />
        </div>

        <div className="h-px bg-border/40 mx-4 my-2 shrink-0" />

        {/* Step 3: Export Settings */}
        <div className="shrink-0">
          <ExportSettingsStep wizard={wizard} />
        </div>
      </div>

      {/* Footer / Action */}
      <div className="p-3 border-t border-border/40 shrink-0">
        <button
          type="button"
          onClick={handleExport}
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 bg-accent text-bg hover:bg-accent-hover shadow-sm hover:shadow-md"
        >
          Export Now
        </button>
      </div>
    </div>
  );
});

ExportSettingsPanel.displayName = 'ExportSettingsPanel';
export default ExportSettingsPanel;
