export interface DetailedFENValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * Təfərrüatlı FEN yoxlanışı (Detailed FEN Validation).
 * Provides highly specific, human-readable error messages pointing out EXACTLY where the FEN is wrong.
 *
 * @param fen - Yoxlanılacaq FEN kodu
 * @returns {DetailedFENValidationResult} Yoxlanış nəticəsi və xəta mesajı
 */
export function validateFENDetailed(fen: string): DetailedFENValidationResult {
  if (typeof fen !== 'string') {
    return { isValid: false, errorMessage: "Xəta: FEN kodu string formatında olmalıdır." };
  }

  const trimmedFen = fen.trim();

  // 1. Length/DoS Check
  if (trimmedFen.length > 100) {
    return { isValid: false, errorMessage: "Xəta: FEN kodu çox uzundur." };
  }

  // 2. Structure (Spaces)
  const parts = trimmedFen.split(/\s+/);
  if (parts.length !== 6) {
    return {
      isValid: false,
      errorMessage: `Xəta: FEN kodu 6 hissədən ibarət olmalıdır. Sizdə ${parts.length} hissə var.`
    };
  }

  const [placement, activeColor, castling, enPassant, halfMove, fullMove] = parts;

  // 3. Piece Placement (Part 1)
  const rows = placement.split('/');
  if (rows.length !== 8) {
    return {
      isValid: false,
      errorMessage: `Xəta: Şahmat taxtasında 8 sətir olmalıdır, lakin sizdə ${rows.length} sətir var.`
    };
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let squareCount = 0;

    for (const char of row) {
      if (/[1-8]/.test(char)) {
        squareCount += parseInt(char, 10);
      } else if (/[pnrqbkPNRQBK]/.test(char)) {
        squareCount += 1;
      } else {
        return {
          isValid: false,
          errorMessage: "Xəta: Fişur düzülüşündə yalnış simvol var."
        };
      }
    }

    if (squareCount !== 8) {
      return {
        isValid: false,
        errorMessage: `Xəta: ${i + 1}-ci sətirdəki xanaların cəmi 8 deyil.`
      };
    }
  }

  // 4. Active Color (Part 2)
  if (activeColor !== 'w' && activeColor !== 'b') {
    return {
      isValid: false,
      errorMessage: "Xəta: Gediş sırası yalnız 'w' (ağ) və ya 'b' (qara) ola bilər."
    };
  }

  // 5. Castling (Part 3)
  if (castling !== '-' && !/^[KQkq]{1,4}$/.test(castling)) {
    return {
      isValid: false,
      errorMessage: "Xəta: Rokirovka (castling) hissəsi yalnışdır."
    };
  }

  // 6. En Passant (Part 4)
  if (enPassant !== '-' && !/^[a-h][36]$/.test(enPassant)) {
    return {
      isValid: false,
      errorMessage: "Xəta: En passant xanası yalnışdır."
    };
  }

  // 7. Halfmove & Fullmove (Parts 5 & 6)
  if (!/^\d+$/.test(halfMove) || !/^\d+$/.test(fullMove)) {
    return {
      isValid: false,
      errorMessage: "Xəta: Gediş sayları yalnız rəqəm olmalıdır."
    };
  }

  // Bütün yoxlamalardan uğurla keçdi
  return { isValid: true, errorMessage: null };
}
