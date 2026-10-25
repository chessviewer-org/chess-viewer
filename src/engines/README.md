# Analysis engines

Each directory owns one concern; nothing is shared by copy.

| Path         | Concern                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `core/`      | Engine-agnostic types (`types.ts`) and search limits (`limits.ts`)                                                    |
| `rules/`     | Chess rules: `pieces.ts` move tables, `moves.ts` generation, `legality.ts` position checks, `position.ts` editor glue |
| `popeye/`    | Fairy solver: input language, worker client, output parser, settings                                                  |
| `stockfish/` | Orthodox analysis: UCI client, output parser, models and settings                                                     |

Related locations outside `src/engines/`:

| Path                                   | Concern                                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `src/components/interactions/Analysis` | Panel UI shared by both engines (`components/`, `hooks/`, `styles/`) |
| `public/wasm/<engine>/`                | Runtime binaries and workers only                                    |
| `public/licenses/<engine>/`            | Licenses, notices, manuals and source offers                         |
| `native/<engine>/`                     | Native sources: patches and the build script                         |

## Rules

`rules/pieces.ts` describes geometric move hints. Standard analysis uses the orthodox
legality checks in `rules/`. Popeye also uses these checks for orthodox diagrams before
solving. Hints are withheld for conditions that alter movement.

When rules are enabled in Fairy analysis, `popeye/moves.ts` asks the native engine for
all legal one-ply continuations of the displayed position. Conditions and piece
attributes stay in Popeye's input language. Capture/rebirth, swaps and Take & Make
stages come from the native move-effect journal. When multiple continuations match a
destination, the UI asks which complete move to play. Incomplete searches never
authorize a move. The preceding move vector is supplied for SynchronMover rules.

`animation.ts` describes playback paths shared with the board UI. The native final
position remains authoritative. Board transformations without a supported journal
animation show their final position directly. Turning rules off restores free diagram
editing.

## Engines

The editor opts into an engine by variant: Popeye on `/fairy-chess`, Stockfish in the
Standard editor. Each loads only its own worker.

Popeye's `S` means knight and `N` means nightrider. Only explicit conversion at the Popeye
input boundary changes a FEN knight `N` to a Popeye knight `S`. Never pass a FEN suffix
(`w - - 0 1`) as part of a Popeye `Forsyth` placement. `src/shared/utils/popeye.ts` owns
Popeye document import and export.
