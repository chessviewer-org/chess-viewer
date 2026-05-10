# Security Policy

## 🔐 Supported Versions

The following versions of **ChessVision** are currently supported with security updates:

| Version | Support Status | Security Updates | End of Life |
| ------- | -------------- | ---------------- | ----------- |
| v5.x.x  | ✅ Active      | ✅ Yes           | Current     |
| v4.x.x  | ⚠️ Limited     | ⚠️ Critical Only | 2026-12-31  |
| < v4.0  | ❌ Unsupported | ❌ No            | N/A         |

> **Note:** As this is a client-side only tool, we strongly recommend always using the latest version available on [chess-vision-site.vercel.app](https://chess-vision-site.vercel.app).

## 🛡️ Security Architecture

ChessVision follows a **zero-backend, client-side-only architecture**. This design inherently minimizes the attack surface.

### Privacy-First Design

- **No data collection:** All processing happens in your browser.
- **No server storage:** No positions or images are uploaded to any server.
- **No tracking:** No analytics, cookies, or telemetry are used.
- **Local storage only:** Settings and history remain on your device.

### Attack Surface

- **Minimal risk:** Static client-side JavaScript only.
- **No authentication:** No user accounts or login systems to compromise.
- **No sensitive data:** The application only handles public chess positions (FEN notation).

### Browser Security Features

- **Content Security Policy (CSP):** Strict policy prevents XSS and unauthorized script execution.
- **HTTPS-only:** Deployed with HSTS and secure headers.
- **No inline scripts:** All logic is bundled and served from verified sources.
- **Sanitized Input:** FEN strings are validated and length-limited (`MAX_FEN_LENGTH = 256`) before processing.
- **Safe State Handling:** LocalStorage parsing uses `safeJSONParse` to prevent prototype pollution.

## 🐞 Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public GitHub issue**.

### 📬 Reporting Methods

#### Option 1: GitHub Security Advisory (Preferred)

1. Go to the [Security tab](https://github.com/BilgeGates/chess-vision/security).
2. Click **"Report a vulnerability"**.
3. Fill out the advisory form with details.

#### Option 2: Direct Email

Send details to: **[chessvision@protonmail.com](mailto:chessvision@protonmail.com)**  
Subject: `[SECURITY] <Brief description>`

### 📋 What to Include

Please provide as much information as possible:

- Type of vulnerability (XSS, injection, etc.)
- Steps to reproduce the issue.
- Potential impact.
- Proof of concept (if available).

### ⏱ Response Timeline

- **Initial acknowledgment:** Within 48 hours.
- **Fix development:** Typically 5-10 business days depending on severity.
- **Public disclosure:** After a fix is released (coordinated disclosure).

## 📦 Dependency Security

This project uses **Dependabot** to monitor and update dependencies automatically. We perform regular audits using `pnpm audit` to ensure no known vulnerabilities are shipped to users.

## 🔒 Best Practices for Users

- **Use the Latest Version:** Always access the app via the official URL.
- **Clear LocalStorage:** If using a shared computer, you can clear the application data in your browser settings.
- **Browser Security:** Keep your browser updated to benefit from the latest security patches.

---

_Last Updated: May 8, 2026_
