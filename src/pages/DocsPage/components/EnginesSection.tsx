import { Cpu } from '@/assets/icons';
import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import { Bullets, PageLink, Term } from './DocsParts';

export default function EnginesSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={Cpu} title="Computer analysis" />
        <Lead>
          Open analysis with the computer icon beside the board. Engines run in
          your browser; positions are not sent to an analysis server. Use the
          switch in the panel to pause or resume a search.
        </Lead>
      </div>

      <InfoCard title="Standard chess · Stockfish">
        <Bullets>
          <li>
            Choose Stockfish 18 or 19 Lite in <Term>Engine settings</Term>. The
            score is shown from White&apos;s point of view. The search shows
            depth and its candidate lines as results arrive.
          </li>
          <li>
            Set search time, memory, threads and number of lines. Threads need a
            cross-origin isolated browser page; when unavailable, the
            single-threaded build is used.
          </li>
          <li>
            Hover over a move to preview its position. Select a move to play it
            on the board. The target icon asks Stockfish to examine the
            opponent&apos;s threat.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Fairy chess · Popeye">
        <Bullets>
          <li>
            <PageLink href="/fairy-chess">Fairy chess</PageLink> uses Popeye
            4.103 to solve the stipulation and conditions in the problem card.
            Its result is a solution count, not a Stockfish evaluation score.
          </li>
          <li>
            Set search time, memory, solution limit, threats and defensive
            variations. Expand a solution to inspect its moves; hover to preview
            a position on a small board, or select a move to show it on the main
            board.
          </li>
          <li>
            Named fairy walks and conditions use Popeye notation and rules.
            Merely rotating an unnamed symbol does not define its movement. A
            time-limited search may report only part of the solution set.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Engine licenses and source">
        <p>
          The engines have their own licenses and source code. Read the{' '}
          <a
            href="/licenses/stockfish/NOTICE.txt"
            className="text-accent hover:underline"
          >
            Stockfish notice
          </a>
          ,{' '}
          <a
            href="/licenses/popeye/NOTICE.txt"
            className="text-accent hover:underline"
          >
            Popeye notice
          </a>{' '}
          and{' '}
          <a href="/licenses/README.md" className="text-accent hover:underline">
            third-party licenses
          </a>
          . The complete Popeye source archive is available with its notice.
        </p>
      </InfoCard>
    </div>
  );
}
