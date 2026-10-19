import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { LATEX_MAX_POSITIONS } from '@utils';
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
  Pick<StudioPosition, 'author' | 'source' | 'award' | 'stipulation' | 'remark'>
>;

export interface LatexProjectState {
  project: LatexProject;
  build: BuildResult;
  isFull: boolean;
  canUndo: boolean;
  actions: LatexProjectActions;
}

export function useLatexProject(): LatexProjectState {
  const [project, setProject] = useState<LatexProject>(loadProject);
  const [snapshot, setSnapshot] = useState<LatexProject | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(project);
  latest.current = project;

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
    saveTimer.current = setTimeout(() => saveProject(project), SAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [project]);

  useEffect(() => () => saveProject(latest.current), []);

  const deferred = useDeferredValue(project);
  const build = useMemo(() => buildLatex(deferred), [deferred]);

  const select = useCallback((id: string) => {
    setProject((current) =>
      current.positions.some((p) => p.id === id)
        ? { ...current, selectedId: id }
        : current
    );
  }, []);

  const updatePosition = useCallback(
    (id: string, patch: Partial<StudioPosition>) => {
      setProject((current) => ({
        ...current,
        positions: current.positions.map((p) =>
          p.id === id ? { ...p, ...patch, id: p.id } : p
        )
      }));
    },
    []
  );

  const updateSettings = useCallback((patch: Partial<StudioSettings>) => {
    setProject((current) => ({
      ...current,
      settings: { ...current.settings, ...patch }
    }));
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
    setProject((current) => ({
      ...current,
      positions: current.positions.map((p) => ({ ...p, ...patch }))
    }));
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
    isFull: project.positions.length >= LATEX_MAX_POSITIONS,
    canUndo: snapshot !== null,
    actions
  };
}
