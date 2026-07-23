import { html } from 'hono/html';

interface LayoutProps {
  title: string;
  description: string;
  children: string;
}

export function Layout(props: LayoutProps) {
  return html`
    <!DOCTYPE html>
    <html lang="en" data-theme="dark">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${props.title} • ChessViewer</title>
        <meta name="description" content="${props.description}" />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js"
        ></script>
        <style>
          :root {
            --val-bg: 15 15 20;
            --val-surface: 24 25 32;
            --val-surface-elevated: 31 33 42;
            --val-surface-hover: 38 41 50;
            --val-border: 48 50 60;
            --val-border-subtle: 38 40 48;
            --val-text-primary: 236 237 242;
            --val-text-secondary: 188 190 200;
            --val-text-muted: 130 133 148;
            --val-accent: 59 130 246;
            --val-accent-hover: 96 165 250;
          }
          *,
          *::before,
          *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html {
            background: rgb(15 15 20);
            color: rgb(236 237 242);
            font-family:
              system-ui,
              -apple-system,
              sans-serif;
            line-height: 1.55;
          }
          body {
            min-height: 100vh;
          }
          a {
            color: rgb(59 130 246);
            text-decoration: none;
          }
          a:hover {
            color: rgb(96 165 250);
            text-decoration: underline;
          }

          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
          }

          /* Navbar */
          .navbar {
            display: flex;
            align-items: center;
            height: 3.5rem;
            border-bottom: 1px solid rgb(48 50 60);
            background: rgb(24 25 32);
            padding: 0 1rem;
          }
          .navbar-inner {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 1280px;
            width: 100%;
            margin: 0 auto;
          }
          .logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            font-size: 1.0625rem;
            color: rgb(236 237 242);
          }
          .logo:hover {
            text-decoration: none;
          }
          .logo svg {
            width: 1.5rem;
            height: 1.5rem;
          }

          /* Page layout */
          .page-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 1.5rem 1rem;
          }
          .page-layout {
            display: flex;
            gap: 1.5rem;
            min-height: calc(100vh - 3.5rem);
          }

          /* Sidebar tabs */
          .sidebar {
            width: 14rem;
            flex-shrink: 0;
          }
          .tab-group {
            margin-bottom: 1rem;
          }
          .tab-group-label {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: rgb(130 133 148);
            padding: 0 0.75rem;
            margin-bottom: 0.375rem;
          }
          .tab-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: rgb(188 190 200);
            cursor: pointer;
            transition: all 0.15s;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
          }
          .tab-item:hover {
            background: rgb(38 41 50);
            color: rgb(236 237 242);
          }
          .tab-item.active {
            background: rgb(59 130 246 / 0.15);
            color: rgb(59 130 246);
            font-weight: 500;
          }
          .tab-item svg {
            width: 1rem;
            height: 1rem;
            flex-shrink: 0;
          }

          /* Content */
          .content {
            flex: 1;
            min-width: 0;
          }
          .content section {
            display: none;
          }
          .content section.active {
            display: block;
          }
          h1 {
            font-size: 1.4375rem;
            font-weight: 700;
            margin-bottom: 1rem;
          }
          h2 {
            font-size: 1.1875rem;
            font-weight: 600;
            margin: 1.5rem 0 0.75rem;
          }
          h3 {
            font-size: 1.0625rem;
            font-weight: 600;
            margin: 1.25rem 0 0.5rem;
          }
          p {
            margin-bottom: 0.75rem;
          }
          ul,
          ol {
            margin: 0.5rem 0 0.75rem 1.5rem;
          }
          li {
            margin-bottom: 0.25rem;
          }

          /* SVG icons inline */
          .icon {
            display: inline-block;
            width: 1em;
            height: 1em;
            vertical-align: middle;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
            color: rgb(130 133 148);
          }
          .back-link:hover {
            color: rgb(236 237 242);
          }
        </style>
      </head>
      <body>
        <nav class="navbar">
          <div class="navbar-inner">
            <a href="/" class="logo">
              <svg
                viewBox="0 0 45 45"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
                <path
                  d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"
                />
              </svg>
              ChessViewer
            </a>
            <div style="flex:1"></div>
          </div>
        </nav>

        <main class="page-container">${props.children}</main>
      </body>
    </html>
  `;
}
