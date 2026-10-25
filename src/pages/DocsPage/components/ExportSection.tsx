import { Download } from '@/assets/icons';

import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import { Bullets, Code, DocTable, Steps, Term } from './DocsParts';

export default function ExportSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={Download} title="Export images" />
        <Lead>
          Press the download button above the board to open the export page. It
          has two tabs: Board Style and Export Settings.
        </Lead>
      </div>

      <InfoCard title="Board Style">
        <Bullets>
          <li>
            <Term>Presets</Term> holds 20 colour themes, including a
            black-and-white Print theme. <Term>Custom</Term> lets you pick any
            light and dark square colours and save them as your own presets.
          </li>
          <li>
            <Term>Hatched dark squares</Term> draws dark squares as diagonal
            lines, the classic look of printed problem books.
          </li>
          <li>
            <Term>Piece set</Term> switches between 20 piece designs. The choice
            applies to the board, previews and every export.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Export Settings">
        <Steps>
          <li>
            Tick one or more <Term>formats</Term>: PNG (lossless, best for
            print), JPEG (smaller files) or SVG (vector, scales to any size).
          </li>
          <li>
            Pick the <Term>quality</Term>: 1× is 300 DPI, 2× 600, 3× 900 and 4×
            1200 DPI. Higher values suit large prints.
          </li>
          <li>
            Choose the printed <Term>board size</Term>: 4, 6 or 8 cm, or type
            any size between 4 and 8 cm.
          </li>
          <li>
            Optionally name the files. Separate names with commas to name each
            format, for example <Code>image1, vector1</Code>. Empty names become{' '}
            <Code>chess-position</Code>.
          </li>
          <li>
            Press <Term>Download</Term>. A progress bar shows each file; you can
            pause or cancel a large export.
          </li>
        </Steps>
      </InfoCard>

      <InfoCard title="Formats and sizes">
        <DocTable
          head={['Quality', 'DPI', '4 cm board', '6 cm board', '8 cm board']}
          rows={[
            {
              id: 'quality-1x',
              cells: ['1×', '300', '472 px', '709 px', '945 px']
            },
            {
              id: 'quality-2x',
              cells: ['2×', '600', '945 px', '1,417 px', '1,890 px']
            },
            {
              id: 'quality-3x',
              cells: ['3×', '900', '1,417 px', '2,126 px', '2,835 px']
            },
            {
              id: 'quality-4x',
              cells: ['4×', '1,200', '1,890 px', '2,835 px', '3,780 px']
            }
          ]}
        />
        <p>
          Sizes are for the board alone; coordinates add a narrow border. PNG
          and JPEG files carry their DPI, so word processors and print tools
          place them at the chosen physical size. SVG embeds the piece artwork,
          so the file opens anywhere without extra assets. Fairy diagrams also
          include their legend, conditions and source notation.
        </p>
      </InfoCard>

      <InfoCard title="Copy instead of download">
        <p>
          The <Term>Copy</Term> button above the board puts a PNG of the current
          diagram on the clipboard, ready to paste into a document, chat or
          slide.
        </p>
      </InfoCard>
    </div>
  );
}
