import { type ReactNode } from 'react';

import { HelpCircle } from 'lucide-react';

import { CONTACT_EMAIL, REPO_ISSUES_URL } from '../aboutConstants';
import { FAQItem, Lead, SectionHeading } from '../parts';

/** A single frequently-asked question and its answer. */
const FAQS: Array<{ q: string; a: ReactNode }> = [
  {
    q: 'What is ChessVision for?',
    a: 'It is a diagram editor. You build a chess position, make it look the way you want, and export it as a high-quality image. That is it — no engine, no opponent, no analysis. Just a clean way to turn a position into a picture you can use anywhere.'
  },
  {
    q: 'Do I need an account?',
    a: 'No. Every feature works without one. Your positions, history, and settings are saved in your browser on this device. An account is only useful if you want to sync that data across multiple devices — and even then it is completely optional.'
  },
  {
    q: 'Is it really free?',
    a: 'Yes, genuinely. Not "free with limits", not a trial, not ad-supported. Every feature is available to everyone at no cost. ChessVision is open source and the code is public on GitHub — you can run your own instance if you want.'
  },
  {
    q: 'What export formats and sizes are available?',
    a: 'PNG, JPEG, and SVG. For PNG and JPEG you set the physical size in centimetres and pick a quality preset — from 300 DPI up to 1200 DPI — so you can produce a diagram that is sharp in print, not just on screen. You can also copy directly to clipboard.'
  },
  {
    q: 'How do I enter a position?',
    a: 'Two ways: drag pieces from the palette onto the board, or paste a FEN string into the input field. FEN is the standard text format chess players use to describe positions — most chess sites and databases can give you one. ChessVision validates it as you type.'
  },
  {
    q: 'Can I export several positions at once?',
    a: 'Yes. The Advanced FEN page lets you paste in multiple FEN strings and export them all together. You get a single ZIP file with every diagram inside, named and ready to use.'
  },
  {
    q: 'Can I use the diagrams in commercial work?',
    a: 'Yes. The images you generate are yours. Use them in books, articles, courses, videos, client work — whatever you need. There are no licensing restrictions on the output.'
  },
  {
    q: 'Why is a very large export slow?',
    a: 'High-resolution exports — especially at large physical sizes — require a lot of memory and processing. ChessVision offloads the heavy work to a background thread to keep the page responsive, but there is no way around the fact that a 1200 DPI image at A4 size is a large computation. If it is struggling, try a lower DPI preset or a smaller size.'
  },
  {
    q: 'Which browsers work?',
    a: 'Chrome, Edge, Firefox, and Safari — current versions. Everything works in all four. The one exception is very large canvas sizes, which Safari caps lower than other browsers due to a platform limit. If you are exporting for print, Chrome or Edge will give you the most headroom.'
  },
  {
    q: 'Can I install it like an app?',
    a: 'Yes. ChessVision is a Progressive Web App. Most browsers will offer an "Install" or "Add to home screen" option, which lets you launch it in its own window without going through a browser tab. It also works offline once installed.'
  },
  {
    q: 'What is a FEN string?',
    a: 'FEN stands for Forsyth-Edwards Notation. It is a compact text format that describes a chess position — where every piece is, whose turn it is, and a few other details. It looks something like "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1". Every major chess site and database can export positions as FEN, and ChessVision can read them directly.'
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
