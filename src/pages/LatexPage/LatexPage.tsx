import { useCallback, useId, useState } from 'react';

import { getRouteSeo } from '@constants';
import { useCopyToClipboard } from '@/shared/hooks/useDOM';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { NotificationContainer } from '@/shared/ui/NotificationContainer';
import { Seo } from '@/shared/ui/Seo';
import { isFairyFEN } from '@utils/fenParser';
import { STARTING_FEN } from '@chessviewer-org/chess-viewer';
import { saveBlob } from '@/shared/utils/saveBlob';
import { DiagramEditor } from './components/DiagramEditor';
import { DiagramNavigator } from './components/DiagramNavigator';
import { ExportCard } from './components/ExportCard';
import { PreviewPanel } from './components/PreviewPanel';
import { ProjectBar } from './components/ProjectBar';
import { SettingsPanel } from './components/SettingsPanel';
import { useLatexProject } from './hooks/useLatexProject';
import {
  PROJECT_FILE_MAX_BYTES,
  parseProjectFile,
  serializeProject
} from './utils/projectFile';

const DEFAULT_FILE_NAME = 'chess-diagrams';
const PROJECT_FILE_NAME = 'latex-studio-project';

type Tab = 'diagrams' | 'document' | 'export';

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'diagrams', label: 'Diagrams' },
  { id: 'document', label: 'Document' },
  { id: 'export', label: 'Export' }
];

const LatexPage = () => {
  const [tab, setTab] = useState<Tab>('diagrams');
  const { project, build, invalidCount, isFull, canUndo, actions } =
    useLatexProject(tab === 'export');
  const { notifications, success, error, removeNotification } =
    useNotifications();
  const [copied, copy] = useCopyToClipboard();
  const [editing, setEditing] = useState(false);
  const [fileName, setFileName] = useState(DEFAULT_FILE_NAME);
  const tabsId = useId();

  const notify = useCallback(
    (message: string, type: 'success' | 'error' = 'success') =>
      type === 'error' ? error(message) : success(message),
    [error, success]
  );

  const openDiagram = useCallback(
    (id: string) => {
      actions.select(id);
      setEditing(true);
    },
    [actions]
  );

  const addDiagram = useCallback(() => {
    actions.addFen(STARTING_FEN);
    setEditing(true);
  }, [actions]);

  const handleCopy = useCallback(() => {
    if (!build?.code) return;
    copy(build.code);
    success('LaTeX copied to clipboard');
  }, [build?.code, copy, success]);

  const handleDownload = useCallback(() => {
    if (!build?.code) return;
    saveBlob(
      new Blob([build.code], { type: 'application/x-tex;charset=utf-8' }),
      fileName.trim() || DEFAULT_FILE_NAME,
      'tex'
    );
    success('LaTeX file downloaded');
  }, [build?.code, fileName, success]);

  const handleSave = useCallback(() => {
    saveBlob(
      new Blob([serializeProject(project)], { type: 'application/json' }),
      PROJECT_FILE_NAME,
      'json'
    );
    success('Project saved to a file');
  }, [project, success]);

  const handleOpen = useCallback(
    async (file: File) => {
      if (file.size > PROJECT_FILE_MAX_BYTES) {
        error('That file is too large to be a LaTeX Studio project.');
        return;
      }
      const imported = await file
        .text()
        .then(parseProjectFile)
        .catch(() => null);
      if (!imported) {
        error('That file is not a LaTeX Studio project.');
        return;
      }
      actions.replaceProject(imported);
      setTab('diagrams');
      setEditing(false);
      success(
        `Loaded ${imported.positions.length} diagram${
          imported.positions.length === 1 ? '' : 's'
        }`
      );
    },
    [actions, error, success]
  );

  const handleReset = useCallback(() => {
    actions.reset();
    setEditing(false);
    success('Started a new project. Undo brings it back.');
  }, [actions, success]);

  const index = Math.max(
    0,
    project.positions.findIndex((p) => p.id === project.selectedId)
  );
  const selected = project.positions[index];

  return (
    <div className="flex-1 bg-bg">
      <Seo {...getRouteSeo('/latex')} />
      <div className="page-container flex flex-col gap-5 py-6 sm:py-8">
        <ProjectBar
          canUndo={canUndo}
          onUndo={actions.undo}
          onSave={handleSave}
          onOpen={(file) => void handleOpen(file)}
          onReset={handleReset}
        />

        <div
          role="tablist"
          aria-label="Studio sections"
          className="hide-scrollbar flex gap-1 overflow-x-auto border-b border-border"
        >
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                id={`${tabsId}-${id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${tabsId}-${id}-panel`}
                onClick={() => setTab(id)}
                className={`relative -mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  active
                    ? 'border-accent text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {label}
                {id === 'diagrams' && (
                  <span className="rounded-full bg-surface-elevated px-2 py-0.5 font-mono text-[11px] text-text-secondary">
                    {project.positions.length}
                  </span>
                )}
                {id === 'export' && invalidCount > 0 && (
                  <span
                    className="size-2 rounded-full bg-warning"
                    aria-label={`${invalidCount} left out`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${tabsId}-${tab}-panel`}
          aria-labelledby={`${tabsId}-${tab}`}
          className="min-w-0"
        >
          {tab === 'diagrams' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
              <DiagramNavigator
                project={project}
                isFull={isFull}
                actions={actions}
                onOpen={openDiagram}
                onAdd={addDiagram}
                onNotify={notify}
                className={`lg:sticky lg:top-[calc(var(--navbar-height)+1rem)] lg:self-start ${editing ? 'max-lg:hidden' : ''}`}
              />
              {selected && (
                <DiagramEditor
                  position={selected}
                  index={index}
                  total={project.positions.length}
                  previousId={project.positions[index - 1]?.id ?? null}
                  nextId={project.positions[index + 1]?.id ?? null}
                  settings={project.settings}
                  actions={actions}
                  onNotify={notify}
                  onBack={() => setEditing(false)}
                  className={editing ? '' : 'max-lg:hidden'}
                />
              )}
            </div>
          )}

          {tab === 'document' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <SettingsPanel
                fairyPosition={project.positions.some((position) =>
                  isFairyFEN(position.fen)
                )}
                settings={project.settings}
                onChange={actions.updateSettings}
              />
            </div>
          )}

          {tab === 'export' && build && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
              <ExportCard
                build={build}
                total={project.positions.length}
                settings={project.settings}
                fileName={fileName}
                onFileNameChange={setFileName}
                copied={copied}
                onCopy={handleCopy}
                onDownload={handleDownload}
              />
              <PreviewPanel
                build={build}
                positions={project.positions}
                settings={project.settings}
              />
            </div>
          )}
        </div>
      </div>
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default LatexPage;
