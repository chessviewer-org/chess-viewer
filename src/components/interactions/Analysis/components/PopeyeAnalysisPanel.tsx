import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Target } from '@/assets/icons';
import {
  MEMORY_SIZES,
  SEARCH_DEBOUNCE_MS,
  SEARCH_TIMES
} from '@/engines/core/limits';
import type { Notify, PreviewMove } from '@/engines/core/types';
import type { PreviousMove } from '@/engines/popeye/moves';
import { lineArrows, type BoardArrow } from '@/engines/core/arrows';
import { parseFEN } from '@/shared/utils/fenParser';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { Checkbox } from '@/shared/ui/Checkbox';
import {
  analysisSettings,
  DEFAULT_ANALYSIS_SETTINGS,
  POPEYE_VERSION,
  type AnalysisSettings
} from '@/engines/popeye/settings';
import {
  buildAnalysisInput,
  compositionStipulation
} from '@/engines/popeye/input';
import { solutionLines } from '@/engines/popeye/output';
import { EMPTY_ANALYSIS, PopeyeClient } from '@/engines/popeye/client';
import { EnginePanel } from './EnginePanel';
import { useStartError } from '../hooks/useStartError';
import { EngineSettings, RangeSetting } from './EngineSettings';
import { SolutionRows } from './SolutionRows';
import type { ChessBoard } from '@app-types';
import styles from '../styles/analysis.module.scss';

interface Props {
  fen: string;
  previousMove?: PreviousMove | undefined;
  id: string;
  onPreview: (board: ChessBoard | null, move?: PreviewMove) => void;
  onClose: () => void;
  closing: boolean;
  onNotify?: Notify | undefined;
  onRulesChange: (enabled: boolean) => void;
  onArrows: (arrows: readonly BoardArrow[]) => void;
  pieceStyle: string;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
}

export default memo(function PopeyeAnalysisPanel({
  fen,
  previousMove,
  id,
  onPreview,
  onClose,
  closing,
  onNotify,
  onRulesChange,
  onArrows,
  pieceStyle,
  lightSquare,
  darkSquare,
  flipped
}: Props) {
  const previousFen = useRef(fen);
  const [saved, setSaved] = useLocalStorage(
    'popeye-analysis-settings',
    DEFAULT_ANALYSIS_SETTINGS
  );
  const settings = useMemo(() => analysisSettings(saved), [saved]);
  const [state, setState] = useState(EMPTY_ANALYSIS);
  const [client] = useState(() => new PopeyeClient(setState));
  const [enabled, setEnabled] = useState(true);
  const [restart, setRestart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inheritedStipulation = useMemo(() => {
    try {
      return compositionStipulation(fen);
    } catch {
      return '#2';
    }
  }, [fen]);
  const stipulation = inheritedStipulation;

  const startError = useStartError(onNotify);

  useEffect(() => {
    client.warm();
    return () => client.destroy();
  }, [client]);

  useLayoutEffect(() => {
    onPreview(null);
    client.dispose();
    const changed = previousFen.current !== fen;
    previousFen.current = fen;
    if (!enabled) {
      if (changed) setState(EMPTY_ANALYSIS);
      return;
    }
    setState({ ...EMPTY_ANALYSIS, status: 'loading' });
    const timer = setTimeout(() => {
      try {
        client.start(
          buildAnalysisInput(fen, stipulation, settings),
          settings,
          previousMove
        );
        client.warm();
        startError.clear();
      } catch (error) {
        setState({
          ...EMPTY_ANALYSIS,
          status: 'error',
          message: startError.fail(error)
        });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      client.dispose();
    };
  }, [
    client,
    fen,
    previousMove,
    stipulation,
    settings,
    enabled,
    restart,
    onPreview,
    startError
  ]);

  useEffect(() => {
    if (state.status !== 'running') {
      setElapsed(state.elapsedMs);
      return;
    }
    const start = performance.now() - state.elapsedMs;
    const timer = setInterval(() => setElapsed(performance.now() - start), 100);
    return () => clearInterval(timer);
    // Output is batched independently; only a new search restarts the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const solutions = useMemo(
    () => solutionLines(state.output, state.moves),
    [state.output, state.moves]
  );
  const arrows = useMemo(() => {
    try {
      return lineArrows(
        parseFEN(fen),
        solutions
          .slice(0, settings.solutions)
          .map((solution) => solution.moves[0]?.board)
      );
    } catch {
      return [];
    }
  }, [fen, solutions, settings.solutions]);
  const busy = state.status === 'loading' || state.status === 'running';
  const changeSetting = <K extends keyof AnalysisSettings>(
    key: K,
    value: AnalysisSettings[K]
  ) => setSaved({ ...settings, [key]: value });
  const toggleEnabled = (value: boolean) => {
    if (!value) client.stop();
    setEnabled(value);
  };
  const status =
    state.status === 'loading'
      ? 'Loading…'
      : state.status === 'running'
        ? `Searching · ${(elapsed / 1000).toFixed(1)} s`
        : state.status === 'complete'
          ? `${solutions.length} solution${solutions.length === 1 ? '' : 's'} · ${(state.elapsedMs / 1000).toFixed(1)} s`
          : state.status === 'error'
            ? 'Check problem'
            : state.status === 'timeout'
              ? 'Time limit reached'
              : enabled
                ? 'Ready'
                : 'Paused';
  const timeUsed = Math.min(100, elapsed / (settings.seconds * 10));

  return (
    <EnginePanel
      id={id}
      onClose={onClose}
      closing={closing}
      rules={settings.rules}
      onRulesChange={onRulesChange}
      arrows={arrows}
      onArrows={onArrows}
      enabled={enabled}
      onEnabledChange={toggleEnabled}
      progress={state.status === 'loading' ? undefined : timeUsed}
      score={stipulation}
      scoreLabel={`Stipulation ${stipulation}`}
      scoreTitle={`Problem stipulation: ${stipulation}`}
      name={`Popeye ${POPEYE_VERSION}`}
      badge="WASM"
      status={status}
      actions={
        <button
          type="button"
          className={`${styles.iconButton} ${styles.threatButton}`}
          aria-label="Include threats"
          title="Include threats in solutions"
          aria-pressed={settings.threats}
          onClick={() => changeSetting('threats', !settings.threats)}
        >
          <Target className={styles.controlIcon} />
        </button>
      }
      settings={
        <EngineSettings
          searchTimes={SEARCH_TIMES}
          memorySizes={MEMORY_SIZES}
          rules={settings.rules}
          onRulesChange={(value) => changeSetting('rules', value)}
          seconds={settings.seconds}
          memoryMb={settings.memoryMb}
          onSecondsChange={(value) => changeSetting('seconds', value)}
          onMemoryChange={(value) => changeSetting('memoryMb', value)}
        >
          <RangeSetting
            label="Solutions"
            value={settings.solutions}
            min={1}
            max={10}
            onChange={(value) => changeSetting('solutions', value)}
          />
          <Checkbox
            checked={settings.variations}
            onChange={(event) =>
              changeSetting('variations', event.currentTarget.checked)
            }
            label="Show defensive variations"
          />
          <a
            href="/licenses/popeye/py-engl.txt"
            target="_blank"
            rel="noopener noreferrer"
          >
            Popeye manual
          </a>
        </EngineSettings>
      }
    >
      <SolutionRows
        label="Popeye solutions"
        solutions={solutions}
        limit={settings.solutions}
        emptyText={
          busy
            ? 'Searching…'
            : state.status === 'complete'
              ? 'No solutions found'
              : '—'
        }
        onPreview={onPreview}
        pieceStyle={pieceStyle}
        lightSquare={lightSquare}
        darkSquare={darkSquare}
        flipped={flipped}
      />
      {state.message && (
        <p
          className={`${styles.notice} ${state.status === 'error' ? styles.errorNotice : ''}`}
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.message}
        </p>
      )}
      {state.status === 'complete' &&
        /Partial solution/i.test(state.output) && (
          <p className={styles.notice}>
            Search limited. More solutions may exist.
          </p>
        )}
      {state.status === 'error' && (
        <button
          type="button"
          className={styles.retry}
          onClick={() => {
            setEnabled(true);
            setRestart((n) => n + 1);
          }}
        >
          Retry
        </button>
      )}
    </EnginePanel>
  );
});
