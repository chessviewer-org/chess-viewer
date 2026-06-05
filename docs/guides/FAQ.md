# FAQ

Common questions about ChessVision.

---

## General

### What does this tool do?

ChessVision takes a FEN string and renders the chess position as a high-resolution image. You can customize the board theme, piece set, and export at print or social media quality.

### What do I need to use it?

A modern browser. Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+. No installation required.

### Is it free?

Yes. Free to use, free to self-host. Licensed under AGPL-3.0.

### Do I need an account?

No. All core features (FEN input, board rendering, export, history) work without signing in.

An optional account enables end-to-end encrypted cloud sync across devices. All data is encrypted client-side before it leaves your device.

---

## FEN Notation

### What is FEN?

FEN (Forsyth-Edwards Notation) encodes a chess position as a text string.

Starting position:

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

### What are the six FEN fields?

1. **Piece placement** — Ranks 8 to 1, separated by `/`. Uppercase = White, lowercase = Black, numbers = empty squares.
2. **Active color** — `w` or `b`
3. **Castling rights** — `KQkq` combinations or `-`
4. **En passant** — Target square or `-`
5. **Halfmove clock** — Moves since last pawn advance or capture
6. **Fullmove number** — Current move number

### Do I need all six fields?

No. Only the piece placement field is required. The rest default to standard values if omitted.

### What is the maximum FEN length?

93 characters. Strings longer than this are rejected before parsing.

### Common FEN errors

- Wrong number of ranks (must be exactly 8)
- Invalid piece characters (only `prnbqkPRNBQK`)
- Rank does not sum to 8 squares

---

## Export

### What formats are supported?

- **PNG** — Lossless, supports transparency. Best for print and diagrams.
- **JPEG** — Smaller file size, no transparency. Best for sharing.
- **SVG** — Vector, resolution-independent. Available in the Advanced FEN export flow.

### What resolutions are available?

Print mode dimensions depend on board size selection (4 cm, 6 cm, 8 cm):

| Quality | Mode   | 8 cm board         |
| ------- | ------ | ------------------ |
| 8×      | Print  | 7,552 × 7,552 px   |
| 16×     | Print  | 15,104 × 15,104 px |
| 24×     | Social | 22,656 × 22,656 px |
| 32×     | Social | 30,208 × 30,208 px |

### The browser crashed during a large export.

24× and 32× exports need significant memory. Try a lower quality setting or use a desktop browser. Safari/iOS has a canvas size cap of 16,384 px — 24× and 32× Social may fail on those devices.

### Export is slow.

Large canvas operations take time. Close other tabs. JPEG is faster to encode than PNG.

### Colors look different in the exported file.

Use PNG for accurate colors. JPEG compression can shift colors slightly.

---

## Customization

### How many themes are there?

20+ preset themes. You can create up to 48 total presets including your own. Default themes cannot be deleted.

### How many piece sets are there?

23 piece sets. Custom piece upload is not supported.

### Can I flip the board?

Yes. The Flip button in the control panel reverses the board to Black's perspective.

---

## Data and Privacy

### Where is my data stored?

FEN history, favorites, and settings are stored in your browser's localStorage. Without an account, nothing leaves your device.

With an account, data is encrypted end-to-end before being sent to Supabase. The decryption key never leaves your device.

### What happens if I clear my browser data?

Without cloud sync, your FEN history, favorites, and settings will be lost. Use the Data Management page in Settings to export a backup first.

### Is there tracking or analytics?

No. No analytics, no cookies, no telemetry.

---

## Known Limitations

- No keyboard shortcuts for board actions
- SVG export is only available in the Advanced FEN flow, not on the home page
- No PGN import — FEN only
- No arrow or highlight annotations
- Safari/iOS: 24× and 32× Social exports may fail due to canvas memory limits
- Canvas content is not accessible to screen readers

---

## Troubleshooting

### Board not displaying

1. Refresh the page (Ctrl+F5)
2. Clear browser cache
3. Check your internet connection (piece images load from a CDN)
4. Try a different browser

### Piece images missing

1. Refresh the page
2. Switch to a different piece set
3. Clear browser cache

### Export not working

1. Reduce export quality
2. Disable popup blockers
3. Allow downloads in browser settings

---

## Development

### Report a bug

[GitHub Issues](https://github.com/BilgeGates/chess-vision/issues) — include browser, OS, steps to reproduce, and screenshots.

### Contribute

Fork the repository, create a branch, run the quality gates (`pnpm test && npx tsc --noEmit && pnpm lint`), and submit a pull request. See [CONTRIBUTING.md](../../CONTRIBUTING.md).

### Self-host

Clone the repository. Run `pnpm build`. Deploy the `dist/` folder to any static hosting provider.

---

## License

AGPL-3.0. Commercial use, modification, and distribution are permitted under the terms of the license.

---

_Last updated: May 2026 — v6.0.0_
