# Security Policy

This document defines the security-disclosure policy for **ChessVision**. It states which versions receive security updates, the architectural controls in place, the supported reporting channels, and the expected response timeline. Reports that follow this policy will be acknowledged and remediated under a coordinated-disclosure model.

## Supported Versions

The following versions are supported with security updates. "Active" denotes the current stable line and the recipient of all security work. "Limited Support" denotes a maintenance window during which only critical fixes are backported. "End of Life" denotes versions that no longer receive any security updates and should not be deployed.

| Version | Support Status  | Security Updates | Notes                                         |
| ------- | --------------- | ---------------- | --------------------------------------------- |
| v5.x.x  | Active          | All severities   | Current stable line; v5.5.3 is the latest tag |
| v4.x.x  | Limited Support | Critical only    | Maintenance window ends 2026-12-31            |
| < v4.0  | End of Life     | None             | Not supported                                 |

ChessVision is a client-side application delivered over the network on each visit. Users are strongly encouraged to access the latest deployed build at [chessvision.org](https://chessvision.org) and to keep their browser up to date.

## Security Architecture

ChessVision follows a zero-backend, client-side-only architecture. This design minimizes the attack surface by removing entire classes of server-side vulnerabilities from scope.

### Privacy-First Design

- **No data collection.** All processing happens in the user's browser.
- **No server storage.** Positions, exports, and settings are never uploaded.
- **No tracking.** The application uses no analytics, cookies, or telemetry.
- **Local-only persistence.** Settings and history are stored in `localStorage` and remain on the user's device.

### Attack Surface

- **Static client-side JavaScript only.** No server endpoints, no user-authentication surface, no remote storage.
- **No user accounts.** There is no login system, password store, session manager, or token surface to compromise on the v5.x line.
- **No sensitive data class.** The application processes public chess positions in FEN notation only.

### Browser Security Controls

- **Content Security Policy.** A strict CSP restricts script origins and inhibits cross-site-scripting payloads.
- **HTTPS-only delivery.** Deployed with HSTS and secure response headers.
- **No inline scripts.** All application logic is bundled and served from the verified origin.
- **Sanitized input at system boundaries.** FEN strings are validated and length-limited (`MAX_FEN_LENGTH = 93`) before any parse attempt. File names, hexadecimal colors, and free-form text inputs are sanitized through `sanitizeFileName`, `sanitizeHexColor`, and `sanitizeInput` respectively.
- **Safe state handling.** Every `localStorage` read is routed through `safeJSONParse`, which contains the parse failure and rejects prototype-polluting payloads. Direct `JSON.parse` on untrusted input is prohibited.
- **Link hardening.** The lint rule `react/jsx-no-target-blank` is configured as an error; outbound links must carry `rel="noopener noreferrer"`.

## Reporting a Vulnerability

Do not file security-sensitive reports as public GitHub issues. Use one of the following channels.

### Preferred: GitHub Security Advisory

1. Open the repository [Security tab](https://github.com/BilgeGates/chess-vision/security).
2. Select **Report a vulnerability**.
3. Complete the advisory form with the information described below.

### Alternative: Email

Send the report to **[chessvision@protonmail.com](mailto:chessvision@protonmail.com)** with the subject line `[SECURITY] <brief description>`.

### Required Information

A report should include the following. Reports missing this information may be returned for clarification before triage begins.

- The class of vulnerability (for example, XSS, injection, prototype pollution, supply-chain compromise).
- The affected version, branch, or commit hash.
- Step-by-step reproduction instructions from a clean session.
- The observed impact, including the privilege level required and the scope of compromise.
- A proof of concept, if available, supplied as a minimal isolated artifact.
- The reporter's preferred attribution wording, or a request to remain anonymous.

### Response Timeline

| Stage                      | Target                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| Initial acknowledgment     | Within 48 hours of receipt                                        |
| Triage and severity rating | Within 5 business days                                            |
| Fix development            | Typically 5 – 10 business days, scaled to severity                |
| Coordinated disclosure     | After a remediating release; reporter notified before publication |

For critical, in-the-wild reports, the fix-development window may be compressed and an out-of-band release published.

## Dependency Security

- **Dependabot** monitors direct and transitive dependencies. Pull requests for security updates are reviewed and merged on an accelerated path; routine version bumps follow the batched cadence described in [CONTRIBUTING.md](CONTRIBUTING.md).
- **`pnpm audit`** is run periodically and before any tagged release. Findings of severity high or critical block the release until remediated or formally accepted.
- **CodeQL** static analysis runs in GitHub Actions with the extended-queries pack enabled.

## Guidance for Users

- **Use the latest deployed build.** Always access the application through the official URL: [chessvision.org](https://chessvision.org).
- **Treat `localStorage` as user-readable.** On a shared device, clear the application's `localStorage` through your browser's developer tools or site-data controls.
- **Keep the browser current.** Browser-level security patches are part of the trust chain that protects this application.

## References

- Repository: https://github.com/BilgeGates/chess-vision
- Security advisories: https://github.com/BilgeGates/chess-vision/security/advisories
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Roadmap: [ROADMAP.md](ROADMAP.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Last Updated:** 2026-05-23  
**Applies To:** v5.5.3
