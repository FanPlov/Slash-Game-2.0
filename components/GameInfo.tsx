
import React from 'react';
import { GameState, Player, GamePhase } from '../types';

interface GameInfoProps {
  state: GameState;
  botEnabled: boolean;
  onReset: () => void;
  onToggleBot: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ state, botEnabled, onReset, onToggleBot }) => {
  const { currentPlayer, phase, winner } = state;

  return (
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Current Phase</span>
          <span className={`text-lg font-black ${phase === GamePhase.EXPANSION ? 'text-indigo-400' : 'text-amber-400'}`}>
            {phase === GamePhase.EXPANSION ? 'I: EXPANSION' : 'II: BATTLE'}
          </span>
        </div>
        <button 
          onClick={onReset}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
        >
          RESTART
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl transition-all border-2 ${currentPlayer === Player.ONE && !winner ? 'border-blue-500 bg-blue-500/10' : 'border-transparent bg-slate-800/50'}`}>
          <div className="text-xs text-slate-400 uppercase font-bold">Player 1</div>
          <div className="text-lg font-bold flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-400 rounded-full" />
            Vertical
          </div>
        </div>
        <div className={`p-4 rounded-xl transition-all border-2 ${currentPlayer === Player.TWO && !winner ? 'border-rose-500 bg-rose-500/10' : 'border-transparent bg-slate-800/50'}`}>
          <div className="text-xs text-slate-400 uppercase font-bold">Player 2</div>
          <div className="text-lg font-bold flex items-center gap-2">
            <div className="h-1 w-4 bg-rose-400 rounded-full" />
            Horizontal
          </div>
        </div>
      </div>

      {winner && (
        <div className="animate-bounce bg-green-500/20 border-2 border-green-500 p-4 rounded-xl text-center">
          <div className="text-green-400 font-black text-2xl">
            {winner === 'DRAW' ? "IT'S A DRAW!" : `PLAYER ${winner} WINS!`}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={botEnabled} 
              onChange={onToggleBot}
            />
            <div className={`w-10 h-6 rounded-full shadow-inner transition-colors ${botEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${botEnabled ? 'translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-3 text-sm font-bold text-slate-300">Smart Gemini Bot</span>
        </label>
        
        {phase === GamePhase.EXPANSION && (
          <div className="text-[10px] text-slate-500 text-right italic">
            Tip: Fill the board to start the Battle phase.
          </div>
        )}
      </div>
    </div>
  );
};

export default GameInfo;
