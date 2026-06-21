import { type ReactNode } from 'react';

import { HeartHandshake } from 'lucide-react';

import { Lead, SectionHeading } from './parts';

/** An inline external link used inside the flowing acknowledgement prose. */
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

/**
 * Thanks / Acknowledgements section. Written as flowing prose with inline links
 * — not a "Built with X, Y, Z" badge list — framed around the idea that
 * ChessVision is built with open source and supports open source in return.
 * Every project named is a real dependency from package.json, a real piece of
 * infrastructure, or a real data source used by the app.
 */
export default function ThanksSection() {
  return (
    <div className="space-y-8 animate-pageEnter">
      <div className="space-y-3">
        <SectionHeading icon={HeartHandshake} title="Thanks" />
        <Lead>
          ChessVision is built with open source, and it tries to support open
          source in return. None of it would exist without the projects, tools,
          and communities below — thank you to everyone who builds and maintains
          them.
        </Lead>
      </div>

      <div className="space-y-5 text-base leading-relaxed text-text-secondary">
        <p>
          The interface is a <Ext href="https://react.dev">React</Ext>{' '}
          application written in{' '}
          <Ext href="https://www.typescriptlang.org">TypeScript</Ext>, built by{' '}
          <Ext href="https://vitejs.dev">Vite</Ext> and styled with{' '}
          <Ext href="https://tailwindcss.com">Tailwind CSS</Ext>. Navigation
          between pages is handled by{' '}
          <Ext href="https://reactrouter.com">React Router</Ext>, the motion and
          page transitions come from{' '}
          <Ext href="https://www.framer.com/motion/">Framer Motion</Ext>, and
          the interactive board editor is powered by{' '}
          <Ext href="https://react-dnd.github.io/react-dnd/">react-dnd</Ext>.
        </p>
        <p>
          Large lists (such as a long FEN history) stay smooth thanks to{' '}
          <Ext href="https://github.com/bvaughn/react-window">react-window</Ext>
          , the icons throughout the app come from{' '}
          <Ext href="https://lucide.dev">Lucide</Ext>, and the two-factor setup
          QR codes are rendered with{' '}
          <Ext href="https://github.com/zpao/qrcode.react">qrcode.react</Ext>.
          Optional accounts and the end-to-end-encrypted cloud sync are built on{' '}
          <Ext href="https://supabase.com">Supabase</Ext>.
        </p>
        <p>
          The app is packaged with{' '}
          <Ext href="https://www.docker.com">Docker</Ext> and served by{' '}
          <Ext href="https://nginx.org">nginx</Ext>, and the source code,
          errors, and discussions live on{' '}
          <Ext href="https://github.com">GitHub</Ext>. The position-database
          search would not be possible without the open chess data published by{' '}
          <Ext href="https://lichess.org">Lichess</Ext> and{' '}
          <Ext href="https://chessdb.cn/queryc_en/">ChessDB</Ext>, together with
          the problem collections at{' '}
          <Ext href="https://pdb.dieschwalbe.de">PDB (Problemdatenbank)</Ext>{' '}
          and <Ext href="https://www.yacpdb.org">YACPDB</Ext>.
        </p>
        <p>
          Finally, thank you to everyone who reports bugs, suggests
          improvements, contributes code, and simply uses ChessVision. The
          project is better because of the community around it.
        </p>
      </div>
    </div>
  );
}
