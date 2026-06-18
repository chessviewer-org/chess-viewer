import {
  BookOpen,
  Bug,
  Code2,
  GitPullRequest,
  Languages,
  Scale
} from 'lucide-react';

import {
  LICENSE_NAME,
  REPO_CONTRIBUTING_URL,
  REPO_DOCS_URL,
  REPO_ISSUES_URL,
  REPO_LICENSE_URL,
  REPO_URL
} from '../aboutConstants';
import { ExternalLinkButton, InfoCard, Lead, SectionHeading } from '../parts';

/**
 * Contribute section: the source code, the license, and concrete ways to help.
 * This is distinct from the Donate section — code/issue contributions live here.
 */
export default function ContributeSection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={Code2} title="Contribute" />
        <Lead>
          ChessVision is open source and built in public. Whether you write
          code, report bugs, improve documentation, or help with translations,
          there is a way to contribute.
        </Lead>
      </div>

      <InfoCard title="The source code">
        <p>
          The entire application is public on GitHub. It is a React 19 and
          TypeScript app built with Vite and Tailwind CSS, with a Supabase
          backend. You can read it, clone it, run it locally, and open pull
          requests.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <ExternalLinkButton href={REPO_URL} icon={Code2} variant="primary">
            View source on GitHub
          </ExternalLinkButton>
          <ExternalLinkButton href={REPO_DOCS_URL} icon={BookOpen}>
            Read the docs
          </ExternalLinkButton>
        </div>
      </InfoCard>

      <InfoCard title="License">
        <p>
          ChessVision is licensed under the{' '}
          <strong className="text-text-primary">{LICENSE_NAME}</strong>. In
          short, you are free to use, study, modify, and share it — but if you
          run a modified version, you must make your source available under the
          same license.
        </p>
        <div className="pt-1">
          <ExternalLinkButton href={REPO_LICENSE_URL} icon={Scale}>
            Read the license
          </ExternalLinkButton>
        </div>
      </InfoCard>

      <InfoCard title="Ways to help">
        <ul className="space-y-3">
          <li className="flex gap-3">
            <GitPullRequest
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Write code.</strong> Pick up
              an open issue, fix a bug, or build a feature, then open a pull
              request. Start with the contributing guide for setup and
              conventions.
            </span>
          </li>
          <li className="flex gap-3">
            <Bug
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Report bugs.</strong> Clear,
              reproducible bug reports are genuinely valuable. Include your
              browser and the steps to reproduce.
            </span>
          </li>
          <li className="flex gap-3">
            <BookOpen
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">
                Improve documentation.
              </strong>{' '}
              Fixing unclear wording, gaps, or typos in the docs helps everyone
              who comes after you.
            </span>
          </li>
          <li className="flex gap-3">
            <Languages
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Spread the word.</strong>{' '}
              Telling other chess players, coaches, and authors about the tool
              helps the project grow.
            </span>
          </li>
        </ul>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <ExternalLinkButton
            href={REPO_CONTRIBUTING_URL}
            icon={GitPullRequest}
          >
            Contributing guide
          </ExternalLinkButton>
          <ExternalLinkButton href={REPO_ISSUES_URL} icon={Bug}>
            Browse open issues
          </ExternalLinkButton>
        </div>
      </InfoCard>
    </div>
  );
}
