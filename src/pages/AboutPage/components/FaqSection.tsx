import { type ReactNode } from 'react';

import { HelpCircle } from '@/assets/icons';

import { CONTACT_EMAIL, REPO_ISSUES_URL } from '../utils/aboutConstants';
import { FAQItem, Lead, SectionHeading } from './parts';

const FAQS: Array<{ q: string; a: ReactNode }> = [
  {
    q: 'What does ChessViewer actually do?',
    a: "It's simply a diagram editor. You build a chess position, style it how you like, and download it as a high-quality image for print or screen. That means there's no opponent to play against, no AI suggesting moves, no analysis engine inside. It's purely built to turn chess positions into clean, sharp images."
  },
  {
    q: 'Do I need to sign up to use it?',
    a: 'Not at all. Every feature works perfectly without an account. The positions you build, your search history, and your style settings are saved right on your own device (in your browser). You only need an account if you want that same data to follow you across devices — say, both your computer and your phone.'
  },
  {
    q: 'Is it really completely free?',
    a: 'Yes, all the way through. No "trial version", no "Premium feature", no ads cluttering the screen. Every single feature is completely free for everyone. ChessViewer is open source and all the code is on GitHub.'
  },
  {
    q: 'What formats and sizes can I download images in?',
    a: 'PNG, JPEG, and SVG. For PNG and JPEG you can even set the physical size in centimeters and push the quality up to 1200 DPI, print-shop level. That way your diagram looks sharp as glass whether it’s on screen or printed on paper. You can also copy it straight to the clipboard instead of downloading.'
  },
  {
    q: 'How do I add a position to the board?',
    a: 'Two really easy ways: either grab pieces from the palette and drag them onto the board, or paste a FEN string you already have into the box on screen. The moment you paste it, ChessViewer checks it and places it on the board without any errors.'
  },
  {
    q: 'Can I download several different positions at once (bulk export)?',
    a: "Yes! Head to the Advanced FEN page for that. Paste in a bunch of different FEN strings, hit the button, and the system neatly names each one and hands you back a single ZIP file. A must-have if you're writing a book or a course."
  },
  {
    q: 'Can I use the images I make for commercial work?',
    a: 'Of course. Those images are entirely yours. Use them freely in your book, your article, a paid course, YouTube videos, or client work. We place no license or copyright restriction on the output whatsoever.'
  },
  {
    q: 'Why does the site slow down on very large images?',
    a: "Producing an A4-size image at 1200 DPI is a heavy computation that demands a lot from your computer's memory (RAM) and processor. We run that heavy work in the background so the site doesn't freeze, but computations that big still take a bit of time regardless. If your browser is struggling, try dropping the DPI or the size a notch."
  },
  {
    q: 'Which browsers does it support?',
    a: "It works flawlessly on Chrome, Edge, Firefox, and Safari. There's one small exception: because of Safari's own internal limits, exporting very large (high-DPI) images can sometimes be an issue there. So for heavy print jobs, using Chrome or Edge will give you more headroom."
  },
  {
    q: 'Can I install ChessViewer as an app on my computer or phone?',
    a: 'Yes, because ChessViewer is also a PWA (Progressive Web App). Your browser will automatically offer you an "Install" or "Add to home screen" option. Do that, and it opens as a fully standalone app — and it’ll keep working perfectly even offline.'
  },
  {
    q: 'What is a FEN string?',
    a: 'FEN (Forsyth-Edwards Notation) is the standard format that packs any chess position into a single short line of text that computers and programs can understand. It records where every piece sits, whose turn it is, and a few other small details. A move looks something like this: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1". Every chess site and database out there supports the FEN format.'
  }
];

export default function FaqSection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={HelpCircle} title="Frequently Asked Questions" />
        <Lead>
          Answers to the most common questions about ChessViewer. If your
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
