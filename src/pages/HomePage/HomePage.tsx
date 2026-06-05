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
    'controls' | 'history'
  >('controls');
  const toggleHistoryPanel = () =>
    setActiveRightPanel((p) => (p === 'history' ? 'controls' : 'history'));
  const closeHistoryPanel = () => setActiveRightPanel('controls');

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
        className="w-full h-full min-h-0 bg-bg px-3 sm:px-6 lg:px-8 py-3 overflow-x-hidden"
      >
        <div className="w-full max-w-400 mx-auto space-y-2.5">
          {/* Top Bar — full-width FEN / Control Panel above the board. */}
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

          {/* Main content — board (left) + command-center panel (right).
              Export actions now live as icons in the panel's top toolbar. */}
          <div className="min-w-0">
            <div className="bg-surface border border-border/40 rounded-xl p-3 sm:p-4">
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
