import React, { memo } from 'react';
import {
  Eye,
  List,
  ChevronRight,
  Globe,
  Sliders
} from 'lucide-react';

import { ToolPageHeader } from '@/components/layout';
import { ExportProgress } from '@/components/features';
import { ADVANCED_FEN_CONFIG } from '@constants';
import { useAdvancedFEN, AdvancedFENInitialProps } from './hooks/useAdvancedFEN';

import PositionsTab from './components/PositionsTab';
import PreviewPlayerColumn from './components/PreviewPlayerColumn';
import WizardExportSettings from './components/WizardExportSettings';
import WizardVisualSetup from './components/WizardVisualSetup';

const { TABS } = ADVANCED_FEN_CONFIG;

const AdvancedFENInputPage = memo(function AdvancedFENInputPage(
  props: AdvancedFENInitialProps
): React.JSX.Element {
  const { state, handlers } = useAdvancedFEN(props);

  const pageTabs = [
    { id: TABS.POSITIONS, icon: List, label: 'Positions' },
    { id: 'preview-export', icon: Eye, label: 'Preview / Export' }
  ];

  return (
    <div className="flex flex-col bg-bg min-h-screen">
      <ToolPageHeader title="Advanced FEN Editor" onBack={handlers.handleBack} />

      <div className="shrink-0 bg-surface border-b border-border">
        <div className="px-3 sm:px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max sm:min-w-0">
            {pageTabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => handlers.setActiveTab(id)}
                className={`px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                  state.activeTab === id
                    ? 'text-accent border-accent bg-accent/5'
                    : 'text-text-secondary hover:text-text-primary border-transparent hover:bg-surface-hover'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden min-h-0">
        <div className="w-full px-[2%] sm:px-[3%] lg:px-[4%] py-8 sm:py-12">
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
                    <Eye className="w-8 h-8 text-text-muted" />
                  </div>
                  <p className="text-text-secondary font-medium mb-1">
                    No valid positions to preview
                  </p>
                  <p className="text-text-muted text-sm">
                    Add valid FEN positions in the Positions tab
                  </p>
                  <button
                    onClick={handlers.handleShowPositionsTab}
                    className="mt-6 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors"
                  >
                    Go to Positions
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto w-full px-4 sm:px-0">
                  <div className="lg:col-span-6 w-full bg-surface border border-border/40 rounded-2xl p-5 sm:p-6 shadow-sm min-h-125 flex flex-col">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-6">
                      <button
                        onClick={() => handlers.setWizardStep(1)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 flex items-center gap-1.5 ${
                          state.wizardStep === 1
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>1. Visual Setup</span>
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <button
                        onClick={() => handlers.setWizardStep(2)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 flex items-center gap-1.5 ${
                          state.wizardStep === 2
                            ? 'bg-accent/10 text-accent'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>2. Export Settings</span>
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      {state.wizardStep === 1 ? (
                        <WizardVisualSetup state={state} handlers={handlers} />
                      ) : (
                        <WizardExportSettings state={state} handlers={handlers} />
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
