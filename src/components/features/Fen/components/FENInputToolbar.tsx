import { memo } from 'react';

import { Clipboard, Eraser, Plus, RotateCcw, Star } from '@/assets/icons';
import styles from '../styles/fen-toolbar.module.scss';

interface FENInputToolbarProps {
  isFavorite: boolean;
  onPaste?: (() => void) | undefined;
  onAddToBatch: () => void;
  onToggleFavorite: () => void;

  onStartPosition: () => void;

  onClearBoard: () => void;
}

const GroupDivider = () => (
  <span className={styles['groupDivider']} aria-hidden="true" />
);

export const FENInputToolbar = memo(function FENInputToolbar({
  isFavorite,
  onPaste,
  onAddToBatch,
  onToggleFavorite,
  onStartPosition,
  onClearBoard
}: FENInputToolbarProps) {
  return (
    <div className={`hide-scrollbar ${styles['inputToolbarContainer']}`}>
      <div className={styles['btnGroup']}>
        <button
          onClick={onPaste}
          className={`${styles['toolbarBtnBase']} ${styles['toolbarBtnNeutral']}`}
          title="Paste FEN from clipboard"
          aria-label="Paste FEN from clipboard"
          type="button"
        >
          <Clipboard
            className={styles['toolbarBtnIcon']}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span className="sr-only">Paste</span>
        </button>
      </div>

      <GroupDivider />

      <div className={styles['btnGroup']}>
        <button
          onClick={onAddToBatch}
          className={`${styles['toolbarBtnBase']} ${styles['toolbarBtnNeutral']}`}
          title="Add to batch (no redirect)"
          aria-label="Add to batch"
          type="button"
        >
          <Plus
            className={styles['toolbarBtnIcon']}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span>Add</span>
        </button>

        <button
          onClick={onToggleFavorite}
          className={`${styles['toolbarBtnBase']} ${
            isFavorite
              ? styles['toolbarBtnFavoriteActive']
              : styles['toolbarBtnNeutral']
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          type="button"
        >
          <Star
            className={`${styles['toolbarBtnIcon']} transition duration-200 ease-out ${
              isFavorite ? 'scale-110' : 'scale-100'
            }`}
            strokeWidth={2.5}
            fill={isFavorite ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            {isFavorite ? 'Saved' : 'Save'}
          </span>
        </button>
      </div>

      <GroupDivider />

      <div className={styles['btnGroup']}>
        <button
          onClick={onStartPosition}
          className={`${styles['toolbarBtnBase']} ${styles['toolbarBtnNeutral']}`}
          title="Load the starting position"
          aria-label="Load starting position"
          type="button"
        >
          <RotateCcw
            className={styles['toolbarBtnIcon']}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span>Reset</span>
        </button>

        <button
          onClick={onClearBoard}
          className={`${styles['toolbarBtnBase']} ${styles['toolbarBtnClear']}`}
          title="Clear the board (empty position)"
          aria-label="Clear board"
          type="button"
        >
          <Eraser
            className={styles['toolbarBtnIcon']}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
});

FENInputToolbar.displayName = 'FENInputToolbar';
