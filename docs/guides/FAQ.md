# FAQ

Common questions about ChessVision.

---

## General

### What is ChessVision for?

It is a diagram editor. You set up a chess position, choose how the board and pieces look, and export a clean image. No engine, no analysis, no opponent — just a fast way to turn a position into a picture you can use anywhere.

### Do I need to install anything?

No. It runs in a browser. Chrome, Firefox, Safari, or Edge — current versions all work.

### Is it free?

Yes. Open source (AGPL-3.0), free to use, free to self-host. No feature is paywalled. If you find it useful, there is a donate link in the About section — entirely optional.

### Do I need an account?

No. FEN input, board editing, export, and history all work without signing in. Your data stays in your browser. An account only adds one thing: cloud sync so your history and settings follow you across devices.

---

## FEN Notation

### What is FEN?

FEN (Forsyth-Edwards Notation) encodes a chess position as a text string. It looks like this:

```
rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
```

Most chess sites and databases can export FEN. ChessVision reads it directly.

### What are the six FEN fields?

1. **Piece placement** — ranks 8 to 1, separated by `/`. Uppercase = White, lowercase = Black, numbers = empty squares.
2. **Active color** — `w` or `b`
3. **Castling rights** — `KQkq` combinations or `-`
4. **En passant** — target square or `-`
5. **Halfmove clock** — moves since last pawn advance or capture
6. **Fullmove number** — current move number

### Do I need all six fields?

No. Only the piece placement field is required. ChessVision accepts partial FEN strings.

### What is the maximum FEN length?

93 characters. Strings longer than this are rejected before parsing.

---

## Export

### What formats are available?

- **PNG** — lossless, transparent background. Best for print and archival.
- **JPEG** — smaller file, no transparency. Best for web sharing.
- **SVG** — vector, infinitely scalable. Pieces embedded as base64 so the file is self-contained.

### What do the quality presets mean?

The preset sets the pixel density (DPI) of the output. The physical board size you choose sets the printed size.

| Preset | DPI  | Typical use                       |
| ------ | ---- | --------------------------------- |
| 1×     | 300  | Standard print quality            |
| 2×     | 600  | High-quality print                |
| 3×     | 900  | Large-format print, sharp screens |
| 4×     | 1200 | Maximum quality                   |

For example, a 2× export at 8 cm board size produces a 1,890 × 1,890 px image at 600 DPI — sharp enough for a book at A6 size.

### Why does a 1× export look small on screen?

300 DPI is a print resolution, not a screen resolution. A 4 cm board at 1× is 472 px — small on a monitor, but exactly the right size when printed at 4 cm. For on-screen use at large sizes, use 3× or 4×.

### Can I export several positions at once?

Yes. The Advanced FEN Input page lets you enter up to 10 positions and export them all together. You download a single ZIP with every image inside.

### Can I use the exported images commercially?

Yes. The images you generate are yours. Use them in books, articles, courses, video thumbnails, client work — there are no licensing restrictions on the output.

### The export seems stuck or slow.

Higher quality presets take more time and memory. The progress bar shows what is happening — you can also pause and resume. If the browser struggles, try a lower preset or a smaller board size.

---

## Data and Privacy

### Where is my data stored?

FEN history, favourites, and settings are stored in your browser's localStorage. Nothing leaves your device unless you sign in and enable sync.

### What happens when I sign in?

Your local data stays where it is. An account adds cloud sync: your history and settings are uploaded to Supabase and synced across your devices. Each user's data is isolated by row-level security — only your account can read your rows.

### What happens if I clear my browser data?

Without cloud sync enabled, your history and settings will be lost. Export a backup first from Data Management in Settings.

### Can I delete my account?

Yes. Email contact@chessvision.org and your account and all associated data will be removed.

---

## Troubleshooting

### The board is not displaying.

Try a hard refresh (Ctrl+F5 or Cmd+Shift+R). If that does not help, try a different browser. Make sure your internet connection is working — piece images are loaded from Lichess CDN.

### The FEN I pasted is not loading.

Check that the FEN is valid. ChessVision shows a validation error inline if something is wrong. The most common issues are extra spaces, wrong separators, or a string that is longer than 93 characters.

### I cannot copy the image to clipboard.

Clipboard access requires the page to be served over HTTPS and the browser to grant permission. If copy fails, use the download button instead.

### Export downloads a file with a `.jpg` extension but I chose PNG.

If you selected multiple formats (JPEG + PNG), the download might start with the JPEG. Check the download folder — all selected formats are downloaded in sequence.
