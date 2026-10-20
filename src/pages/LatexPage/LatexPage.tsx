import { useCallback, useState } from 'react';

import { getRouteSeo } from '@constants';
import { useCopyToClipboard, useNotifications } from '@hooks';
import { NotificationContainer, Seo } from '@ui';
import { saveBlob } from '@utils';
import { DiagramList } from './components/DiagramList';
import { OutputPanel } from './components/OutputPanel';
import { ProjectBar } from './components/ProjectBar';
import { SettingsPanel } from './components/SettingsPanel';
import { useLatexProject } from './hooks/useLatexProject';
import { segmentButton } from './utils/controlStyles';
import {
  PROJECT_FILE_MAX_BYTES,
  parseProjectFile,
  serializeProject
} from './utils/projectFile';

const DEFAULT_FILE_NAME = 'chess-diagrams';
const PROJECT_FILE_NAME = 'latex-studio-project';

type Pane = 'edit' | 'output';

const PANES: ReadonlyArray<{ id: Pane; label: string }> = [
  { id: 'edit', label: 'Edit' },
  { id: 'output', label: 'Output' }
];

const LatexPage = () => {
  const { project, build, isFull, canUndo, actions } = useLatexProject();
  const { notifications, success, error, removeNotification } =
    useNotifications();
  const [copied, copy] = useCopyToClipboard();
  const [pane, setPane] = useState<Pane>('edit');
  const [fileName, setFileName] = useState(DEFAULT_FILE_NAME);

  const editHidden = pane === 'edit' ? '' : 'max-lg:hidden';

  const notify = useCallback(
    (message: string, type: 'success' | 'error' = 'success') =>
      type === 'error' ? error(message) : success(message),
    [error, success]
  );

  const handleCopy = useCallback(() => {
    if (!build.code) return;
    copy(build.code);
    success('LaTeX copied to clipboard');
  }, [build.code, copy, success]);

  const handleDownload = useCallback(() => {
    if (!build.code) return;
    saveBlob(
      new Blob([build.code], { type: 'application/x-tex;charset=utf-8' }),
      fileName.trim() || DEFAULT_FILE_NAME,
      'tex'
    );
    success('LaTeX file downloaded');
  }, [build.code, fileName, success]);

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
      setPane('edit');
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
    success('Started a new project. Undo brings it back.');
  }, [actions, success]);

  return (
    <div className="flex-1 bg-bg">
      <Seo {...getRouteSeo('/latex')} />
      <div className="page-container flex flex-col gap-6 py-6 sm:py-8">
        <ProjectBar
          canUndo={canUndo}
          onUndo={actions.undo}
          onSave={handleSave}
          onOpen={(file) => void handleOpen(file)}
          onReset={handleReset}
        />

        <div
          role="group"
          aria-label="Studio view"
          className="flex overflow-hidden rounded-lg border border-border/60 lg:hidden"
        >
          {PANES.map(({ id, label }, index) => (
            <button
              key={id}
              type="button"
              aria-pressed={pane === id}
              onClick={() => setPane(id)}
              className={`${segmentButton(pane === id)} min-h-11 ${
                index < PANES.length - 1 ? 'border-r border-border/60' : ''
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DiagramList
            project={project}
            isFull={isFull}
            actions={actions}
            onNotify={notify}
            className={editHidden}
          />
          <OutputPanel
            build={build}
            positions={project.positions}
            settings={project.settings}
            fileName={fileName}
            onFileNameChange={setFileName}
            copied={copied}
            onCopy={handleCopy}
            onDownload={handleDownload}
            className={pane === 'output' ? '' : 'max-lg:hidden'}
          />
          <SettingsPanel
            settings={project.settings}
            onChange={actions.updateSettings}
            className={editHidden}
          />
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
