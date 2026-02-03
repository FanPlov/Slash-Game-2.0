
export enum SymbolType {
  VERTICAL = 'V',   // |
  HORIZONTAL = 'H', // —
  PLUS = 'PLUS',    // +
  SLASH = 'SLASH',  // /
  EMPTY = 'EMPTY'
}

export enum GamePhase {
  EXPANSION = 1,
  BATTLE = 2
}

export enum Player {
  ONE = 1, // Vertical (|)
  TWO = 2  // Horizontal (—)
}

export enum GameMode {
  PVP = 'PVP',
  PVE = 'PVE'
}

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED'
}

export enum Language {
  EN = 'EN',
  RU = 'RU',
  UZ = 'UZ'
}

export type BoardState = (SymbolType | null)[];

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  phase: GamePhase;
  lastMoveIndex: number | null;
  winner: Player | 'DRAW' | null;
  winReason?: string;
}
