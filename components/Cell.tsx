
import React from 'react';
import { SymbolType } from '../types';

interface CellProps {
  symbol: SymbolType | null;
  isValid: boolean;
  onClick: () => void;
  isLastMove: boolean;
  isLocked: boolean; // Ko Rule
  disabled: boolean;
}

const Cell: React.FC<CellProps> = React.memo(({ symbol, isValid, onClick, isLastMove, isLocked, disabled }) => {
  const getSymbolContent = () => {
    switch (symbol) {
      case SymbolType.VERTICAL:
        return (
          <div className="h-[75%] w-[14%] bg-gradient-to-b from-cyan-300 to-cyan-600 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-in zoom-in duration-300" />
        );
      case SymbolType.HORIZONTAL:
        return (
          <div className="w-[75%] h-[14%] bg-gradient-to-r from-rose-400 to-rose-600 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-in zoom-in duration-300" />
        );
      case SymbolType.PLUS:
        return (
          <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in-90 duration-300">
            <div className="absolute h-[75%] w-[14%] bg-white/90 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            <div className="absolute w-[75%] h-[14%] bg-white/90 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            {/* Energy Core */}
            <div className="absolute w-4 h-4 bg-white rounded-full blur-sm animate-pulse" />
          </div>
        );
      case SymbolType.SLASH:
        return (
          <div className="w-[85%] h-[16%] bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 rotate-45 rounded-full shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-in fade-in slide-in-from-top-2 slide-in-from-left-2 duration-200 ease-out" />
        );
      default:
        return null;
    }
  };

  const showLock = isLocked && symbol !== SymbolType.SLASH;

  return (
    <button
      onClick={onClick}
      disabled={disabled || (!isValid && !symbol)}
      className={`
        relative w-full h-full min-h-[85px] sm:min-h-[110px] 
        flex items-center justify-center
        transition-all duration-500
        ${symbol ? 'bg-white/5' : 'bg-white/[0.02]'}
        ${isValid && !disabled ? 'cursor-pointer hover:bg-white/10 active:scale-90 border-white/10' : 'border-transparent'}
        ${isLastMove ? 'ring-2 ring-amber-500/30 bg-amber-500/5' : ''}
        rounded-2xl border backdrop-blur-sm
        overflow-hidden
        group
      `}
    >
      {/* Dynamic Hover Background */}
      {isValid && !symbol && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      {getSymbolContent()}

      {/* Ko Rule Lock Overlay - Frosted glass effect */}
      {showLock && (
        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center backdrop-blur-md z-20 transition-all duration-300">
           <div className="p-3 bg-white/10 rounded-full border border-white/10 shadow-2xl">
             <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           </div>
        </div>
      )}

      {/* Subtle interaction point */}
      {isValid && !symbol && !disabled && (
        <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
      )}
    </button>
  );
});

export default Cell;
