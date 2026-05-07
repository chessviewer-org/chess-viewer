# FENForsty Pro - FAQ

Common questions and answers.

---

## General

### What is this tool?

A browser-based tool that creates chess position images from FEN notation.

### Requirements

- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection (piece images loaded from CDN)
- No installation needed

### Is it free?

Yes. MIT License. Use for any purpose.

---

## FEN Notation

### What is FEN?

FEN (Forsyth-Edwards Notation) describes chess positions as text.

**Example (starting position):**

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

### FEN Format

Six fields separated by spaces:

1. **Piece placement** - Ranks 8 to 1, separated by `/`. Uppercase=White, lowercase=Black, numbers=empty squares
2. **Active color** - `w` or `b`
3. **Castling** - `KQkq` or `-`
4. **En passant** - Target square or `-`
5. **Halfmove clock** - Moves since capture/pawn move
6. **Fullmove number** - Current move number

### Partial FEN

Only the piece placement field is required. Others default to standard values.

### Common FEN Errors

- Wrong number of ranks (must be 8)
- Invalid piece letters (only `prnbqkPRNBQK`)
- Rank doesn't sum to 8 squares

---

## Export

### Formats

- **PNG** - Lossless, transparent background
- **JPEG** - Smaller file size, no transparency
- **SVG** - Vector export (currently available in Advanced FEN page export actions)

### Resolution

Print mode resolutions depend on board size selection (4 cm, 6 cm, 8 cm):

| Quality | Mode   | Example dimension (8 cm) |
| ------- | ------ | ------------------------ |
| 8×      | Print  | 7,552 × 7,552 px         |
| 16×     | Print  | 15,104 × 15,104 px       |
| 24×     | Social | 18,112 × 18,112 px       |
| 32×     | Social | 24,192 × 24,192 px       |

### Export Issues

**Browser crashes:** High-resolution exports (24×, 32×) need significant memory. Use lower scale or desktop browser.

**Export slow:** Large canvas operations take time. Close other tabs, use JPEG for faster processing.

**Colors different after export:** Use PNG for accurate colors. JPEG compression can alter colors.

---

## Customization

### Themes

20+ preset board themes available. Custom hex colors supported via color picker.

### Piece Sets

20+ piece sets included. Cannot upload custom sets.

### Board Options

- Flip board (view from Black's perspective)
- Toggle coordinate labels
- Adjust board size

---

## Known Limitations

- **No keyboard shortcuts** — Planned for future
- **Home page has no SVG button** — SVG export is in Advanced FEN flow
- **No PGN import** — FEN only
- **No arrow/highlight annotations**
- **Safari memory limits** — 24×/32× Social exports may fail on Safari/iOS
- **No WCAG compliance** — Canvas content not accessible to screen readers
- **No cross-device sync** — All data stored locally in browser

---

## Troubleshooting

### Board not displaying

1. Refresh page (Ctrl+F5)
2. Clear browser cache
3. Check internet connection
4. Try different browser

### Piece images missing

1. Refresh page
2. Try different piece set
3. Clear browser cache

### Export not working

1. Check browser supports Canvas API
2. Reduce export scale
3. Disable popup blockers
4. Allow downloads in browser settings

---

## Development

### Report a Bug

[GitHub Issues](https://github.com/BilgeGates/chess_viewer/issues) - Include browser, steps to reproduce, screenshots.

### Contribute

Fork repo, create branch, submit pull request. See CONTRIBUTING.md.

### Self-Host

Clone repository. Build with `pnpm build`. Deploy `dist/` folder.

---

## License

MIT License - Commercial use, modification, distribution allowed.

---

**Last Updated:** May 6, 2026  
**Version:** 5.0.0
