import { useCallback } from 'react';

import { Code2, Copy, Heart, Megaphone } from '@/assets/icons';

import { useNotifications } from '@/shared/hooks/useNotifications';

import { NotificationContainer } from '@/shared/ui/NotificationContainer';
import { CRYPTO_WALLETS, REPO_URL } from '../utils/aboutConstants';
import {
  ExternalLinkButton,
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';

export default function DonateSection() {
  const { notifications, success, error, removeNotification } =
    useNotifications();

  const copyWallet = useCallback(
    (address: string) => {
      void navigator.clipboard
        .writeText(address)
        .then(() => success('Wallet address copied'))
        .catch(() => error('Could not copy address'));
    },
    [success, error]
  );

  return (
    <div className="space-y-8 stagger-children">
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

      <InfoCard title="Donate with crypto">
        <p>Choose the matching network and check the address before sending.</p>
        <div className="space-y-4">
          {CRYPTO_WALLETS.map(({ label, address }) => (
            <div key={address} className="space-y-2">
              <h4 className="text-sm font-medium text-text-primary">{label}</h4>
              <div className="relative">
                <code className="block select-all break-all rounded-md border border-border bg-surface px-3 py-2 pr-12 font-mono text-sm text-text-primary leading-relaxed">
                  {address}
                </code>
                <button
                  type="button"
                  onClick={() => copyWallet(address)}
                  className="absolute top-1 right-1 inline-flex rounded p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-ring"
                  aria-label={`Copy ${label} wallet address to clipboard`}
                  title={`Copy ${label} wallet address`}
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
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
        <ExternalLinkButton href={REPO_URL} icon={Code2} className="mt-1">
          View the project on GitHub
        </ExternalLinkButton>
      </InfoCard>

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}
