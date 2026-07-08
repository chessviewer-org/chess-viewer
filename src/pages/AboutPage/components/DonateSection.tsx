import { useCallback } from 'react';

import { Code2, Copy, Heart, Megaphone } from '@/assets/icons';

import { useNotifications } from '@/shared/hooks';

import { NotificationContainer } from '@shared/ui';
import { CRYPTO_WALLET_ADDRESS, REPO_URL } from '../utils/aboutConstants';
import {
  Callout,
  ExternalLinkButton,
  InfoCard,
  Lead,
  SectionHeading
} from './parts';

export default function DonateSection() {
  const { notifications, success, error, removeNotification } =
    useNotifications();

  const copyWallet = useCallback(() => {
    void navigator.clipboard
      .writeText(CRYPTO_WALLET_ADDRESS)
      .then(() => success('Wallet address copied'))
      .catch(() => error('Could not copy address'));
  }, [success, error]);

  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={Heart} title="Donate" />
        <Lead>
          First, the important part: ChessViewer is completely free and will
          always stay that way. No ads on the site, no &quot;Premium&quot;
          subscription, no hidden feature locked behind a paywall. If this tool
          has saved you time and you would like to support the project, we would
          genuinely appreciate it. But it is never required or expected.
        </Lead>
      </div>

      <InfoCard title="Why do we take donations?">
        <p>
          To be upfront, right now we are only paying the domain cost out of
          pocket, and running everything else on free tiers. But as the project
          grows and more people use it, our database&apos;s free tier is bound
          to fill up eventually and we will have to move to a paid plan. Any
          small donation you make helps cover both our current domain cost and
          those database and server costs that are coming down the road.
        </p>
      </InfoCard>

      <InfoCard title="Sponsor badge">
        <p>
          Supporting us financially does not unlock some hidden premium feature
          — every feature is already completely free for everyone. If you
          donate, it is simply because you find the project useful.
        </p>
        <p>
          That said, to not leave your support unacknowledged, we add a 1-month
          Sponsor Badge to your account. There are 4 different badge tiers
          depending on how much you give. Keep in mind this is not a social
          platform, so no one but you will ever see this badge — it is just our
          personal, visual way of saying &quot;thank you&quot; when you log in,
          for helping keep the project running.
        </p>
      </InfoCard>

      <InfoCard title="Crypto (USDT / USDC / ETH)">
        <p>
          If you would rather support us with crypto, you can send USDT, USDC,
          or ETH to the single EVM wallet address below — the same address works
          for all three. Just double-check the address before you send anything.
        </p>
        <Callout>
          <div className="flex items-stretch gap-2">
            <code className="min-w-0 flex-1 select-all break-all rounded-xl border border-border bg-surface px-4 py-3 font-mono text-base text-text-primary">
              {CRYPTO_WALLET_ADDRESS}
            </code>
            <button
              type="button"
              onClick={copyWallet}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              aria-label="Copy crypto wallet address to clipboard"
              title="Copy wallet address"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Copy</span>
            </button>
          </div>
        </Callout>
      </InfoCard>

      <InfoCard title="Other ways to support, for free">
        <p>
          Money is not the only way to help. Contributing code, writing good bug
          reports, improving the documentation, and simply telling other chess
          players about the tool all make a real difference.
        </p>
        <ul className="space-y-3 pt-1">
          <li className="flex gap-3">
            <Code2
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>Contribute on GitHub.</span>
          </li>
          <li className="flex gap-3">
            <Megaphone
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>Share ChessViewer with people who make chess diagrams.</span>
          </li>
        </ul>
        <div className="pt-1">
          <ExternalLinkButton href={REPO_URL} icon={Code2}>
            View the project on GitHub
          </ExternalLinkButton>
        </div>
      </InfoCard>

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}
