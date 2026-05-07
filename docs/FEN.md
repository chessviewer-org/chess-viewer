# FEN Notation Guide

Guide to Forsyth-Edwards Notation (FEN) for chess positions.

---

## Table of Contents

- [What is FEN?](#what-is-fen)
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

## What is FEN?

**Forsyth-Edwards Notation (FEN)** is a standard notation for describing a particular board position in chess.

### Purpose

- Compact representation of board state
- Human-readable and machine-parsable
- Industry standard (used by chess engines, databases)
- Easy to copy/paste and share
- Contains all information needed to reconstruct position

### History

- Created by Scottish journalist **David Forsyth** (19th century)
- Extended by **Steven J. Edwards** for computer use (1990s)
- Universal standard for chess position notation

---

## FEN Structure

A complete FEN string has **6 fields** separated by spaces:

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

### Field Breakdown

| Field              | Description                           | Example                                       |
| ------------------ | ------------------------------------- | --------------------------------------------- |
| 1. Piece Placement | Board position from rank 8 to rank 1  | `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR` |
| 2. Active Color    | Side to move next                     | `w` (white) or `b` (black)                    |
| 3. Castling Rights | Available castling moves              | `KQkq`, `Kk`, `-`                             |
| 4. En Passant      | En passant target square              | `e3`, `-`                                     |
| 5. Halfmove Clock  | Moves since last pawn move or capture | `0`, `5`, `42`                                |
| 6. Fullmove Number | Current move number                   | `1`, `20`, `100`                              |

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

**Rule:** Uppercase = White pieces, Lowercase = Black pieces

### Rank Notation

- Board is described **rank by rank** from **rank 8 (top) to rank 1 (bottom)**
- Ranks are separated by **forward slash** `/`
- Within each rank, pieces are listed from **file a to file h**

### Empty Squares

- Empty squares are represented by **digits 1-8**
- Digit represents the number of consecutive empty squares
- Example: `8` means 8 empty squares (entire rank)

### Example Breakdown

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
│         │        │ │ │ │         │
│         │        │ │ │ │         └─ Rank 1: White pieces (back rank)
│         │        │ │ │ └─────────── Rank 2: White pawns
│         │        │ │ └───────────── Ranks 3-4-5-6: Empty
│         │        └─────────────────── Rank 7: Black pawns
│         └──────────────────────────── Rank 8: Black pieces (back rank)
└────────────────────────────────────── Starting position notation
```

### Rank 8 (Black's back rank)

```
r n b q k b n r
a8 b8 c8 d8 e8 f8 g8 h8
```

### Rank 7 (Black pawns)

```
p p p p p p p p
a7 b7 c7 d7 e7 f7 g7 h7
```

### Rank 6-3 (Empty)

```
8 = all squares empty
```

### Rank 2 (White pawns)

```
P P P P P P P P
a2 b2 c2 d2 e2 f2 g2 h2
```

### Rank 1 (White's back rank)

```
R N B Q K B N R
a1 b1 c1 d1 e1 f1 g1 h1
```

---

## Active Color

**Second field** indicates whose turn it is to move.

```
w = White to move
b = Black to move
```

### Examples

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w ...
                                            ↑
                                         White's turn

rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b ...
                                              ↑
                                          Black's turn
```

---

## Castling Rights

**Third field** shows which castling moves are still legal.

### Notation

- `K` = White can castle kingside (O-O)
- `Q` = White can castle queenside (O-O-O)
- `k` = Black can castle kingside (O-O)
- `q` = Black can castle queenside (O-O-O)
- `-` = No castling available for either side

### Examples

| Notation | Meaning                                           |
| -------- | ------------------------------------------------- |
| `KQkq`   | All castling rights available (starting position) |
| `KQ`     | Only White can castle (both sides)                |
| `kq`     | Only Black can castle (both sides)                |
| `Kk`     | Both sides can castle kingside only               |
| `Q`      | Only White can castle queenside                   |
| `-`      | No castling available                             |

### Castling Requirements

For castling to be legal:

1. King has not moved
2. Relevant rook has not moved
3. No pieces between king and rook
4. King not in check
5. King doesn't pass through check
6. King doesn't end in check

**Note:** FEN only tracks requirements 1 and 2. Other requirements must be checked during move validation.

---

## En Passant

**Fourth field** indicates the en passant target square (if available).

### What is En Passant?

Special pawn capture rule:

- If a pawn moves **two squares forward** from starting position
- And lands **beside** an opponent's pawn
- That opponent can capture "in passing" on the next move only

### Notation

- Square where capturing pawn would land (not where the pawn is)
- Format: file (a-h) + rank (3 or 6)
- `-` if no en passant is available

### Examples

```
After 1. e4:
rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
                                                     ^^
                                               Black can capture
                                               on e3 en passant

After 1. e4 e5:
rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2
                                                       ^^
                                                 White can capture
                                                 on e6 en passant

After 1. e4 e5 2. Nf3:
rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 0 2
                                                         ^
                                                    No en passant
                                                    (opportunity expired)
```

### Valid En Passant Squares

- White pawns: Files a-h, rank 6 (e.g., `a6`, `e6`, `h6`)
- Black pawns: Files a-h, rank 3 (e.g., `a3`, `e3`, `h3`)

---

## Move Counters

### Halfmove Clock (Fifth Field)

Counts moves since last **pawn advance** or **capture**.

**Purpose:** Used for the **50-move rule**

- If 50 moves (100 half-moves) occur with no pawn move or capture, game is a draw

**Range:** 0 to 100+ (theoretically unlimited, but usually ≤ 50)

### Examples

```
Starting position:
... 0 1
    ↑
  No moves yet

After 1. e4:
... 0 1
    ↑
  Pawn moved, reset to 0

After 1. e4 e5 2. Nf3:
... 1 2
    ↑
  One move since last pawn move

After 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6:
... 0 4
    ↑
  Capture occurred, reset to 0
```

### Fullmove Number (Sixth Field)

Counts the number of **full moves** in the game.

**Rules:**

- Starts at 1
- Increments after **Black's move**
- White's first move is move 1, Black's response is still move 1

### Examples

```
Starting position (before any moves):
... 0 1
    ↑
  Move 1 hasn't happened yet

After 1. e4 (White's first move):
... 0 1
    ↑
  Still move 1 (White just moved)

After 1. e4 e5 (Black's first move):
... 0 2
    ↑
  Now move 2 (full move completed)

After 10. Nf3 (White's 10th move):
... 5 10
    ↑
  Move 10

After 10... Nc6 (Black's 10th move):
... 6 11
    ↑
  Move 11
```

---

## Examples

### Starting Position

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

**Explanation:**

- All pieces in starting squares
- White to move
- All castling available
- No en passant
- No moves made yet
- Move 1

---

### After 1. e4

```
rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1
```

**Changes:**

- White pawn moved from e2 to e4
- Black to move
- En passant available on e3
- Still move 1 (Black hasn't responded yet)

---

### After 1. e4 c5 (Sicilian Defense)

```
rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2
```

**Changes:**

- Black pawn moved from c7 to c5
- White to move
- En passant available on c6
- Move 2 begins

---

### After 1. e4 e5 2. Nf3 Nc6 3. Bb5 (Ruy Lopez)

```
r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3
```

**Changes:**

- Multiple pieces moved
- Black to move
- No en passant (last move wasn't two-square pawn advance)
- 3 half-moves since last pawn move
- Move 3

---

### Middle Game Position

```
r3k2r/ppp2ppp/2n1b3/3pp3/2BPP3/2N2N2/PPP2PPP/R1BQK2R w KQkq d6 0 7
```

**Complex position with:**

- Both sides developed
- En passant available
- Both sides can still castle
- Move 7

---

### Endgame Position

```
8/5k2/8/8/8/3K4/8/8 w - - 50 100
```

**King and pawn endgame:**

- Only two kings on board
- Neither side can castle
- No en passant
- 50 half-moves (50-move rule approaching)
- Move 100

---

## Validation Rules

**Source file:** `src/utils/validation.js` — `isValidFENFormat(fen)`.  
Re-exported as `validateFEN` from `src/utils/index.js` and used throughout hooks and contexts.

### Basic Validation

```javascript
// src/utils/validation.js
export function isValidFENFormat(fen) {
  if (!fen || typeof fen !== 'string') return false;

  const parts = fen.trim().split(/\s+/);
  // Accepts 1–6 fields (position-only FEN is valid for display purposes)
  if (parts.length < 1 || parts.length > 6) return false;

  const position = parts[0];
  const ranks = position.split('/');
  if (ranks.length !== 8) return false;

  for (const rank of ranks) {
    let squareCount = 0;
    for (const char of rank) {
      if (/[1-8]/.test(char)) {
        squareCount += parseInt(char, 10);
      } else if (/[pnbrqkPNBRQK]/.test(char)) {
        squareCount += 1;
      } else {
        return false; // invalid character
      }
    }
    if (squareCount !== 8) return false;
  }

  return true;
}
```

**Note:** The validator accepts FEN strings with 1–6 fields. A position-only FEN (no color/castling/etc.) is considered valid for display purposes. Full 6-field FEN is required for strict chess legality checks.

### Position Validation

```javascript
const validatePosition = (position) => {
  const ranks = position.split('/');

  // Must have exactly 8 ranks
  if (ranks.length !== 8) return false;

  for (const rank of ranks) {
    let squareCount = 0;

    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        // Empty squares
        squareCount += parseInt(char);
      } else if ('prnbqkPRNBQK'.includes(char)) {
        // Piece
        squareCount += 1;
      } else {
        // Invalid character
        return false;
      }
    }

    // Each rank must have exactly 8 squares
    if (squareCount !== 8) return false;
  }

  return true;
};
```

### Color Validation

```javascript
const validateColor = (color) => {
  return color === 'w' || color === 'b';
};
```

### Castling Validation

```javascript
const validateCastling = (castling) => {
  if (castling === '-') return true;

  // Must only contain K, Q, k, q
  const valid = /^[KQkq]+$/.test(castling);

  // No duplicates
  const noDuplicates = new Set(castling).size === castling.length;

  // Correct order (K before Q, k before q)
  const correctOrder =
    (castling.indexOf('K') < castling.indexOf('Q') ||
      castling.indexOf('Q') === -1) &&
    (castling.indexOf('k') < castling.indexOf('q') ||
      castling.indexOf('q') === -1);

  return valid && noDuplicates && correctOrder;
};
```

### En Passant Validation

```javascript
const validateEnPassant = (enPassant) => {
  if (enPassant === '-') return true;

  // Must be like "e3" or "a6"
  const match = enPassant.match(/^([a-h])([36])$/);

  if (!match) return false;

  const [, file, rank] = match;

  // Rank must be 3 (for black) or 6 (for white)
  return rank === '3' || rank === '6';
};
```

### Move Counter Validation

```javascript
const validateHalfmove = (halfmove) => {
  const num = parseInt(halfmove);
  return !isNaN(num) && num >= 0;
};

const validateFullmove = (fullmove) => {
  const num = parseInt(fullmove);
  return !isNaN(num) && num >= 1;
};
```

---

## Common Positions

### Famous Positions

#### 1. Starting Position

```
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

#### 2. Scholar's Mate

```
r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4
```

#### 3. Fool's Mate (Fastest Checkmate)

```
rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3
```

#### 4. Lucena Position (Endgame Study)

```
1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1
```

#### 5. Philidor Position (Endgame Study)

```
3k4/R7/8/8/8/8/r7/4K3 b - - 0 1
```

---

## Parser Implementation

**Source files:** `src/utils/fenParser.ts` (parse) and `src/utils/boardUtils.js` (board-to-FEN).

### Parse FEN to Board Array

The actual implementation uses **empty string** `''` for empty squares (not `null`).
Valid piece characters are stored in a `Set` for O(1) lookup, and valid digit characters in another `Set`.

```javascript
// src/utils/fenParser.ts
export function parseFEN(fenString) {
  const parts = fenString.trim().split(/\s+/);
  const position = parts[0];
  const rows = position.split('/');

  const board = [];

  for (const row of rows) {
    const boardRow = [];

    for (const char of row) {
      if (VALID_DIGITS.has(char)) {
        const emptySquares = parseInt(char, 10);
        for (let i = 0; i < emptySquares; i++) {
          boardRow.push(''); // empty string, not null
        }
      } else {
        boardRow.push(char); // piece letter, e.g. 'K', 'p'
      }
    }

    board.push(boardRow);
  }

  return board; // string[][8][8]
}
```

Returns an 8×8 array of strings: `''` = empty square, piece letter (`'K'`, `'p'`, etc.) = occupied.

A memoised wrapper around this function is provided by the `useChessBoard(fen)` hook.

### Board Array to FEN

The reverse conversion is in `src/utils/boardUtils.js`:

```javascript
// src/utils/boardUtils.js
export function boardToFEN(board) {
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

  // Appends default suffix 'w - - 0 1' for display purposes
  return ranks.join('/') + ' w - - 0 1';
}
```

Used by `useInteractiveBoard` to convert the drag-and-drop board state back to a FEN string.

---

## Troubleshooting

### Common Errors

#### 1. Wrong Number of Ranks

```
❌ rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP
    Missing rank 1!

✅ rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

#### 2. Wrong Number of Squares in Rank

```
❌ rnbqkbnr/ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
    Rank 7 only has 7 squares!

✅ rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

#### 3. Invalid Piece Character

```
❌ rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBXKBNR
    'X' is not a valid piece!

✅ rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

#### 4. Missing Fields

```
❌ rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
    Missing color, castling, en passant, counters!

✅ rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

#### 5. Invalid En Passant Square

```
❌ ... e4
    En passant must be on rank 3 or 6!

✅ ... e3
    or
✅ ... e6
```

---

## Resources

### Online Tools

- [Lichess Board Editor](https://lichess.org/editor) - Visual FEN editor
- [Chess.com Analysis Board](https://www.chess.com/analysis) - FEN input and analysis
- [FEN Validator](https://www.chess.com/analysis/game/pgn) - Check FEN validity

### Documentation

- [FEN Wikipedia](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
- [Chess Programming Wiki - FEN](https://www.chessprogramming.org/Forsyth-Edwards_Notation)

### Libraries

- [chess.js](https://github.com/jhlywa/chess.js) - Full-featured chess library with FEN support
- [python-chess](https://python-chess.readthedocs.io/) - Python chess library

---

**Last Updated:** May 6, 2026  
**Version:** 5.0.0  
**Maintainer:** [@BilgeGates](https://github.com/BilgeGates)
