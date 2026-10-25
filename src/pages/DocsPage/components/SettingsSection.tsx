import { Settings } from '@/assets/icons';

import {
  InfoCard,
  Lead,
  SectionHeading
} from '@/components/layout/Sidebar/SectionParts';
import { CONTACT_EMAIL } from '@/pages/AboutPage/utils/aboutConstants';
import { Bullets, DocTable, PageLink, Term, type DocRow } from './DocsParts';

const SETTINGS: readonly DocRow[] = [
  {
    id: 'account',
    cells: ['Account', 'Display name, membership and cloud sync.']
  },
  {
    id: 'appearance',
    cells: [
      'Appearance',
      'Light, Dark or System theme; Default or High contrast.'
    ]
  },
  {
    id: 'board-style',
    cells: [
      'Board Style',
      'Square colours and piece set for the board and exports.'
    ]
  },
  {
    id: 'accessibility',
    cells: [
      'Accessibility',
      'Colour vision mode (deuteranopia, protanopia, tritanopia), reduced motion and drag sensitivity.'
    ]
  },
  {
    id: 'security',
    cells: [
      'Security',
      'Two-factor authentication, recent sign-in activity, confirmation for destructive actions and hiding sensitive details. Signed-in accounts only.'
    ]
  },
  {
    id: 'data-management',
    cells: [
      'Data Management',
      'Export and import a JSON backup, clear FEN history or reset all data.'
    ]
  }
];

export default function SettingsSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={Settings} title="Settings and account" />
        <Lead>
          <PageLink href="/settings">Settings</PageLink> holds your preferences,
          your data and, if you sign in, your account and security.
        </Lead>
      </div>

      <InfoCard title="Settings pages">
        <DocTable head={['Page', 'What it controls']} rows={SETTINGS} />
      </InfoCard>

      <InfoCard title="Backups">
        <Bullets>
          <li>
            <Term>Export Data</Term> downloads a JSON backup of your boards,
            history and preferences from this browser.
          </li>
          <li>
            <Term>Import Data</Term> restores a backup; keys in the file replace
            the current ones.
          </li>
          <li>
            Clearing browser data removes everything stored locally. Export a
            backup first or use an account.
          </li>
        </Bullets>
      </InfoCard>

      <InfoCard title="Accounts and sync">
        <Bullets>
          <li>
            An account is optional. Create one under{' '}
            <PageLink href="/auth/sign-up">Sign Up</PageLink> to sync history
            and settings across devices; your existing local data is moved to
            the cloud on the first sign-in.
          </li>
          <li>
            Data is stored in Supabase with row-level security: only your
            account can read or write your rows.
          </li>
          <li>
            Turn on <Term>two-factor authentication</Term> under Security for
            extra protection. Sign-in then asks for a code from your
            authenticator app.
          </li>
          <li>
            To delete your account and all cloud data, email{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-accent hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </li>
        </Bullets>
      </InfoCard>
    </div>
  );
}
