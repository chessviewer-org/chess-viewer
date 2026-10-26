import type { AnalysisStatus } from '../core/types';
import {
  analysisProblemError,
  decodePreviewMove,
  type PopeyeMove
} from './output';
import type { AnalysisSettings } from './settings';

export interface AnalysisState {
  status: AnalysisStatus;
  output: string;
  message: string;
  elapsedMs: number;
  moves: PopeyeMove[];
}
export const EMPTY_ANALYSIS: AnalysisState = {
  status: 'idle',
  output: '',
  message: '',
  elapsedMs: 0,
  moves: []
};

const MAX_OUTPUT = 512 * 1024;
const LOAD_TIMEOUT_MS = 30_000;

export class PopeyeClient {
  private worker: Worker | null = null;
  private spare: { worker: Worker; ready: boolean } | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private startedAt = 0;
  private state = EMPTY_ANALYSIS;
  private readonly update: (state: AnalysisState) => void;
  private readonly createWorker: () => Worker;

  constructor(
    update: (state: AnalysisState) => void,
    createWorker: () => Worker = () =>
      new Worker('/wasm/popeye/worker.js', {
        type: 'module',
        name: 'popeye'
      })
  ) {
    this.update = update;
    this.createWorker = createWorker;
  }

  private publish(patch: Partial<AnalysisState>) {
    this.state = {
      ...this.state,
      ...patch,
      elapsedMs: this.startedAt ? performance.now() - this.startedAt : 0
    };
    this.update(this.state);
  }

  dispose() {
    clearTimeout(this.timer);
    this.worker?.terminate();
    this.worker = null;
  }

  warm() {
    if (this.spare) return;
    try {
      const worker = this.createWorker();
      const spare = { worker, ready: false };
      worker.onmessage = (event: MessageEvent<{ type?: string }>) => {
        if (event.data?.type === 'ready') spare.ready = true;
      };
      worker.onerror = () => {
        if (this.spare !== spare) return;
        worker.terminate();
        this.spare = null;
      };
      this.spare = spare;
    } catch {
      this.spare = null;
    }
  }

  destroy() {
    this.dispose();
    this.spare?.worker.terminate();
    this.spare = null;
  }

  stop(status: 'stopped' | 'timeout' = 'stopped') {
    this.dispose();
    this.publish({
      status,
      message:
        status === 'timeout'
          ? 'Time limit reached. The search is incomplete.'
          : 'Stopped. The search is incomplete.'
    });
  }

  start(
    input: string,
    settings: AnalysisSettings,
    previousMove?: { from: number; to: number }
  ) {
    this.dispose();
    this.startedAt = 0;
    this.state = { ...EMPTY_ANALYSIS, status: 'loading' };
    this.update(this.state);
    const fail = (message: string) => {
      this.dispose();
      this.publish({ status: 'error', message });
    };
    try {
      const spare = this.spare;
      this.spare = null;
      const worker = spare?.worker ?? this.createWorker();
      this.worker = worker;
      this.timer = setTimeout(
        () =>
          fail('Popeye could not load. Check your connection and try again.'),
        LOAD_TIMEOUT_MS
      );
      worker.onerror = (event) => {
        if (this.worker !== worker) return;
        event.preventDefault();
        fail('Popeye could not run. Reload the engine and try again.');
      };
      const handle = (event: MessageEvent<unknown>) => {
        if (
          this.worker !== worker ||
          !event.data ||
          typeof event.data !== 'object'
        )
          return;
        const data = event.data as {
          type?: string;
          text?: string;
          moves?: unknown[];
        };
        if (data.type === 'ready') {
          clearTimeout(this.timer);
          this.startedAt = performance.now();
          this.publish({ status: 'running' });
          this.timer = setTimeout(
            () => this.stop('timeout'),
            settings.seconds * 1000
          );
          worker.postMessage({
            input,
            memoryMb: settings.memoryMb,
            previousMove
          });
        } else if (data.type === 'output' && typeof data.text === 'string') {
          if (this.state.output.length + data.text.length > MAX_OUTPUT) {
            this.stop();
            this.publish({
              message:
                'Output limit reached. Narrow the problem and run it again.'
            });
          } else {
            const decoded = Array.isArray(data.moves)
              ? data.moves.map(decodePreviewMove)
              : [];
            if (decoded.some((move) => move === null)) {
              fail(
                'Popeye returned an unreadable move. Run the analysis again.'
              );
              return;
            }
            const moves = decoded as PopeyeMove[];
            this.publish({
              output: this.state.output + data.text,
              moves: [...this.state.moves, ...moves]
            });
          }
        } else if (data.type === 'done') {
          this.dispose();
          const problem = analysisProblemError(this.state.output);
          this.publish(
            problem
              ? { status: 'error', message: problem }
              : { status: 'complete' }
          );
        } else if (data.type === 'error')
          fail(data.text || 'Popeye could not run this problem.');
      };
      worker.onmessage = handle;
      if (spare?.ready) handle({ data: { type: 'ready' } } as MessageEvent);
    } catch {
      fail('Your browser could not start the analysis worker.');
    }
  }
}
