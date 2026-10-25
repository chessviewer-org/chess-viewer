import { Zap } from '@/assets/icons';

import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import { DocTable, Kbd, type DocRow } from './DocsParts';

const EDITOR: readonly DocRow[] = [
  {
    id: 'undo',
    cells: [
      <>
        <Kbd>Ctrl</Kbd> + <Kbd>Z</Kbd>
      </>,
      'Undo'
    ]
  },
  {
    id: 'redo',
    cells: [
      <>
        <Kbd>Ctrl</Kbd> + <Kbd>Y</Kbd> or <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> +{' '}
        <Kbd>Z</Kbd>
      </>,
      'Redo'
    ]
  },
  { id: 'f', cells: [<Kbd key="kbd-1">F</Kbd>, 'Flip the board'] },
  {
    id: 'delete',
    cells: [
      <>
        <Kbd>Delete</Kbd> or <Kbd>Backspace</Kbd>
      </>,
      'Remove the selected piece'
    ]
  },
  {
    id: 'esc',
    cells: [
      <Kbd key="kbd-2">Esc</Kbd>,
      'Cancel the current selection or close a dialog'
    ]
  }
];

const BOARD: readonly DocRow[] = [
  { id: 'tab', cells: [<Kbd key="kbd-3">Tab</Kbd>, 'Move focus to the board'] },
  {
    id: 'arrow-keys',
    cells: ['Arrow keys', 'Move the cursor between squares']
  },
  {
    id: 'enter',
    cells: [
      <>
        <Kbd>Enter</Kbd> or <Kbd>Space</Kbd>
      </>,
      'Pick up the piece under the cursor, then place it'
    ]
  },
  {
    id: 'remove',
    cells: [
      <>
        <Kbd>Delete</Kbd> or <Kbd>Backspace</Kbd>
      </>,
      'Remove the piece under the cursor'
    ]
  },
  {
    id: 'cancel',
    cells: [<Kbd key="kbd-4">Esc</Kbd>, 'Put a picked-up piece back']
  }
];

export default function ShortcutsSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={Zap} title="Keyboard shortcuts" />
        <Lead>
          Every editor works without a mouse. On macOS use <Kbd>Cmd</Kbd> where
          the table says <Kbd>Ctrl</Kbd>. Shortcuts are ignored while you type
          in a text field.
        </Lead>
      </div>

      <InfoCard title="Editor">
        <DocTable head={['Keys', 'Action']} rows={EDITOR} />
      </InfoCard>

      <InfoCard title="Board">
        <DocTable head={['Keys', 'Action']} rows={BOARD} />
        <p>
          A screen reader announces the full position and every change. A
          palette piece can be picked up with <Kbd>Enter</Kbd> and placed on the
          board with the same keys.
        </p>
      </InfoCard>
    </div>
  );
}
