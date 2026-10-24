import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { isFairyFEN } from '@utils/fenParser';
import { trackPendingWrite } from '@/shared/utils/pendingWrites';
import { LATEX_MAX_POSITIONS } from '@chessviewer-org/chess-viewer';
import {
  type BuildResult,
  type LatexProject,
  type StudioPosition,
  type StudioSettings,
  addPositions,
  appendPositions,
  buildLatex,
  createDefaultProject,
  createPosition,
  importIncoming,
  loadProject,
  parseBulkInput,
  saveProject,
  usableFen,
  takeStagedPositions
} from '../utils/latexProject';

const SAVE_DELAY_MS = 300;

export interface LatexProjectActions {
  select: (id: string) => void;
  updatePosition: (id: string, patch: Partial<StudioPosition>) => void;
  updateSettings: (patch: Partial<StudioSettings>) => void;
  addFen: (fen: string) => void;
  addFromText: (text: string) => number;
  addFens: (fens: string[]) => number;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  move: (id: string, direction: -1 | 1) => void;
  reset: () => void;
  replaceProject: (next: LatexProject) => void;
  applyToAll: (patch: SharedFields) => void;
  undo: () => void;
}

export type SharedFields = Partial<
  Pick<
    StudioPosition,
    'author' | 'source' | 'award' | 'stipulation' | 'remark' | 'event' | 'date'
  >
>;

export interface LatexProjectState {
  project: LatexProject;
  build: BuildResult | null;
  invalidCount: number;
  isFull: boolean;
  canUndo: boolean;
  actions: LatexProjectActions;
}

export function useLatexProject(buildEnabled: boolean): LatexProjectState {
  const [storedProject, setProject] = useState<LatexProject>(loadProject);
  const project = useMemo<LatexProject>(
    () =>
      storedProject.settings.latexPackage !== 'diagram' &&
      storedProject.positions.some((position) => isFairyFEN(position.fen))
        ? {
            ...storedProject,
            settings: { ...storedProject.settings, latexPackage: 'diagram' }
          }
        : storedProject,
    [storedProject]
  );
  const [snapshot, setSnapshot] = useState<LatexProject | null>(null);
  const latest = useRef(project);
  const saved = useRef(project);
  latest.current = project;

  const flushSave = useCallback(() => {
    if (saved.current === latest.current) return;
    if (saveProject(latest.current)) saved.current = latest.current;
  }, []);

  const withSnapshot = useCallback(
    (change: (current: LatexProject) => LatexProject) => {
      const current = latest.current;
      const next = change(current);
      if (next === current) return;
      setSnapshot(current);
      setProject(next);
    },
    []
  );

  useEffect(() => {
    const incoming = takeStagedPositions();
    if (incoming.length) {
      setProject((current) => importIncoming(current, incoming));
    }
  }, []);

  useEffect(() => {
    if (saved.current === project) return;
    const timer = setTimeout(flushSave, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [project, flushSave]);

  useLayoutEffect(() => {
    const untrack = trackPendingWrite(flushSave);
    return () => {
      untrack();
      flushSave();
    };
  }, [flushSave]);

  const invalidCount = useMemo(
    () => project.positions.filter(({ fen }) => usableFen(fen) === null).length,
    [project.positions]
  );

  const buildInput = useMemo(
    () => ({ positions: project.positions, settings: project.settings }),
    [project.positions, project.settings]
  );
  const build = useMemo(
    () => (buildEnabled ? buildLatex(buildInput) : null),
    [buildEnabled, buildInput]
  );

  const select = useCallback((id: string) => {
    setProject((current) =>
      current.selectedId !== id && current.positions.some((p) => p.id === id)
        ? { ...current, selectedId: id }
        : current
    );
  }, []);

  const updatePosition = useCallback(
    (id: string, patch: Partial<StudioPosition>) => {
      setProject((current) => {
        const index = current.positions.findIndex((p) => p.id === id);
        const position = current.positions[index];
        if (
          !position ||
          !(Object.keys(patch) as (keyof StudioPosition)[]).some(
            (key) => key !== 'id' && patch[key] !== position[key]
          )
        )
          return current;
        const positions = [...current.positions];
        positions[index] = { ...position, ...patch, id: position.id };
        return { ...current, positions };
      });
    },
    []
  );

  const updateSettings = useCallback((patch: Partial<StudioSettings>) => {
    setProject((current) =>
      (Object.keys(patch) as (keyof StudioSettings)[]).some(
        (key) => patch[key] !== current.settings[key]
      )
        ? { ...current, settings: { ...current.settings, ...patch } }
        : current
    );
  }, []);

  const addFen = useCallback((fen: string) => {
    setProject((current) => addPositions(current, [createPosition(fen)]));
  }, []);

  const addFromText = useCallback((text: string) => {
    const parsed = parseBulkInput(text);
    if (parsed.length) {
      setProject((current) => appendPositions(current, parsed));
    }
    return parsed.length;
  }, []);

  const addFens = useCallback((fens: string[]) => {
    const parsed = fens.map((fen) => createPosition(fen));
    if (parsed.length) {
      setProject((current) => importIncoming(current, parsed));
    }
    return parsed.length;
  }, []);

  const duplicate = useCallback((id: string) => {
    setProject((current) => {
      const index = current.positions.findIndex((p) => p.id === id);
      const source = current.positions[index];
      if (!source || current.positions.length >= LATEX_MAX_POSITIONS) {
        return current;
      }
      const copy = createPosition(source.fen, { ...source });
      const positions = [...current.positions];
      positions.splice(index + 1, 0, copy);
      return { ...current, positions, selectedId: copy.id };
    });
  }, []);

  const remove = useCallback(
    (id: string) => {
      withSnapshot((current) => {
        const index = current.positions.findIndex((p) => p.id === id);
        if (index === -1) return current;
        const positions = current.positions.filter((p) => p.id !== id);
        if (!positions.length) {
          return { ...createDefaultProject(), settings: current.settings };
        }
        const selectedId =
          current.selectedId === id
            ? positions[Math.min(index, positions.length - 1)]!.id
            : current.selectedId;
        return { ...current, positions, selectedId };
      });
    },
    [withSnapshot]
  );

  const move = useCallback((id: string, direction: -1 | 1) => {
    setProject((current) => {
      const index = current.positions.findIndex((p) => p.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.positions.length) {
        return current;
      }
      const positions = [...current.positions];
      const [item] = positions.splice(index, 1);
      positions.splice(target, 0, item!);
      return { ...current, positions };
    });
  }, []);

  const reset = useCallback(
    () => withSnapshot(() => createDefaultProject()),
    [withSnapshot]
  );

  const replaceProject = useCallback(
    (next: LatexProject) => withSnapshot(() => next),
    [withSnapshot]
  );

  const applyToAll = useCallback((patch: SharedFields) => {
    const keys = Object.keys(patch) as (keyof SharedFields)[];
    setProject((current) => {
      let changed = false;
      const positions = current.positions.map((position) => {
        if (!keys.some((key) => patch[key] !== position[key])) return position;
        changed = true;
        return { ...position, ...patch };
      });
      return changed ? { ...current, positions } : current;
    });
  }, []);

  const undo = useCallback(() => {
    if (!snapshot) return;
    setProject(snapshot);
    setSnapshot(null);
  }, [snapshot]);

  const actions = useMemo(
    () => ({
      select,
      updatePosition,
      updateSettings,
      addFen,
      addFromText,
      addFens,
      duplicate,
      remove,
      move,
      reset,
      replaceProject,
      applyToAll,
      undo
    }),
    [
      select,
      updatePosition,
      updateSettings,
      addFen,
      addFromText,
      addFens,
      duplicate,
      remove,
      move,
      reset,
      replaceProject,
      applyToAll,
      undo
    ]
  );

  return {
    project,
    build,
    invalidCount,
    isFull: project.positions.length >= LATEX_MAX_POSITIONS,
    canUndo: snapshot !== null,
    actions
  };
}
