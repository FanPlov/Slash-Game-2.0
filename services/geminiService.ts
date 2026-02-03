
import { GoogleGenAI } from "@google/genai";
import { GameState, Player, SymbolType, GamePhase } from "../types";
import { isValidMove } from "../logic/gameEngine";

/**
 * Безопасное получение API ключа без краша приложения в браузере.
 */
const getSafeApiKey = (): string | null => {
  try {
    // Проверка через globalThis для безопасности в браузерной среде Vercel
    const g = globalThis as any;
    const processEnv = g.process?.env?.API_KEY;
    if (processEnv) return processEnv;

    // Фолбек для Vite
    const viteEnv = (import.meta as any).env?.VITE_API_KEY;
    if (viteEnv) return viteEnv;
    
    // Прямая попытка (может выкинуть ошибку в некоторых сборках, поэтому в try-catch)
    if (typeof process !== 'undefined' && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Игнорируем ошибки доступа
  }
  return null;
};

export const getBotMove = async (state: GameState): Promise<number | null> => {
  const apiKey = getSafeApiKey();
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI disabled.");
    return getRandomMove(state);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const boardStr = state.board.map((s, i) => `${i}:${s || 'EMPTY'}`).join(', ');
    const playerSymbol = state.currentPlayer === Player.ONE ? 'VERTICAL (|)' : 'HORIZONTAL (—)';
    const opponentSymbol = state.currentPlayer === Player.ONE ? 'HORIZONTAL (—)' : 'VERTICAL (|)';
    const phaseStr = state.phase === GamePhase.EXPANSION ? 'EXPANSION' : 'BATTLE';

    const prompt = `
      You are an expert AI playing "Plus-Slash".
      Board: [${boardStr}]
      Phase: ${phaseStr}
      You play as: ${playerSymbol}
      Opponent: ${opponentSymbol}
      Locked cell (Ko rule): ${state.lastMoveIndex}
      
      Instructions:
      1. In EXPANSION: Fill board, prioritize spots to make PLUS (+).
      2. In BATTLE: Get 3 SLASH (/) in a row to win.
      Return your move as JSON: {"move": index} (0-8)
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
