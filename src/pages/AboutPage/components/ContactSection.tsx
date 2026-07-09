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
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={Mail} title="Contact" />
        <Lead>
          When you want to tell us something about the project, picking the
          right channel makes life easier for both of us. Short version: use
          GitHub for anything technical that other people could benefit from
          reading, and email for things that are just about you personally.
        </Lead>
      </div>

      <InfoCard title="Found a bug or have a new idea?">
        <p>
          Something not working, or a nice idea popped into your head like
          &quot;it&apos;d be great if it also did X&quot;? The best place for
          that is opening a GitHub issue. If you&apos;re reporting a bug, please
          write down which browser you&apos;re using and walk through how the
          bug happened. The more detail you give us, the faster we can fix it.
        </p>
        <ExternalLinkButton
          href={REPO_ISSUES_URL}
          icon={Bug}
          variant="primary"
          className="mt-1"
        >
          Open a GitHub issue
        </ExternalLinkButton>
      </InfoCard>

      <InfoCard title="Got a question or want to discuss something?">
        <p>
          For general questions and thoughts that aren&apos;t really bugs —
          things like &quot;how do I do this?&quot; or &quot;what if we added a
          feature like that?&quot; — GitHub Discussions is the better fit. Think
          of it as an open forum: the question you ask and the answer you get
          will help someone else running into the same thing later.
        </p>
        <ExternalLinkButton
          href={REPO_DISCUSSIONS_URL}
          icon={MessageSquare}
          className="mt-1"
        >
          Start a discussion
        </ExternalLinkButton>
      </InfoCard>

      <InfoCard title="For personal matters (email)">
        <p>
          If something only concerns you — an account issue, a deletion request,
          or anything personal you would rather not post publicly — you can
          email us directly. We try to read and reply as quickly as we can.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <MailButton email={CONTACT_EMAIL} icon={Mail}>
            {CONTACT_EMAIL}
          </MailButton>
        </div>
      </InfoCard>

      <InfoCard title="Found a serious security issue?">
        <p>
          If you have found a serious security vulnerability, please do not post
          it publicly anywhere, GitHub included. We need to fix the problem
          before anyone can take advantage of it. Send security reports straight
          to our email — we take these very seriously and will act on them as
          fast as possible.
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
