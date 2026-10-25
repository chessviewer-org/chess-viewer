# Editor layout

The editor lays out against the width of `.workspace-container` (`container: workspace / inline-size`), not the viewport. `C` below is that container's content width in px.

## Where the math lives

All derived values are computed in `editor/_metrics.scss` with Sass math (`math.div`, `math.min`, `math.percentage`), not written as literals:

- the rank and file label boxes use `percentage(1 − s)` and `percentage(s)`, and each rank is `percentage(1/8)` tall
- the command bar overhead is `2·1px + 7·4px + 8px = 38px`
- build-time assertions fail the compile if the side breakpoint gives squares under 34px, if the desktop board is smaller than the side-by-side board, or if the command bar does not fit 283px

## Constants

| Name             | Value      | Source                              |
| ---------------- | ---------- | ----------------------------------- |
| board scale `s`  | 0.95       | `editor/_metrics.scss`              |
| rank/file gutter | 1 − s      | share of the column kept for labels |
| top inset `i`    | 3 px       | `--board-top-inset`                 |
| frame `f`        | 0 / 2.5 px | `--board-frame` (thin frame)        |
| side breakpoint  | 564 px     | `$editor-breakpoint-side`           |
| command-in-panel | 800 px     | `$editor-breakpoint-cmd`            |
| desktop          | 1024 px    | `$editor-breakpoint-desk`           |

## Board column `B`

- `C < 564`: one column, `B = min(C, 70vh, 520px)`
- `564 ≤ C < 1024`: `B = min(52cqi, 460px)`
- `C ≥ 1024`: `B = min(54cqi, 520px)`

The board is `s·B` wide and tall and sits in the top right of the column.
Standard and Fairy use the same board and panel layout from `C = 564` onward.

## Panel height

Side by side, the panel bottom meets the board bottom:

`H = s·B + f + i`

The same expression is used for the panel in both variants. Stacked, the analysis panel is as wide as the board column, so its height is `aspect-ratio: 1 / s`.

## Palette cell

In side-by-side layouts the standard palette (`PiecePalette fit`) takes the height left after display options and trash. Each cell is `max(1.75rem, min(100%, 100cqb))` of its row, so the palette shrinks to fit and never pushes the panel past the board.

The Fairy palette uses the same outer panel geometry. Its extra symbol groups pair into two rows when the palette is at least `20rem` wide; at narrower widths, the palette card scrolls internally so its controls never overlap the display options or trash zone.

## Command bar

Seven buttons, two 1 px dividers and seven 0.25 rem gaps share the row:

`size = clamp(1.75rem, (100cqi − 2.375rem) / 7, 2.1875rem)`

where `2.375rem` is the 38 px of dividers, gaps and side padding.

## Verified widths

Measured as `panel.bottom − board.bottom` with analysis open and closed, plus horizontal overflow of the editor root: 320, 360, 390, 430, 520, 563, 602, 640, 700, 768, 800, 839, 900, 1000, 1023, 1060, 1100, 1300 (standard) and 320 to 1300 (fairy). Side-by-side difference is 0.0 px and overflow is 0 at every width.
