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

import { APP_VERSION, LICENSE_NAME, REPO_URL } from '../aboutConstants';
import { FactList, FactRow, InfoCard, Lead, SectionHeading } from '../parts';

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
          ChessVision is a free tool for building chess positions and turning
          them into crisp, high-quality images. You set up a position on a board
          you can drag pieces around on, then save it as a picture you can drop
          into an article, a book, a lesson, a video, or a website. ChessVision
          runs in your web browser — there is nothing to install — and you can
          use it with full functionality without ever creating an account.
        </Lead>
      </div>

      <InfoCard title="What is ChessVision?">
        <p>
          Think of ChessVision as a workshop for chess diagrams. You place the
          pieces you want, choose how the board and pieces look, and export a
          clean image at exactly the size and quality you need. It is not a
          place to play games against an opponent or to use a computer to
          analyse your moves — there is no chess engine and no move suggestions.
          It does one job and tries to do it really well: produce accurate,
          good-looking chess positions you can use anywhere.
        </p>
        <p>
          Everything you need is free, and the project intends to keep it that
          way. There are no ads, the site does not track you, and nothing
          essential is locked behind a payment.
        </p>
      </InfoCard>

      <InfoCard title="Who is it for?">
        <p>
          ChessVision is built for anyone who needs a clear picture of a chess
          position:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-text-primary">Players</strong> who want to
            save a position from a game to study or share with friends,
          </li>
          <li>
            <strong className="text-text-primary">Coaches and teachers</strong>{' '}
            preparing worksheets, slides, and puzzles for lessons,
          </li>
          <li>
            <strong className="text-text-primary">Authors and bloggers</strong>{' '}
            who need print-ready diagrams for books, articles, and newsletters,
          </li>
          <li>
            <strong className="text-text-primary">
              Streamers and video makers
            </strong>{' '}
            who want sharp board images that look good on screen,
          </li>
          <li>
            <strong className="text-text-primary">Developers</strong> who want a
            quick, reliable way to generate board images.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="What can you do?">
        <p>Here is what ChessVision lets you do, in plain terms:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-text-primary">
              Set up a position by hand:
            </strong>{' '}
            Drag pieces onto the board, move them around, take them off, flip
            the board to see it from the other side, and enable or disable
            coordinates.
          </li>
          <li>
            <strong className="text-text-primary">
              Load a position from a FEN:
            </strong>{' '}
            FEN is simply the standard text shorthand for a chess position — a
            short line of letters and numbers that describes where every piece
            sits. Paste one in and the board updates instantly. ChessVision
            checks the text as you type and tells you if something is off, so
            you never export an impossible position.
          </li>
          <li>
            <strong className="text-text-primary">
              Export beautiful, high-resolution images:
            </strong>{' '}
            Save your position as a PNG, JPEG, or SVG. You can set the real
            physical size in centimetres and pick a print-quality level (from
            standard up to very high resolution), so the image is the right size
            and sharpness for whatever you are making — including print.
          </li>
          <li>
            <strong className="text-text-primary">Export many at once:</strong>{' '}
            Need a whole batch of diagrams? Export several positions together
            and download them all as a single ZIP file.
          </li>
          <li>
            <strong className="text-text-primary">Customize the board:</strong>{' '}
            Choose from many different piece designs and board-colour themes, or
            create a theme according to your own taste.
          </li>
          <li>
            <strong className="text-text-primary">
              Keep a history of your positions:
            </strong>{' '}
            ChessVision remembers positions you have worked on, lets you mark
            favourites, and keeps a clipboard history so you can come back to
            something you used earlier.
          </li>
          <li>
            <strong className="text-text-primary">
              Look a position up in chess databases:
            </strong>{' '}
            Curious whether a position has been seen before? ChessVision can
            search several public chess databases for you and link you straight
            to the result.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Your account is optional — and private">
        <p>
          You do not need an account to use ChessVision. Everything works
          straight away, and when you are signed out your settings and history
          simply live in your own browser on this device.
        </p>
        <p>
          If you do choose to create an account, the benefit is sync and
          superior security: your settings and history follow you from one
          device to another. Crucially, that synced data is{' '}
          <strong className="text-text-primary">end-to-end encrypted</strong>.
          That means it is scrambled on your device before it ever leaves it,
          and only you hold the key — we literally cannot read your positions or
          settings on our servers. If you want extra protection on your account,
          you can also turn on two-factor authentication.
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
              <strong className="text-text-primary">Open source:</strong> The
              full source code is public, so anyone can inspect it, learn from
              it, or improve it.
            </span>
          </li>
          <li className="flex gap-3">
            <Lock
              className="mt-0.5 h-5 w-5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Privacy first:</strong>{' '}
              Building positions and making images happens in your browser,
              there is no tracking and there are no ads, and optional cloud sync
              is end-to-end encrypted.
            </span>
          </li>
          <li className="flex gap-3">
            <Boxes
              className="mt-0.5 h-5 w-5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Your data is yours:</strong>{' '}
              The copy on your device is the real one; cloud sync is just a
              convenience on top, never a requirement.
            </span>
          </li>
          <li className="flex gap-3">
            <Download
              className="mt-0.5 h-5 w-5 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Forever free:</strong> No
              feature is paid. ChessVision will remain free and transparent
              forever.
            </span>
          </li>
        </ul>
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
            value="Optional, end-to-end encrypted"
          />
        </FactList>
      </div>
    </div>
  );
}
