import { useRef } from 'react';
import { Download, Upload } from '@/assets/icons';
import DiagramWorkspace from '@/components/interactions/Editor/DiagramWorkspace';
import { useHome } from '@/pages/HomePage/hooks/useHome';
import {
  parseFEN,
  positionContext,
  validateFENDetailed
} from '@utils/fenParser';
import { serializePopeye, MAX_COMPOSITION_LENGTH } from '@utils/popeye';
import { saveBlob } from '@utils/saveBlob';
import { BUTTON } from '@/components/interactions/FairySetup/controls';

export default function FairyChessPage() {
  const home = useHome('fairy');
  const fileRef = useRef<HTMLInputElement>(null);
  const importPosition = async (file: File) => {
    try {
      if (file.size > MAX_COMPOSITION_LENGTH * 4)
        throw new Error('The composition file is too large.');
      const source = (await file.text()).trim();
      const validation = validateFENDetailed(source);
      if (!validation.isValid)
        throw new Error(validation.errorMessage ?? 'Invalid position.');
      home.setFen(source);
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
      const validation = validateFENDetailed(home.fen);
      if (!validation.isValid)
        throw new Error(
          validation.errorMessage ?? 'Correct the position before saving.'
        );
      const context = positionContext(home.fen);
      const source = serializePopeye(parseFEN(home.fen), {
        ...context,
        commands: context.commands ?? []
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
      header={
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-2 pb-1">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-text-primary">
              Fairy chess
            </p>
            <p className="text-xs text-text-secondary">
              Rotated, neutral and named pieces, markers, conditions and Popeye
              notation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              className={BUTTON}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Import
            </button>
            <button
              type="button"
              className={`${BUTTON} border-accent/40 bg-accent/10 text-accent enabled:hover:text-accent`}
              onClick={downloadPosition}
            >
              <Download className="size-3.5" aria-hidden="true" />
              Save .inp
            </button>
          </div>
        </div>
      }
    />
  );
}
