
import { SymbolType, GamePhase, Player, BoardState, GameState } from '../types';

// --- CONSTANTS ---
export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- GAME RULES ---

export const checkWinner = (board: BoardState): boolean => {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (
      board[a] === SymbolType.SLASH &&
      board[b] === SymbolType.SLASH &&
      board[c] === SymbolType.SLASH
    ) {
      return true;
    }
  }
  return false;
};

export const isValidMove = (
  state: GameState,
  index: number,
  player: Player
): boolean => {
  const { board, phase, lastMoveIndex, winner } = state;
  if (winner) return false;

  const currentSymbol = board[index];
  const playerSymbol = player === Player.ONE ? SymbolType.VERTICAL : SymbolType.HORIZONTAL;
  const opponentSymbol = player === Player.ONE ? SymbolType.HORIZONTAL : SymbolType.VERTICAL;

  // Ko Rule: Cannot move to the exact spot opponent just played (Applies in BOTH phases)
  if (index === lastMoveIndex) {
    return false;
  }

  if (phase === GamePhase.EXPANSION) {
    // 1. Place on Empty
    if (currentSymbol === null) return true;
    // 2. Create PLUS on Opponent Symbol
    if (currentSymbol === opponentSymbol) return true;
    return false;
  } else {
    // BATTLE PHASE
    // 1. Create SLASH from PLUS
    if (currentSymbol === SymbolType.PLUS) return true;
    // 2. Create PLUS from Opponent Symbol
    if (currentSymbol === opponentSymbol) return true;
    return false;
  }
};

export const executeMove = (
  state: GameState,
  index: number
): GameState => {
  const { board, currentPlayer, phase } = state;
  const newBoard = [...board];
  const currentSymbol = board[index];
  const playerSymbol = currentPlayer === Player.ONE ? SymbolType.VERTICAL : SymbolType.HORIZONTAL;
  const opponentSymbol = currentPlayer === Player.ONE ? SymbolType.HORIZONTAL : SymbolType.VERTICAL;

  // Apply Move Logic
  if (phase === GamePhase.EXPANSION) {
    if (currentSymbol === null) {
      newBoard[index] = playerSymbol;
    } else if (currentSymbol === opponentSymbol) {
      newBoard[index] = SymbolType.PLUS;
    }
  } else {
    // Battle Phase
    if (currentSymbol === SymbolType.PLUS) {
      newBoard[index] = SymbolType.SLASH;
    } else if (currentSymbol === opponentSymbol) {
      newBoard[index] = SymbolType.PLUS;
    }
  }

  // Check Win Condition
  if (checkWinner(newBoard)) {
    return {
      ...state,
      board: newBoard,
      winner: currentPlayer,
      lastMoveIndex: index,
      winReason: "Three Slashes"
    };
  }

  // Check Phase Transition
  let newPhase = phase;
  if (phase === GamePhase.EXPANSION && newBoard.every(cell => cell !== null)) {
    newPhase = GamePhase.BATTLE;
  }

  const nextPlayer = currentPlayer === Player.ONE ? Player.TWO : Player.ONE;

  // Check Draw (No legal moves available for next player)
  // Only strictly necessary in Battle phase, but good to check always to prevent lock
  const tempState = { ...state, board: newBoard, phase: newPhase, lastMoveIndex: index, currentPlayer: nextPlayer, winner: null };
  const hasLegalMoves = newBoard.some((_, idx) => isValidMove(tempState, idx, nextPlayer));

  if (!hasLegalMoves) {
    return {
      ...state,
      board: newBoard,
      phase: newPhase,
      lastMoveIndex: index,
      winner: 'DRAW',
      winReason: "Stalemate"
    };
  }

  return {
    ...state,
    board: newBoard,
    currentPlayer: nextPlayer,
    phase: newPhase,
    lastMoveIndex: index
  };
};

// --- MINIMAX AI ---

const evaluateBoard = (state: GameState, player: Player): number => {
  const { board, winner } = state;
  if (winner === player) return 1000;
  if (winner && winner !== 'DRAW') return -1000;
  if (winner === 'DRAW') return 0;

  let score = 0;
  const opponent = player === Player.ONE ? Player.TWO : Player.ONE;
  const pSymbol = player === Player.ONE ? SymbolType.VERTICAL : SymbolType.HORIZONTAL;
  const oSymbol = player === Player.ONE ? SymbolType.HORIZONTAL : SymbolType.VERTICAL;

  // Heuristics
  WINNING_LINES.forEach(line => {
    const symbols = line.map(idx => board[idx]);
    const slashCount = symbols.filter(s => s === SymbolType.SLASH).length;
    const plusCount = symbols.filter(s => s === SymbolType.PLUS).length;
    
    // Threat detection: 2 slashes + 1 Plus is a winning setup
    if (slashCount === 2 && plusCount === 1) {
       // If it's my turn, this is huge. If not, it's dangerous.
       // Since this is a static eval, we just value the potential.
       score += 50; 
    }
    
    if (slashCount === 3) score += 1000;
  });

  // Material / Control
  board.forEach(cell => {
    if (cell === pSymbol) score += 5;
    if (cell === oSymbol) score -= 5;
    if (cell === SymbolType.PLUS) score += 2; // Plus is generally good as it's a stepping stone
    if (cell === SymbolType.SLASH) score += 10; // Slashes are valuable
  });

  return score;
};

export const getBotMove = (state: GameState, depth: number = 3): number | null => {
  let bestScore = -Infinity;
  let bestMove: number | null = null;
  const moves = state.board
    .map((_, i) => i)
    .filter(i => isValidMove(state, i, state.currentPlayer));

  // Sort moves for better pruning (simple heuristic: Center > Corners > Edges)
  moves.sort((a, b) => {
    const priorities = [4, 0, 2, 6, 8, 1, 3, 5, 7]; // Center is index 4
    return priorities.indexOf(a) - priorities.indexOf(b); // Lower index in priorities array = better
  });

  for (const move of moves) {
    const nextState = executeMove(state, move);
    const score = minimax(nextState, depth - 1, false, -Infinity, Infinity, state.currentPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

const minimax = (
  state: GameState, 
  depth: number, 
  isMaximizing: boolean, 
  alpha: number, 
  beta: number,
  maximizingPlayer: Player
): number => {
  if (depth === 0 || state.winner) {
    return evaluateBoard(state, maximizingPlayer);
  }

  const currentPlayer = isMaximizing ? maximizingPlayer : (maximizingPlayer === Player.ONE ? Player.TWO : Player.ONE);
  const moves = state.board
    .map((_, i) => i)
    .filter(i => isValidMove(state, i, currentPlayer));
  
  // If no moves, treat as draw/loss depending on rules, but executeMove handles Draw state.
  if (moves.length === 0) {
      return evaluateBoard(state, maximizingPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = executeMove(state, move);
      const evalScore = minimax(nextState, depth - 1, false, alpha, beta, maximizingPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = executeMove(state, move);
      const evalScore = minimax(nextState, depth - 1, true, alpha, beta, maximizingPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};
