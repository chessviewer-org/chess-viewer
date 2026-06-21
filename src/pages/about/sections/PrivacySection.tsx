import { Shield } from 'lucide-react';

import { InfoCard, Lead, SectionHeading } from '../parts';

/**
 * Privacy section: a detailed, accurate description of what data ChessVision
 * does and does not handle, grounded in how the app is actually built —
 * browser-local storage, no tracking, end-to-end-encrypted optional sync, and
 * an explicit position-database lookup. It is transparent about the two things
 * that DO leave the device: the FEN you search, and encrypted sync blobs.
 */
export default function PrivacySection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={Shield} title="Privacy" />
        <Lead>
          ChessVision is built around a simple idea: your data is none of our
          business. Everything happens in your browser. There is no tracking, no
          analytics, and no ads — and if you never create an account, nothing
          about your positions ever leaves your device.
        </Lead>
      </div>

      <InfoCard title="What stays on your device">
        <p>
          Your positions, FEN history, favorites, board themes, and editor
          settings are all stored in your browser&apos;s local storage. When you
          edit a board or export an image, that work happens entirely in your
          browser — on your own CPU, in your own memory. Nothing is sent to a
          server to be rendered or processed.
        </p>
        <p>
          If you never sign in and never run a position-database search, nothing
          you do in ChessVision leaves your browser at all.
        </p>
      </InfoCard>

      <InfoCard title="No tracking, no ads, no analytics">
        <p>
          There are no third-party analytics scripts, no advertising cookies,
          and no tracking pixels. We do not know which positions you work on,
          how long you spend on the site, or what you export. The only storage
          ChessVision uses is the functional kind — remembering your settings
          and history so you do not have to start from scratch every time.
        </p>
      </InfoCard>

      <InfoCard title="Optional accounts and cloud sync">
        <p>
          You do not need an account. If you want your settings and history to
          follow you across devices, you can create one — and that is the only
          thing accounts are for.
        </p>
        <p>
          When you sign in, your data is synced to the cloud using Supabase.
          Every database table is protected by row-level security — your data is
          only readable by your own account, not by anyone else&apos;s, and not
          by us in any useful way. The architecture is owner-scoped by design:
          one account cannot access another&apos;s rows.
        </p>
        <p>
          Your browser copy is always the source of truth. Cloud sync is a
          convenience layer on top — if sync fails or you are offline, your
          local data is still intact.
        </p>
      </InfoCard>

      <InfoCard title="How your account is protected">
        <p>
          Sign-in and storage go through Supabase, which handles auth securely.
          You can enable two-factor authentication (2FA) for extra protection —
          we recommend it. If you ever want your account and all associated data
          deleted, email us and we will take care of it promptly.
        </p>
      </InfoCard>

      <InfoCard title="Position database searches">
        <p>
          If you use the database search feature, the FEN string of the position
          you are looking up gets sent to a server function that queries
          Lichess, PDB, and YACPDB on your behalf. Only the FEN leaves your
          device — no history, no account details, nothing else. And it only
          happens when you explicitly start a search. It never runs
          automatically in the background.
        </p>
      </InfoCard>

      <InfoCard title="Your data, your call">
        <p>
          You can export a full backup of your local data, import it back, or
          wipe it entirely from the Data Management section in Settings. If you
          want your account deleted along with any cloud data, email us at{' '}
          <a
            href="mailto:contact@chessvision.org"
            className="font-semibold text-accent hover:underline"
          >
            contact@chessvision.org
          </a>{' '}
          and we will remove everything.
        </p>
      </InfoCard>
    </div>
  );
}
