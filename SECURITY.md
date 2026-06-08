# Security Policy

## Supported Versions

| Version | Status        | Security Updates |
| ------- | ------------- | ---------------- |
| v6.x    | Active        | Yes              |
| v5.x    | Critical only | Yes              |
| < v5.0  | Unsupported   | No               |

Always use the latest version available at [chessvision.org](https://chessvision.org).

---

## Security Architecture

### Client-Side Processing

All board rendering and image export runs in the browser. No chess position data is transmitted to any server during normal use.

- No analytics, cookies, or telemetry
- FEN input is length-capped at 93 characters before any parsing attempt
- All localStorage and Supabase response parsing uses `safeJSONParse` to prevent prototype pollution
- FEN strings and hex colors are sanitized at input boundaries (`sanitizeInput`, `sanitizeHexColor`)

### Optional Cloud Sync

Users may sign in to enable cross-device sync. When cloud sync is active:

- All values are end-to-end encrypted before transmission using a key stored locally in `localStorage` under `cv_privacy_key`
- The server stores only ciphertext (`enc:<ciphertext>` format) — the plaintext is never sent
- Row-Level Security (RLS) is enforced on all Supabase tables; rows are scoped to the authenticated user
- Privileged operations (e.g., security session reset) use an RPC function rather than direct table writes

### Authentication

- Email/password with optional TOTP-based multi-factor authentication
- A 90-day re-verification gate is enforced for sensitive operations (`useSecurityCheck` — fail-closed by default)
- MFA uses Supabase TOTP; no custom TOTP logic is implemented

### Browser Security

- Content Security Policy (CSP) prevents XSS and unauthorized script execution
- HTTPS with HSTS enforced on deployment
- No inline scripts; all logic is bundled from verified sources
- `target="_blank"` links always include `rel="noopener noreferrer"`

---

## Reporting a Vulnerability

Do not open a public GitHub issue for security vulnerabilities.

### Option 1: GitHub Security Advisory (preferred)

1. Go to the [Security tab](https://github.com/chessvision-org/chess-vision/security).
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

_Last updated: May 2026_
