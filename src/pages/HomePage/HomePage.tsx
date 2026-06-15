import React, { useCallback, useState } from 'react';

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { ChessEditor, DndProvider } from '@/components/interactions';
import { ControlPanel, ExportProgress } from '@/components/panels';

import { NotificationContainer } from '@shared/ui';
import ExportStudio from './components/ExportStudio';
import { useHome } from './hooks/useHome';

/** Primary workspace combining the DnD board editor, control panel, and export studio trigger. */
const HomePage: React.FC = () => {
  const {
    fen,
    setFen,
    pieceStyle,
    setPieceStyle,
    showCoords,
    setShowCoords,
    showCoordinateBorder,
    setShowCoordinateBorder,
    showThinFrame,
    setShowThinFrame,
    lightSquare,
    setLightSquare,
    darkSquare,
    setDarkSquare,
    boardSize,
    setBoardSize,
    exportQuality,
    setExportQuality,
    flipped,
    setIsFavorite,
    addToFavoritesRef,
    exportState,
    notifications,
    removeNotification,

    saveManualFen,
    saveExportFen,
    addCurrentToFavorites,

    handlePieceImagesChange,
    handleBatchExport,
    handleCancelExport,
    handlePause,
    handleResume,
    handleEditorFenChange,
    handleFlip,
    handleNotification,
    toggleProgress,
    getExportConfig
  } = useHome();

  const [isExportStudioOpen, setIsExportStudioOpen] = useState(false);

  // Which view occupies the right-side panel: the normal control tools, or the
  // inline Clipboard History (lifted here as it is toggled from the FEN toolbar
  // but rendered inside ChessEditor's right column).
  const [activeRightPanel, setActiveRightPanel] = useState<
    'controls' | 'history' | 'settings'
  >('controls');
  const toggleHistoryPanel = () =>
    setActiveRightPanel((p) => (p === 'history' ? 'controls' : 'history'));
  const closeHistoryPanel = () => setActiveRightPanel('controls');
  const toggleSettingsPanel = useCallback(() => {
    setActiveRightPanel((p) => (p === 'settings' ? 'controls' : 'settings'));
  }, []);

  // Send a history FEN to the Advanced FEN editor. The page reads `addFen` from
  // navigation state and drops it into the batch (see useFENBatchSync).
  const navigate = useNavigate();
  const handleSendToAdvanced = useCallback(
    (advFen: string) => {
      navigate('/advanced-fen', { state: { addFen: advFen } });
    },
    [navigate]
  );

  const homeState = {
    fen,
    pieceStyle,
    setPieceStyle,
    showCoords,
    setShowCoords,
    showCoordinateBorder,
    setShowCoordinateBorder,
    showThinFrame,
    setShowThinFrame,
    lightSquare,
    setLightSquare,
    darkSquare,
    setDarkSquare,
    boardSize,
    setBoardSize,
    exportQuality,
    setExportQuality,
    flipped,
    handleBatchExport
  };

  return (
    <DndProvider>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full h-auto lg:h-full lg:overflow-hidden min-h-0 bg-bg py-fluid-xs overflow-x-hidden"
      >
        {/* Same width formula as the navbar inner container (Navbar.tsx) so the
            page edges line up pixel-exact with the ChessVision logo on the left
            and the account menu on the right. No extra outer px-* padding — that
            would shrink the page narrower than the navbar.

            Layout skeleton is a CSS Grid (NOT a flex column): a `auto`-sized
            row for the FEN/control toolbar and a `minmax(0,1fr)` row for the
            board card. The grid resolves the board card's height deterministically
            from the remaining track instead of relying on `flex-1` reflow, and
            `min-h-0` on the rows lets the card's own scroll/overflow take over
            cleanly. Vertical rhythm via the fluid `gap-fluid-xs` token. */}
        <div className="grid grid-rows-[auto_minmax(0,1fr)] gap-fluid-xs w-[94%] sm:w-[88%] max-w-600 mx-auto h-auto lg:h-full min-h-0">
          {/* Top Bar — full-width FEN / Control Panel above the board. */}
          <div className="min-w-0">
            <ControlPanel
              fen={fen}
              setFen={setFen}
              addToFavoritesRef={addToFavoritesRef}
              onFavoriteStatusChange={setIsFavorite}
              saveManualFen={saveManualFen}
              saveExportFen={saveExportFen}
              addCurrentToFavorites={addCurrentToFavorites}
              onNotification={handleNotification}
              isHistoryActive={activeRightPanel === 'history'}
              onToggleHistory={toggleHistoryPanel}
            />
          </div>

          {/* Main content — board (left) + command-center panel (right).
              Export actions now live as icons in the panel's top toolbar.

              `workspace-container` makes this card a container-query context so
              ChessEditor adapts to the CARD's inline width (`@5xl:flex-row`),
              not the viewport — board+panel go side-by-side when the CARD is
              wide enough, which is the right signal on ultra-wide. `overscroll-trap`
              keeps a scroll bounce inside the card on touch. */}
          <div className="min-w-0 min-h-0 self-start w-full">
            <div className="workspace-container lg:overscroll-trap bg-surface border border-border/40 rounded-xl p-fluid-xs sm:p-fluid-sm h-auto lg:max-h-full overflow-visible lg:overflow-hidden">
              <ChessEditor
                fen={fen}
                onFenChange={handleEditorFenChange}
                pieceStyle={pieceStyle}
                showCoords={showCoords}
                setShowCoords={setShowCoords}
                showThinFrame={showThinFrame}
                setShowThinFrame={setShowThinFrame}
                exportQuality={exportQuality}
                showCoordinateBorder={showCoordinateBorder}
                lightSquare={lightSquare}
                darkSquare={darkSquare}
                flipped={flipped}
                onFlip={handleFlip}
                onNotify={handleNotification}
                onDownload={() => setIsExportStudioOpen(true)}
                onPieceImagesChange={handlePieceImagesChange}
                activeRightPanel={activeRightPanel}
                onSelectHistoryFen={handleEditorFenChange}
                onSendToAdvanced={handleSendToAdvanced}
                onCloseHistory={closeHistoryPanel}
                onToggleSettings={toggleSettingsPanel}
                homeState={homeState}
              />
            </div>
          </div>
        </div>

        <NotificationContainer
          notifications={notifications}
          onRemove={removeNotification}
        />

        {isExportStudioOpen && (
          <ExportStudio
            homeState={homeState}
            onClose={() => setIsExportStudioOpen(false)}
          />
        )}

        {exportState.showProgress && (
          <ExportProgress
            isExporting={exportState.isExporting}
            progress={exportState.exportProgress}
            currentFormat={exportState.currentFormat || ''}
            config={getExportConfig()}
            isPaused={exportState.isPaused}
            onClose={toggleProgress}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancelExport}
          />
        )}
      </motion.div>
    </DndProvider>
  );
};

export default HomePage;
