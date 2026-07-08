import { Shield } from '@/assets/icons';

import { CONTACT_EMAIL } from '../utils/aboutConstants';
import { InfoCard, Lead, SectionHeading } from './parts';

export default function PrivacySection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading
          icon={Shield}
          title="Privacy: your data is none of our business"
        />
        <Lead>
          ChessViewer is built on a simple, transparent idea: your personal
          information and what you do here is absolutely none of our business.
          Everything happens right in your browser. There is no tracking code,
          no analytics, no ads on the site. If you never sign up for an account,
          not a single scrap of data about the positions you build ever leaves
          your device.
        </Lead>
      </div>

      <InfoCard title="What stays on your device (local)?">
        <p>
          The positions you build, your FEN history, your favorites, the board
          colors you pick, and all your style settings are stored entirely in
          your browser&apos;s local storage. When you change something on the
          board or export an image, that happens using your own computer&apos;s
          memory and processor. No image or data gets sent to an outside server
          to be rendered.
        </p>
        <p>
          In short, as long as you do not create an account, nothing you do ever
          leaves your browser.
        </p>
      </InfoCard>

      <InfoCard title="No tracking, no ads, no analytics, period">
        <p>
          There is no third-party analytics script, no advertising cookies, no
          tracking pixels running in the background. We do not know which
          positions you are working on, how much time you spend on the site, or
          what you export. The only kind of storage ChessViewer uses in your
          browser is functional — it just remembers your history so you do not
          start from zero every time you come back.
        </p>
      </InfoCard>

      <InfoCard title="Optional accounts and cloud sync">
        <p>
          To say it again: you do not need an account to use the project.
          Creating one only makes sense if you want your settings and history to
          sync across devices — say, from your phone to your computer. That is
          the one and only reason accounts exist.
        </p>
        <p>
          When you sign in, your data syncs to the cloud through Supabase. Every
          table in Supabase is protected by row-level security. That means only
          you can read your own data — not other users, and not us either. The
          architecture is built so nobody can reach anyone else&apos;s data.
        </p>
        <p>
          Remember, the copy in your browser is always the primary one. The
          cloud is just a convenience layered on top. Even if your internet
          drops, your local data stays intact and you keep working offline.
        </p>
      </InfoCard>

      <InfoCard title="How is your account protected?">
        <p>
          Sign-in and data storage run directly through Supabase. You can turn
          on Two-Factor Authentication (2FA) on your account for extra
          protection — we strongly recommend it.
        </p>
      </InfoCard>

      <InfoCard title="External database searches">
        <p>
          If you use the &quot;database search&quot; feature on the site, only
          the FEN code of the position you are looking up gets sent, on your
          behalf, to external databases like Lichess and ChessDB. The ONLY thing
          that leaves your device is that short FEN code — not your history, not
          your account details, nothing else. And this only ever happens when
          you press the search button yourself. The site never searches those
          databases on its own in the background.
        </p>
      </InfoCard>

      <InfoCard title="Your data, your call">
        <p>
          You can download a full backup of all your local data from the
          &quot;Data Management&quot; section in Settings, restore it whenever
          you want, or wipe it completely with one click. If you want your
          account and all your cloud data deleted for good, email us at{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>{' '}
          and we will remove everything right away.
        </p>
      </InfoCard>
    </div>
  );
}
