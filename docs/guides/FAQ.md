# FAQ (Frequently Asked Questions)

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

No. All core features (FEN input, board rendering, export, history) work without signing in. An optional account enables end-to-end encrypted cloud sync across devices. All data is encrypted client-side before it leaves your device.

---

## FEN Notation

### What is FEN?

FEN (Forsyth-Edwards Notation) encodes a chess position as a text string.

### What are the six FEN fields?

1. Piece placement — Ranks 8 to 1, separated by `/`. Uppercase = White, lowercase = Black, numbers = empty squares.
2. Active color — `w` (white) or `b` (black)
3. Castling rights — `KQkq` combinations or `-`
4. En passant — Target square or `-`
5. Halfmove clock — Moves since last pawn advance or capture
6. Fullmove number — Current move number

### Do I need all six fields?

No. Only the piece placement field is required. The rest default to standard values if omitted.

### What is the maximum FEN length?

93 characters. Strings longer than this are rejected before parsing.

---

## Export

### What formats are supported?

- PNG — Lossless, supports transparency. Best for print and diagrams.
- JPEG — Smaller file size, no transparency. Best for sharing.
- SVG — Vector, resolution-independent. Available in the Advanced FEN export flow.

### What resolutions are available?

Print mode dimensions depend on board size selection (4 cm, 6 cm, 8 cm). For example, a 32x quality for an 8 cm board creates a 30,208 x 30,208 px image.

### The browser crashed during a large export.

24x and 32x exports need significant memory. Try a lower quality setting or use a desktop browser. Safari/iOS has a 16,384 px size limit.

---

## Data and Privacy

### Where is my data stored?

FEN history, favorites, and settings are stored in your browser's localStorage. Without an account, nothing leaves your device. With an account, data is sent in end-to-end encrypted form.

### What happens if I clear my browser data?

Without cloud sync, your history and settings will be lost. First export a backup from the Data Management page in settings.

---

## Troubleshooting

### Board not displaying

1. Refresh the page (Ctrl+F5)
2. Clear browser cache
3. Check your internet connection
4. Try a different browser
