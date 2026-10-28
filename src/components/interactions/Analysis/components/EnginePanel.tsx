import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Settings } from '@/assets/icons';
import type { BoardArrow } from '@/engines/core/arrows';
import { useOutsideClick } from '@/shared/hooks/useDOM';
import { Switch } from '@/shared/ui/Switch';
import styles from '../styles/analysis.module.scss';

interface Props {
  id: string;
  onClose: () => void;
  closing: boolean;
  rules: boolean;
  onRulesChange: (rules: boolean) => void;
  arrows: readonly BoardArrow[];
  onArrows: (arrows: readonly BoardArrow[]) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  progress: number | undefined;
  score: string;
  scoreLabel: string;
  scoreTitle: string;
  name: string;
  badge: string;
  status: string;
  actions?: ReactNode;
  settings: ReactNode;
  children: ReactNode;
}

export function EnginePanel({
  id,
  onClose,
  closing,
  rules,
  onRulesChange,
  arrows,
  onArrows,
  enabled,
  onEnabledChange,
  progress,
  score,
  scoreLabel,
  scoreTitle,
  name,
  badge,
  status,
  actions,
  settings,
  children
}: Props) {
  const settingsId = useId();
  const engineRef = useRef<HTMLDivElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    onRulesChange(rules);
    return () => onRulesChange(false);
  }, [rules, onRulesChange]);

  useEffect(() => {
    onArrows(arrows);
    return () => onArrows([]);
  }, [arrows, onArrows]);

  useOutsideClick(
    engineRef,
    (event) => {
      setSettingsOpen(false);
      if (event instanceof KeyboardEvent) {
        event.preventDefault();
        event.stopPropagation();
        settingsButton.current?.focus();
      }
    },
    settingsOpen
  );

  return (
    <section
      id={id}
      aria-label="Computer analysis"
      className={styles.panel}
      data-analysis-panel=""
      data-closing={closing}
      onClick={(event) => event.stopPropagation()}
      onKeyDownCapture={(event) => {
        if (event.key !== 'Escape') return;
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('[role="combobox"][aria-expanded="true"]')
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        if (settingsOpen) {
          setSettingsOpen(false);
          settingsButton.current?.focus();
        } else onClose();
      }}
    >
      <div ref={engineRef} className={styles.engineAnchor}>
        <div className={styles.engine}>
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="Search time used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              progress === undefined ? undefined : Math.round(progress)
            }
          >
            <span style={{ width: `${progress ?? 0}%` }} />
          </div>
          <Switch
            checked={enabled}
            onChange={onEnabledChange}
            aria-label="Enable analysis"
          />
          <span
            className={styles.score}
            title={scoreTitle}
            aria-label={scoreLabel}
          >
            {score}
          </span>
          <div className={styles.engineName}>
            <strong>
              {name} <span>{badge}</span>
            </strong>
            <span role="status">{status}</span>
          </div>
          {actions}
          <button
            ref={settingsButton}
            type="button"
            className={`${styles.iconButton} ${settingsOpen ? styles.active : ''}`}
            aria-label="Engine settings"
            title="Engine settings"
            aria-expanded={settingsOpen}
            aria-controls={settingsId}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <Settings className={styles.controlIcon} />
          </button>
        </div>
        <div
          id={settingsId}
          className={styles.settingsPopover}
          data-open={settingsOpen}
          aria-hidden={!settingsOpen}
          inert={!settingsOpen}
        >
          {settings}
        </div>
      </div>
      <div className={styles.results}>{children}</div>
    </section>
  );
}
