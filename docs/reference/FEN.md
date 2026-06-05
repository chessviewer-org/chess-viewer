# FEN Notation

Reference for Forsyth-Edwards Notation (FEN) and its implementation in ChessVision.

---

## Table of Contents

- [What Is FEN?](#what-is-fen)
- [FEN Structure](#fen-structure)
- [Piece Placement](#piece-placement)
- [Active Color](#active-color)
- [Castling Rights](#castling-rights)
- [En Passant](#en-passant)
- [Move Counters](#move-counters)
- [Examples](#examples)
- [Validation Rules](#validation-rules)
- [Common Positions](#common-positions)
- [Parser Implementation](#parser-implementation)
- [Troubleshooting](#troubleshooting)

---

## What Is FEN?

Forsyth-Edwards Notation (FEN) is the standard text format for describing a chess position. It encodes all information needed to reconstruct a board position: piece placement, side to move, castling rights, en passant availability, and move counters.

Created by David Forsyth in the 19th century and extended by Steven J. Edwards in the 1990s for computer use.

---

## FEN Structure

A complete FEN string has six space-separated fields:

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
│                                           │ │    │ │ │
│                                           │ │    │ │ └─ Fullmove number
│                                           │ │    │ └─── Halfmove clock
│                                           │ │    └───── En passant target
│                                           │ └────────── Castling rights
│                                           └──────────── Active color
└──────────────────────────────────────────────────────── Piece placement
```

| Field | Description                   | Example                                       |
| ----- | ----------------------------- | --------------------------------------------- |
| 1     | Piece placement, ranks 8 to 1 | `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR` |
| 2     | Side to move                  | `w` or `b`                                    |
| 3     | Castling rights               | `KQkq`, `Kk`, `-`                             |
| 4     | En passant target square      | `e3`, `-`                                     |
| 5     | Halfmove clock                | `0`, `5`                                      |
| 6     | Fullmove number               | `1`, `20`                                     |

ChessVision accepts FEN strings with 1–6 fields. A position-only FEN (field 1 only) is valid for display purposes.

**Maximum length enforced before parsing: 93 characters.**

---

## Piece Placement

### Piece Letters

| Letter | Piece  | Color |
| ------ | ------ | ----- |
| `K`    | King   | White |
| `Q`    | Queen  | White |
| `R`    | Rook   | White |
| `B`    | Bishop | White |
| `N`    | Knight | White |
| `P`    | Pawn   | White |
| `k`    | King   | Black |
| `q`    | Queen  | Black |
| `r`    | Rook   | Black |
| `b`    | Bishop | Black |
| `n`    | Knight | Black |
| `p`    | Pawn   | Black |

Uppercase = White. Lowercase = Black.

### Rank Encoding

- Ranks are listed from rank 8 (top of board, Black's back rank) to rank 1 (White's back rank)
- Ranks are separated by `/`
- Within each rank, squares are listed from file a to file h
- A digit (1–8) represents that many consecutive empty squares

### Example

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR

Rank 8: r n b q k b n r  (Black pieces)
Rank 7: p p p p p p p p  (Black pawns)
Rank 6: 8 empty squares
Rank 5: 8 empty squares
Rank 4: 8 empty squares
Rank 3: 8 empty squares
Rank 2: P P P P P P P P  (White pawns)
Rank 1: R N B Q K B N R  (White pieces)
```

---

## Active Color

The second field indicates whose turn it is to move.

- `w` — White to move
- `b` — Black to move

---

## Castling Rights

The third field encodes which castling moves are still legally available.

| Character | Meaning                    |
| --------- | -------------------------- |
| `K`       | White can castle kingside  |
| `Q`       | White can castle queenside |
| `k`       | Black can castle kingside  |
| `q`       | Black can castle queenside |
| `-`       | No castling available      |

Examples:

| Notation | Meaning                                           |
| -------- | ------------------------------------------------- |
| `KQkq`   | All castling rights available (starting position) |
| `KQ`     | Only White can castle                             |
| `Kk`     | Both sides can castle kingside only               |
| `-`      | No castling available                             |

---

## En Passant

The fourth field indicates the en passant target square, or `-` if none is available.

If a pawn advances two squares on the previous move, the target square (where a capturing pawn would land) is recorded. This opportunity expires after one move.

Valid en passant squares:

- Rank 3: available for Black to capture (after White pawn advances from rank 2 to rank 4)
- Rank 6: available for White to capture (after Black pawn advances from rank 7 to rank 5)

Format: file letter (a–h) + rank number (3 or 6). Example: `e3`, `h6`.

---

## Move Counters

### Halfmove Clock (Field 5)

Counts half-moves (plies) since the last pawn advance or capture. Used for the 50-move draw rule. Resets to 0 on any pawn move or capture. Range: 0–100+.

### Fullmove Number (Field 6)

Counts full moves. Starts at 1. Increments after Black's move.

---

## Examples

### Starting Position

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

All pieces on starting squares. White to move. All castling available. No en passant. Move 1.

### After 1. e4

```
rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
```

White pawn on e4. Black to move. En passant available on e3.

### After 1. e4 c5 (Sicilian Defense)

```
rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2
```

Black pawn on c5. White to move. En passant available on c6. Move 2.

### Ruy Lopez (after 3. Bb5)

```
r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3
```

No en passant. 3 halfmoves since last pawn move. Move 3.

### Endgame (King vs King)

```
8/5k2/8/8/8/3K4/8/8 w - - 50 100
```

Two kings only. No castling. No en passant. 50 halfmoves since last capture/pawn move. Move 100.

---

## Validation Rules

**Source:** `src/shared/utils/fenParser.ts` and `src/shared/utils/validation.ts`.

### Length

```typescript
if (fen.length > MAX_FEN_LENGTH)
  throw new FENParseError('FEN exceeds maximum length');
// MAX_FEN_LENGTH = 93
```

### Piece Placement

- Exactly 8 ranks separated by `/`
- Each rank sums to exactly 8 squares (digits + piece letters)
- Only valid characters: `prnbqkPRNBQK` and digits `1–8`

### Active Color

Must be `w` or `b`.

### Castling Rights

Must match `/^[KQkq]+$/` with no duplicate characters, or be `-`.

### En Passant

Must be `-`, or a square on rank 3 (files a–h) or rank 6 (files a–h). Format: `/^[a-h][36]$/`.

### Move Counters

- Halfmove clock: non-negative integer
- Fullmove number: positive integer (>= 1)

---

## Common Positions

```
Starting position:
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

Scholar's Mate:
r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4

Fool's Mate (fastest checkmate):
rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3

Lucena Position:
1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1

Philidor Position:
3k4/R7/8/8/8/8/r7/4K3 b - - 0 1
```

---

## Parser Implementation

**Source files:**

- Parse: `src/shared/utils/fenParser.ts`
- Board-to-FEN: `src/shared/utils/boardUtils.ts`

### FEN to Board Array (`parseFEN`)

Returns an 8×8 array of strings. Empty square = `''`. Piece = piece letter (`'K'`, `'p'`, etc.).

```typescript
export function parseFEN(fenString: string): BoardMatrix {
  const parts = fenString.trim().split(/\s+/);
  const position = parts[0];
  const rows = position.split('/');

  return rows.map((row) => {
    const boardRow: string[] = [];
    for (const char of row) {
      if (VALID_DIGITS.has(char)) {
        for (let i = 0; i < parseInt(char, 10); i++) {
          boardRow.push('');
        }
      } else {
        boardRow.push(char);
      }
    }
    return boardRow;
  });
}
```

### Board Array to FEN (`boardToFEN`)

Converts an 8×8 board array back to a FEN piece-placement string and appends the default suffix `w - - 0 1`.

```typescript
export function boardToFEN(board: BoardMatrix): string {
  const ranks = board.map((row) => {
    let rankStr = '';
    let emptyCount = 0;
    for (const square of row) {
      if (square === '') {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount;
          emptyCount = 0;
        }
        rankStr += square;
      }
    }
    if (emptyCount > 0) rankStr += emptyCount;
    return rankStr;
  });
  return ranks.join('/') + ' w - - 0 1';
}
```

Used by `useInteractiveBoard` to convert drag-and-drop board state back to a FEN string.

---

## Troubleshooting

### Wrong number of ranks

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP     ← missing rank 1
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1  ← correct
```

### Rank does not sum to 8 squares

```
rnbqkbnr/ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR    ← rank 7 has 7 squares
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR   ← correct
```

### Invalid piece character

```
RNBXKBNR    ← 'X' is not a valid piece letter
RNBQKBNR   ← correct
```

### Invalid en passant square

```
e4    ← rank 4 is not valid for en passant
e3    ← correct (rank 3 or 6 only)
```

---

_Last updated: May 2026 — v6.0.0_
