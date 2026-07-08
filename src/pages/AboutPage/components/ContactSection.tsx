import { Bug, Mail, MessageSquare, ShieldAlert } from '@/assets/icons';

import {
  CONTACT_EMAIL,
  REPO_DISCUSSIONS_URL,
  REPO_ISSUES_URL
} from '../utils/aboutConstants';
import {
  ExternalLinkButton,
  InfoCard,
  Lead,
  MailButton,
  SectionHeading
} from './parts';

export default function ContactSection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={Mail} title="Contact" />
        <Lead>
          Use whichever channel makes sense for what you need. GitHub is best
          for bugs, ideas, and questions that others might benefit from seeing.
          Email is for private matters.
        </Lead>
      </div>

      <InfoCard title="Found a bug or have a feature idea?">
        <p>
          Open a GitHub issue. That is where bugs get tracked and fixed, and
          where feature requests get discussed. If it is a bug, include your
          browser, what you were doing, and what went wrong — the more specific,
          the faster it gets fixed.
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

      <InfoCard title="Have a question or want to share feedback?">
        <p>
          GitHub Discussions is the right place for questions that are not
          strictly bugs — &quot;how do I do X&quot;, &quot;would it make sense
          to add Y&quot;, or just general feedback. It is a public thread, so
          the answer helps anyone who searches for the same thing later.
        </p>
        <div className="pt-1">
          <ExternalLinkButton href={REPO_DISCUSSIONS_URL} icon={MessageSquare}>
            Start a discussion
          </ExternalLinkButton>
        </div>
      </InfoCard>

      <InfoCard title="Email">
        <p>
          For anything private — account help, deletion requests, or something
          you would rather not post publicly — email us directly. We aim to
          reply within a few days.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <MailButton email={CONTACT_EMAIL} icon={Mail}>
            {CONTACT_EMAIL}
          </MailButton>
        </div>
      </InfoCard>

      <InfoCard title="Found a security vulnerability?">
        <p>
          Please do not post it publicly. Security issues should be reported
          privately so they can be fixed before anyone is exposed. Email us with
          the details — we take security reports seriously and will respond
          quickly.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <MailButton
            email={CONTACT_EMAIL}
            subject="Security report"
            icon={ShieldAlert}
          >
            Report privately by email
          </MailButton>
        </div>
      </InfoCard>
    </div>
  );
}
