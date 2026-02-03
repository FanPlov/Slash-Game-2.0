
import { GoogleGenAI } from "@google/genai";
import { GameState, Player, SymbolType, GamePhase } from "../types";
import { isValidMove } from "../logic/gameEngine";

export const getBotMove = async (state: GameState): Promise<number | null> => {
  // Безопасное получение ключа для работы в браузере (Vercel/Vite/ESM)
  let apiKey: string | undefined;
  
  try {
    // Пытаемся получить ключ из глобального контекста
    apiKey = (globalThis as any).process?.env?.API_KEY || (import.meta as any).env?.VITE_API_KEY;
  } catch (e) {
    console.warn("Environment check failed, trying direct access...");
  }

  // Если ключ все еще не найден, используем фолбек к прямому обращению (инъекция среды)
  if (!apiKey) {
    try {
      apiKey = process.env.API_KEY;
    } catch (e) {
      console.error("API_KEY not found in process.env");
    }
  }
  
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
    console.error("AI Decision Error:", error);
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
