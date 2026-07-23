import { html } from 'hono/html';

const ICONS = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  history:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
  shield:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>',
  heart:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/></svg>'
};

export function AboutPage() {
  return html`
    <div x-data="aboutPage()" class="page-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="tab-group">
          <div class="tab-group-label">Project</div>
          <button
            class="tab-item"
            :class="{ active: tab === 'about' }"
            @click="setTab('about')"
          >
            ${ICONS.info} About ChessViewer
          </button>
          <button
            class="tab-item"
            :class="{ active: tab === 'changelog' }"
            @click="setTab('changelog')"
          >
            ${ICONS.history} Changelog
          </button>
          <button
            class="tab-item"
            :class="{ active: tab === 'privacy' }"
            @click="setTab('privacy')"
          >
            ${ICONS.shield} Privacy
          </button>
        </div>
        <div class="tab-group">
          <div class="tab-group-label">Help</div>
          <button
            class="tab-item"
            :class="{ active: tab === 'faq' }"
            @click="setTab('faq')"
          >
            ${ICONS.help} FAQ
          </button>
          <button
            class="tab-item"
            :class="{ active: tab === 'contact' }"
            @click="setTab('contact')"
          >
            ${ICONS.mail} Contact
          </button>
        </div>
        <div class="tab-group">
          <div class="tab-group-label">Community</div>
          <button
            class="tab-item"
            :class="{ active: tab === 'contribute' }"
            @click="setTab('contribute')"
          >
            ${ICONS.code} Contribute
          </button>
          <button
            class="tab-item"
            :class="{ active: tab === 'donate' }"
            @click="setTab('donate')"
          >
            ${ICONS.heart} Donate
          </button>
        </div>
      </aside>

      <!-- Content -->
      <div class="content">
        <section x-show="tab === 'about'" x-cloak>
          <h1>About ChessViewer</h1>
          <p>
            ChessViewer is a free, open-source chess diagram generator. Convert
            FEN strings into high-resolution PNG, JPEG, and SVG chess diagrams
            for books, articles, and social media.
          </p>
          <p>
            Built with modern web technologies, ChessViewer offers a clean, fast
            interface for creating professional-quality chess diagrams. No
            sign-up required.
          </p>
          <h2>Features</h2>
          <ul>
            <li>Drag-and-drop board editor</li>
            <li>Multiple export formats (PNG, JPEG, SVG)</li>
            <li>Customizable board themes and piece styles</li>
            <li>High-resolution output (up to 3×)</li>
            <li>FEN history and favorites</li>
            <li>Batch export with ZIP archive</li>
            <li>Keyboard shortcuts for efficient editing</li>
          </ul>
          <h2>License</h2>
          <p>
            ChessViewer is released under the MIT License. You are free to use,
            modify, and distribute the software.
          </p>
        </section>

        <section x-show="tab === 'changelog'" x-cloak>
          <h1>Changelog</h1>
          <p>Track the development and improvements of ChessViewer.</p>
          <h2>v1.0.0 — Initial Release</h2>
          <ul>
            <li>Core board editor with drag-and-drop</li>
            <li>Export to PNG, JPEG, SVG</li>
            <li>Board style customization</li>
            <li>FEN input and validation</li>
            <li>Dark and light theme support</li>
          </ul>
        </section>

        <section x-show="tab === 'privacy'" x-cloak>
          <h1>Privacy Policy</h1>
          <p>Last updated: January 2025</p>
          <p>
            ChessViewer respects your privacy. We do not collect, store, or
            share any personal information beyond what is necessary to provide
            the service.
          </p>
          <h2>Data We Store</h2>
          <ul>
            <li>Board configuration preferences (locally in your browser)</li>
            <li>FEN history (locally, optionally synced if signed in)</li>
            <li>
              Account information (email, display name) if you create an account
            </li>
          </ul>
          <h2>Third-Party Services</h2>
          <p>
            We use Supabase for authentication and optional cloud sync. Your
            data is handled according to Supabase's privacy policy.
          </p>
        </section>

        <section x-show="tab === 'faq'" x-cloak>
          <h1>Frequently Asked Questions</h1>
          <h2>What is a FEN?</h2>
          <p>
            Forsyth-Edwards Notation (FEN) is a standard notation for describing
            a particular board position of a chess game. It encodes the
            placement of pieces, active color, castling rights, en passant, and
            move counts.
          </p>
          <h2>Can I use ChessViewer offline?</h2>
          <p>
            Yes! ChessViewer is a Progressive Web App. After your first visit,
            it works offline thanks to service worker caching.
          </p>
          <h2>Is there a limit on exports?</h2>
          <p>
            No. You can export unlimited diagrams. Batch export supports up to
            100 positions at once.
          </p>
          <h2>Do I need an account?</h2>
          <p>
            No. All features work without an account. Signing in enables FEN
            history sync across devices.
          </p>
        </section>

        <section x-show="tab === 'contact'" x-cloak>
          <h1>Contact</h1>
          <p>
            Have a question, suggestion, or found a bug? We'd love to hear from
            you.
          </p>
          <h2>GitHub</h2>
          <p>
            Open an issue or discussion on
            <a
              href="https://github.com/chessviewer-org/chess-viewer"
              target="_blank"
              rel="noopener"
              >GitHub</a
            >.
          </p>
          <h2>Email</h2>
          <p>
            Reach out at
            <a href="mailto:support@chessvision.org">support@chessvision.org</a
            >.
          </p>
        </section>

        <section x-show="tab === 'contribute'" x-cloak>
          <h1>Contribute</h1>
          <p>
            ChessViewer is open-source and welcomes contributions from the
            community.
          </p>
          <h2>How to Contribute</h2>
          <ul>
            <li>
              Report bugs and suggest features via
              <a
                href="https://github.com/chessviewer-org/chess-viewer/issues"
                target="_blank"
                rel="noopener"
                >GitHub Issues</a
              >
            </li>
            <li>Submit pull requests for improvements</li>
            <li>Help translate the interface</li>
            <li>Share ChessViewer with others</li>
          </ul>
          <h2>Development</h2>
          <p>
            Check the
            <a
              href="https://github.com/chessviewer-org/chess-viewer/blob/master/CONTRIBUTING.md"
              target="_blank"
              rel="noopener"
              >contributing guide</a
            >
            to get started.
          </p>
        </section>

        <section x-show="tab === 'donate'" x-cloak>
          <h1>Donate</h1>
          <p>
            ChessViewer is free and always will be. If you find it useful,
            consider supporting the project.
          </p>
          <p>
            Donations help cover hosting costs, domain registration, and
            development time.
          </p>
          <h2>Ways to Support</h2>
          <ul>
            <li>GitHub Sponsors</li>
            <li>Share ChessViewer with friends and colleagues</li>
            <li>Contribute code, documentation, or translations</li>
          </ul>
          <p>Thank you for your support!</p>
        </section>
      </div>

      <script>
        document.addEventListener('alpine:init', () => {
          Alpine.data('aboutPage', () => ({
            tab:
              new URLSearchParams(window.location.search).get('tab') || 'about',
            validTabs: [
              'about',
              'changelog',
              'privacy',
              'faq',
              'contact',
              'contribute',
              'donate'
            ],
            setTab(t) {
              if (!this.validTabs.includes(t)) t = 'about';
              this.tab = t;
              history.replaceState(null, '', '?tab=' + t);
            }
          }));
        });
      </script>
    </div>

    <style>
      [x-cloak] {
        display: none !important;
      }
    </style>
  `;
}
