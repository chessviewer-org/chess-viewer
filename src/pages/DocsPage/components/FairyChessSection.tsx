import { Sparkles } from '@/assets/icons';

import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import {
  Bullets,
  Code,
  DocTable,
  PageLink,
  Steps,
  Term,
  type DocRow
} from './DocsParts';

const NOTATION: readonly DocRow[] = [
  { id: 'white-bishop', cells: ['White bishop', <Code key="code-1">B</Code>] },
  { id: 'black-bishop', cells: ['Black bishop', <Code key="code-2">b</Code>] },
  {
    id: 'neutral-bishop',
    cells: [
      'Neutral bishop',
      <>
        <Code>-B</Code> or <Code>-b</Code>
      </>
    ]
  },
  {
    id: 'white-bishop-turned-90',
    cells: ['White bishop, turned 90°', <Code key="code-3">*1B</Code>]
  },
  {
    id: 'black-queen-turned-270',
    cells: ['Black queen, turned 270°', <Code key="code-4">*3q</Code>]
  },
  {
    id: 'neutral-rook-turned-180',
    cells: [
      'Neutral rook, turned 180°',
      <>
        <Code>-*2R</Code> or <Code>-*2r</Code>
      </>
    ]
  },
  {
    id: 'grasshopper-inverted-queen',
    cells: ['Grasshopper (inverted queen)', <Code key="code-5">*2Q</Code>]
  },
  {
    id: 'nightrider-inverted-knight',
    cells: ['Nightrider (inverted knight)', <Code key="code-6">*2N</Code>]
  }
];

const POPEYE_EXAMPLE = `BeginProblem
Stipulation h#2
Condition Circe
Pieces White Ke1 Ge4
Pieces Black Ke8 Ne5
Pieces Neutral PAa4
EndProblem`;

export default function FairyChessSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={Sparkles} title="Fairy chess" />
        <Lead>
          The <PageLink href="/fairy-chess">Fairy chess</PageLink> page builds
          composition diagrams with neutral and rotated pieces, 163 named walks
          from the Popeye catalogue, stipulations and conditions. It shares the
          board, toolbar and export of the standard editor and adds a fairy
          piece panel and a Popeye problem card.
        </Lead>
      </div>

      <InfoCard title="Symbols tab">
        <Bullets>
          <li>
            <Term>White, Black and Neutral</Term> rows hold the six orthodox
            shapes. A neutral piece belongs to both sides and is drawn half
            white, half black.
          </li>
          <li>
            The <Term>rotation switch</Term> (0°, 90°, 180°, 270°) turns every
            symbol in the palette. By convention an upside-down queen is a
            Grasshopper and an upside-down knight a Nightrider; other meanings
            belong in the stipulation or legend.
          </li>
          <li>
            <Term>Markers</Term> — circle, cross, square and triangle — label
            squares in white, black or neutral, chosen with the marker colour
            switch next to them.
          </li>
          <li>
            Drag a symbol onto the board, or click it and then click a square.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Named pieces tab">
        <Bullets>
          <li>
            The catalogue holds the 163 walks of the English Popeye manual,
            including the six orthodox ones, shown as letter discs and paged in
            two rows. Use the dots, the arrows or a swipe to move between pages.
          </li>
          <li>
            The <Term>White / Black / Neutral</Term> switch sets the colour of
            the pieces you place.
          </li>
          <li>
            <Term>Search</Term> matches a walk&apos;s name or Popeye code, such
            as <Code>G</Code> for Grasshopper or <Code>N</Code> for Nightrider.
          </li>
          <li>
            <Term>Attributes</Term> toggles any of 19 Popeye attributes, such as
            Royal, Chameleon, Kamikaze or Paralysing. Pieces placed while an
            attribute is on carry it.
          </li>
          <li>
            Walks with a conventional diagram glyph are drawn with it; the rest
            appear as their letter code and are explained in the printed legend.
            Two walks that share a glyph stay distinct in history, undo and
            export.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Fairy FEN">
        <p>
          The FEN box accepts Fairy FEN as defined by Joost de Heer: a{' '}
          <Code>-</Code> prefix marks a neutral piece and <Code>*1</Code>,{' '}
          <Code>*2</Code>, <Code>*3</Code> turn a piece 90°, 180° or 270°
          clockwise. Ordinary FEN letters keep their meaning, so <Code>N</Code>{' '}
          is always a knight.
        </p>
        <DocTable head={['Piece', 'Fairy FEN']} rows={NOTATION} />
        <p>
          A placement-only FEN is enough for a diagram. Named walks, attributes
          and conditions are not part of Fairy FEN; they are kept in the Popeye
          problem. The board is 8 × 8.
        </p>
      </InfoCard>

      <InfoCard title="Popeye problem card">
        <Steps>
          <li>
            <Term>Stipulation</Term>: type it, pick a quick chip such as{' '}
            <Code>#2</Code>, <Code>h#2</Code>, <Code>s#2</Code> or{' '}
            <Code>ser-h#5</Code>, or switch to <Term>Structured</Term> to enter
            a Popeye SStipulation expression.
          </li>
          <li>
            <Term>Conditions</Term>: one per line, for example{' '}
            <Code>Circe</Code> or <Code>Madrasi RexInclusive</Code>. The{' '}
            <Term>Condition library</Term> lists all 182 Popeye conditions with
            search.
          </li>
          <li>
            <Term>Problem details</Term> (optional): author, source, title,
            remarks and twin declarations.
          </li>
          <li>
            Press <Term>Apply to position</Term>. The legend under the board
            then shows the stipulation, conditions and the named pieces in use.
          </li>
        </Steps>
      </InfoCard>

      <InfoCard title="Popeye files">
        <p>
          <Term>Import</Term> reads <Code>.inp</Code>, <Code>.txt</Code> and{' '}
          <Code>.fen</Code> files; <Term>Save .inp</Term> downloads the problem
          in Popeye&apos;s English input format. Apply pending changes before
          saving:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border bg-surface-elevated p-4 font-mono text-[0.8125rem] text-text-primary">
          {POPEYE_EXAMPLE}
        </pre>
        <Bullets>
          <li>
            Pieces, Forsyth placement, stipulation, conditions, options,
            authorship, remarks and twins are preserved. In Popeye notation{' '}
            <Code>S</Code> is the knight and <Code>N</Code> the Nightrider.
          </li>
          <li>
            One 8 × 8 problem is imported at a time, up to 32,768 characters.
            Other board sizes and unknown commands are rejected with an error
            rather than silently dropped.
          </li>
          <li>
            Twins are kept as text; ChessViewer does not draw the twin
            positions.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Export, sharing and LaTeX">
        <Bullets>
          <li>
            PNG, JPEG and SVG exports include the legend, conditions and
            credits. SVG also embeds the source notation.
          </li>
          <li>
            Share links keep the position in the part of the address after{' '}
            <Code>#</Code>, which browsers never send to a server.
          </li>
          <li>
            In <PageLink href="/latex">LaTeX Studio</PageLink> fairy positions
            use the <Code>diagram</Code> package, which supports neutral and
            rotated pieces.
          </li>
          <li>
            Database search is disabled for fairy positions, because Lichess and
            ChessDB only understand orthodox FEN.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Limits">
        <p>
          The fairy workspace draws diagrams; it does not solve problems or
          enforce fairy rules. Choosing a condition records it with the diagram
          but does not run it. The board is always 8 × 8.
        </p>
      </InfoCard>
    </div>
  );
}
