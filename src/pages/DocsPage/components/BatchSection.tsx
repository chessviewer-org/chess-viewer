import { Layers } from '@/assets/icons';

import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import { Bullets, PageLink, Steps, Term } from './DocsParts';

export default function BatchSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={Layers} title="Batch export" />
        <Lead>
          The <PageLink href="/advanced-fen">Advanced</PageLink> page exports up
          to 10 positions in one style and downloads them as a single ZIP file —
          useful for worksheets, articles and course material.
        </Lead>
      </div>

      <InfoCard title="Add positions">
        <Bullets>
          <li>
            Open the page with <Term>Advanced</Term> above the FEN box, or press{' '}
            <Term>Add</Term> in the FEN toolbar to send the current position to
            the batch.
          </li>
          <li>
            On <Term>Positions</Term>, paste one FEN per card. A new empty card
            appears when every card is filled, up to 10. A green dot marks a
            valid FEN; the clipboard icon pastes into a card and the star saves
            it to favourites.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Preview and export">
        <Steps>
          <li>
            Open <Term>Preview / Export</Term> →{' '}
            <Term>Board Style &amp; Preview</Term>. The player steps through
            every position, automatically or with the arrows, so you can check
            the batch before downloading.
          </li>
          <li>
            Pick the colour preset, hatched dark squares and piece set for the
            position on screen. Each position can have its own style;{' '}
            <Term>Apply to All Positions</Term> copies the current colours,
            pieces, coordinates, frame, orientation and export settings to every
            position.
          </li>
          <li>
            On <Term>Export Settings</Term>, choose formats, quality and board
            size exactly as on the single export page, then download the ZIP.
          </li>
        </Steps>
      </InfoCard>

      <InfoCard title="Send the batch to LaTeX">
        <p>
          Under the preview, <Term>Open all in LaTeX Studio</Term> hands every
          valid position to the LaTeX Studio. A project that still holds only
          the untouched starting position is replaced; otherwise the positions
          are appended and duplicates are skipped.
        </p>
      </InfoCard>
    </div>
  );
}
