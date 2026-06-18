import React, { memo } from 'react';

import { ChevronRight, Eye, Globe, List, Sliders } from 'lucide-react';

import { ExportProgress } from '@/components/panels';
import {
  ADVANCED_FEN_CONFIG,
  getRouteSeo,
  SOFTWARE_APP_SCHEMA
} from '@constants';

import { Seo } from '@shared/ui';
import PositionsTab from './components/PositionsTab';
import PreviewPlayerColumn from './components/PreviewPlayerColumn';
import WizardExportSettings from './components/WizardExportSettings';
import WizardVisualSetup from './components/WizardVisualSetup';
import {
  AdvancedFENInitialProps,
  useAdvancedFEN
} from './hooks/useAdvancedFEN';

const { TABS } = ADVANCED_FEN_CONFIG;

/** Batch FEN studio page with positions list, visual setup wizard, and multi-format export. */
const AdvancedFENInputPage = memo(function AdvancedFENInputPage(
  props: AdvancedFENInitialProps
): React.JSX.Element {
  const { state, handlers } = useAdvancedFEN(props);

  const pageTabs = [
    { id: TABS.POSITIONS, icon: List, label: 'Positions' },
    { id: 'preview-export', icon: Eye, label: 'Preview / Export' }
  ];

  return (
    <div className="flex flex-col bg-bg min-h-full">
      <Seo {...getRouteSeo('/advanced-fen')} schema={SOFTWARE_APP_SCHEMA} />
      <div className="shrink-0 bg-surface border-b border-border">
        <div className="page-container overflow-x-auto">
          <div
            role="tablist"
            aria-label="Advanced FEN sections"
            className="flex gap-0 min-w-max sm:min-w-0"
          >
            {pageTabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={state.activeTab === id}
                onClick={() => handlers.setActiveTab(id)}
                className={`px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-colors duration-200 border-b-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset ${
                  state.activeTab === id
                    ? 'text-accent border-accent bg-accent/5'
                    : 'text-text-secondary hover:text-text-primary border-transparent hover:bg-surface-hover'
                }`}
              >
                <Icon
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  aria-hidden="true"
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden min-h-0">
        <div className="page-container py-8 sm:py-12">
          {state.activeTab === TABS.POSITIONS && (
            <PositionsTab
              fens={state.fens}
              displayFensCount={state.displayFensCount}
              fenErrors={state.fenErrors}
              duplicateWarning={state.duplicateWarning}
              favorites={state.favorites}
              pastedIndex={state.pastedIndex}
              onUpdateFen={handlers.updateFen}
              onRemoveFen={handlers.removeFenInput}
              onToggleFavorite={handlers.toggleFavorite}
              onPasteFEN={handlers.handlePasteFEN}
            />
          )}

          {state.activeTab === 'preview-export' && (
            <div className="tab-content w-full">
              {!state.hasValidFens ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center mb-4">
                    <Eye
                      className="w-8 h-8 text-text-muted"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-text-secondary font-medium mb-1">
                    No valid positions to preview
                  </p>
                  <p className="text-text-muted text-sm">
                    Add valid FEN positions in the Positions tab
                  </p>
                  <button
                    type="button"
                    onClick={handlers.handleShowPositionsTab}
                    className="mt-6 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Go to Positions
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start page-container mx-auto">
                  <div className="lg:col-span-6 w-full bg-surface border border-border/40 rounded-2xl p-5 sm:p-6 shadow-sm min-h-125 flex flex-col">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-6">
                      <button
                        type="button"
                        aria-current={
                          state.wizardStep === 1 ? 'step' : undefined
                        }
                        onClick={() => handlers.setWizardStep(1)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          state.wizardStep === 1
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>1. Visual Setup</span>
                      </button>
                      <ChevronRight
                        className="w-3.5 h-3.5 text-text-muted shrink-0"
                        aria-hidden="true"
                      />
                      <button
                        type="button"
                        aria-current={
                          state.wizardStep === 2 ? 'step' : undefined
                        }
                        onClick={() => handlers.setWizardStep(2)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          state.wizardStep === 2
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>2. Export Settings</span>
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      {state.wizardStep === 1 ? (
                        <WizardVisualSetup state={state} handlers={handlers} />
                      ) : (
                        <WizardExportSettings
                          state={state}
                          handlers={handlers}
                        />
                      )}
                    </div>
                  </div>

                  <PreviewPlayerColumn state={state} handlers={handlers} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {state.exportState.isExporting && (
        <ExportProgress
          isExporting={state.exportState.isExporting}
          progress={state.exportState.progress}
          currentFormat={state.exportState.currentFormat}
          statusText={state.exportState.status}
          config={{ ...state.exportConfig, fen: state.exportConfig.fen || '' }}
          isPaused={state.isPaused}
          onPause={handlers.handlePauseExport}
          onResume={handlers.handleResumeExport}
          onCancel={handlers.handleCancelExportProgress}
        />
      )}
    </div>
  );
});

AdvancedFENInputPage.displayName = 'AdvancedFENInputPage';
export default AdvancedFENInputPage;
