import { memo, useCallback, useEffect, useRef, useState } from 'react';

import {
  Check,
  Copy,
  Cpu,
  Download,
  Redo2,
  Repeat2,
  Share2,
  Undo2
} from '@/assets/icons';
import styles from '../styles/command-bar.module.scss';

const COPIED_FEEDBACK_MS = 1500;

interface CommandBarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFlip?: () => void;
  onCopyImage: () => Promise<boolean>;
  onShare: () => void;
  onDownload?: (() => void) | undefined;
  onToggleAnalysis?: (() => void) | undefined;
  analysisOpen?: boolean;
  analysisPanelId?: string;
}

const Divider = () => <span className={styles.divider} aria-hidden="true" />;

export const CommandBar = memo(function CommandBar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onFlip,
  onCopyImage,
  onShare,
  onDownload,
  onToggleAnalysis,
  analysisOpen = false,
  analysisPanelId
}: CommandBarProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const handleCopy = useCallback(async () => {
    if (!(await onCopyImage())) return;
    clearTimeout(copiedTimer.current);
    setCopied(true);
    copiedTimer.current = setTimeout(
      () => setCopied(false),
      COPIED_FEEDBACK_MS
    );
  }, [onCopyImage]);

  return (
    <div className={styles.bar}>
      <div className={styles.group}>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={styles.button}
          title="Undo (Ctrl+Z)"
          aria-label="Undo last change"
        >
          <Undo2 className={styles.icon} />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={styles.button}
          title="Redo (Ctrl+Y)"
          aria-label="Redo last change"
        >
          <Redo2 className={styles.icon} />
        </button>

        <Divider />

        <button
          type="button"
          onClick={onFlip}
          className={styles.button}
          title="Flip board (F)"
          aria-label="Flip board orientation"
        >
          <Repeat2 className={styles.icon} />
        </button>
      </div>

      <div className={styles.group}>
        {onToggleAnalysis && (
          <button
            type="button"
            onClick={onToggleAnalysis}
            className={`${styles.button} ${analysisOpen ? styles.active : ''}`}
            title="Computer analysis"
            aria-label="Computer analysis"
            aria-pressed={analysisOpen}
            aria-expanded={analysisOpen}
            aria-controls={analysisPanelId}
          >
            <Cpu className={styles.icon} />
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className={`${styles.button} ${copied ? styles.success : ''}`}
          title={copied ? 'Copied' : 'Copy image'}
          aria-label={
            copied ? 'Board image copied' : 'Copy board image to clipboard'
          }
        >
          {copied ? (
            <Check
              className={`${styles.icon} animate-draw-check`}
              strokeWidth={2.5}
            />
          ) : (
            <Copy className={styles.icon} />
          )}
        </button>
        <button
          type="button"
          onClick={onShare}
          className={styles.button}
          title="Share"
          aria-label="Share board"
        >
          <Share2 className={styles.icon} />
        </button>

        <Divider />

        <button
          type="button"
          onClick={onDownload}
          className={`${styles.button} ${styles.primary}`}
          title="Download / Export"
          aria-label="Download or export board"
        >
          <Download className={styles.icon} />
        </button>
      </div>
    </div>
  );
});

CommandBar.displayName = 'CommandBar';
