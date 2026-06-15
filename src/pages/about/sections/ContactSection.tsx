import { Bug, Mail, MessageSquare, ShieldAlert } from 'lucide-react';

import {
  CONTACT_EMAIL,
  REPO_DISCUSSIONS_URL,
  REPO_ISSUES_URL
} from '../aboutConstants';
import {
  ExternalLinkButton,
  InfoCard,
  Lead,
  MailButton,
  SectionHeading
} from '../parts';

/**
 * Contact section: how to reach the project, routed by purpose so people land
 * in the right place (bug reports, questions, security, or general email).
 */
export default function ContactSection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={Mail} title="Contact" />
        <Lead>
          The best channel depends on what you need. For most questions, the
          public GitHub project is the fastest way to get a useful answer; for
          private or account matters, email works best.
        </Lead>
      </div>

      <InfoCard title="Report a bug or request a feature">
        <p>
          If something is broken or you have an idea, open a GitHub issue. When
          reporting a bug, include the FEN string you were using, your browser
          and version, and the steps to reproduce it — that makes a fix much
          faster.
        </p>
        <div className="pt-1">
          <ExternalLinkButton
            href={REPO_ISSUES_URL}
            icon={Bug}
            variant="primary"
          >
            Open a GitHub issue
          </ExternalLinkButton>
        </div>
      </InfoCard>

      <InfoCard title="Ask a question or share feedback">
        <p>
          For general questions, ideas, and discussion, use GitHub Discussions.
          This is the place for &quot;how do I…&quot; and &quot;what
          about…&quot; questions that are not necessarily bugs.
        </p>
        <div className="pt-1">
          <ExternalLinkButton href={REPO_DISCUSSIONS_URL} icon={MessageSquare}>
            Join the discussion
          </ExternalLinkButton>
        </div>
      </InfoCard>

      <InfoCard title="Email">
        <p>
          For private matters, account help, account deletion, or anything that
          does not belong in public, email us directly. We aim to reply within a
          few days.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <MailButton email={CONTACT_EMAIL} icon={Mail}>
            {CONTACT_EMAIL}
          </MailButton>
        </div>
      </InfoCard>

      <InfoCard title="Reporting a security issue">
        <p>
          If you believe you have found a security vulnerability, please do not
          post it publicly. Email{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Security report')}`}
            className="font-semibold text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>{' '}
          with the subject &quot;Security report&quot; and details of the issue,
          and give us a reasonable chance to address it before disclosure.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <MailButton
            email={CONTACT_EMAIL}
            subject="Security report"
            icon={ShieldAlert}
          >
            Report a security issue
          </MailButton>
        </div>
      </InfoCard>
    </div>
  );
}
