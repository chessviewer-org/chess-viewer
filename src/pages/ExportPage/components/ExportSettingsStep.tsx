import { useId } from 'react';

import {
  Archive,
  Check,
  Download,
  FileImage,
  Folder,
  type LucideIcon
} from '@/assets/icons';
import {
  DEFAULT_EXPORT_FILE_NAME,
  DEFAULT_EXPORT_FOLDER_NAME,
  FORMAT_EXTENSIONS
} from '@/shared/utils/exportJobs';
import { FORBIDDEN_NAME_CHARS } from '@/shared/utils/safeFileName';

import type {
  BoardSizePreset,
  ExportFormat,
  ExportResolution,
  useExportWizard
} from '../hooks/useExportWizard';

// Constants
const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' }
];

const RESOLUTIONS: ExportResolution[] = [1, 2, 3, 4];
const BOARD_PRESETS: BoardSizePreset[] = [4, 6, 8];
const MAX_INPUT_LENGTH = 240;

// Helpers
const BlockedCharsNotice = () => (
  <p role="status" className="text-xs text-warning">
    {`${FORBIDDEN_NAME_CHARS} can't be used in file or folder names.`}
  </p>
);

const OutputRow = ({
  icon: Icon,
  name
}: {
  icon: LucideIcon;
  name: string;
}) => (
  <span className="flex min-w-0 items-center gap-2">
    <Icon className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
    <span className="truncate" title={name}>
      {name}
    </span>
  </span>
);

// Types
export interface ExportSettingsStepProps {
  wizard: ReturnType<typeof useExportWizard>;
  onExport: (asZip: boolean) => void;
}

export default function ExportSettingsStep({
  wizard,
  onExport
}: ExportSettingsStepProps) {
  const id = useId();
  const formatList = wizard.selectedFormats
    .map((format) => format.toUpperCase())
    .join(', ');
  const outputFiles = wizard.selectedFormats.map(
    (format) =>
      `${wizard.resolvedFileNames[format]}.${FORMAT_EXTENSIONS[format] ?? format}`
  );
  const showZip = wizard.multipleFormats || wizard.folderEnabled;
  const zipName = `${wizard.folderEnabled ? wizard.resolvedFolderName : DEFAULT_EXPORT_FOLDER_NAME}.zip`;
  const downloadLabel = wizard.folderEnabled
    ? 'Download folder'
    : wizard.multipleFormats
      ? `Download ${outputFiles.length} files`
      : 'Download';

  const inputCls =
    'rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm ' +
    'text-text-primary focus:outline-none transition-colors';

  const presetBtn = (active: boolean) =>
    `flex-1 flex justify-center items-center rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none ${
      active
        ? 'bg-accent/10 text-text-primary'
        : 'bg-surface text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
    }`;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 @3xl:p-5 gap-6">
      <div className="flex flex-col gap-6">
        <div className="space-y-2.5">
          <h3 className="section-eyebrow">Format</h3>
          <div className="flex w-full rounded-lg border border-border/60 overflow-hidden">
            {FORMATS.map((fmt, idx) => {
              const active = wizard.selectedFormats.includes(fmt.value);
              return (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => wizard.toggleFormat(fmt.value)}
                  className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-semibold transition-colors focus:outline-none ${
                    idx !== FORMATS.length - 1
                      ? 'border-r border-border/60'
                      : ''
                  } ${
                    active
                      ? 'bg-accent/10 text-text-primary'
                      : 'text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      active
                        ? 'border-accent bg-accent text-bg'
                        : 'border-border'
                    }`}
                  >
                    {active && <Check className="w-2.5 h-2.5" />}
                  </span>
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="section-eyebrow">Quality</h3>
          <div className="flex w-full gap-2">
            {RESOLUTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => wizard.setResolutionValue(r)}
                className={presetBtn(wizard.resolution === r)}
              >
                {r}×
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="section-eyebrow">Board Size</h3>
          <div className="flex w-full items-center gap-2">
            {BOARD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => wizard.selectBoardSizePreset(preset)}
                className={presetBtn(wizard.boardSizePreset === preset)}
              >
                {preset} cm
              </button>
            ))}
            <div className="h-5 w-px bg-border/60 shrink-0" />
            <input
              type="number"
              inputMode="decimal"
              min={4}
              max={8}
              step={0.5}
              value={wizard.customBoardSizeInput}
              onFocus={() => wizard.selectBoardSizePreset('custom')}
              onChange={(e) => wizard.updateCustomBoardSize(e.target.value)}
              placeholder="cm"
              aria-label="Custom board size in centimetres (4 to 8)"
              aria-invalid={wizard.customBoardSizeError ? true : undefined}
              className={`flex-1 min-w-0 text-center rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none ${
                wizard.boardSizePreset === 'custom'
                  ? 'bg-accent/10 text-text-primary'
                  : 'bg-surface text-text-secondary hover:bg-surface-elevated focus:bg-surface-elevated'
              }`}
            />
          </div>
          {wizard.customBoardSizeError && (
            <p className="text-xs text-error">{wizard.customBoardSizeError}</p>
          )}
        </div>

        <div className="space-y-2.5">
          <label htmlFor={`${id}-file`} className="section-eyebrow block">
            File Name
          </label>
          <input
            id={`${id}-file`}
            value={wizard.fileNamesInput}
            onChange={(e) => wizard.updateFileNames(e.target.value)}
            placeholder={
              wizard.multipleFormats
                ? `e.g. ${wizard.selectedFormats.map((_, i) => `diagram-${i + 1}`).join(', ')}`
                : DEFAULT_EXPORT_FILE_NAME
            }
            maxLength={MAX_INPUT_LENGTH}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={wizard.fileNameError ? true : undefined}
            aria-describedby={`${id}-file-hint`}
            className={`w-full ${inputCls}`}
          />
          <p id={`${id}-file-hint`} className="text-xs text-text-secondary">
            {wizard.multipleFormats
              ? `One name per format, separated by commas, in the order ${formatList}.`
              : 'Leave empty to use the default name.'}
          </p>
          {wizard.fileNameError && (
            <p className="text-xs text-error">{wizard.fileNameError}</p>
          )}
          {wizard.blockedCharsIn === 'file' && <BlockedCharsNotice />}
        </div>

        <div className="space-y-2.5">
          <label htmlFor={`${id}-folder`} className="section-eyebrow block">
            Folder Name
          </label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={wizard.folderEnabled}
              onChange={(e) => wizard.setFolderEnabled(e.target.checked)}
              aria-label="Save the files into a folder"
              className="h-4.5 w-4.5 shrink-0 cursor-pointer accent-accent"
            />
            <input
              id={`${id}-folder`}
              value={wizard.folderNameInput}
              onChange={(e) => wizard.updateFolderName(e.target.value)}
              disabled={!wizard.folderEnabled}
              placeholder={DEFAULT_EXPORT_FOLDER_NAME}
              maxLength={MAX_INPUT_LENGTH}
              spellCheck={false}
              autoComplete="off"
              aria-describedby={`${id}-folder-hint`}
              className={`min-w-0 flex-1 ${inputCls} disabled:cursor-not-allowed disabled:opacity-50`}
            />
          </div>
          <p id={`${id}-folder-hint`} className="text-xs text-text-secondary">
            {wizard.folderEnabled
              ? 'Chrome and Edge ask where to create the folder. Other browsers save it as a ZIP archive.'
              : 'Optional. Until it is enabled, each format downloads as a separate file.'}
          </p>
          {wizard.blockedCharsIn === 'folder' && <BlockedCharsNotice />}
        </div>

        <div className="space-y-2.5">
          <h3 className="section-eyebrow">Output</h3>
          <div className="rounded-lg border border-border/60 bg-surface-elevated/40 p-3.5 font-mono text-sm text-text-primary">
            {wizard.folderEnabled && (
              <OutputRow icon={Folder} name={`${wizard.resolvedFolderName}/`} />
            )}
            <ul
              className={`space-y-1.5 ${wizard.folderEnabled ? 'mt-1.5 ml-2 border-l border-border/60 pl-3' : ''}`}
            >
              {outputFiles.map((file) => (
                <li key={file}>
                  <OutputRow icon={FileImage} name={file} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onExport(false)}
            className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-bold text-bg transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 flex items-center justify-center gap-2"
          >
            <Download
              className="h-4.5 w-4.5"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            {downloadLabel}
          </button>
          {showZip && (
            <button
              type="button"
              onClick={() => onExport(true)}
              title={`Download ${zipName}`}
              aria-label={`Download as ZIP archive ${zipName}`}
              className="rounded-lg border border-accent/50 px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 flex items-center justify-center gap-2"
            >
              <Archive
                className="h-4.5 w-4.5"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              ZIP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
