import { Code2 } from '@/assets/icons';

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

const LAYOUTS: readonly DocRow[] = [
  {
    id: 'classic-board',
    cells: [
      'Classic board',
      <Code key="code-1">skak</Code>,
      'Plain diagrams with coordinates.'
    ]
  },
  {
    id: 'annotated-board',
    cells: [
      'Annotated board',
      <Code key="code-2">chessboard</Code>,
      'Arrows, highlights, circles, coordinates and side to move.'
    ]
  },
  {
    id: 'problem-diagram',
    cells: [
      'Problem diagram',
      <Code key="code-3">diagram</Code>,
      'Hatched problem-book boards with author, source, award, stipulation and piece count. The only layout for fairy positions.'
    ]
  }
];

const CAPTIONS: readonly DocRow[] = [
  {
    id: 'problem',
    cells: [
      'Problem',
      'Number and credits above; (white+black) bottom-left, stipulation bottom-right.'
    ]
  },
  {
    id: 'study',
    cells: [
      'Study',
      'Number and credits above; stipulation and piece count centred below.'
    ]
  },
  {
    id: 'game',
    cells: [
      'Game',
      'White, Black, event and date above; caption and side to move below.'
    ]
  },
  {
    id: 'plain',
    cells: ['Plain', 'Only the number above and the stipulation below.']
  },
  { id: 'classic', cells: ['Classic', 'Everything stacked under the board.'] }
];

const OUTPUTS: readonly DocRow[] = [
  {
    id: 'document',
    cells: [
      'Document',
      'A complete .tex file from \\documentclass to \\end{document}. Compiles as it is.'
    ]
  },
  {
    id: 'snippet',
    cells: [
      'Snippet',
      'Only the \\usepackage line and the diagrams, to paste into your own document.'
    ]
  },
  {
    id: 'figure',
    cells: [
      'Figure',
      'A standalone document cropped to the diagrams, for a PDF figure.'
    ]
  }
];

export default function LatexSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={Code2} title="LaTeX Studio" />
        <Lead>
          <PageLink href="/latex">LaTeX Studio</PageLink> turns up to 100
          positions into LaTeX for books, bulletins and problem collections. It
          writes the source in your browser; you compile it with pdfLaTeX or on
          Overleaf.
        </Lead>
      </div>

      <InfoCard title="Workflow">
        <Steps>
          <li>
            On <Term>Diagrams</Term>, add positions and their details.
          </li>
          <li>
            On <Term>Document</Term>, pick the layout, caption style, size and
            output type.
          </li>
          <li>
            On <Term>Export</Term>, check the preview, then download the{' '}
            <Code>.tex</Code> file or copy the code.
          </li>
          <li>Compile it with the commands shown on the Export tab.</li>
        </Steps>
      </InfoCard>

      <InfoCard title="Diagrams tab">
        <Bullets>
          <li>
            The list on the left shows every diagram in print order, with search
            by author, stipulation or FEN.
          </li>
          <li>
            <Term>Add</Term> creates a diagram. <Term>Paste list</Term> takes
            one position per line as{' '}
            <Code>FEN | author | source | stipulation</Code>; only the FEN is
            required. <Term>From history</Term> adds saved positions.
          </li>
          <li>
            The editor on the right sets the FEN, the caption style for this
            diagram, the stipulation, award, author (
            <Code>Surname, First name</Code>, several separated by{' '}
            <Code>;</Code>) and source. <Term>Use these details for all</Term>{' '}
            copies them to every diagram.
          </li>
          <li>
            <Term>Notes and solution</Term> holds the caption, a remark and the
            solution, which is printed in the Solutions section.
          </li>
          <li>
            With the Annotated board layout, <Term>Highlights and arrows</Term>{' '}
            takes squares such as <Code>e4 d5</Code>, circled squares and arrows
            such as <Code>e2-e4 g1-f3</Code>.
          </li>
          <li>
            The arrows above the editor move to the previous or next diagram,
            reorder it, duplicate it or delete it.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Layouts">
        <DocTable head={['Layout', 'Package', 'Best for']} rows={LAYOUTS} />
      </InfoCard>

      <InfoCard title="Caption styles">
        <DocTable head={['Style', 'Text around the board']} rows={CAPTIONS} />
        <p>
          The Document tab sets the default style; each diagram can override it.
        </p>
      </InfoCard>

      <InfoCard title="Document tab">
        <Bullets>
          <li>
            <Term>Board size</Term>: Tiny, Small, Normal or Large.{' '}
            <Term>Diagrams per row</Term>: 1 to 4. A layout check warns when a
            board is wider than its column and suggests a column count that
            fits.
          </li>
          <li>
            <Term>Number the diagrams</Term> prints No. 1, No. 2 and so on;{' '}
            <Term>Solutions section</Term> lists every solution at the end.
            Depending on the layout you can also toggle coordinates, the
            side-to-move marker and the piece count.
          </li>
          <li>
            For a full document: title, document author, paper (A4, A5, Letter),
            font size (10, 11, 12 pt), class (article, report, book) and margins
            from 5 to 50 mm.
          </li>
        </Bullets>
        <DocTable head={['Output', 'What you get']} rows={OUTPUTS} />
      </InfoCard>

      <InfoCard title="Export tab">
        <Bullets>
          <li>
            The counters show the number of diagrams, lines and kilobytes.
          </li>
          <li>
            Set the <Term>file name</Term>, then <Term>Download</Term> the{' '}
            <Code>.tex</Code> file or <Term>Copy</Term> the code.
          </li>
          <li>
            <Term>Preview</Term> draws the diagrams on a paper sheet;{' '}
            <Term>Code</Term> shows the syntax-coloured source.
          </li>
          <li>
            <Term>Install</Term> and <Term>Compile</Term> show the exact{' '}
            <Code>tlmgr install</Code> and <Code>pdflatex</Code> commands for
            your layout and output.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Compile the document">
        <Bullets>
          <li>
            <Term>Without installing anything</Term>: create a project on
            Overleaf, paste the Document output and compile. Overleaf already
            has all three packages.
          </li>
          <li>
            <Term>TeX Live or TinyTeX</Term>: run the install command from the
            Export tab, then <Code>pdflatex chess-diagrams.tex</Code>.
          </li>
          <li>
            <Term>MiKTeX</Term> (Windows) installs missing packages on first
            use. <Term>MacTeX</Term> (macOS) already contains them.
          </li>
          <li>
            Check an installation with{' '}
            <Code>kpsewhich skak.sty chessboard.sty diagram.sty</Code>; every
            file must print a path.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Projects">
        <Bullets>
          <li>
            The project is saved in your browser automatically and is still
            there on your next visit.
          </li>
          <li>
            <Term>Save</Term> downloads it as a <Code>.json</Code> file and{' '}
            <Term>Open</Term> loads one back. <Term>New</Term> starts an empty
            project.
          </li>
          <li>
            <Term>Undo</Term> reverses deleting a diagram, starting a new
            project or opening a file.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Safe output">
        <p>
          Text fields are escaped for LaTeX, so you can type <Code>#2</Code>,{' '}
          <Code>50%</Code> or <Code>R&amp;D</Code> as they are. FENs are
          validated and only safe characters reach the output, so a pasted
          position can never inject LaTeX commands. Each text field is capped at
          2,000 characters.
        </p>
      </InfoCard>
    </div>
  );
}
