import { History } from '@/assets/icons';

import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import { Bullets, DocTable, PageLink, Term, type DocRow } from './DocsParts';

const STATUSES: readonly DocRow[] = [
  { id: 'fresh', cells: ['Fresh', 'Used in the last 7 days'] },
  { id: 'aging', cells: ['Aging', 'Used in the last 30 days'] },
  { id: 'stale', cells: ['Stale', 'Not used for 30 days or more'] },
  {
    id: 'archived',
    cells: ['Archived', 'Not used for 90 days; moved to Archive automatically']
  }
];

export default function HistorySection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={History} title="History and favourites" />
        <Lead>
          ChessViewer remembers the positions you work with.{' '}
          <PageLink href="/fen-history">History</PageLink> lets you find, reload
          and organise them.
        </Lead>
      </div>

      <InfoCard title="Lists">
        <Bullets>
          <li>
            <Term>Active</Term> holds your recent positions, newest first, up to
            200.
          </li>
          <li>
            <Term>Favorites</Term> holds positions you starred with Save or the
            star on a card. Favourites are never archived or trimmed.
          </li>
          <li>
            <Term>Archive</Term> keeps older positions out of the way. Restore
            one to bring it back to Active.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Status">
        <DocTable head={['Badge', 'Meaning']} rows={STATUSES} />
      </InfoCard>

      <InfoCard title="Find a position">
        <Bullets>
          <li>
            Filter by <Term>status</Term>, by <Term>source</Term> (Manual Input,
            Export, Drag &amp; Drop) and by a <Term>From</Term> /{' '}
            <Term>To</Term> date range.
          </li>
          <li>
            <Term>Search FEN</Term> matches any part of a FEN.
          </li>
          <li>
            <Term>Load</Term> opens the position in the editor; standard
            positions open on Standard and fairy positions on Fairy chess.
          </li>
        </Bullets>
      </InfoCard>
    </div>
  );
}
