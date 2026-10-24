import React, { useCallback } from 'react';

import { useLocation } from 'wouter';

import { ExportProgress } from '@/components/features/Export/ExportProgress';
import { FenToolbar } from '@/components/features/Fen/components/FenToolbar';
import { ChessEditor } from '@/components/interactions/Editor/components/ChessEditor';
import {
  getRouteSeo,
  HOME_FAQ_SCHEMA,
  SOFTWARE_APP_SCHEMA,
  WEBSITE_SCHEMA
} from '@constants';

import { NotificationContainer } from '@/shared/ui/NotificationContainer';
import { Seo } from '@/shared/ui/Seo';
import { isFairyFEN, validateFENDetailed } from '@utils/fenParser';
import type { BoardCell } from '@app-types';
import type { useHome } from '@/pages/HomePage/hooks/useHome';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface DiagramWorkspaceProps {
  home: ReturnType<typeof useHome>;
  variant?: 'standard' | 'fairy';
  palettePiece?: BoardCell | null;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

const DiagramWorkspace: React.FC<DiagramWorkspaceProps> = ({
  home,
  variant = 'standard',
  palettePiece,
  header,
  children
}) => {
  const isFairyPage = variant === 'fairy';
  const [, setLocation] = useLocation();

  const handleDownloadClick = useCallback(() => {
    sessionStorage.setItem(
      'cv_export_config',
      JSON.stringify({
        fen: home.fen,
        pieceStyle: home.pieceStyle,
        showCoords: home.showCoords,
        showCoordinateBorder: home.showCoordinateBorder,
        showThinFrame: home.showThinFrame,
        lightSquare: home.lightSquare,
        darkSquare: home.darkSquare,
        exportQuality: home.exportQuality,
        boardSize: home.boardSize,
        flipped: home.flipped,
        fileName: home.fileName
      })
    );
    setLocation('/export');
  }, [
    home.fen,
    home.pieceStyle,
    home.showCoords,
    home.showCoordinateBorder,
    home.showThinFrame,
    home.lightSquare,
    home.darkSquare,
    home.exportQuality,
    home.boardSize,
    home.flipped,
    home.fileName,
    setLocation
  ]);

  const { setFen } = home;
  const handleFenInput = useCallback(
    (value: string) => {
      if (
        !isFairyPage &&
        isFairyFEN(value) &&
        validateFENDetailed(value).isValid
      ) {
        setLocation(`/fairy-chess#position=${encodeURIComponent(value)}`);
      } else setFen(value);
    },
    [isFairyPage, setFen, setLocation]
  );

  const isCustomFen = home.fen && home.fen !== STARTING_FEN;
  const dynamicParams = isCustomFen
    ? `?fen=${encodeURIComponent(home.fen)}`
    : undefined;

  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ||
    'https://placeholder.supabase.co';
  const dynamicOgImage =
    isCustomFen && !isFairyPage && !isFairyFEN(home.fen)
      ? `${supabaseUrl}/functions/v1/og-image${dynamicParams}`
      : undefined;

  return (
    <>
      <Seo
        {...getRouteSeo(isFairyPage ? '/fairy-chess' : '/')}
        dynamicParams={isFairyPage ? undefined : dynamicParams}
        image={dynamicOgImage ?? getRouteSeo('/').image}
        schema={
          isFairyPage
            ? SOFTWARE_APP_SCHEMA
            : [WEBSITE_SCHEMA, SOFTWARE_APP_SCHEMA, HOME_FAQ_SCHEMA]
        }
      />
      <h1 className="sr-only">
        {isFairyPage
          ? 'Fairy Chess Diagram Editor'
          : 'Free Chess Diagram Generator — FEN to PNG, JPEG & SVG'}
      </h1>
      <div
        className={`page-container w-full bg-bg py-2 overflow-x-clip flex-1 flex flex-col ${isFairyPage ? '' : 'home-workspace'}`}
      >
        <div className="flex flex-col shrink-0 gap-fluid-xs md:gap-3 pt-1.5 md:pt-0">
          {header}
          <div className="min-w-0">
            <FenToolbar
              fen={home.fen}
              setFen={handleFenInput}
              addToFavoritesRef={home.addToFavoritesRef}
              onFavoriteStatusChange={home.setIsFavorite}
              saveManualFen={home.saveManualFen}
              saveExportFen={home.saveExportFen}
              addCurrentToFavorites={home.addCurrentToFavorites}
              onNotification={home.handleNotification}
            />
          </div>
          <div className="w-full">
            <div className="workspace-container bg-surface border border-border/40 rounded-xl p-fluid-xs sm:p-fluid-sm overflow-x-hidden">
              <ChessEditor
                variant={variant}
                palettePiece={palettePiece ?? null}
                fen={home.fen}
                onFenChange={home.handleEditorFenChange}
                pieceStyle={home.pieceStyle}
                showCoords={home.showCoords}
                setShowCoords={home.setShowCoords}
                showThinFrame={home.showThinFrame}
                setShowThinFrame={home.setShowThinFrame}
                lightSquare={home.lightSquare}
                darkSquare={home.darkSquare}
                flipped={home.flipped}
                onFlip={home.handleFlip}
                onNotify={home.handleNotification}
                onDownload={handleDownloadClick}
                onCopyImage={home.handleCopyImage}
                onPieceImagesChange={home.handlePieceImagesChange}
              />
            </div>
          </div>
          {children}
        </div>

        <NotificationContainer
          notifications={home.notifications}
          onRemove={home.removeNotification}
        />

        {home.exportState.showProgress && (
          <ExportProgress
            isExporting={home.exportState.isExporting}
            progress={home.exportState.exportProgress}
            currentFormat={home.exportState.currentFormat || ''}
            config={home.getExportConfig()}
            isPaused={home.exportState.isPaused}
            actualBytes={home.exportState.actualBytes}
            onClose={home.toggleProgress}
            onPause={home.handlePause}
            onResume={home.handleResume}
            onCancel={home.handleCancelExport}
          />
        )}
      </div>
    </>
  );
};

export default DiagramWorkspace;
