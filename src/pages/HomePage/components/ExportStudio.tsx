import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useExportWizard } from '../hooks/useExportWizard';

import ExportSettingsStep from './ExportSettingsStep';
import ExportStudioPreview from './ExportStudioPreview';
import PieceDisplayStep from './PieceDisplayStep';
import ThemeStudioStep from './ThemeStudioStep';
import { useExportStudioThemes } from './useExportStudioThemes';
import {
  type BatchExportOverrides,
  type HomeStateForExport,
  type ThemeCard
} from './ExportStudio.types';

/** Props for the full-screen export studio overlay. */
interface ExportStudioProps {
  homeState: HomeStateForExport;
  onClose: () => void;
}

/** Full-screen three-step export wizard with live board preview panel. */
const ExportStudio = ({ homeState, onClose }: ExportStudioProps) => {
  const wizard = useExportWizard();
  const themes = useExportStudioThemes();

  const handleThemeSelect = useCallback(
    (theme: ThemeCard) => {
      homeState.setLightSquare(theme.light);
      homeState.setDarkSquare(theme.dark);
    },
    [homeState]
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

          <ExportStudioPreview
            homeState={homeState}
            activeBoardSize={wizard.activeBoardSize}
          />
        </div>
      </div>
    </div>
  );
};

export default ExportStudio;
