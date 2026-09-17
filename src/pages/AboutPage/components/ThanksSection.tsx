import { type ReactNode } from 'react';

import { HeartHandshake } from '@/assets/icons';

import { Lead, SectionHeading } from './parts';

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded"
    >
      {children}
    </a>
  );
}

export default function ThanksSection() {
  return (
    <div className="space-y-8 stagger-children">
      <div className="space-y-3">
        <SectionHeading icon={HeartHandshake} title="Thanks" />
        <Lead>
          ChessViewer is built with open source, and it tries to support open
          source in return. None of it would exist without the projects, tools,
          and communities below — thank you to everyone who builds and maintains
          them.
        </Lead>
      </div>

      <div className="space-y-5 text-base leading-relaxed text-text-secondary">
        <p>
          The interface is a <Ext href="https://preactjs.com">Preact</Ext> app
          written in <Ext href="https://www.typescriptlang.org">TypeScript</Ext>
          , built with <Ext href="https://vitejs.dev">Vite</Ext>, and styled
          with <Ext href="https://tailwindcss.com">Tailwind CSS</Ext>. Fast
          navigation between pages is handled by{' '}
          <Ext href="https://github.com/molefrog/wouter">wouter</Ext>, and the
          page transitions are hand-written in plain CSS. The board&apos;s
          interactivity — grabbing a piece and dropping it wherever you want —
          runs on our own custom drag-and-drop system built on the{' '}
          <Ext href="https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events">
            Pointer Events API
          </Ext>
          .
        </p>
        <p>
          For long lists (like your FEN history) to scroll smoothly without
          freezing the browser, we use our own custom system built on{' '}
          <Ext href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API">
            IntersectionObserver
          </Ext>
          , the icons around the site come from{' '}
          <Ext href="https://lucide.dev">Lucide</Ext>, and the QR codes for
          Two-Factor Authentication (2FA) are rendered with{' '}
          <Ext href="https://github.com/nuintun/uqr">uqr</Ext>. All account
          handling, auth, and cloud sync are entrusted to{' '}
          <Ext href="https://supabase.com">Supabase</Ext>.
        </p>
        <p>
          The app is packaged with{' '}
          <Ext href="https://www.docker.com">Docker</Ext> and served by{' '}
          <Ext href="https://nginx.org">nginx</Ext>. The position-database
          search would not be possible without the open chess data published by{' '}
          <Ext href="https://lichess.org">Lichess</Ext> and{' '}
          <Ext href="https://chessdb.cn/queryc_en/">ChessDB</Ext>, together with
          the problem collections at{' '}
          <Ext href="https://pdb.dieschwalbe.de">PDB (Problemdatenbank)</Ext>{' '}
          and <Ext href="https://www.yacpdb.org">YACPDB</Ext>.
        </p>

        <p>
          A special thanks goes to the open-source contributors who have helped
          shape the project at{' '}
          <Ext href="https://github.com/chessviewer-org/chess-viewer">
            chessviewer-org/chess-viewer
          </Ext>
          , including <Ext href="https://github.com/vektorhub">vektorhub</Ext>,{' '}
          <Ext href="https://github.com/yu102118">yu102118</Ext>, and{' '}
          <Ext href="https://github.com/iccccccccccccc">iccccccccccccc</Ext>,
          whose efforts have directly improved the codebase and the community.
        </p>

        <p>
          Finally, thank you to everyone who reports bugs, suggests
          improvements, contributes code, and simply uses ChessViewer. The
          project is better because of the community around it.
        </p>
      </div>
    </div>
  );
}
