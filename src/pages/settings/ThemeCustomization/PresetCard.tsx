import { memo, useEffect, useRef, useState } from 'react';

import { Check, GripVertical, Palette, Pencil, Trash2 } from 'lucide-react';

import { WOOD_PRESET } from '@constants';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const PresetCard = memo(function PresetCard({
  preset,
  isActive,
  onClick,
  editMode,
  onEdit,
  onDelete,
  onRename,
  dragOverId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const [hovered, setHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameValue, setNameValue] = useState(preset.name);
  const inputRef = useRef(null);
  const isWood = preset.id === WOOD_PRESET.id;
  const canDelete = !isWood && preset.isDeletable !== false;
  const isDragTarget = dragOverId === preset.id;
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  /**
   * Saves or cancels preset renaming from keyboard input.
   *
   * @param {KeyboardEvent} e - Input keyboard event
   * @returns {void}
   */
  function handleRenameKeyDown(e) {
    if (e.key === 'Enter') {
      onRename(preset.id, nameValue.trim() || preset.name);
      setIsRenaming(false);
    } else if (e.key === 'Escape') {
      setNameValue(preset.name);
      setIsRenaming(false);
    }
  }

  /**
   * Persists the renamed preset when the input loses focus.
   *
   * @returns {void}
   */
  function handleRenameBlur() {
    onRename(preset.id, nameValue.trim() || preset.name);
    setIsRenaming(false);
  }

  return (
    <div className="relative transition-shadow duration-200">
      {isDragTarget && (
        <div className="absolute inset-0 border-2 border-dashed border-accent/60 rounded-lg bg-accent/5 z-10 pointer-events-none" />
      )}
      <button
        onClick={() => !editMode && onClick(preset)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        draggable={editMode}
        onDragStart={(e) => onDragStart?.(e, preset)}
        onDragOver={(e) => onDragOver?.(e, preset)}
        onDrop={(e) => onDrop?.(e, preset)}
        onDragEnd={onDragEnd}
        aria-label={
          isWood
            ? `${preset.name} theme (default, not editable)`
            : `Apply ${preset.name} theme`
        }
        title={
          isWood && editMode
            ? 'Default theme — cannot be edited or deleted'
            : undefined
        }
        className={`group relative rounded-lg transition-colors duration-200 overflow-hidden w-full border ${isActive ? 'border-accent ring-2 ring-accent/60 shadow-[0_0_0_1px_rgba(210,155,30,0.65),0_10px_24px_-14px_rgba(210,155,30,0.65)]' : 'border-border/60 hover:border-accent/40 hover:shadow-sm'} ${editMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="relative overflow-hidden rounded-lg">
          <div className="flex w-full h-14" aria-hidden="true">
            <div
              className="flex-1 transition-colors duration-300"
              style={{
                backgroundColor: preset.light
              }}
            />
            <div
              className="flex-1 transition-colors duration-300"
              style={{
                backgroundColor: preset.dark
              }}
            />
          </div>
          {isActive && !editMode && (
            <div className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-accent text-bg rounded-sm flex items-center justify-center shadow-[0_0_0_1px_rgba(16,17,22,0.75)]">
              <Check className="w-2.5 h-2.5" strokeWidth={3} />
            </div>
          )}
          {!editMode && (
            <div
              className={`absolute bottom-0 left-0 right-0 px-1.5 py-1 ${isActive ? 'bg-accent/85' : 'bg-black/55'}`}
            >
              <span className="block text-white text-[11px] font-semibold tracking-wide text-center truncate">
                {preset.name}
              </span>
            </div>
          )}
        </div>
        {editMode && !isWood && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
              className="p-1 bg-white/20 hover:bg-white/30 rounded transition-colors duration-200"
              aria-label={`Rename ${preset.name}`}
            >
              <Pencil className="w-2.5 h-2.5 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(preset);
              }}
              className="p-1 bg-accent/80 hover:bg-accent rounded transition-colors duration-200"
              aria-label={`Edit ${preset.name} colors`}
            >
              <Palette className="w-2.5 h-2.5 text-bg" />
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(preset.id);
                }}
                className="p-1 bg-error/80 hover:bg-error rounded transition-colors duration-200"
                aria-label={`Delete ${preset.name}`}
              >
                <Trash2 className="w-2.5 h-2.5 text-white" />
              </button>
            )}
            <div className="p-1 text-white/60">
              <GripVertical className="w-2.5 h-2.5" />
            </div>
          </div>
        )}
        {editMode && isWood && hovered && (
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
            <div className="p-1 text-white/60">
              <GripVertical className="w-3 h-3" />
            </div>
          </div>
        )}
      </button>
      {editMode && isRenaming && (
        <div className="absolute inset-0 z-20 bg-surface rounded-lg border border-accent flex items-center p-1">
          <input
            ref={inputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            className="w-full text-xs font-semibold bg-transparent text-text-primary outline-none px-1"
            maxLength={20}
          />
        </div>
      )}
      {editMode && (
        <div className="text-[9px] text-text-muted text-center mt-0.5 truncate px-0.5 font-medium">
          {preset.name}
        </div>
      )}
    </div>
  );
});
PresetCard.displayName = 'PresetCard';
export default PresetCard;
