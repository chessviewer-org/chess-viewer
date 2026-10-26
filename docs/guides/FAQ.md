# FAQ

Common questions about ChessViewer.

---

## General

### What is ChessViewer for?

It is a diagram editor with optional local computer analysis. Set up an orthodox or fairy position, style the board, analyse with Stockfish or solve a composition with Popeye, then export a clean image. The engines run in your browser.

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

Most chess sites and databases can export FEN. ChessViewer reads it directly.

### What are the six FEN fields?

1. **Piece placement** — ranks 8 to 1, separated by `/`. Uppercase = White, lowercase = Black, numbers = empty squares.
2. **Active color** — `w` or `b`
3. **Castling rights** — `KQkq` combinations or `-`
4. **En passant** — target square or `-`
5. **Halfmove clock** — moves since last pawn advance or capture
6. **Fullmove number** — current move number

### Do I need all six fields?

No. Only the piece placement field is required. ChessViewer accepts partial FEN strings.

### What is the maximum FEN length?

93 characters. Strings longer than this are rejected before parsing.

---

## Export

### What formats are available?

- **PNG** — lossless, transparent background. Best for print and archival.
- **JPEG** — smaller file, no transparency. Best for web sharing.
- **SVG** — vector, infinitely scalable. Piece paths are embedded as vector symbols, so the file is self-contained.

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

### Can I choose any board size?

Yes. Pick 4, 6 or 8 cm, or type any size between 4 and 8 cm on the Export Settings tab.

### Can I export several positions at once?

Yes. The Advanced FEN Input page lets you enter up to 10 positions and export them all together. You download a single ZIP with every image inside.

### Can I use the exported images commercially?

ChessViewer and all its features are free to use. The position and annotations
you create are yours, but exported images also contain piece artwork under its
authors' terms. CC BY 4.0 permits commercial use with attribution. CC BY-NC-SA
4.0 permits noncommercial use; commercial use needs separate permission.
The AGPL license on the application code does not override those artwork terms.
Check the
[piece-set attribution and licenses](../../public/piece/ATTRIBUTION.md) before
publishing an export; use a set whose terms allow your intended use.

### The export seems stuck or slow.

Higher quality presets take more time and memory. The progress bar shows what is happening — you can also pause and resume. If the browser struggles, try a lower preset or a smaller board size.

---

## Fairy Chess

### What can I put on the fairy chess board?

The six orthodox piece shapes in white, black and neutral, each in four rotations (0°, 90°, 180°, 270°), markers, and 163 named walks from the Popeye manual (Grasshopper, Nightrider, Amazon and so on). Open **Fairy chess** in the navigation bar.

### Does ChessViewer check that a fairy problem is sound?

No. It is a diagram editor, not a solver. Stipulations and conditions are printed with the diagram, but ChessViewer does not play them out.

### Can I import a Popeye file?

Yes. The Popeye problem card under the board imports `.inp`, `.txt` and `.fen` files and saves `.inp`. One 8×8 problem is imported at a time.

### Why are the database search buttons disabled for fairy positions?

Lichess and ChessDB only understand orthodox FEN, so fairy positions are never sent to them.

---

## LaTeX

### How do I get a chess diagram into a LaTeX document?

Open **LaTeX** in the navigation bar, add your positions, pick a layout (`skak`, `chessboard` or the `diagram` problem style) on the Document tab, then copy or download the code on the Export tab. The Export tab also shows the exact `tlmgr install` and `pdflatex` commands.

### Does LaTeX Studio compile the PDF for me?

No. It writes the `.tex` source in your browser. Compile it with pdfLaTeX locally or paste it into [Overleaf](https://www.overleaf.com), which already has all three packages.

### How many diagrams can one document hold?

Up to 100. The project is saved in your browser and can be saved to or opened from a `.json` file.

---

## Data and Privacy

### Where is my data stored?

FEN history, favourites, and settings are stored in your browser's localStorage. Nothing leaves your device unless you sign in and enable sync.

### Do you track me?

No. There are no ads, tracking cookies or advertising pixels. Visits are counted with Cloudflare Web Analytics, which sets no cookies and only shows totals such as page views per page and country.

### What happens when I sign in?

Your local data stays where it is. An account adds cloud sync: your history and settings are uploaded to Supabase and synced across your devices. Each user's data is isolated by row-level security — only your account can read your rows.

### What happens if I clear my browser data?

Without cloud sync enabled, your history and settings will be lost. Export a backup first from Data Management in Settings.

### Can I delete my account?

Yes. Email contact@chessvision.org and your account and all associated data will be removed.

---

## Troubleshooting

### The board is not displaying.

Try a hard refresh (Ctrl+F5 or Cmd+Shift+R). If that does not help, try a different browser. Piece images are served from chessvision.org itself, so a blocked third-party CDN is never the cause; a browser extension that blocks images can be.

### The FEN I pasted is not loading.

Check that the FEN is valid. ChessViewer shows a validation error inline if something is wrong. The most common issues are extra spaces, wrong separators, or a string that is longer than 93 characters. Fairy FEN (neutral `-B`, rotated `*2N`) only loads on the Fairy chess page.

### I cannot copy the image to clipboard.

Clipboard access requires the page to be served over HTTPS and the browser to grant permission. If copy fails, use the download button instead.

### Export downloads a file with a `.jpg` extension but I chose PNG.

If you selected multiple formats (JPEG + PNG), the download might start with the JPEG. Check the download folder — all selected formats are downloaded in sequence.
