# Security Policy

## Supported Versions

ChessViewer is a web application — only the code running at [chessvision.org](https://chessvision.org) is actively maintained. There are no versioned releases; the `master` branch is always the current production deployment. Self-hosted deployments should track `master`.

---

## Security Architecture

### Client-Side Processing

All board rendering and image export runs in the browser. No position data is sent to any server during normal use.

- No analytics, cookies, or telemetry
- FEN input is length-capped at 93 characters before any parsing attempt
- All localStorage and Supabase response parsing uses `safeJSONParse` to prevent prototype pollution
- FEN strings and hex colours are sanitized at input boundaries (`sanitizeInput`, `sanitizeHexColor`)

### Optional Cloud Sync

Users may sign in to enable cross-device sync. When cloud sync is active:

- Data is stored in Supabase with row-level security (RLS) enforced on every table — rows are scoped to the authenticated user; one account cannot read another's data
- Privileged operations (e.g., security session reset) use an RPC function rather than direct table writes, so the application cannot bypass the server-side policy
- The local localStorage copy is the source of truth; cloud is best-effort sync on top

### Authentication

- Email/password with optional TOTP-based multi-factor authentication via Supabase
- A 90-day re-verification gate is enforced for sensitive operations (`useSecurityCheck`) — it defaults to locked and only unlocks on positive server confirmation
- No custom TOTP logic; the standard Supabase MFA flow is used throughout

### Browser Security

- Content Security Policy (CSP) prevents XSS and unauthorized script execution
- HTTPS with HSTS enforced on deployment
- No inline scripts; all logic is bundled from verified sources
- `target="_blank"` links always include `rel="noopener noreferrer"`

---

## Reporting a Vulnerability

Do not open a public GitHub issue for security vulnerabilities.

### Option 1: GitHub Security Advisory (preferred)

1. Go to the [Security tab](https://github.com/chessviewer-org/chess-viewer/security).
2. Click "Report a vulnerability".
3. Fill in the advisory form.

### Option 2: Direct Email

Send to: [contact@chessvision.org](mailto:contact@chessvision.org)  
Subject: `[SECURITY] <brief description>`

### What to Include

- Type of vulnerability (XSS, injection, authentication bypass, etc.)
- Steps to reproduce
- Potential impact
- Proof of concept, if available

### Response Timeline

- Initial acknowledgment: within 48 hours
- Fix development: typically 5–10 business days depending on severity
- Public disclosure: after a fix is released (coordinated disclosure)

---

## Dependency Security

Dependencies are monitored via Dependabot. Run `pnpm audit` locally to check for known vulnerabilities.

---

_Last updated: June 2026_
