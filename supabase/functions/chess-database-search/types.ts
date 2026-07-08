export type Provider = 'lichess' | 'chessdb' | 'pdb' | 'yacpdb';

export interface SearchResponse {
  found: boolean;
  database: string | null;
  url: string | null;
}

export interface ProviderHit {
  found: boolean;
  url: string;
}

export type ProviderMap = Record<Provider, ProviderHit>;

export interface PlacedPiece {
  piece: string;
  white: boolean;
  square: string;
}
