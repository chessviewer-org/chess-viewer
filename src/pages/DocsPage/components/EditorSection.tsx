import { MousePointer } from '@/assets/icons';

import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import { Bullets, Code, Kbd, PageLink, Steps, Term } from './DocsParts';

export default function EditorSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={MousePointer} title="Standard editor" />
        <Lead>
          The <PageLink href="/">Standard</PageLink> page turns any chess
          position into a diagram. Set up the position, choose how the board
          looks, then copy, share or export it.
        </Lead>
      </div>

      <InfoCard title="Set up a position">
        <Steps>
          <li>
            <Term>Paste a FEN</Term> into the FEN Notation box. The board
            updates as soon as the FEN is valid; an error explains what is wrong
            otherwise.
          </li>
          <li>
            <Term>Drag pieces</Term> from the White and Black palettes onto the
            board, or click a palette piece and then click a square. Drag a
            piece onto <Term>Drop to remove</Term> to delete it.
          </li>
          <li>
            <Term>Use the keyboard</Term>: focus the board, move with the arrow
            keys, press <Kbd>Enter</Kbd> or <Kbd>Space</Kbd> to pick up and
            place a piece, and <Kbd>Delete</Kbd> to remove it.
          </li>
        </Steps>
      </InfoCard>

      <InfoCard title="FEN toolbar">
        <Bullets>
          <li>
            <Term>Paste</Term> reads a FEN from your clipboard.
          </li>
          <li>
            <Term>Add</Term> puts the position into the batch on the{' '}
            <PageLink href="/advanced-fen">Advanced</PageLink> page.
          </li>
          <li>
            <Term>Save</Term> stores the position in your favourites.
          </li>
          <li>
            <Term>Reset</Term> loads the starting position and{' '}
            <Term>Clear</Term> empties the board.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Board actions">
        <Bullets>
          <li>
            <Term>Undo</Term> and <Term>Redo</Term> step through your changes:{' '}
            <Kbd>Ctrl</Kbd> + <Kbd>Z</Kbd> and <Kbd>Ctrl</Kbd> + <Kbd>Y</Kbd>.
          </li>
          <li>
            <Term>Flip</Term> turns the board so Black is at the bottom:{' '}
            <Kbd>F</Kbd>.
          </li>
          <li>
            <Term>Copy</Term> puts a PNG of the board on your clipboard.
          </li>
          <li>
            <Term>Share</Term> gives you a link to copy; anyone who opens it
            sees this exact position.
          </li>
          <li>
            <Term>Download</Term> opens the export page with every format and
            size option.
          </li>
          <li>
            <Term>Show Coordinates</Term> and <Term>Board Frame</Term> change
            the board and every export.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Open a position from a link">
        <p>
          Add a FEN to the address and the editor opens it directly:{' '}
          <Code>chessvision.org/?fen=…</Code> with the FEN URL-encoded. Links
          made with Share use <Code>#position=…</Code>.
        </p>
      </InfoCard>

      <InfoCard title="Database search">
        <p>
          Under the board, <Term>Search</Term> looks the position up on Lichess
          or ChessDB, and <Term>Open</Term> shows it on PDB or YACPDB. Only the
          FEN is sent, and only when you press the button. Fairy positions are
          never sent because these databases only understand orthodox FEN.
        </p>
      </InfoCard>
    </div>
  );
}
