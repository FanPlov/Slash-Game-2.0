
import { GoogleGenAI } from "@google/genai";
import { GameState, Player, SymbolType, GamePhase } from "../types";
import { isValidMove } from "../logic/gameEngine";

/**
 * Безопасно получает API ключ из различных возможных источников окружения.
 * Это предотвращает ошибку "process is not defined" в браузерах и при деплое.
 */
const fetchApiKey = (): string | null => {
  try {
    // 1. Пробуем через globalThis (самый безопасный способ для браузера)
    const g = globalThis as any;
    if (g.process?.env?.API_KEY) return g.process.env.API_KEY;
    
    // 2. Пробуем стандартное обращение (может вызвать ReferenceError, поэтому в try-catch)
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }

    // 3. Пробуем Vite-специфичный способ
    if ((import.meta as any).env?.VITE_API_KEY) {
      return (import.meta as any).env.VITE_API_KEY;
    }
  } catch (e) {
    // Игнорируем ошибки доступа к окружению
  }
  return null;
};

export const getBotMove = async (state: GameState): Promise<number | null> => {
  const apiKey = fetchApiKey();
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Falling back to random move.");
    return getRandomMove(state);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const boardStr = state.board.map((s, i) => `${i}:${s || 'EMPTY'}`).join(', ');
    const playerSymbol = state.currentPlayer === Player.ONE ? 'VERTICAL (|)' : 'HORIZONTAL (—)';
    const opponentSymbol = state.currentPlayer === Player.ONE ? 'HORIZONTAL (—)' : 'VERTICAL (|)';
    const phaseStr = state.phase === GamePhase.EXPANSION ? 'EXPANSION' : 'BATTLE';

    const prompt = `
      You are an expert player in "Plus-Slash".
      Board: [${boardStr}]
      Phase: ${phaseStr}
      You are: ${playerSymbol}
      Opponent: ${opponentSymbol}
      Locked cell (Ko rule): ${state.lastMoveIndex}
      
      Strategy: Fill board in Expansion. In Battle, connect 3 Slashes (/).
      Return move index (0-8) as JSON: {"move": index}
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
    console.error("Gemini AI error:", error);
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
