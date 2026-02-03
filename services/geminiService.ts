
import { GoogleGenAI } from "@google/genai";
import { GameState, Player, SymbolType, GamePhase } from "../types";
import { isValidMove } from "../logic/gameEngine";

export const getBotMove = async (state: GameState): Promise<number | null> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found for Gemini Bot");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const boardStr = state.board.map((s, i) => `${i}:${s || 'EMPTY'}`).join(', ');
  const playerSymbol = state.currentPlayer === Player.ONE ? 'VERTICAL (|)' : 'HORIZONTAL (—)';
  const opponentSymbol = state.currentPlayer === Player.ONE ? 'HORIZONTAL (—)' : 'VERTICAL (|)';
  const phaseStr = state.phase === GamePhase.EXPANSION ? 'EXPANSION (Fill board)' : 'BATTLE (Connect 3 Slashes)';

  const prompt = `
    You are an expert strategic AI player for the abstract board game "Slash Game".
    
    ### GAME RULES:
    - **Grid**: 3x3 (indices 0-8).
    - **Symbols**: Vertical (|), Horizontal (—), PLUS (+), SLASH (/).
    - **Phase 1 (Expansion)**: Fill the board. 
      - Valid moves: Place your symbol on EMPTY cell OR Place on Opponent's symbol to make PLUS (+).
    - **Phase 2 (Battle)**: Board is full.
      - Valid moves: Turn PLUS (+) into SLASH (/) OR Turn Opponent's symbol into PLUS (+).
    - **Ko Rule**: You CANNOT move to index ${state.lastMoveIndex}. This index is LOCKED.
    - **Win Condition**: Create 3 SLASHES (/) in a row (horizontal, vertical, or diagonal).

    ### CURRENT STATE:
    - **You are**: ${playerSymbol}
    - **Opponent is**: ${opponentSymbol}
    - **Phase**: ${phaseStr}
    - **Board**: [${boardStr}]
    - **Locked Index**: ${state.lastMoveIndex}

    ### STRATEGY:
    1. **WIN IMMEDIATELY**: If you can create the 3rd SLASH to complete a line, DO IT.
    2. **BLOCK WIN**: If the opponent has 2 slashes and can make a 3rd on their next turn, you MUST disrupt them (e.g., turn their symbol into a PLUS or occupy the spot if in expansion).
    3. **SETUP**: In Battle, try to create SLASHES in positions that form a line. In Expansion, try to control the center (4) or corners.
    
    ### RESPONSE:
    Analyze the board and return the BEST move index (0-8) as a JSON object.
    Example: {"move": 4}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || '{}');
    const move = result.move;

    if (typeof move === 'number' && isValidMove(state, move, state.currentPlayer)) {
      return move;
    }
  } catch (error) {
    console.error("Gemini AI Error:", error);
  }

  // Fallback to random legal move if AI fails
  const legalMoves = state.board
    .map((_, i) => i)
    .filter(i => isValidMove(state, i, state.currentPlayer));
  
  if (legalMoves.length === 0) return null;
  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
};
