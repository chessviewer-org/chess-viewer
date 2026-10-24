import { useCallback, useRef, useState } from 'react';
import DiagramWorkspace from '@/components/interactions/Editor/DiagramWorkspace';
import { FairySetup } from '@/components/interactions/FairySetup/FairySetup';
import { BoardStylePanel } from '@/components/features/BoardStyle/BoardStylePanel';
import { useHome } from '@/pages/HomePage/hooks/useHome';
import {
  parseFEN,
  positionContext,
  validateFENDetailed
} from '@utils/fenParser';
import { serializePopeye, MAX_COMPOSITION_LENGTH } from '@utils/popeye';
import { saveBlob } from '@utils/saveBlob';
import type { BoardCell } from '@app-types';

export default function FairyChessPage() {
  const home = useHome('fairy');
  const [palettePiece, setPalettePiece] = useState<BoardCell | null>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const { handlePieceImagesChange } = home;
  const captureImages = useCallback(
    (value: Record<string, HTMLImageElement>) => {
      setImages(value);
      handlePieceImagesChange(value);
    },
    [handlePieceImagesChange]
  );
  const importPosition = async (file: File) => {
    try {
      if (file.size > MAX_COMPOSITION_LENGTH * 4)
        throw new Error('The composition file is too large.');
      const source = (await file.text()).trim();
      const validation = validateFENDetailed(source);
      if (!validation.isValid)
        throw new Error(validation.errorMessage ?? 'Invalid position.');
      home.setFen(source);
      setPalettePiece(null);
      home.handleNotification('Position imported', 'success');
    } catch (error) {
      home.handleNotification(
        error instanceof Error ? error.message : 'Could not import this file.',
        'error'
      );
    }
  };
  const downloadPosition = () => {
    try {
      const source = serializePopeye(parseFEN(home.fen), {
        ...positionContext(home.fen),
        commands: positionContext(home.fen).commands ?? []
      });
      saveBlob(
        new Blob([source], { type: 'text/plain;charset=utf-8' }),
        'fairy-position',
        'inp'
      );
    } catch (error) {
      home.handleNotification(
        error instanceof Error
          ? error.message
          : 'Correct the position before saving.',
        'error'
      );
    }
  };

  return (
    <DiagramWorkspace
      home={home}
      variant="fairy"
      palettePiece={palettePiece}
      onPieceImagesChange={captureImages}
      header={
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1">
          <p className="text-lg font-semibold text-text-primary">Fairy chess</p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".inp,.txt,.fen"
              className="sr-only"
              aria-label="Import fairy position file"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void importPosition(file);
                event.currentTarget.value = '';
              }}
            />
            <button
              type="button"
              className="min-h-10 px-3 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => fileRef.current?.click()}
            >
              Import position
            </button>
            <button
              type="button"
              className="min-h-10 px-3 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={downloadPosition}
            >
              Save Popeye
            </button>
          </div>
        </div>
      }
    >
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <section
            id="fairy-catalogue"
            className="min-w-0 rounded-xl border border-border/40 bg-surface p-fluid-sm scroll-mt-20"
          >
            <FairySetup
              section="pieces"
              fen={home.fen}
              pieceImages={images}
              selectedPiece={palettePiece}
              onPick={(piece) => {
                setPalettePiece(piece);
                document
                  .querySelector('[data-palette-mode="fairy"]')
                  ?.scrollIntoView({
                    block: 'start',
                    behavior: window.matchMedia(
                      '(prefers-reduced-motion: reduce)'
                    ).matches
                      ? 'instant'
                      : 'smooth'
                  });
              }}
              onUseSymbols={() => setPalettePiece(null)}
              onChange={home.handleEditorFenChange}
            />
          </section>
          <section
            id="fairy-problem"
            className="min-w-0 rounded-xl border border-border/40 bg-surface p-fluid-sm scroll-mt-20"
          >
            <FairySetup
              section="problem"
              fen={home.fen}
              pieceImages={images}
              onPick={(piece) => {
                setPalettePiece(piece);
                document
                  .querySelector('[data-palette-mode="fairy"]')
                  ?.scrollIntoView({
                    block: 'start',
                    behavior: window.matchMedia(
                      '(prefers-reduced-motion: reduce)'
                    ).matches
                      ? 'instant'
                      : 'smooth'
                  });
              }}
              onUseSymbols={() => setPalettePiece(null)}
              onChange={home.handleEditorFenChange}
            />
          </section>
        </div>
        <section className="rounded-xl border border-border/40 bg-surface p-fluid-sm">
          <h2 className="font-semibold text-text-primary mb-4">Board style</h2>
          <BoardStylePanel
            lightSquare={home.lightSquare}
            darkSquare={home.darkSquare}
            pieceStyle={home.pieceStyle}
            onApplyTheme={(light, dark) => {
              home.setLightSquare(light);
              home.setDarkSquare(dark);
            }}
            onSelectPiece={home.setPieceStyle}
          />
        </section>
      </>
    </DiagramWorkspace>
  );
}
