
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
          <div className="h-[75%] w-[14%] bg-gradient-to-b from-cyan-300 to-cyan-600 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-in zoom-in duration-200" />
        );
      case SymbolType.HORIZONTAL:
        return (
          <div className="w-[75%] h-[14%] bg-gradient-to-r from-rose-400 to-rose-600 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-in zoom-in duration-200" />
        );
      case SymbolType.PLUS:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute h-[70%] w-[12%] bg-white rounded-full" />
            <div className="absolute w-[70%] h-[12%] bg-white rounded-full" />
            <div className="absolute w-2 h-2 bg-white rounded-full blur-[1px]" />
          </div>
        );
      case SymbolType.SLASH:
        return (
          <div className="w-[80%] h-[14%] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 rotate-45 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
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
        relative w-full h-full min-h-[45px] 
        flex items-center justify-center
        transition-all duration-300
        ${symbol ? 'bg-white/5' : 'bg-white/[0.02]'}
        ${isValid && !disabled ? 'cursor-pointer hover:bg-white/10 active:scale-95 border-white/10' : 'border-transparent'}
        ${isLastMove ? 'ring-1 ring-amber-500/30' : ''}
        rounded-xl border backdrop-blur-sm
        overflow-hidden
        group
      `}
    >
      {isValid && !symbol && !disabled && (
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      {getSymbolContent()}

      {showLock && (
        <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center backdrop-blur-sm z-20">
           <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
      )}

      {isValid && !symbol && !disabled && (
        <div className="w-1 h-1 bg-white/20 rounded-full" />
      )}
    </button>
  );
});

export default Cell;
