# Fairy chess diagrams and Fairy FEN

ChessViewer is a position and diagram editor. The standard editor and fairy editor
both allow free placement; neither is a move-legality engine or a problem solver.

## Sources and meaning

The implementation follows Joost de Heer's [Fairy FEN specification](https://www.janko.at/Retros/d.htm).
This is a composition diagram notation, not a universal engine format for every
chess variant. Fairy-Stockfish's extended FEN is a different convention; its
arbitrary piece letters do not describe the neutral/rotated diagram symbols used
here.

A rotated glyph is a diagram symbol. Its rotation does not, by itself, specify a
move rule. The [Unicode fairy-symbol proposal](https://www.unicode.org/L2/L2017/17034r3-n4784r-fairy-chess.pdf)
explains that most symbol assignments depend on the composition. In particular,
an upside-down queen conventionally represents a Grasshopper, and an upside-down
knight a Nightrider. Custom meanings belong in the problem's stipulation or legend.
We consequently name arbitrary rotated pieces by their symbol and angle, rather
than inventing a piece name or move rule for every rotation.

The [WFCC's published definitions](https://www.wfcc.ch/wp-content/uploads/WCCC-2021-bulletin-v1.1.pdf)
distinguish:

- Grasshopper: hops along a queen line over a hurdle and lands immediately beyond.
- Nightrider: repeats knight steps along one straight direction.
- Neutral unit: either side can move or capture it. Neutral is a property of a
  piece, not a third player or a white piece painted in two colours.

The [BCPS beginner guide](https://www.theproblemist.org/beginner.pl?type=b_fy) and
[Julia's Fairies glossary](https://juliasfairies.com/fairy-terms/jf-fairy-terms/)
provide the piece and condition definitions. The image generator combines the
white and black artwork for neutral symbols, and rotates the whole neutral glyph.

## Workspaces and composition settings

The home route is the orthodox editor. `/fairy-chess` is the dedicated diagram
workspace; `/latex` is the independent LaTeX Studio. The navigation uses a small
brand, ordinary section links and a mobile section dropdown sized to its links.
The mobile dropdown contains only Standard, Fairy chess and LaTeX, using the
same gray surface as the account dropdown. Donate stays beside the logo on
phones and after the section links on desktop, always in the navigation bar.
The home link is labeled Standard. Brand text stays neutral and brightens slightly
on hover or keyboard focus; the horse icon carries the gold accent.
The shared logo uses a traced SVG of the original horse silhouette, retaining
its gold color without a raster image embedded inside the vector.
The navbar pairs the mark at 2rem high, retaining its natural aspect ratio, with
the brand name at 1.375rem and a compact line height.
The account dropdown has the same anchored, non-modal behavior on desktop,
tablet and phone. It begins
at the bottom edge of the navigation. Its surface matches the square background
of the expanded account toggle, using the existing surface-hover token. Active sections
have an accent underline; hover and keyboard focus reveal it from left to right.
Donate has a heart and a separate pill hover treatment. The account panel is
anchored with `top: 100%` to its full-height navigation control, so its top edge
tracks the header bottom directly. Short viewports reduce the scrollable panel
height rather than shifting it above the header.
On phones, the account toggle and dropdown share the viewport's right edge.
Opening either navigation menu blurs and dims the page behind it; tapping the
backdrop dismisses the open menu. Desktop navigation keeps the page gutters;
its dropdown aligns with the account toggle, without a page backdrop.
Navigation hides as soon as the document scrolls below the top. Open
menus and keyboard access keep their navigation available.
The standard editor centers its FEN field and board workspace together in the
viewport height below the navigation. Taller content scrolls normally. The page
does not reserve an empty scrollbar gutter; scroll locking preserves an existing
gutter only while an overlay is open.
Route transitions cross-fade without moving the page. The navbar and shell keep
the same viewport width when a scrollbar appears, and navigation resets scroll
before rendering the destination. Menu state is local to the navbar; opening a
menu does not render the editor. Image loading updates the editor once the piece
map is complete rather than on every unused progress tick.

Fairy settings are inline: piece catalogue, color, attributes, stipulation,
conditions, author, source, title, remarks, twins, board theme and piece set.
The catalogue contains 163 walks from the official English
[Popeye manual](https://github.com/thomas-maeder/popeye/blob/develop/py-engl.txt)
and [piece-name table](https://github.com/thomas-maeder/popeye/blob/develop/piecenam.txt),
including the six orthodox walks. The condition picker contains 182 names and the
attribute picker contains 19 attributes. These are diagram declarations; choosing
a condition does not run its rules or validate its parameters with a solver.

Named pieces preserve their identity independently of artwork. Conventional
Popeye diagram glyphs are used where available. Walks without an assigned glyph
use their letter code, with color and a printed legend. Two walks sharing a glyph
remain different pieces in storage, history, undo and export.

## Supported notation

The current board is 8 × 8. The symbol palette supports the six orthodox glyph
families in white, black and neutral, with 0°, 90°, 180° and 270° clockwise
rotations (72 symbols). Named walks are available separately in the catalogue.
FFEN's markers, text labels, intermediate knight angles and other board sizes are
outside this feature; unsupported syntax is rejected with a validation error.

| Meaning                     | FFEN             | Internal image key |
| --------------------------- | ---------------- | ------------------ |
| White bishop                | `B`              | `wB`               |
| Black bishop                | `b`              | `bB`               |
| Neutral bishop              | `-B` or `-b`     | `nB`               |
| White bishop, 90° clockwise | `*1B`            | `wB90`             |
| Black queen, 270° clockwise | `*3q`            | `bQ270`            |
| Neutral rook, 180°          | `-*2r` or `-*2R` | `nR180`            |

Neutral letter case is insignificant; output uses uppercase neutral glyphs.
Ordinary FEN letters retain their original meaning. In FFEN, `N` is the ordinary
knight glyph; the problemist abbreviation N for Nightrider is not substituted
into the FEN placement. Its conventional inverted-knight symbol is `*2N`.

Placement-only input is accepted for diagrams. Full positions retain the usual
five metadata fields, which are validated. Canonical editor output includes all
six fields. FFEN records symbol placement; it does not encode fairy conditions,
royalty, a solver's piece declarations or the complete rules of a variant.

Standard FEN keeps the dependency's existing length guard. FFEN input has a
separate bounded limit allowing three prefix characters per square. Shared
validation and parsing cover the editor, previews, history, favourites, batch,
sharing and raster/SVG exports. Plain FEN is never produced by discarding fairy
information.

## Popeye files

Named walks, attributes and problem declarations use English Popeye notation,
not invented FEN letters. In Popeye `S` is the ordinary knight and `N` is the
Nightrider. In orthodox FEN and FFEN `N` retains its ordinary-knight meaning.

```text
BeginProblem
Stipulation h#2
Condition Circe
Pieces White Ke1 Ge4
Pieces Black Ke8 Ne5
Pieces Neutral PAa4
EndProblem
```

`Pieces` color groups, `Forsyth` placement, stipulations, conditions, options,
authorship, remarks and raw twin declarations are preserved. Forsyth supports
optional rank separators, color overrides and two-character walk codes. One
8×8 problem is imported at a time; overlapping/underworld units are rejected.
Twin declarations are retained as text, rather than automatically generating
transformed twin boards. Other board dimensions, arbitrary hunter definitions
and unrecognized commands are rejected instead of being silently discarded.

The file importer accepts `.inp`, `.txt` and `.fen`; Save Popeye downloads an
`.inp` file. Compositions have a 32768-character bound. Popeye shares use a URL
fragment to avoid sending the whole document in the HTTP request path.

Two valid `Remark` comments preserve editor-only information when needed:
`ChessViewerFEN` retains the ordinary five FEN metadata fields, and
`ChessViewerSymbols` retains unnamed rotated glyphs mixed with named walks.
These comments are ChessViewer conventions, not a universal extension to FEN;
Popeye reads them as remarks. Arbitrary symbol rotations do not assert a walk.

PNG/JPEG/SVG exports include a composition legend, conditions and metadata.
SVG also embeds the source notation. LaTeX uses documented `\pieces` and
`\fieldtext` commands; unassigned glyphs use explicit color-prefixed walk codes.

## Integration

- Standard assets: `/piece/<set>/<piece>.svg`.
- Generated fairy assets: `/fairypiece/<set>/<piece>.svg`.
- `pnpm pieces:fairy` regenerates the fairy directory from the twelve originals.
- Orthodox database searches are disabled for fairy positions; FFEN is never sent
  to a service expecting ordinary FEN.
- LaTeX Studio uses `diagram` for fairy positions. Its documented `\pieces` syntax
  supports neutral units and R/U/L rotations. The other package choices are
  unavailable while the project contains fairy symbols. Counts include neutral
  pieces separately.

Regression tests: `tests/fairyFen.test.ts`, `tests/boardCells.test.ts`,
`tests/fairyPieces.test.ts`, `tests/popeye.test.ts` and the SVG export tests.
