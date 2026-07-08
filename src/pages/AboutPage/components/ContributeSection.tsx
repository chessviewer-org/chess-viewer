import {
  BookOpen,
  Bug,
  Code2,
  GitPullRequest,
  Languages,
  Scale
} from '@/assets/icons';

import {
  LICENSE_NAME,
  REPO_CONTRIBUTING_URL,
  REPO_DOCS_URL,
  REPO_ISSUES_URL,
  REPO_LICENSE_URL,
  REPO_URL
} from '../utils/aboutConstants';
import { ExternalLinkButton, InfoCard, Lead, SectionHeading } from './parts';

export default function ContributeSection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={Code2} title="Contribute" />
        <Lead>
          ChessViewer is fully open source and develops out in the open. The
          code lives on GitHub — anyone can read it, run it on their own
          machine, and make it better. If you have ever wanted to contribute to
          a real, working project that people actually use, this is a great
          place to start.
        </Lead>
      </div>

      <InfoCard title="The tech (source code)">
        <p>
          The project&apos;s architecture is simple and modern: it is built with
          Preact and TypeScript, bundled with Vite, and styled with Tailwind
          CSS. Backend work like auth and sync is handled by Supabase. The
          codebase is documented clearly enough that finding your way around
          should not take long.
        </p>
        <p>
          You can clone it and run it locally with a single command. None of the
          core features, like the chess board itself, need any hidden API key.
          Supabase keys are only needed for auth and cloud features — and even
          those are optional anyway.
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
          ChessViewer is licensed under the{' '}
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
              <strong className="text-text-primary">Write code.</strong> Browse
              the open issues, pick something that interests you, and open a
              pull request. The contributing guide covers how to set up the
              project locally and the conventions the codebase follows. First
              contributions are welcome — there are issues labeled accordingly.
            </span>
          </li>
          <li className="flex gap-3">
            <Bug
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Report bugs.</strong> A
              clear, reproducible bug report is genuinely one of the most useful
              things you can do. Include your browser, what you were doing, and
              what happened versus what you expected. Screenshots help.
            </span>
          </li>
          <li className="flex gap-3">
            <BookOpen
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">Improve the docs.</strong>{' '}
              If something in the documentation is unclear, missing, or just
              wrong — fix it. Small improvements add up and help everyone who
              comes after you.
            </span>
          </li>
          <li className="flex gap-3">
            <Languages
              className="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span>
              <strong className="text-text-primary">
                Tell people about it.
              </strong>{' '}
              If ChessViewer has saved you time, mention it. Share it with a
              coach, a chess blogger, a teacher who makes worksheets. Word of
              mouth is how small open-source tools grow.
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
