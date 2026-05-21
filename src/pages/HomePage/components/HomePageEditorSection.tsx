import { memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { ChessEditor } from '@/components/interactions';
import { ActionButtons } from '@/components/features';

interface HomePageEditorSectionProps {
  itemVariants: Variants;
  fen: string;
  pieceStyle: string;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  isExporting: boolean;
  handleEditorFenChange: (fen: string) => void;
  handlePieceImagesChange: (images: Record<string, HTMLImageElement>) => void;
  handleDownloadPNG: () => Promise<void>;
  handleDownloadJPEG: () => Promise<void>;
  handleCopyImage: () => Promise<void>;
  handleFlip: () => void;
  handleBatchExport: (formats: string[]) => Promise<void>;
}

export const HomePageEditorSection: React.FC<HomePageEditorSectionProps> = memo(({
  itemVariants,
  fen,
  pieceStyle,
  showCoords,
  lightSquare,
  darkSquare,
  flipped,
  isExporting,
  handleEditorFenChange,
  handlePieceImagesChange,
  handleDownloadPNG,
  handleDownloadJPEG,
  handleCopyImage,
  handleFlip,
  handleBatchExport
}) => {
  return (
    <div className="w-full xl:flex-1 space-y-3 sm:space-y-4 min-w-0">
      <motion.div
        variants={itemVariants}
        className="bg-surface border border-border/40 rounded-xl p-3 sm:p-4"
      >
        <ChessEditor
          fen={fen}
          onFenChange={handleEditorFenChange}
          pieceStyle={pieceStyle}
          showCoords={showCoords}
          lightSquare={lightSquare}
          darkSquare={darkSquare}
          flipped={flipped}
          onPieceImagesChange={handlePieceImagesChange}
        />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-surface border border-border/40 rounded-xl p-3 sm:p-4 lg:p-5"
      >
        <ActionButtons
          onDownloadPNG={handleDownloadPNG}
          onDownloadJPEG={handleDownloadJPEG}
          onCopyImage={handleCopyImage}
          onFlip={handleFlip}
          onBatchExport={handleBatchExport}
          isExporting={isExporting}
        />
      </motion.div>
    </div>
  );
});

HomePageEditorSection.displayName = 'HomePageEditorSection';
