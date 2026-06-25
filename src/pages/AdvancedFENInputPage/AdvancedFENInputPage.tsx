import React, { memo } from 'react';

import { Eye, Globe, List, Sliders } from 'lucide-react';

import { ExportProgress } from '@/components/features';
import { type PageTabGroup, PageTabs } from '@/components/layout';
import {
  ADVANCED_FEN_BREADCRUMB_SCHEMA,
  ADVANCED_FEN_CONFIG,
  getRouteSeo,
  SOFTWARE_APP_SCHEMA
} from '@constants';

import { Seo } from '@shared/ui';
import styles from './advanced-fen-layout.module.scss';
import InteractiveBoardColumn from './components/InteractiveBoardColumn';
import NoValidPositions from './components/NoValidPositions';
import PositionsTab from './components/PositionsTab';
import WizardExportSettings from './components/WizardExportSettings';
import WizardVisualSetup from './components/WizardVisualSetup';
import {
  AdvancedFENInitialProps,
  useAdvancedFEN
} from './hooks/useAdvancedFEN';

const { TABS } = ADVANCED_FEN_CONFIG;

/** Shared two-column layout for preview/export tabs.
 *  Reacts to the CONTENT container width (the `@container` region wrapper), NOT
 *  the viewport — the sidebar steals ~208–236px so a viewport `lg:` switches at
 *  the wrong moment. When the content container reaches ~768px (`@3xl`) the
 *  board (45%, sticky) and panel (55%) sit side-by-side; below that they stack
 *  vertically (board first, then panel). */
function PreviewExportLayout({
  left,
  right
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className={styles.previewLayout}>
      <div className={styles.previewLeft}>{left}</div>
      <div className={styles.previewRight}>{right}</div>
    </div>
  );
}

/** Batch FEN studio page with positions list, visual setup wizard, and multi-format export. */
const AdvancedFENInputPage = memo(function AdvancedFENInputPage(
  props: AdvancedFENInitialProps
): React.JSX.Element {
  const { state, handlers } = useAdvancedFEN(props);

  const groups: PageTabGroup[] = [
    {
      items: [{ id: TABS.POSITIONS, icon: List, label: 'Positions' }]
    },
    {
      id: 'preview-export-group',
      label: 'Preview / Export',
      icon: Eye,
      isCollapsible: true,
      items: [
        { id: 'preview-style', icon: Sliders, label: 'Board Style & Preview' },
        { id: 'export-settings', icon: Globe, label: 'Export Settings' }
      ]
    }
  ];

  const interactiveBoard = (
    <InteractiveBoardColumn state={state} handlers={handlers} />
  );

  return (
    <div
      data-page-scroll
      className="bg-bg min-h-full lg:h-screen lg:max-h-screen lg:overflow-hidden animate-pageEnter"
    >
      <Seo
        {...getRouteSeo('/advanced-fen')}
        schema={[SOFTWARE_APP_SCHEMA, ADVANCED_FEN_BREADCRUMB_SCHEMA]}
      />
      <h1 className="sr-only">Batch FEN Export — Chess Diagram Studio</h1>

      <div className="page-container flex flex-col gap-6 py-6 sm:py-8 md:flex-row md:gap-8 lg:gap-10 lg:h-full lg:overflow-hidden">
        {/* Sidebar: sticky left column on md+ */}
        <div className="shrink-0 md:border-r md:border-border md:pr-8 md:w-52 lg:w-56 w-full lg:overflow-y-auto">
          <div className="md:sticky md:top-8">
            <PageTabs
              groups={groups}
              activeId={state.activeTab}
              onSelect={handlers.setActiveTab}
              ariaLabel="Advanced FEN sections"
            />
          </div>
        </div>

        {/* @container: preview/export layout reads THIS wrapper's width.
            On desktop the column is pinned (overflow-y-auto + h-full) so the
            board sticks to the top and only the right panel scrolls. */}
        <div
          role="region"
          aria-label="Editor content"
          className="@container min-w-0 flex-1 flex flex-col overflow-y-auto lg:overflow-hidden pr-2 pb-2 lg:h-full"
        >
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

          {state.activeTab === 'preview-style' && (
            <div className="tab-content w-full h-full">
              {!state.hasValidFens ? (
                <NoValidPositions
                  onGoToPositions={handlers.handleShowPositionsTab}
                />
              ) : (
                <PreviewExportLayout
                  left={interactiveBoard}
                  right={
                    <WizardVisualSetup state={state} handlers={handlers} />
                  }
                />
              )}
            </div>
          )}

          {state.activeTab === 'export-settings' && (
            <div className="tab-content w-full h-full">
              {!state.hasValidFens ? (
                <NoValidPositions
                  onGoToPositions={handlers.handleShowPositionsTab}
                />
              ) : (
                <PreviewExportLayout
                  left={interactiveBoard}
                  right={
                    <WizardExportSettings state={state} handlers={handlers} />
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>

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
