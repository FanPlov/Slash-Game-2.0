
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GamePhase, Player, GameMode, GameStatus, Language } from './types';
import { isValidMove, executeMove } from './logic/gameEngine';
import { getBotMove } from './services/geminiService'; // Using Gemini Bot
import { translations } from './translations';
import Cell from './components/Cell';

// --- INITIAL STATES ---

const SHOT_CLOCK_TIME = 30; // seconds per move

const INITIAL_GAME_STATE: GameState = {
  board: Array(9).fill(null),
  currentPlayer: Player.ONE,
  phase: GamePhase.EXPANSION,
  lastMoveIndex: null,
  winner: null,
};

// Music URL (Free/Public Domain Loop)
const MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=abstract-fashion-pop-131283.mp3";

// --- ICONS (SVG) ---
const IconMenu = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const IconBack = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
);
const IconPause = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const IconPlay = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const IconReset = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
);
const IconUndo = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
);
const IconRedo = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
);
const IconSettings = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const IconX = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);

// --- COMPONENT: APP ---

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [mode, setMode] = useState<GameMode>(GameMode.PVP);
  
  // Settings
  const [isDark, setIsDark] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState<Language>(Language.RU);
  
  // Game Logic
  const [history, setHistory] = useState<GameState[]>([INITIAL_GAME_STATE]);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(SHOT_CLOCK_TIME);
  
  // Modals
  const [showMenu, setShowMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isBotThinking, setIsBotThinking] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = translations[language];
  const gameState = history[currentStep];

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Handle Audio Playback
  useEffect(() => {
    if (soundEnabled && status === GameStatus.PLAYING) {
      audioRef.current?.play().catch(e => console.log("Audio play failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [status, soundEnabled]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (status === GameStatus.PLAYING && !gameState.winner) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeOut(gameState.currentPlayer === Player.ONE ? Player.TWO : Player.ONE);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, gameState.winner, gameState.currentPlayer]);

  // Bot Logic (Gemini)
  useEffect(() => {
    if (
      status === GameStatus.PLAYING &&
      mode === GameMode.PVE &&
      gameState.currentPlayer === Player.TWO &&
      !gameState.winner &&
      !isBotThinking &&
      currentStep === history.length - 1
    ) {
      const runBot = async () => {
         setIsBotThinking(true);
         const move = await getBotMove(gameState);
         if (move !== null && status === GameStatus.PLAYING) {
            makeMove(move, true);
         }
         setIsBotThinking(false);
      };
      runBot();
    }
  }, [gameState, status, mode, isBotThinking, currentStep]);

  const handleTimeOut = (winner: Player) => {
    updateGameState({
      ...gameState,
      winner: winner,
      winReason: "Time Out"
    });
    setStatus(GameStatus.FINISHED);
  };

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setHistory([INITIAL_GAME_STATE]);
    setCurrentStep(0);
    setTimeLeft(SHOT_CLOCK_TIME);
    setStatus(GameStatus.PLAYING);
    setIsBotThinking(false);
    setShowMenu(false);
    setShowRules(false);
    setShowSettings(false);
  };

  const handleBackToMenu = () => {
    setStatus(GameStatus.MENU);
    setShowMenu(false);
    setShowRules(false);
    setShowSettings(false);
    setIsBotThinking(false);
  };

  const resetGame = () => {
    setHistory([INITIAL_GAME_STATE]);
    setCurrentStep(0);
    setTimeLeft(SHOT_CLOCK_TIME);
    setStatus(GameStatus.PLAYING);
    setIsBotThinking(false);
    setShowMenu(false);
  };

  const togglePause = () => {
    if (status === GameStatus.PLAYING) setStatus(GameStatus.PAUSED);
    else if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
  };

  const updateGameState = (newState: GameState) => {
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    setTimeLeft(SHOT_CLOCK_TIME);
  };

  const makeMove = (index: number, isBot: boolean = false) => {
    if (gameState.winner || status !== GameStatus.PLAYING) return;
    
    if (isValidMove(gameState, index, gameState.currentPlayer)) {
      const newState = executeMove(gameState, index);
      updateGameState(newState);
      if (newState.winner) {
        setStatus(GameStatus.FINISHED);
      }
    }
  };

  const handleUndo = () => {
    if (currentStep === 0 || isBotThinking || gameState.winner) return;
    if (mode === GameMode.PVP) {
      setCurrentStep(prev => prev - 1);
    } else {
      if (currentStep >= 2) setCurrentStep(prev => prev - 2);
      else setCurrentStep(0);
    }
    setTimeLeft(SHOT_CLOCK_TIME);
    setStatus(GameStatus.PLAYING);
  };

  const handleRedo = () => {
    if (currentStep >= history.length - 1 || gameState.winner) return;
    if (mode === GameMode.PVP) {
       setCurrentStep(prev => prev + 1);
    } else {
       if (currentStep + 2 < history.length) setCurrentStep(prev => prev + 2);
       else if (currentStep + 1 < history.length) setCurrentStep(prev => prev + 1);
    }
    setTimeLeft(SHOT_CLOCK_TIME);
    setStatus(GameStatus.PLAYING);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- STYLES ---
  const theme = {
    bg: isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100',
    surface: isDark ? 'bg-[#1f1f1f]' : 'bg-white',
    boardBg: isDark ? 'bg-[#2d2d2d]' : 'bg-gray-200',
    text: isDark ? 'text-gray-200' : 'text-gray-800',
    textDim: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-[#2d2d2d]' : 'border-gray-300',
    modalBg: isDark ? 'bg-[#2d2d2d]' : 'bg-white',
  };

  const cellStyle = `
    .cell-bg {
        background-color: ${isDark ? '#333' : '#fff'};
    }
    .cell-bg:hover {
        background-color: ${isDark ? '#444' : '#f0f0f0'};
    }
  `;

  // --- RENDERING MODALS ---
  const Modals = () => (
    <>
      {showSettings && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className={`${theme.modalBg} w-full max-w-xs rounded-2xl p-6 border ${theme.border} shadow-2xl relative`}>
              <button onClick={() => setShowSettings(false)} className={`absolute top-4 right-4 ${theme.textDim} hover:${theme.text}`}>
                <IconX />
              </button>
              <h3 className={`text-xl font-bold ${theme.text} mb-6 pr-8`}>{t.settings}</h3>
              <div className="space-y-4">
                 <div className={`p-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} rounded-lg`}>
                    <span className={`${theme.textDim} text-xs font-bold uppercase mb-2 block`}>{t.lang}</span>
                    <div className="flex gap-2">
                       {[Language.RU, Language.EN, Language.UZ].map(l => (
                         <button key={l} onClick={() => setLanguage(l)} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${language === l ? 'bg-blue-600 text-white' : `${isDark ? 'bg-[#333]' : 'bg-white'} ${theme.textDim}`}`}>
                           {l}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className={`p-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} rounded-lg flex items-center justify-between`}>
                    <span className={`${theme.textDim} text-xs font-bold uppercase`}>{t.theme}</span>
                    <button onClick={() => setIsDark(!isDark)} className={`px-4 py-1.5 rounded font-bold text-xs ${isDark ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}>
                       {isDark ? 'DARK' : 'LIGHT'}
                    </button>
                 </div>
                 <div className={`p-3 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} rounded-lg flex items-center justify-between`}>
                    <span className={`${theme.textDim} text-xs font-bold uppercase`}>{t.sound}</span>
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className={`px-4 py-1.5 rounded font-bold text-xs ${soundEnabled ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                       {soundEnabled ? t.on : t.off}
                    </button>
                 </div>
              </div>
           </div>
         </div>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
           <div className={`${theme.modalBg} w-full max-w-sm rounded-2xl p-6 shadow-2xl border ${theme.border} relative`}>
              <button onClick={() => setShowMenu(false)} className={`absolute top-4 right-4 ${theme.textDim} hover:${theme.text}`}>
                  <IconX />
              </button>
              <div className="flex justify-between items-center mb-6">
                 <h2 className={`text-xl font-bold ${theme.text} uppercase tracking-wider`}>{t.menu}</h2>
              </div>
              <nav className="space-y-3">
                 <button onClick={() => { setShowRules(true); }} className={`w-full text-left p-4 rounded-xl ${isDark ? 'bg-[#2d2d2d]' : 'bg-gray-100'} ${theme.text} font-bold hover:brightness-110 transition-all`}>
                    📖 {t.rules}
                 </button>
                 <button onClick={() => { setShowSettings(true); }} className={`w-full text-left p-4 rounded-xl ${isDark ? 'bg-[#2d2d2d]' : 'bg-gray-100'} ${theme.text} font-bold hover:brightness-110 transition-all`}>
                    ⚙️ {t.settings}
                 </button>
                 <button onClick={handleBackToMenu} className={`w-full text-left p-4 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-all`}>
                    🚪 {t.exit}
                 </button>
              </nav>
           </div>
        </div>
      )}
      
      {showRules && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className={`${theme.modalBg} w-full max-w-sm rounded-2xl p-6 border ${theme.border} shadow-2xl max-h-[85vh] overflow-y-auto relative`}>
              <button onClick={() => setShowRules(false)} className={`absolute top-4 right-4 ${theme.textDim} hover:${theme.text}`}>
                  <IconX />
              </button>
              <h3 className={`text-2xl font-black ${theme.text} mb-6 flex items-center gap-2 pr-8`}>
                 <span>📄</span> {t.rulesTitle}
              </h3>
              <div className={`space-y-6 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                 <div className={`p-4 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} rounded-xl border ${theme.border}`}>
                    <p className="font-bold text-blue-500 mb-2">{t.expansion}</p>
                    <p>{t.rulesText1}</p>
                 </div>
                 <div className={`p-4 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} rounded-xl border ${theme.border}`}>
                    <p className="font-bold text-amber-500 mb-2">{t.battle}</p>
                    <p>{t.rulesText2}</p>
                 </div>
                 <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/30">
                    <p className="font-bold text-rose-500 mb-2">⚠️ {t.locked}</p>
                    <p>{t.rulesText3}</p>
                 </div>
                 <p className={`text-center font-bold ${theme.text} pt-2`}>{t.winCondition}</p>
              </div>
           </div>
        </div>
      )}
    </>
  );

  // --- RENDERING VIEWS ---

  if (status === GameStatus.MENU) {
    return (
      <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-300`}>
        <style>{cellStyle}</style>
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-rose-500 italic tracking-tighter font-['Orbitron'] pr-4 pb-1">
            {t.gameTitle}
          </h1>
          <p className={`${theme.textDim} tracking-widest text-sm uppercase`}>Over The Board</p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={() => startGame(GameMode.PVP)}
            className={`w-full py-4 ${isDark ? 'bg-[#2d2d2d] hover:bg-[#3d3d3d]' : 'bg-white hover:bg-gray-50'} ${theme.text} font-bold rounded-xl border ${theme.border} transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg`}
          >
            <span>⚔️</span> {t.playPvp}
          </button>
          <button 
            onClick={() => startGame(GameMode.PVE)}
            className={`w-full py-4 ${isDark ? 'bg-[#2d2d2d] hover:bg-[#3d3d3d]' : 'bg-white hover:bg-gray-50'} ${theme.text} font-bold rounded-xl border ${theme.border} transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg`}
          >
            <span>🤖</span> {t.playBot}
          </button>
          <button 
            onClick={() => setShowMenu(true)}
            className={`w-full py-3 mt-4 ${theme.textDim} hover:${theme.text} font-bold text-sm tracking-wider uppercase transition-colors`}
          >
            {t.menu}
          </button>
        </div>
        
        <div className={`text-[10px] ${theme.textDim} mt-12 text-center max-w-xs leading-relaxed uppercase tracking-widest`}>
          v2.0 &bull; {t.copyright}
          <div className="mt-2 font-bold opacity-60">Created by Asadbek</div>
        </div>

        <Modals />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col overflow-hidden transition-colors duration-300`}>
      <style>{cellStyle}</style>
      
      <header className={`h-16 border-b ${theme.border} flex items-center justify-between px-4 ${theme.surface} z-20 shrink-0`}>
        <button onClick={handleBackToMenu} className={`${theme.textDim} hover:${theme.text} p-2`}>
           <IconBack />
        </button>
        <h2 className={`text-sm font-bold ${theme.text} uppercase tracking-widest font-['Orbitron']`}>{t.gameTitle}</h2>
        <button onClick={() => setShowSettings(true)} className={`${theme.textDim} hover:${theme.text} p-2`}>
          <IconSettings />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative w-full p-4 overflow-y-auto">
        <div className="w-full max-w-md flex items-center justify-between mb-8 transform rotate-180 px-2 select-none shrink-0">
          <div className="flex items-center gap-3">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${gameState.currentPlayer === Player.TWO ? 'bg-rose-600 text-white scale-110 ring-4 ring-rose-500/30' : `${theme.surface} ${theme.textDim}`} transition-all duration-300`}>
                {mode === GameMode.PVE ? 'AI' : 'P2'}
             </div>
             <div className="flex flex-col items-start">
               <span className={`text-xs font-bold ${theme.textDim}`}>{mode === GameMode.PVE ? t.bot : t.player2}</span>
               <div className="flex items-center gap-1">
                 <span className="w-4 h-1 bg-rose-500 rounded-full mt-1"></span>
               </div>
             </div>
          </div>
          <div className={`text-3xl font-mono font-bold tracking-tighter ${timeLeft < 10 && gameState.currentPlayer === Player.TWO ? 'text-rose-500 animate-pulse' : theme.text} ${gameState.currentPlayer === Player.TWO ? 'opacity-100' : 'opacity-20 blur-[1px]'} transition-all`}>
            {gameState.currentPlayer === Player.TWO ? formatTime(timeLeft) : '0:30'}
          </div>
        </div>

        <div className={`relative p-2 ${theme.boardBg} rounded-2xl shadow-2xl z-10 shrink-0`}>
          <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
               <span className={`text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full border ${theme.bg} shadow-lg ${gameState.phase === GamePhase.EXPANSION ? 'text-blue-500 border-blue-500/30' : 'text-amber-500 border-amber-500/30'}`}>
                  {gameState.phase === GamePhase.EXPANSION ? t.expansion : t.battle}
               </span>
          </div>

          <div className={`grid grid-cols-3 gap-2 ${theme.bg} p-2 rounded-xl border ${theme.border} w-[80vw] h-[80vw] max-w-[320px] max-h-[320px]`}>
            {gameState.board.map((symbol, idx) => (
              <Cell
                key={idx}
                symbol={symbol}
                isValid={isValidMove(gameState, idx, gameState.currentPlayer)}
                isLastMove={gameState.lastMoveIndex === idx}
                isLocked={gameState.lastMoveIndex === idx}
                disabled={status !== GameStatus.PLAYING || (mode === GameMode.PVE && gameState.currentPlayer === Player.TWO)}
                onClick={() => makeMove(idx)}
              />
            ))}
          </div>

          {gameState.winner && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-sm rounded-xl animate-in fade-in duration-300">
               <div className="text-center p-4">
                  <div className="text-5xl mb-3 animate-bounce">
                    {gameState.winner === 'DRAW' ? '🤝' : '🏆'}
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase mb-1">
                    {gameState.winner === 'DRAW' ? t.draw : `Player ${gameState.winner} ${t.winner}`}
                  </h3>
                  <button onClick={resetGame} className="mt-6 w-full py-3 px-6 bg-white text-black font-bold rounded-lg hover:bg-gray-200 active:scale-95 transition-all uppercase tracking-wider">
                    {t.reset}
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-md flex items-center justify-between mt-8 px-2 select-none shrink-0">
          <div className="flex items-center gap-3">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${gameState.currentPlayer === Player.ONE ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-500/30' : `${theme.surface} ${theme.textDim}`} transition-all duration-300`}>
                P1
             </div>
             <div className="flex flex-col">
               <span className={`text-xs font-bold ${theme.textDim}`}>{t.player1}</span>
               <div className="flex items-center gap-1">
                 <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
               </div>
             </div>
          </div>
          <div className={`text-3xl font-mono font-bold tracking-tighter ${timeLeft < 10 && gameState.currentPlayer === Player.ONE ? 'text-red-500 animate-pulse' : theme.text} ${gameState.currentPlayer === Player.ONE ? 'opacity-100' : 'opacity-20 blur-[1px]'} transition-all`}>
            {gameState.currentPlayer === Player.ONE ? formatTime(timeLeft) : '0:30'}
          </div>
        </div>
      </main>

      <footer className={`${theme.surface} border-t ${theme.border} p-3 z-20 shrink-0 safe-area-pb`}>
        <div className="flex items-center justify-between max-w-md mx-auto gap-2">
          <button onClick={() => setShowMenu(true)} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${theme.textDim} hover:${theme.text} hover:${theme.bg} transition-all active:scale-95`}>
             <div className="scale-75"><IconMenu /></div>
             <span className="text-[10px] font-bold mt-1 uppercase">{t.menu}</span>
          </button>
          <button 
             onClick={handleUndo} 
             disabled={currentStep === 0 || isBotThinking || !!gameState.winner}
             className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all active:scale-95 ${currentStep === 0 || isBotThinking || gameState.winner ? 'text-gray-400 cursor-not-allowed opacity-50' : `${theme.textDim} hover:${theme.text} hover:${theme.bg}`}`}
          >
             <div className="scale-75"><IconUndo /></div>
             <span className="text-[10px] font-bold mt-1 uppercase">{t.undo}</span>
          </button>
          <button 
             onClick={handleRedo} 
             disabled={currentStep >= history.length - 1 || !!gameState.winner}
             className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all active:scale-95 ${currentStep >= history.length - 1 || gameState.winner ? 'text-gray-400 cursor-not-allowed opacity-50' : `${theme.textDim} hover:${theme.text} hover:${theme.bg}`}`}
          >
             <div className="scale-75"><IconRedo /></div>
             <span className="text-[10px] font-bold mt-1 uppercase">{t.redo}</span>
          </button>
          <button onClick={togglePause} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${theme.textDim} hover:${theme.text} hover:${theme.bg} transition-all active:scale-95`}>
             <div className="scale-75"><IconPause /></div>
             <span className="text-[10px] font-bold mt-1 uppercase">{t.paused}</span>
          </button>
          <button onClick={resetGame} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${theme.textDim} hover:text-rose-500 hover:${theme.bg} transition-all active:scale-95`}>
             <div className="scale-75"><IconReset /></div>
             <span className="text-[10px] font-bold mt-1 uppercase">{t.reset}</span>
          </button>
        </div>
      </footer>

      <Modals />

      {status === GameStatus.PAUSED && (
        <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="text-4xl font-black text-white tracking-widest uppercase mb-8">{t.paused}</div>
           <button 
             onClick={togglePause}
             className="px-8 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
           >
             <IconPlay />
             <span>{t.resume}</span>
           </button>
           <button 
             onClick={handleBackToMenu}
             className="mt-8 text-gray-500 hover:text-white text-sm font-bold uppercase tracking-widest"
           >
             {t.exit}
           </button>
        </div>
      )}
    </div>
  );
};

export default App;
