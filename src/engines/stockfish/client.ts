import type { AnalysisStatus, SolutionLine } from '../core/types';
import { buildSearchInput, gameEndMessage, type SearchInput } from './input';
import { parseInfo, scoreText, searchLine } from './output';
import { modelById, threadedEngine, type AnalysisSettings } from './settings';

export interface AnalysisState {
  status: AnalysisStatus;
  lines: SolutionLine[];
  score: string;
  depth: number;
  download: number;
  message: string;
  elapsedMs: number;
}

export const EMPTY_ANALYSIS: AnalysisState = {
  status: 'idle',
  lines: [],
  score: '',
  depth: 0,
  download: 0,
  message: '',
  elapsedMs: 0
};

interface Search {
  input: SearchInput;
  settings: AnalysisSettings;
  fullmove: number;
  lines: Map<number, SolutionLine>;
}

const LOAD_TIMEOUT_MS = 30_000;
const GRACE_MS = 5_000;
const FLUSH_MS = 100;
const DOWNLOAD_STEP = 0.01;

export class StockfishClient {
  private worker: Worker | null = null;
  private model = '';
  private progressPort: MessagePort | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private flushTimer: ReturnType<typeof setTimeout> | undefined;
  private startedAt = 0;
  private state = EMPTY_ANALYSIS;
  private pending: Search | null = null;
  private active: Search | null = null;
  private awaiting = 0;
  private hash = 0;
  private threads = 0;
  private multiPv = 0;
  private readonly update: (state: AnalysisState) => void;
  private readonly createWorker: (file: string) => Worker;

  constructor(
    update: (state: AnalysisState) => void,
    createWorker: (file: string) => Worker = (file) =>
      new Worker(`/wasm/stockfish/${file}`, { name: 'stockfish' })
  ) {
    this.update = update;
    this.createWorker = createWorker;
  }

  private publish(patch: Partial<AnalysisState>) {
    clearTimeout(this.flushTimer);
    this.flushTimer = undefined;
    this.state = {
      ...this.state,
      ...patch,
      elapsedMs: this.startedAt ? performance.now() - this.startedAt : 0
    };
    this.update(this.state);
  }

  private send(command: string) {
    this.worker?.postMessage(command);
  }

  private reset() {
    clearTimeout(this.timer);
    clearTimeout(this.flushTimer);
    this.flushTimer = undefined;
    this.pending = null;
    this.active = null;
  }

  halt() {
    if (this.active) this.send('stop');
    this.reset();
  }

  stop() {
    this.halt();
    this.publish({
      status: 'stopped',
      message: 'Stopped. The search is incomplete.'
    });
  }

  destroy() {
    this.progressPort?.close();
    this.progressPort = null;
    this.reset();
    this.worker?.terminate();
    this.worker = null;
    this.model = '';
    this.awaiting = 0;
  }

  private armLoadTimer() {
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () =>
        this.fail(
          'Stockfish could not load. Check your connection and try again.'
        ),
      LOAD_TIMEOUT_MS
    );
  }

  private fail(message: string) {
    this.destroy();
    this.publish({ status: 'error', message });
  }

  private connect(file: string) {
    const worker = this.createWorker(file);
    this.worker = worker;
    this.model = file;
    this.hash = 0;
    this.threads = 0;
    this.multiPv = 0;
    this.awaiting = 1;
    worker.onerror = (event) => {
      if (this.worker !== worker) return;
      event.preventDefault();
      this.fail('Stockfish could not run. Reload the engine and try again.');
    };
    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (this.worker === worker && typeof event.data === 'string')
        this.receive(event.data);
    };
    this.watchDownload(worker);
    this.send('uci');
  }

  private watchDownload(worker: Worker) {
    this.progressPort?.close();
    const channel = new MessageChannel();
    this.progressPort = channel.port1;
    channel.port1.onmessage = (event: MessageEvent<{ percent?: number }>) => {
      const percent = event.data?.percent;
      if (this.worker !== worker || typeof percent !== 'number') return;
      const download = Math.min(1, Math.max(0, percent));
      if (this.pending) this.armLoadTimer();
      if (download - this.state.download >= DOWNLOAD_STEP || download === 1)
        this.publish({ download });
    };
    worker.postMessage('setoption name CanOutputEngineDownloadProgress');
    worker.postMessage({ progressPort: channel.port2 }, [channel.port2]);
  }

  private configure(search: Search) {
    const { memoryMb, lines } = search.settings;
    const multiPv = Math.min(lines, search.input.moves.length);
    if (memoryMb !== this.hash) {
      this.send(`setoption name Hash value ${memoryMb}`);
      this.hash = memoryMb;
    }
    if (threadedEngine() && search.settings.threads !== this.threads) {
      this.send(`setoption name Threads value ${search.settings.threads}`);
      this.threads = search.settings.threads;
    }
    if (multiPv !== this.multiPv) {
      this.send(`setoption name MultiPV value ${multiPv}`);
      this.multiPv = multiPv;
    }
    this.awaiting++;
    this.send('isready');
  }

  private receive(text: string) {
    if (text === 'uciok') {
      if (this.pending) this.configure(this.pending);
      this.awaiting--;
    } else if (text === 'readyok') {
      this.awaiting--;
      if (!this.awaiting && this.pending) this.run(this.pending);
    } else if (this.awaiting || !this.active) {
      return;
    } else if (text.startsWith('bestmove')) {
      this.reset();
      this.publish({ status: 'complete' });
    } else {
      this.collect(text);
    }
  }

  private run(search: Search) {
    clearTimeout(this.timer);
    this.pending = null;
    this.active = search;
    this.startedAt = performance.now();
    this.publish({ status: 'running' });
    this.timer = setTimeout(
      () => this.stop(),
      search.settings.seconds * 1000 + GRACE_MS
    );
    this.send(`position fen ${search.input.fen}`);
    this.send(`go movetime ${search.settings.seconds * 1000}`);
  }

  private collect(text: string) {
    const search = this.active;
    const info = parseInfo(text);
    if (!search || !info) return;
    search.lines.set(
      info.multipv,
      searchLine(search.input.position, search.fullmove, info)
    );
    this.state = {
      ...this.state,
      lines: [...search.lines.values()].sort((a, b) => a.id - b.id),
      depth: info.depth,
      ...(info.multipv === 1 && {
        score: scoreText(info, search.input.position.turn)
      })
    };
    this.flushTimer ??= setTimeout(() => this.publish({}), FLUSH_MS);
  }

  start(source: string, settings: AnalysisSettings, hypothetical = false) {
    this.halt();
    this.startedAt = 0;
    this.state = EMPTY_ANALYSIS;
    const input = buildSearchInput(source, hypothetical);
    const ended = gameEndMessage(input);
    if (ended) {
      this.publish({ status: 'complete', message: ended });
      return;
    }
    this.publish({ status: 'loading' });
    const search: Search = {
      input,
      settings,
      fullmove: Number(input.fen.split(' ')[5]) || 1,
      lines: new Map()
    };
    const model = modelById(settings.model);
    const file = threadedEngine() ? model.threadedFile : model.file;
    try {
      if (this.worker && this.model !== file) this.destroy();
      this.pending = search;
      this.armLoadTimer();
      if (!this.worker) this.connect(file);
      else this.configure(search);
    } catch {
      this.fail('Your browser could not start the analysis worker.');
    }
  }
}
