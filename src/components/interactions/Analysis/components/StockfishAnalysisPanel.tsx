import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState
} from 'react';
import { lineArrows, type BoardArrow } from '@/engines/core/arrows';
import { flipTurn, mustAnswerCheck } from '@/engines/rules/position';
import { Target } from '@/assets/icons';
import { parseFEN } from '@/shared/utils/fenParser';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { SEARCH_DEBOUNCE_MS, SEARCH_TIMES } from '@/engines/core/limits';
import type { Notify, PreviewMove } from '@/engines/core/types';
import {
  analysisSettings,
  DEFAULT_ANALYSIS_SETTINGS,
  HASH_SIZES,
  MAX_LINES,
  maxThreads,
  threadedEngine,
  MODELS,
  modelById,
  type AnalysisSettings,
  type ModelId
} from '@/engines/stockfish/settings';
import { EMPTY_ANALYSIS, StockfishClient } from '@/engines/stockfish/client';
import { EnginePanel } from './EnginePanel';
import { useStartError } from '../hooks/useStartError';
import { EngineSettings, RangeSetting } from './EngineSettings';
import { SolutionRows } from './SolutionRows';
import type { ChessBoard } from '@app-types';
import styles from '../styles/analysis.module.scss';

interface Props {
  fen: string;
  id: string;
  onPreview: (board: ChessBoard | null) => void;
  onClose: () => void;
  closing: boolean;
  onNotify?: Notify | undefined;
  onRulesChange: (enabled: boolean) => void;
  onPlay: (move: PreviewMove) => void;
  onArrows: (arrows: readonly BoardArrow[]) => void;
  pieceStyle: string;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
}

export default memo(function StockfishAnalysisPanel({
  fen,
  id,
  onPreview,
  onClose,
  closing,
  onNotify,
  onRulesChange,
  onPlay,
  onArrows,
  pieceStyle,
  lightSquare,
  darkSquare,
  flipped
}: Props) {
  const [saved, setSaved] = useLocalStorage(
    'stockfish-analysis-settings',
    DEFAULT_ANALYSIS_SETTINGS
  );
  const settings = useMemo(() => analysisSettings(saved), [saved]);
  const [state, setState] = useState(EMPTY_ANALYSIS);
  const [client] = useState(() => new StockfishClient(setState));
  const [enabled, setEnabled] = useState(true);
  const [restart, setRestart] = useState(0);
  const [threat, setThreat] = useState(false);
  const inCheck = useMemo(() => {
    try {
      return mustAnswerCheck(fen);
    } catch {
      return false;
    }
  }, [fen]);
  const searchFen = useMemo(
    () => (threat ? flipTurn(fen) : fen),
    [threat, fen]
  );
  const [elapsed, setElapsed] = useState(0);
  const modelId = useId();
  const startError = useStartError(onNotify);
  const model = modelById(settings.model);
  const {
    model: modelKey,
    seconds: searchSeconds,
    memoryMb,
    threads,
    lines
  } = settings;
  const searchSettings = useMemo(
    () => ({
      model: modelKey,
      seconds: searchSeconds,
      memoryMb,
      threads,
      lines,
      rules: false
    }),
    [modelKey, searchSeconds, memoryMb, threads, lines]
  );

  useEffect(() => () => client.destroy(), [client]);

  useLayoutEffect(() => {
    onPreview(null);
    client.halt();
    if (!enabled) {
      setState(EMPTY_ANALYSIS);
      return;
    }
    setState({ ...EMPTY_ANALYSIS, status: 'loading' });
    const timer = setTimeout(() => {
      try {
        if (threat && mustAnswerCheck(fen))
          throw new Error(
            'Threat mode is unavailable while the side to move is in check.'
          );
        client.start(searchFen, searchSettings, threat);
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
      client.halt();
    };
  }, [
    client,
    fen,
    threat,
    searchFen,
    searchSettings,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const arrows = useMemo(() => {
    try {
      return lineArrows(
        parseFEN(fen),
        state.lines
          .slice(0, settings.lines)
          .map((line) => line.moves[0]?.board),
        threat ? 'threat' : 'hint'
      );
    } catch {
      return [];
    }
  }, [fen, state.lines, settings.lines, threat]);
  const busy = state.status === 'loading' || state.status === 'running';
  const changeSetting = <K extends keyof AnalysisSettings>(
    key: K,
    value: AnalysisSettings[K]
  ) => setSaved({ ...settings, [key]: value });
  const toggleEnabled = (value: boolean) => {
    if (!value) client.stop();
    setEnabled(value);
  };
  const depth = state.depth ? `Depth ${state.depth}` : '';
  const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
  const status =
    state.status === 'loading'
      ? state.download > 0 && state.download < 1
        ? `Downloading engine · ${Math.round(state.download * 100)}%`
        : 'Loading…'
      : state.status === 'running'
        ? `${depth || 'Searching'} · ${seconds(elapsed)}`
        : state.status === 'complete'
          ? state.message
            ? 'Game over'
            : `${depth} · ${seconds(state.elapsedMs)}`
          : state.status === 'error'
            ? 'Check position'
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
      progress={
        state.status === 'loading'
          ? state.download > 0
            ? state.download * 100
            : undefined
          : timeUsed
      }
      score={state.score || '—'}
      scoreLabel={`Evaluation ${state.score || 'unavailable'}`}
      scoreTitle="Evaluation from White's point of view"
      name={model.label}
      badge="WASM"
      status={threat ? `Threat · ${status}` : status}
      actions={
        <button
          type="button"
          className={`${styles.iconButton} ${styles.threatButton}`}
          disabled={!threat && inCheck}
          aria-label="Show the opponent's threat"
          title="Show the opponent's threat"
          aria-pressed={threat}
          onClick={() => setThreat((on) => !on)}
        >
          <Target className={styles.controlIcon} />
        </button>
      }
      settings={
        <EngineSettings
          searchTimes={SEARCH_TIMES}
          memorySizes={HASH_SIZES}
          rules={settings.rules}
          onRulesChange={(value) => changeSetting('rules', value)}
          header={
            <label className={styles.setting} htmlFor={modelId}>
              <span>Engine</span>
              <select
                id={modelId}
                className={styles.select}
                value={settings.model}
                onChange={(event) =>
                  changeSetting('model', event.currentTarget.value as ModelId)
                }
              >
                {MODELS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label} · {entry.detail}
                  </option>
                ))}
              </select>
            </label>
          }
          seconds={settings.seconds}
          memoryMb={settings.memoryMb}
          onSecondsChange={(value) => changeSetting('seconds', value)}
          onMemoryChange={(value) => changeSetting('memoryMb', value)}
        >
          <RangeSetting
            label="Threads"
            value={threadedEngine() ? settings.threads : 1}
            min={1}
            max={Math.max(2, maxThreads())}
            disabled={!threadedEngine()}
            title={
              threadedEngine()
                ? undefined
                : 'Multi-threading needs a cross-origin isolated page. Reload the page or restart the dev server.'
            }
            onChange={(value) => changeSetting('threads', value)}
          />
          <RangeSetting
            label="Lines"
            value={settings.lines}
            min={1}
            max={MAX_LINES}
            onChange={(value) => changeSetting('lines', value)}
          />
        </EngineSettings>
      }
    >
      <SolutionRows
        label="Stockfish lines"
        solutions={state.lines}
        limit={settings.lines}
        emptyText={busy ? 'Searching…' : '—'}
        onPreview={onPreview}
        onPlay={onPlay}
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
