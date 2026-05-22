import React, { memo } from 'react';
import {
  Eye,
  List,
  ChevronRight,
  Copy,
  FlipVertical2,
  Download,
  Link,
  Link2Off,
  Check,
  Sparkles,
  Globe,
  Sliders,
  Maximize2
} from 'lucide-react';

import { ToolPageHeader } from '@/components/layout';
import { ExportProgress } from '@/components/features';
import { ADVANCED_FEN_CONFIG } from '@constants';
import { BOARD_THEMES, PIECE_SETS } from '@/shared/constants/chessConstants';
import { useAdvancedFEN, AdvancedFENInitialProps } from './hooks/useAdvancedFEN';
import { logger } from '@utils';

import BoardDisplay from './components/BoardDisplay';
import PlaybackControls from './components/PlaybackControls';
import PositionsTab from './components/PositionsTab';

const { INTERVAL_OPTIONS, TABS } = ADVANCED_FEN_CONFIG;

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
                  {/* Left Column — The 2-Step Export Wizard */}
                  <div className="lg:col-span-6 w-full bg-surface border border-border/40 rounded-2xl p-5 sm:p-6 shadow-sm min-h-125 flex flex-col">
                    {/* Step Navigation Header */}
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

                    {/* Step Contents */}
                    <div className="flex-1 flex flex-col justify-between">
                      {state.wizardStep === 1 ? (
                        /* Wizard Step 1: Visual Setup (Theme & Style) */
                        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
                          {/* Board Themes */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                                Theme
                              </label>
                              <span className="text-[10px] text-text-muted">
                                Click circles to select preset themes
                              </span>
                            </div>
                            <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 pb-2 pt-1 max-h-35 overflow-y-auto pr-1 scrollbar-thin">
                              {Object.entries(BOARD_THEMES).map(([key, theme]) => {
                                const isActive =
                                  state.theme.lightSquare === theme.light &&
                                  state.theme.darkSquare === theme.dark;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() =>
                                      handlers.handleApplyPresetTheme(
                                        theme.light,
                                        theme.dark
                                      )
                                    }
                                    className="group relative flex flex-col items-center gap-1 focus:outline-none"
                                    title={theme.name}
                                  >
                                    <div
                                      className={`w-10 h-10 rounded-full border-2 transition duration-200 overflow-hidden flex relative ${
                                        isActive
                                          ? 'border-accent scale-105 shadow-md shadow-accent/20'
                                          : 'border-border/60 group-hover:border-text-secondary'
                                      }`}
                                    >
                                      <div
                                        className="w-1/2 h-full"
                                        style={{ backgroundColor: theme.light }}
                                      />
                                      <div
                                        className="w-1/2 h-full"
                                        style={{ backgroundColor: theme.dark }}
                                      />
                                      {isActive && (
                                        <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                                          <Check className="w-4 h-4 text-accent drop-shadow" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[9px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-11">
                                      {theme.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Piece Style Selector */}
                          <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                              Piece Style
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin max-w-full">
                              {PIECE_SETS.map((piece) => {
                                const isActive = state.pieceStyle === piece.id;
                                return (
                                  <button
                                    key={piece.id}
                                    type="button"
                                    onClick={() => handlers.setPieceStyle(piece.id)}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition duration-150 whitespace-nowrap ${
                                      isActive
                                        ? 'bg-accent/10 border-accent text-accent shadow-sm'
                                        : 'bg-surface-elevated hover:bg-surface-hover border-border/60 text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    {piece.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Options Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={state.showCoordsLocal}
                                onChange={(e) =>
                                  handlers.setShowCoordsLocal(e.target.checked)
                                }
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-surface"
                              />
                              <span className="text-xs font-medium text-text-secondary">
                                Show Coordinates
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={state.showCoordinateBorder}
                                onChange={(e) =>
                                  handlers.setShowCoordinateBorder(
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-surface"
                              />
                              <span className="text-xs font-medium text-text-secondary">
                                Coordinate Border
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={state.showThinFrame}
                                onChange={(e) =>
                                  handlers.setShowThinFrame(e.target.checked)
                                }
                                className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-surface"
                              />
                              <span className="text-xs font-medium text-text-secondary">
                                Thin Outer Frame
                              </span>
                            </label>
                          </div>

                          {/* Apply to All Button */}
                          <div className="pt-4 border-t border-border/40 flex justify-end">
                            <button
                              type="button"
                              onClick={handlers.handleApplyToAll}
                              className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border/60 text-text-secondary hover:text-text-primary rounded-xl font-bold transition duration-150 text-xs flex items-center gap-1.5 active:scale-[0.98]"
                              title="Globally sync the current visual configuration to all positions in the queue"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-text-muted" />
                              <span>Apply Style to All Positions</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Wizard Step 2: Export Settings (Format & Size) */
                        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                            {/* Format segmented control */}
                            <div className="space-y-3">
                              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                                File Format
                              </label>
                              <div className="flex bg-surface-elevated border border-border/40 rounded-xl p-1 w-full max-w-70">
                                {(['png', 'jpeg', 'svg'] as const).map((format) => {
                                  const isActive = state.exportFormat === format;
                                  return (
                                    <button
                                      key={format}
                                      type="button"
                                      onClick={() =>
                                        handlers.setExportFormat(format)
                                      }
                                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition duration-150 uppercase ${
                                        isActive
                                          ? 'bg-accent text-bg shadow-sm'
                                          : 'text-text-secondary hover:text-text-primary'
                                      }`}
                                    >
                                      {format === 'jpeg' ? 'JPG' : format}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Size / Scale segmented control */}
                            <div className="space-y-3">
                              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                                Resolution Sizing
                              </label>
                              <div className="flex bg-surface-elevated border border-border/40 rounded-xl p-1 w-full max-w-70">
                                {([8, 16, 32] as const).map((quality) => {
                                  const isActive = state.exportQuality === quality;
                                  return (
                                    <button
                                      key={quality}
                                      type="button"
                                      onClick={() =>
                                        handlers.setExportQuality(quality)
                                      }
                                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition duration-150 ${
                                        isActive
                                          ? 'bg-accent text-bg shadow-sm'
                                          : 'text-text-secondary hover:text-text-primary'
                                      }`}
                                    >
                                      {quality}x
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-start">
                            {/* Smart Naming */}
                            <div className="space-y-3">
                              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                                Smart Naming
                              </label>
                              <input
                                type="text"
                                value={state.smartNamingInput}
                                onChange={(e) =>
                                  handlers.setSmartNamingInput(e.target.value)
                                }
                                placeholder="e.g. Siciliya[1-4], İspan[5-6]"
                                className="w-full bg-surface-elevated border border-border/60 hover:border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition duration-150"
                              />

                              {/* Smart Chain Sync */}
                              <div className="flex items-center justify-between bg-surface-elevated/40 border border-border/40 rounded-xl p-2.5">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] font-bold text-text-primary">
                                    Chain Sync
                                  </span>
                                  <span className="text-[8px] text-text-muted leading-tight">
                                    {state.isChained
                                      ? 'Linked: Updates apply to all positions'
                                      : 'Unlinked: Position specific sizes'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlers.setIsChained(!state.isChained)
                                  }
                                  className={`p-1.5 rounded-lg border transition duration-150 active:scale-[0.98] ${
                                    state.isChained
                                      ? 'bg-accent/10 border-accent/30 text-accent'
                                      : 'bg-surface border-border text-text-muted hover:text-text-secondary'
                                  }`}
                                  title={
                                    state.isChained
                                      ? 'Linked (Changing size/format applies to all)'
                                      : 'Unlinked (Changing applies only to this position)'
                                  }
                                >
                                  {state.isChained ? (
                                    <Link className="w-3.5 h-3.5" />
                                  ) : (
                                    <Link2Off className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Output Preview */}
                            <div className="bg-bg/40 border border-border/40 rounded-xl p-3 space-y-1.5 w-full">
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wide block">
                                Parsed File Name Output
                              </span>
                              <div className="max-h-26.25 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                                {state.parsedNames.map((name, idx) => (
                                  <div
                                    key={name + '-' + (state.validFens[idx] || idx)}
                                    className="flex justify-between items-center text-[9px] font-mono text-text-secondary"
                                  >
                                    <span>Pos {idx + 1}:</span>
                                    <span
                                      className={
                                        idx === state.safeCurrentIndex
                                          ? 'text-accent font-bold'
                                          : ''
                                      }
                                    >
                                      {name || `Position-${idx + 1}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* CTA Executer Buttons */}
                          <div className="space-y-3 pt-4 border-t border-border/40">
                            <button
                              type="button"
                              onClick={handlers.handleExportActive}
                              className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-xl font-semibold transition duration-150 text-xs active:scale-[0.98]"
                            >
                              Download Active Position ({state.safeCurrentIndex + 1})
                            </button>
                            <button
                              type="button"
                              onClick={handlers.handleExportBatch}
                              className="w-full py-3 bg-accent hover:bg-accent-hover text-bg rounded-xl font-bold transition duration-150 text-xs active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-1.5"
                            >
                              <Sparkles className="w-4 h-4 fill-current shrink-0" />
                              <span>
                                Download All ({state.validFens.length} Positions)
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column — Sticky Preview Player */}
                  <div className="lg:col-span-6 w-full flex flex-col items-center lg:sticky lg:top-8 animate-fadeIn">
                    <div className="w-full bg-surface border border-border/40 rounded-2xl p-5 sm:p-6 flex flex-col items-center shadow-sm">
                      <BoardDisplay
                        boardState={state.boardState}
                        isFlipped={state.isFlipped}
                        showCoordinates={state.showCoordinates}
                        pieceImages={state.pieceImages}
                        isBoardReady={state.isBoardReady}
                        lightSquare={state.theme.lightSquare}
                        darkSquare={state.theme.darkSquare}
                      />
                      
                      <PlaybackControls
                        isPlaying={state.isPlaying}
                        interval={state.intervalTime}
                        showIntervalMenu={state.showIntervalMenu}
                        intervalOptions={INTERVAL_OPTIONS.map((opt) => opt.value)}
                        currentIndex={state.safeCurrentIndex}
                        totalCount={state.validFens.length}
                        onTogglePlay={handlers.handleTogglePlay}
                        onSetInterval={handlers.handleSetIntervalTime}
                        onToggleIntervalMenu={handlers.handleToggleIntervalMenu}
                        onPrevious={handlers.handlePrevious}
                        onNext={handlers.handleNext}
                      />

                      {/* Minimalist Player Buttons */}
                      <div className="grid grid-cols-3 gap-3 w-full mt-6 border-t border-border/40 pt-4">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(state.currentFen);
                            } catch (err) {
                              logger.error('Copy failed:', err);
                            }
                          }}
                          className="px-2 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border/60 text-text-primary rounded-xl font-semibold transition duration-150 text-[10px] sm:text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <Copy className="w-3.5 h-3.5 text-text-secondary" />
                          <span>Copy FEN</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={handlers.handleFlipBoard}
                          className="px-2 py-2.5 bg-surface-elevated hover:bg-surface-hover border border-border/60 text-text-primary rounded-xl font-semibold transition duration-150 text-[10px] sm:text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <FlipVertical2 className="w-3.5 h-3.5 text-text-secondary" />
                          <span>Flip Board</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handlers.setWizardStep(2)}
                          className="px-2 py-2.5 bg-accent hover:bg-accent-hover text-bg rounded-xl font-bold transition duration-150 text-[10px] sm:text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
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
