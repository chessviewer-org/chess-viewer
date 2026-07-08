import { Globe, Info, Scale, Server } from '@/assets/icons';

import { LICENSE_NAME, REPO_URL } from '../utils/aboutConstants';
import { FactList, FactRow, InfoCard, Lead, SectionHeading } from './parts';

export default function AboutSection() {
  return (
    <div className="space-y-10 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={Info} title="About ChessViewer" />
        <Lead>
          Simply put, ChessViewer is a free tool that lets you build chess
          positions and turn them into high-quality images for print or screen.
          Drag the pieces onto the board however you want, pick a style, and
          download. Nothing to install, no sign-up — it all runs right in your
          browser, fast.
        </Lead>
      </div>

      <InfoCard title="Why does this exist?">
        <p>
          Say you need a clean chess board image for a book, an article, a
          YouTube video, or a worksheet for your students. That&apos;s exactly
          what ChessViewer is for. It is not an engine — it will not suggest
          moves or play against you. It has one job: turn the position you build
          into the sharpest, cleanest image possible.
        </p>
        <p>
          And it is completely free — no annoying ads, no code tracking you in
          the background, no &quot;upgrade to Premium&quot; popups.
        </p>
      </InfoCard>

      <InfoCard title="Who is it for?">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-text-primary">Teachers and coaches:</strong>{' '}
            putting together worksheets or slides for students.
          </li>
          <li>
            <strong className="text-text-primary">Writers and bloggers:</strong>{' '}
            adding crisp, print-quality (high-DPI) images to articles or books.
          </li>
          <li>
            <strong className="text-text-primary">
              YouTubers and streamers:
            </strong>{' '}
            making custom board images for video thumbnails.
          </li>
          <li>
            <strong className="text-text-primary">Developers:</strong> turning a
            FEN string straight into an image without any hassle.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="What can you do with it?">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="text-text-primary">Simple controls.</strong> Just
            grab a piece and drop it where you want on the board. Flip the
            board, hide or show coordinates — it all works the way you&apos;d
            expect.
          </li>
          <li>
            <strong className="text-text-primary">FEN support.</strong> Got a
            FEN string handy? Paste it in and watch the board update instantly.
            If something is off, ChessViewer flags it before you export.
          </li>
          <li>
            <strong className="text-text-primary">Real quality.</strong> Export
            as PNG, JPEG, or SVG. You can push the quality up to 1200 DPI —
            print-shop level.
          </li>
          <li>
            <strong className="text-text-primary">Batch export.</strong> Writing
            a book and need 30 different positions exported at once? Don&apos;t
            do them one by one. Paste all the FEN strings in and download them
            as a single ZIP.
          </li>
          <li>
            <strong className="text-text-primary">Your look, your call.</strong>{' '}
            Change the board colors and piece style to match whatever
            you&apos;re working on.
          </li>
          <li>
            <strong className="text-text-primary">Auto-save.</strong> Nothing
            you are working on gets lost — it stays saved on your device. Search
            back through it and pick up where you left off any time.
          </li>
          <li>
            <strong className="text-text-primary">Database lookup.</strong>{' '}
            Wondering if a position has ever been played before? Check it
            against Lichess, ChessDB, PDB, and YACPDB in one click.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Do I have to sign up?">
        <p>
          Not at all. Open the site and start working — everything stays in your
          browser. If you do create an account, you get one extra perk: your
          positions and settings sync across your devices, phone and computer
          alike. Your data is protected by row-level security in the database —
          only your account can read your rows, nobody else&apos;s. You can also
          turn on two-factor authentication for extra peace of mind.
        </p>
      </InfoCard>

      <InfoCard title="The idea behind it">
        <p>
          ChessViewer started as something built just for one person — a fast
          way to put together a decent chess diagram without wrestling with
          image editors or paying for software that does too much. Turns out
          other people needed the same thing, so it was made open source and put
          out there for everyone.
        </p>
        <p>
          There is no company or investor behind it. Your data isn&apos;t sold
          to anyone, nothing tracks you in the background, and nothing here is
          paid. The code is all on GitHub — read it, run it locally, or send in
          a contribution whenever you want.
        </p>
      </InfoCard>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
          At a glance
        </h3>
        <FactList>
          <FactRow icon={Scale} label="License" value={LICENSE_NAME} />
          <FactRow
            icon={Globe}
            label="Source code"
            value={
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent hover:underline"
              >
                GitHub
              </a>
            }
          />
          <FactRow
            icon={Server}
            label="Account & sync"
            value="Optional — your data, your browser"
          />
        </FactList>
      </div>
    </div>
  );
}
