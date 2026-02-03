
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
        return <div className="h-[70%] w-[12%] bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />;
      case SymbolType.HORIZONTAL:
        return <div className="w-[70%] h-[12%] bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />;
      case SymbolType.PLUS:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute h-[70%] w-[12%] bg-current rounded-full opacity-90" />
            <div className="absolute w-[70%] h-[12%] bg-current rounded-full opacity-90" />
          </div>
        );
      case SymbolType.SLASH:
        return (
          <div className="w-[70%] h-[12%] bg-yellow-400 rotate-45 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
        );
      default:
        return null;
    }
  };

  // Logic: Lock icon should NOT appear if the symbol is SLASH, even if it was the last move.
  const showLock = isLocked && symbol !== SymbolType.SLASH;

  return (
    <button
      onClick={onClick}
      disabled={disabled || (!isValid && !symbol)}
      className={`
        relative w-full h-full min-h-[80px] sm:min-h-[100px] 
        flex items-center justify-center
        transition-all duration-300
        ${symbol ? 'bg-opacity-100' : 'bg-opacity-80'}
        ${isValid && !disabled ? 'cursor-pointer active:scale-95 brightness-110' : ''}
        ${isLastMove ? 'ring-2 ring-inset ring-yellow-500/40' : ''}
        rounded-xl
        overflow-hidden
        shadow-sm
        cell-bg
      `}
    >
      {/* Interaction Hint (Ghost) */}
      {isValid && !symbol && !disabled && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-20 transition-opacity bg-white">
          <div className="w-4 h-4 rounded-full bg-current"></div>
        </div>
      )}
      
      {getSymbolContent()}

      {/* Ko Rule Lock Overlay */}
      {showLock && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] animate-in fade-in duration-200 z-10">
           <svg className="w-8 h-8 text-gray-400 opacity-90 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
      )}

      {isLastMove && !showLock && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-md" />
      )}
    </button>
  );
});

export default Cell;
