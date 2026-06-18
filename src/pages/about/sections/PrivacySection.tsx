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
          ChessVision is designed not to use your data. Your data is stored in
          your browser; there is no tracking; and the two things that ever leave
          your device — a position-database search and optional cloud sync — are
          limited and, in the case of sync, encrypted so that not even the
          server can read it.
        </Lead>
      </div>

      <InfoCard title="What stays on your device">
        <p>
          Your positions, FEN history, favorites, theme choices, and editor
          preferences are stored in your browser&apos;s local storage. Board
          editing and image export run entirely in your browser using the canvas
          and background web workers — your positions are never uploaded
          anywhere to be rendered or exported.
        </p>
        <p>
          Your local copy is the source of truth. If you never sign in and never
          run a position-database search, nothing about your positions leaves
          the browser at all.
        </p>
      </InfoCard>

      <InfoCard title="No tracking, no analytics, no ads">
        <p>
          ChessVision does not include third-party analytics, advertising, or
          tracking scripts. We do not build a profile of you, and there are no
          advertising cookies. The only browser storage used is the functional
          storage needed to remember your settings and history.
        </p>
      </InfoCard>

      <InfoCard title="Optional accounts and cloud sync">
        <p>
          If you choose to create an account, it is used for sign-in and for
          syncing your preferences and history across your devices. Sync is
          optional — if you never sign in, none of this applies.
        </p>
        <p>
          When sync is enabled, your synced data is{' '}
          <strong className="text-text-primary">end-to-end encrypted</strong> in
          your browser before it is uploaded. What is stored on the server is
          only an unreadable or undecryptable encrypted data block.
        </p>
      </InfoCard>

      <InfoCard title="How accounts are protected">
        <p>
          Authentication and storage are handled by Supabase. Every database
          table is protected by row-level security that only allows access to
          the owning user, so one account cannot read another&apos;s data.
          Accounts can enable two-factor authentication (2FA) for an extra layer
          of protection.
        </p>
      </InfoCard>

      <InfoCard title="Position database lookups">
        <p>
          When you explicitly run a position-database search, the FEN string of
          that position is sent to a function that queries the Lichess, PDB, and
          YACPDB databases on your behalf. Only the FEN string leaves your
          device — no account, history, or other data is attached — and this
          only happens when you start a search. It is never done in the
          background.
        </p>
      </InfoCard>

      <InfoCard title="Your data, your control">
        <p>
          You can export a full backup of your local data, import it again, or
          reset it from the Data Management section in Settings. To delete your
          account and any associated cloud data, email us and we will remove it.
        </p>
      </InfoCard>
    </div>
  );
}
