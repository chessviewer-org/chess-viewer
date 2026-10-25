import { useEffect } from 'react';
import { ModalShell } from '@/shared/ui/Modal/ModalShell';
import type { PopeyeMove } from '@/engines/popeye/output';
import styles from '../styles/analysis.module.scss';

interface Props {
  moves: PopeyeMove[];
  onPick: (move: PopeyeMove) => void;
  onCancel: () => void;
}
export default function PopeyeMoveChoices({ moves, onPick, onCancel }: Props) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    };
    document.addEventListener('keydown', close, true);
    return () => document.removeEventListener('keydown', close, true);
  }, [onCancel]);
  return (
    <ModalShell
      isOpen={moves.length > 1}
      onClose={onCancel}
      title="Choose move"
    >
      <p className={styles.hint}>Choose the complete move.</p>
      <div className={styles.moveChoices}>
        {moves.map((move) => (
          <button key={move.text} type="button" onClick={() => onPick(move)}>
            {move.text}
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
