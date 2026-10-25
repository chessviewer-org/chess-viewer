import { BookOpen } from '@/assets/icons';

import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import { DocTable, PageLink, Term, type DocRow } from './DocsParts';

const WORKSPACES: readonly DocRow[] = [
  {
    id: 'standard',
    cells: [
      <PageLink key="pagelink-1" href="/">
        Standard
      </PageLink>,
      'Orthodox positions from FEN or by hand',
      'PNG, JPEG, SVG, share link'
    ]
  },
  {
    id: 'fairy',
    cells: [
      <PageLink key="pagelink-2" href="/fairy-chess">
        Fairy chess
      </PageLink>,
      'Neutral and rotated symbols, 163 named walks, stipulations, conditions',
      'PNG, JPEG, SVG with legend, Popeye .inp'
    ]
  },
  {
    id: 'latex',
    cells: [
      <PageLink key="pagelink-3" href="/latex">
        LaTeX
      </PageLink>,
      'Up to 100 diagrams with credits, stipulations and solutions',
      '.tex for skak, chessboard or diagram'
    ]
  },
  {
    id: 'batch',
    cells: [
      <PageLink key="pagelink-4" href="/advanced-fen">
        Advanced
      </PageLink>,
      'Up to 10 positions with one style',
      'ZIP of images, hand-off to LaTeX'
    ]
  }
];

export default function OverviewSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={BookOpen} title="Overview" />
        <Lead>
          ChessViewer turns chess positions into publication-quality diagrams.
          It covers orthodox chess, fairy chess compositions and LaTeX output
          for books and bulletins. Everything runs in your browser; no
          installation or account is needed.
        </Lead>
      </div>

      <InfoCard title="Workspaces">
        <DocTable
          head={['Page', 'What you build', 'What you get']}
          rows={WORKSPACES}
        />
      </InfoCard>

      <InfoCard title="How your work is stored">
        <p>
          Positions, history, favourites, board styles and the LaTeX project are
          saved in your browser&apos;s local storage as you work, so a reload or
          a closed tab loses nothing. Rendering and export happen on your
          device; no image is sent to a server.
        </p>
        <p>
          An <Term>optional account</Term> syncs history and settings across
          devices. The copy in your browser stays the primary one, and you keep
          working offline. See <Term>Settings and account</Term> in this
          documentation.
        </p>
      </InfoCard>

      <InfoCard title="Supported browsers">
        <p>
          Current versions of Chrome, Edge, Firefox and Safari on desktop,
          Android and iOS. Screens from 320 px phones to 4K monitors are
          supported, and every page works with the keyboard and screen readers.
        </p>
      </InfoCard>

      <InfoCard title="What ChessViewer is not">
        <p>
          ChessViewer is a diagram editor, not an engine or a solver. It does
          not check move legality, suggest moves or verify that a problem is
          sound. Stipulations and fairy conditions are printed with the diagram
          exactly as you enter them.
        </p>
      </InfoCard>
    </div>
  );
}
