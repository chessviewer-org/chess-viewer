import {
  Boxes,
  Download,
  Globe,
  Info,
  Lock,
  Package,
  Scale,
  Server
} from 'lucide-react';

import { APP_VERSION, LICENSE_NAME, REPO_URL } from './aboutConstants';
import { FactList, FactRow, InfoCard, Lead, SectionHeading } from './parts';

/**
 * The main "About ChessVision" section. Long-form and written in plain language
 * for ordinary users (not developer jargon). Every claim is grounded in what
 * the app actually does — no marketing, no exaggeration, nothing unverifiable.
 */
export default function AboutSection() {
  return (
    <div className="space-y-10 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={Info} title="About ChessVision" />
        <Lead>
          ChessVision is a free tool that lets you build chess positions and
          export them as clean, high-resolution images. Drag pieces onto the
          board, pick your style, and save. Nothing to install, no account
          needed — it runs entirely in your browser.
        </Lead>
      </div>

      <InfoCard title="What is it, exactly?">
        <p>
          It is a diagram editor. You put pieces where you want them, decide how
          the board looks, and export a sharp image you can use anywhere — in a
          book, a lesson, a blog post, a video thumbnail, wherever. That is the
          whole point.
        </p>
        <p>
          It is not a chess engine. There are no move suggestions, no analysis,
          no opponent to play against. ChessVision does one thing — build
          positions and export them — and tries to do it really well. If you
          want a diagram tool that gets out of your way, this is it.
        </p>
        <p>
          Everything is free. No ads, no tracking, nothing paywalled. The
          project is open source and intends to stay that way.
        </p>
      </InfoCard>

      <InfoCard title="Who uses it?">
        <p>
          Mostly people who create chess content and need a clean diagram fast:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-text-primary">Coaches and teachers</strong>{' '}
            who make worksheets, slide decks, and puzzles for their students —
            and need diagrams that actually look professional,
          </li>
          <li>
            <strong className="text-text-primary">Writers and authors</strong>{' '}
            who are putting positions into books, newsletters, or articles and
            need print-quality images at the right physical size,
          </li>
          <li>
            <strong className="text-text-primary">
              Streamers and video creators
            </strong>{' '}
            who want sharp, well-styled board images for thumbnails and
            overlays,
          </li>
          <li>
            <strong className="text-text-primary">Players</strong> who want to
            save an interesting position from a game to study later or share
            with a friend,
          </li>
          <li>
            <strong className="text-text-primary">Developers</strong> who need a
            quick, reliable way to turn a FEN string into a board image.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="What can you actually do with it?">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="text-text-primary">
              Drag pieces onto the board.
            </strong>{' '}
            Click and drag from the piece palette to place what you want. Move
            pieces around, remove them, flip the board, toggle coordinates on or
            off. It works like you would expect it to.
          </li>
          <li>
            <strong className="text-text-primary">Paste a FEN string.</strong>{' '}
            FEN is the standard shorthand chess players use to describe a
            position — a short line of text that says where every piece is. If
            you have one, paste it in and the board updates instantly.
            ChessVision validates it as you type and tells you if something
            looks wrong before you export.
          </li>
          <li>
            <strong className="text-text-primary">
              Export as PNG, JPEG, or SVG.
            </strong>{' '}
            You set the physical size in centimetres and pick a quality level —
            from a standard screen resolution up to 1200 DPI for print. The
            result is a properly sized, properly sharp image you can drop
            straight into InDesign, Word, a slide deck, or wherever.
          </li>
          <li>
            <strong className="text-text-primary">
              Batch-export a whole set of diagrams.
            </strong>{' '}
            If you are writing a book or a course and you need 30 positions
            exported at once, use the advanced FEN page. Paste them all in, hit
            export, and download a single ZIP with every image inside.
          </li>
          <li>
            <strong className="text-text-primary">
              Customize the look completely.
            </strong>{' '}
            There are several piece sets and board-color themes to choose from,
            and you can build your own theme with your own colors. Light
            squares, dark squares, coordinates, borders — all of it is
            adjustable.
          </li>
          <li>
            <strong className="text-text-primary">
              Keep a history of what you have worked on.
            </strong>{' '}
            ChessVision remembers your recent positions automatically. You can
            mark favorites, search through your history, and come back to
            anything you were working on earlier.
          </li>
          <li>
            <strong className="text-text-primary">
              Search public chess databases.
            </strong>{' '}
            Wondering if a position has been played before? ChessVision can look
            it up in Lichess, PDB, and YACPDB and take you straight to the
            result. This only happens when you ask — it never runs in the
            background.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Your account is optional">
        <p>
          You do not need an account. Open the site and start working — no
          sign-up, no form to fill in. Your positions, history, and preferences
          are saved in your browser on this device, and that is it.
        </p>
        <p>
          If you create an account, you get one extra thing: your settings and
          history follow you across devices. Sign in on another computer and
          everything is there. Your data is protected by row-level security in
          the database — only your account can read your rows, nobody else's.
          You can also turn on two-factor authentication for extra peace of
          mind.
        </p>
      </InfoCard>

      <InfoCard title="What ChessVision stands for">
        <ul className="space-y-3">
          <li className="flex gap-3">
            <Package
              className="mt-0.5 h-5 w-5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Open source:</strong> Every
              line of code is public on GitHub. Read it, run it locally, learn
              from it, contribute to it — the full project is yours to inspect.
            </span>
          </li>
          <li className="flex gap-3">
            <Lock
              className="mt-0.5 h-5 w-5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">
                No tracking, no ads:
              </strong>{' '}
              Everything — editing, exporting, customizing — happens in your
              browser. There are no analytics scripts, no advertising cookies,
              and no third-party trackers watching what you do.
            </span>
          </li>
          <li className="flex gap-3">
            <Boxes
              className="mt-0.5 h-5 w-5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">
                Your data stays with you:
              </strong>{' '}
              The version in your browser is the real one. Cloud sync is a
              convenience, not a dependency. You can export a full backup, wipe
              everything, or delete your account at any time.
            </span>
          </li>
          <li className="flex gap-3">
            <Download
              className="mt-0.5 h-5 w-5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Free, genuinely:</strong>{' '}
              Not free-with-a-catch. Not a trial. Not ad-supported. Every
              feature is free for everyone and will stay that way. Donations
              help keep it running but are never required for anything.
            </span>
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="A bit of background">
        <p>
          ChessVision started as a personal tool — a faster, cleaner way to make
          chess diagrams without fighting with image editors or paying for
          software that does too much. It grew into something worth sharing, so
          it was open-sourced and made freely available to anyone who needs it.
        </p>
        <p>
          The people who use it most are writers, coaches, and content creators
          — people who need a clean diagram quickly and do not want to think
          about DPI settings, board colors, or file formats. That is the use
          case ChessVision is built around: fast, high-quality output with as
          little friction as possible.
        </p>
        <p>
          It is a small, focused project. There is no team behind it, no
          company, no venture capital. Just code, an open repository, and the
          people who occasionally fix things or suggest improvements.
        </p>
      </InfoCard>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
          At a glance
        </h3>
        <FactList>
          <FactRow icon={Info} label="Version" value={APP_VERSION} />
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
