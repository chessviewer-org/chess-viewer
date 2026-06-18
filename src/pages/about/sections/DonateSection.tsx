import { useCallback } from 'react';

import { Code2, Copy, Heart, Megaphone } from 'lucide-react';

import { useNotifications } from '@hooks';

import { NotificationContainer } from '@shared/ui';
import {
  CRYPTO_WALLET_ADDRESS,
  REPO_URL,
  SPONSORS_URL
} from '../aboutConstants';
import {
  Callout,
  ExternalLinkButton,
  InfoCard,
  Lead,
  SectionHeading
} from '../parts';

/**
 * Donate section: how to support the project financially, mirroring the
 * Sponsorship section of the main repo README. Kept honest — sponsorship is a
 * voluntary donation, not payment for work, and nothing is locked behind it.
 * The only channels shown are the two that actually exist: GitHub Sponsors and
 * a single EVM wallet address (USDT / USDC / ETH on the same address).
 */
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
          ChessVision is free and will stay free. A donation is voluntary, not
          payment for work — it helps fund ongoing maintenance, security and
          dependency updates, and infrastructure and hosting. Nothing is locked
          behind it, and contributing never requires payment. Currently, GitHub
          Sponsors and cryptocurrency payments are available.
        </Lead>
      </div>

      <InfoCard title="GitHub Sponsors">
        <p>
          You can also support the project through GitHub Sponsors. Either way,
          there are no special perks, premium tiers, or paywalls attached —
          every feature stays available to everyone regardless of whether you
          donate.
        </p>
        <div className="pt-1">
          <ExternalLinkButton
            href={SPONSORS_URL}
            icon={Heart}
            variant="primary"
          >
            Sponsor on GitHub
          </ExternalLinkButton>
        </div>
      </InfoCard>

      <InfoCard title="Crypto (USDT / USDC / ETH)">
        <p>
          You can send USDT, USDC, or ETH to the single EVM wallet address below
          — the same address works for all three. Always double-check the
          address before sending.
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
            <span>Share ChessVision with people who make chess diagrams.</span>
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
