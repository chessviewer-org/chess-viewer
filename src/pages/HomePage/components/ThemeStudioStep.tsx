import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';

import AddThemePanel from './AddThemePanel';
import type { ThemeCard } from './ExportStudio.types';

/** Props for wizard step 1 — theme selection and custom theme management. */
export interface ThemeStudioStepProps {
  themeTab: 'main' | 'custom';
  setThemeTab: (tab: 'main' | 'custom') => void;
  isEditMode: boolean;
  beginEditMode: () => void;
  cancelEditMode: () => void;
  saveEditMode: () => void;
  isAddingTheme: boolean;
  setIsAddingTheme: (open: boolean) => void;
  paginatedThemes: ThemeCard[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  canAddTheme: boolean;
  onThemeSelect: (theme: ThemeCard) => void;
  selectedLight: string;
  selectedDark: string;
  onRenameDraft: (id: number, name: string) => void;
  onDeleteDraft: (id: number) => void;
  onDragStart: (id: number | null) => void;
  onDragEnd: () => void;
  onDropTheme: (targetId: number) => void;
  onSaveNewTheme: (name: string, light: string, dark: string) => void;
}

/** Wizard step 1: paginated colour-theme picker with drag-reorder and add/delete in edit mode. */
export default function ThemeStudioStep({
  themeTab,
  setThemeTab,
  isEditMode,
  beginEditMode,
  cancelEditMode,
  saveEditMode,
  isAddingTheme,
  setIsAddingTheme,
  paginatedThemes,
  currentPage,
  setCurrentPage,
  totalPages,
  canAddTheme,
  onThemeSelect,
  selectedLight,
  selectedDark,
  onRenameDraft,
  onDeleteDraft,
  onDragStart,
  onDragEnd,
  onDropTheme,
  onSaveNewTheme
}: ThemeStudioStepProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  return (
    <div className="h-full p-4 sm:p-6 lg:p-8 flex flex-col gap-5 overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
            Theme Studio
          </h2>

          {!isEditMode ? (
            <button
              type="button"
              onClick={beginEditMode}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border/60 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            >
              Edit Mode
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEditMode}
                className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border/60 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditMode}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent text-bg hover:bg-accent-hover transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 rounded-lg bg-surface-elevated border border-border/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setThemeTab('main')}
            className={`w-full px-4 py-2 text-xs font-semibold rounded-md border transition-colors ${
              themeTab === 'main'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Main
          </button>
          <button
            type="button"
            onClick={() => setThemeTab('custom')}
            className={`w-full px-4 py-2 text-xs font-semibold rounded-md border transition-colors ${
              themeTab === 'custom'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto pr-2"
        onTouchStart={(event) => {
          if (totalPages > 1) {
            setTouchStartX(event.touches[0]?.clientX ?? null);
          }
        }}
        onTouchEnd={(event) => {
          if (touchStartX === null || totalPages <= 1) return;
          const touchEndX = event.changedTouches[0]?.clientX;
          if (typeof touchEndX !== 'number') return;

          const delta = touchEndX - touchStartX;
          if (Math.abs(delta) < 40) return;
          if (delta < 0 && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
          } else if (delta > 0 && currentPage > 0) {
            setCurrentPage(currentPage - 1);
          }
          setTouchStartX(null);
        }}
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-6">
          {paginatedThemes.map((theme) => {
            const isSelected =
              selectedLight === theme.light && selectedDark === theme.dark;
            const isEditable =
              isEditMode && !theme.isSystem && typeof theme.rawId === 'number';

            return (
              <div
                key={theme.id}
                className="flex flex-col items-center gap-2 relative"
                draggable={isEditable}
                onDragStart={(event) => {
                  if (!isEditable || typeof theme.rawId !== 'number') return;
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(theme.rawId));
                  onDragStart(theme.rawId);
                }}
                onDragOver={(event) => {
                  if (!isEditable) return;
                  event.preventDefault();
                }}
                onDrop={() => {
                  if (!isEditable || typeof theme.rawId !== 'number') return;
                  onDropTheme(theme.rawId);
                }}
                onDragEnd={onDragEnd}
              >
                {isEditable && (
                  <span className="absolute -top-2 -left-1 text-text-muted">
                    <GripVertical className="w-3.5 h-3.5" />
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onThemeSelect(theme)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 transition-[border-color,box-shadow] duration-200 ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent/20'
                      : 'border-border/60 hover:border-text-muted'
                  }`}
                >
                  <div
                    className="h-1/2 w-full"
                    style={{ backgroundColor: theme.light }}
                  />
                  <div
                    className="h-1/2 w-full"
                    style={{ backgroundColor: theme.dark }}
                  />
                </button>

                {isEditable ? (
                  <input
                    value={theme.name}
                    onChange={(event) => {
                      if (typeof theme.rawId === 'number') {
                        onRenameDraft(theme.rawId, event.target.value);
                      }
                    }}
                    className="w-full text-[10px] text-center rounded-md border border-border/50 bg-surface-elevated px-1 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                ) : (
                  <span className="w-full text-[10px] text-center uppercase tracking-wide text-text-muted truncate px-1 py-1">
                    {theme.name}
                  </span>
                )}

                {isEditable && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof theme.rawId === 'number') {
                        onDeleteDraft(theme.rawId);
                      }
                    }}
                    className="absolute -top-2 -right-1 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                    aria-label={`Delete ${theme.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {canAddTheme && (
            <button
              type="button"
              onClick={() => setIsAddingTheme(true)}
              className="flex flex-col items-center gap-2 group"
            >
              <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-border text-text-muted group-hover:text-accent group-hover:border-accent transition-colors flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </span>
              <span className="text-[10px] uppercase tracking-wide text-text-muted group-hover:text-accent transition-colors">
                Add
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="min-h-4 flex justify-center gap-2">
        {totalPages > 1 &&
          Array.from({ length: totalPages }).map((_, pageIndex) => (
            <button
              // eslint-disable-next-line react/no-array-index-key
              key={pageIndex}
              type="button"
              onClick={() => setCurrentPage(pageIndex)}
              className={`h-2 rounded-full transition-[width,background-color] duration-200 ${
                currentPage === pageIndex ? 'w-5 bg-accent' : 'w-2 bg-border'
              }`}
              aria-label={`Go to page ${pageIndex + 1}`}
            />
          ))}
      </div>

      <AnimatePresence>
        {isAddingTheme && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0 bg-surface border-l border-border/40 p-4 sm:p-6 lg:p-8 z-20"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">
                  Add Custom Theme
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingTheme(false)}
                  className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AddThemePanel
                onSave={onSaveNewTheme}
                onCancel={() => setIsAddingTheme(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
