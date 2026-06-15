import { type ReactNode } from 'react';

import { HelpCircle } from 'lucide-react';

import { CONTACT_EMAIL, REPO_ISSUES_URL } from '../aboutConstants';
import { FAQItem, Lead, SectionHeading } from '../parts';

/** A single frequently-asked question and its answer. */
const FAQS: Array<{ q: string; a: ReactNode }> = [
  {
    q: 'What is ChessVision for?',
    a: 'It is a tool for building chess positions and exporting them as high-quality images (PNG, JPEG, or SVG). It is a diagram and position editor — not a place to play games or analyse moves with an engine.'
  },
  {
    q: 'Do I need an account?',
    a: 'No. Every core feature works without signing in, and your data stays in your browser. An account is only needed if you want optional, end-to-end-encrypted cloud sync of your settings and history across devices.'
  },
  {
    q: 'Is it really free?',
    a: 'Yes. ChessVision is open source and core features are not paywalled. You can also run it yourself from the public source code.'
  },
  {
    q: 'What export formats and quality are available?',
    a: 'You can export PNG, JPEG, and SVG. Raster exports use print-oriented quality presets ranging from 300 DPI up to 1200 DPI at your chosen physical size, so diagrams stay sharp in print. You can also copy a diagram to the clipboard.'
  },
  {
    q: 'How do I enter a position?',
    a: 'You can drag and drop pieces onto the board, or paste a FEN string. The starting position is loaded by default, and FEN input is validated in real time so you get immediate feedback on mistakes.'
  },
  {
    q: 'Can I export several positions at once?',
    a: 'Yes. The advanced FEN page lets you enter multiple positions and batch-export them together, downloaded as a single ZIP archive.'
  },
  {
    q: 'Can I use the diagrams commercially?',
    a: 'Yes. Images you generate are yours to use, including in books, articles, lessons, and commercial work.'
  },
  {
    q: 'Why is a very high-resolution export slow?',
    a: 'Large exports require significant browser memory and processing. ChessVision moves heavy export work to a background worker to keep the interface responsive, but very large images still take time. If your device struggles, choose a smaller physical size or a lower-quality preset.'
  },
  {
    q: 'Which browsers are supported?',
    a: 'A current version of Chrome, Edge, Firefox, or Safari is recommended. Some very large export sizes are capped lower on Safari due to platform canvas limits.'
  },
  {
    q: 'Can I install it like an app?',
    a: 'Yes. ChessVision is a Progressive Web App, so most browsers let you add it to your home screen or desktop and launch it in its own window.'
  }
];

/** FAQ section: common questions about using ChessVision. */
export default function FaqSection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={HelpCircle} title="Frequently Asked Questions" />
        <Lead>
          Answers to the most common questions about ChessVision. If your
          question is not here, ask in{' '}
          <a
            href={REPO_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            GitHub issues
          </a>{' '}
          or email{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </Lead>
      </div>

      <div className="space-y-3">
        {FAQS.map((item) => (
          <FAQItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </div>
  );
}
