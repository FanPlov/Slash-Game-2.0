
import { GoogleGenAI } from "@google/genai";
import { GameState, Player, SymbolType, GamePhase } from "../types";
import { isValidMove } from "../logic/gameEngine";

export const getBotMove = async (state: GameState): Promise<number | null> => {
  // Безопасное получение ключа: проверяем существование process и process.env
  const env = typeof process !== 'undefined' ? process.env : {};
  const apiKey = (env as any).API_KEY;
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Using random fallback.");
    return getRandomMove(state);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const boardStr = state.board.map((s, i) => `${i}:${s || 'EMPTY'}`).join(', ');
    const playerSymbol = state.currentPlayer === Player.ONE ? 'VERTICAL (|)' : 'HORIZONTAL (—)';
    const opponentSymbol = state.currentPlayer === Player.ONE ? 'HORIZONTAL (—)' : 'VERTICAL (|)';
    const phaseStr = state.phase === GamePhase.EXPANSION ? 'EXPANSION' : 'BATTLE';

    const prompt = `
      You are an AI player for "Plus-Slash".
      Board: [${boardStr}]
      Phase: ${phaseStr}
      Your Symbol: ${playerSymbol}
      Opponent: ${opponentSymbol}
      Locked: ${state.lastMoveIndex}
      Return move index (0-8) as JSON: {"move": number}
    `;

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
    console.error("AI Error:", error);
  }

  return getRandomMove(state);
};

const getRandomMove = (state: GameState): number | null => {
  const legalMoves = state.board
    .map((_, i) => i)
    .filter(i => isValidMove(state, i, state.currentPlayer));
  
  if (legalMoves.length === 0) return null;
  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
};
