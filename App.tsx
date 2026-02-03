
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GamePhase, Player, GameMode, GameStatus, Language } from './types';
import { isValidMove, executeMove } from './logic/gameEngine';
import { getBotMove } from './services/geminiService';
import { translations } from './translations';
import Cell from './components/Cell';

const SHOT_CLOCK_TIME = 30;
const INITIAL_GAME_STATE: GameState = {
  board: Array(9).fill(null),
  currentPlayer: Player.ONE,
  phase: GamePhase.EXPANSION,
  lastMoveIndex: null,
  winner: null,
};

const MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=abstract-fashion-pop-131283.mp3";

const IconMenu = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconBack = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconPause = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPlay = () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconReset = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const IconUndo = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const IconRedo = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>;
const IconSettings = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconX = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [mode, setMode] = useState<GameMode>(GameMode.PVP);
  const [isDark, setIsDark] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState<Language>(Language.RU);
  const [history, setHistory] = useState<GameState[]>([INITIAL_GAME_STATE]);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(SHOT_CLOCK_TIME);
  const [showMenu, setShowMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = translations[language];
  const gameState = history[currentStep];

  useEffect(() => {
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    return () => audioRef.current?.pause();
  }, []);

  useEffect(() => {
    if (soundEnabled && status === GameStatus.PLAYING) {
      audioRef.current?.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [status, soundEnabled]);

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

  useEffect(() => {
    if (status === GameStatus.PLAYING && mode === GameMode.PVE && gameState.currentPlayer === Player.TWO && !gameState.winner && !isBotThinking && currentStep === history.length - 1) {
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
    updateGameState({ ...gameState, winner, winReason: "Time Out" });
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
  };

  const handleBackToMenu = () => {
    setStatus(GameStatus.MENU);
    setShowMenu(false);
    setShowRules(false);
    setShowSettings(false);
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
      if (newState.winner) setStatus(GameStatus.FINISHED);
    }
  };

  const handleUndo = () => {
    if (currentStep === 0 || isBotThinking || gameState.winner) return;
    setCurrentStep(prev => Math.max(0, mode === GameMode.PVP ? prev - 1 : prev - 2));
    setTimeLeft(SHOT_CLOCK_TIME);
  };

  const handleRedo = () => {
    if (currentStep >= history.length - 1 || gameState.winner) return;
    setCurrentStep(prev => Math.min(history.length - 1, mode === GameMode.PVP ? prev + 1 : prev + 2));
    setTimeLeft(SHOT_CLOCK_TIME);
  };

  const theme = {
    bg: isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100',
    surface: isDark ? 'bg-[#1f1f1f]' : 'bg-white',
    boardBg: isDark ? 'bg-[#2d2d2d]' : 'bg-gray-200',
    text: isDark ? 'text-gray-200' : 'text-gray-800',
    textDim: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-[#2d2d2d]' : 'border-gray-300',
    modalBg: isDark ? 'bg-[#2d2d2d]' : 'bg-white',
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col overflow-hidden transition-colors duration-300`}>
      <style>{`.cell-bg { background-color: ${isDark ? '#333' : '#fff'}; transition: background-color 0.2s; }`}</style>
      
      {status === GameStatus.MENU ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-300">
          <div className="text-center space-y-3">
            <h1 className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter font-['Orbitron']">
              PLUS-SLASH
            </h1>
            <p className={`${theme.textDim} tracking-[0.3em] text-[10px] uppercase font-bold`}>Strategic Board Combat</p>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button onClick={() => startGame(GameMode.PVP)} className={`w-full py-4 ${isDark ? 'bg-[#2d2d2d] hover:bg-[#3d3d3d]' : 'bg-white hover:bg-gray-50'} ${theme.text} font-bold rounded-xl border ${theme.border} transition-all active:scale-95 shadow-xl`}>⚔️ {t.playPvp}</button>
            <button onClick={() => startGame(GameMode.PVE)} className={`w-full py-4 ${isDark ? 'bg-[#2d2d2d] hover:bg-[#3d3d3d]' : 'bg-white hover:bg-gray-50'} ${theme.text} font-bold rounded-xl border ${theme.border} transition-all active:scale-95 shadow-xl`}>🤖 {t.playBot}</button>
            <button onClick={() => setShowMenu(true)} className={`w-full py-3 mt-4 ${theme.textDim} hover:${theme.text} font-bold text-xs tracking-[0.2em] uppercase transition-colors`}>{t.menu}</button>
          </div>
          <div className={`text-[10px] ${theme.textDim} mt-12 text-center max-w-xs opacity-40 uppercase tracking-[0.2em] font-bold`}>
            Created by Asadbek
          </div>
        </div>
      ) : (
        <>
          <header className={`h-16 border-b ${theme.border} flex items-center justify-between px-4 ${theme.surface} z-50`}>
            <button onClick={handleBackToMenu} className={`${theme.textDim} hover:${theme.text} p-2`}><IconBack /></button>
            <h2 className={`text-xs font-black ${theme.text} uppercase tracking-[0.2em] font-['Orbitron']`}>{t.gameTitle}</h2>
            <button onClick={() => setShowSettings(true)} className={`${theme.textDim} hover:${theme.text} p-2`}><IconSettings /></button>
          </header>
          <main className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md flex items-center justify-between mb-8 transform rotate-180 px-2 opacity-50 select-none">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${gameState.currentPlayer === Player.TWO ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : `${theme.surface} ${theme.textDim}`}`}>{mode === GameMode.PVE ? 'AI' : 'P2'}</div>
                  <span className={`text-[10px] font-bold ${theme.textDim}`}>{mode === GameMode.PVE ? t.bot : t.player2}</span>
               </div>
               <div className={`text-xl font-mono font-bold ${gameState.currentPlayer === Player.TWO ? theme.text : 'opacity-20'}`}>{gameState.currentPlayer === Player.TWO ? `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}` : '0:30'}</div>
            </div>
            
            <div className={`relative p-3 ${theme.boardBg} rounded-[2rem] shadow-2xl transition-all`}>
              <div className="absolute -top-6 left-0 right-0 flex justify-center">
                 <span className={`text-[9px] font-black tracking-[0.2em] uppercase px-4 py-1 rounded-full border ${theme.bg} shadow-lg ${gameState.phase === GamePhase.EXPANSION ? 'text-blue-500 border-blue-500/30' : 'text-amber-500 border-amber-500/30'}`}>
                    {gameState.phase === GamePhase.EXPANSION ? t.expansion : t.battle}
                 </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 bg-black/10 p-2.5 rounded-[1.5rem] w-[85vw] h-[85vw] max-w-[340px] max-h-[340px]">
                {gameState.board.map((symbol, idx) => (
                  <Cell key={idx} symbol={symbol} isValid={isValidMove(gameState, idx, gameState.currentPlayer)} isLastMove={gameState.lastMoveIndex === idx} isLocked={gameState.lastMoveIndex === idx} disabled={status !== GameStatus.PLAYING || (mode === GameMode.PVE && gameState.currentPlayer === Player.TWO)} onClick={() => makeMove(idx)} />
                ))}
              </div>
              {gameState.winner && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-[1.5rem] animate-in fade-in duration-300">
                   <div className="text-center p-6">
                      <div className="text-5xl mb-4">🏆</div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{gameState.winner === 'DRAW' ? t.draw : `P${gameState.winner} ${t.winner}`}</h3>
                      <button onClick={resetGame} className="mt-8 px-8 py-3 bg-white text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all uppercase text-[10px] tracking-widest shadow-lg">{t.reset}</button>
                   </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-md flex items-center justify-between mt-8 px-2 opacity-80 select-none">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${gameState.currentPlayer === Player.ONE ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : `${theme.surface} ${theme.textDim}`}`}>P1</div>
                  <span className={`text-[10px] font-bold ${theme.textDim}`}>{t.player1}</span>
               </div>
               <div className={`text-xl font-mono font-bold ${gameState.currentPlayer === Player.ONE ? theme.text : 'opacity-20'}`}>{gameState.currentPlayer === Player.ONE ? `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}` : '0:30'}</div>
            </div>
          </main>
          <footer className={`${theme.surface} border-t ${theme.border} p-4 z-50`}>
            <div className="flex items-center justify-around max-w-md mx-auto">
              <button onClick={() => setShowMenu(true)} className={`flex flex-col items-center gap-1.5 ${theme.textDim} hover:${theme.text} active:scale-90 transition-all`}><IconMenu /><span className="text-[9px] font-bold uppercase tracking-widest">{t.menu}</span></button>
              <button onClick={handleUndo} disabled={currentStep === 0 || isBotThinking} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${currentStep === 0 ? 'opacity-20' : `${theme.textDim} hover:${theme.text}`}`}><IconUndo /><span className="text-[9px] font-bold uppercase tracking-widest">{t.undo}</span></button>
              <button onClick={handleRedo} disabled={currentStep >= history.length - 1} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${currentStep >= history.length - 1 ? 'opacity-20' : `${theme.textDim} hover:${theme.text}`}`}><IconRedo /><span className="text-[9px] font-bold uppercase tracking-widest">{t.redo}</span></button>
              <button onClick={togglePause} className={`flex flex-col items-center gap-1.5 ${theme.textDim} hover:${theme.text} active:scale-90 transition-all`}><IconPause /><span className="text-[9px] font-bold uppercase tracking-widest">{t.paused}</span></button>
              <button onClick={resetGame} className="flex flex-col items-center gap-1.5 text-rose-500/50 hover:text-rose-500 active:scale-90 transition-all"><IconReset /><span className="text-[9px] font-bold uppercase tracking-widest">{t.reset}</span></button>
            </div>
          </footer>
        </>
      )}

      {/* Modals are always accessible through their state */}
      {showMenu && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`${theme.modalBg} w-full max-w-xs rounded-3xl p-8 border ${theme.border} relative shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
            <button onClick={() => setShowMenu(false)} className={`absolute top-6 right-6 ${theme.textDim} hover:${theme.text}`}><IconX /></button>
            <h2 className={`text-2xl font-black ${theme.text} uppercase tracking-tighter mb-8`}>{t.menu}</h2>
            <nav className="space-y-4">
              <button onClick={() => {setShowRules(true); setShowMenu(false);}} className={`w-full text-left p-4 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} ${theme.text} font-bold transition-all`}>📖 {t.rules}</button>
              <button onClick={() => {setShowSettings(true); setShowMenu(false);}} className={`w-full text-left p-4 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} ${theme.text} font-bold transition-all`}>⚙️ {t.settings}</button>
              {status !== GameStatus.MENU && <button onClick={handleBackToMenu} className="w-full text-left p-4 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-all">🚪 {t.exit}</button>}
            </nav>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[210] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`${theme.modalBg} w-full max-w-xs rounded-3xl p-8 border ${theme.border} relative shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
            <button onClick={() => setShowSettings(false)} className={`absolute top-6 right-6 ${theme.textDim} hover:${theme.text}`}><IconX /></button>
            <h3 className={`text-2xl font-black ${theme.text} mb-8 uppercase tracking-tighter`}>{t.settings}</h3>
            <div className="space-y-8">
              <div>
                <span className={`${theme.textDim} text-[10px] font-black uppercase tracking-[0.2em] block mb-3`}>{t.lang}</span>
                <div className="flex gap-2">
                  {[Language.RU, Language.EN, Language.UZ].map(l => (
                    <button key={l} onClick={() => setLanguage(l)} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${language === l ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : `${isDark ? 'bg-white/5' : 'bg-black/5'} ${theme.textDim}`}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20">
                <span className={`${theme.textDim} text-[10px] font-black uppercase tracking-[0.2em]`}>{t.theme}</span>
                <button onClick={() => setIsDark(!isDark)} className={`px-5 py-2 rounded-lg font-black text-[10px] tracking-widest ${isDark ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}>{isDark ? 'DARK' : 'LIGHT'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[220] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`${theme.modalBg} w-full max-w-sm rounded-3xl p-8 border ${theme.border} relative shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto`}>
            <button onClick={() => setShowRules(false)} className={`absolute top-6 right-6 ${theme.textDim} hover:${theme.text}`}><IconX /></button>
            <h3 className={`text-2xl font-black ${theme.text} mb-6 uppercase tracking-tighter`}>📄 {t.rulesTitle}</h3>
            <div className={`space-y-6 text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <p className="font-black text-blue-500 uppercase mb-2">Phase 1: Expansion</p>
                <p>{t.rulesText1}</p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <p className="font-black text-rose-500 uppercase mb-2">Phase 2: Battle</p>
                <p>{t.rulesText2}</p>
              </div>
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="font-black text-yellow-500 uppercase mb-2">Ko Rule</p>
                <p>{t.rulesText3}</p>
              </div>
              <div className="p-4 bg-green-600/10 border border-green-600/30 rounded-2xl text-center font-black text-green-500 uppercase tracking-widest">{t.winCondition}</div>
            </div>
          </div>
        </div>
      )}

      {status === GameStatus.PAUSED && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300 p-6">
           <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-16 italic">PAUSED</h2>
           <button onClick={togglePause} className="px-12 py-5 bg-white text-black font-black rounded-2xl flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl">
             <IconPlay /> <span className="text-lg tracking-tight">{t.resume}</span>
           </button>
           <button onClick={handleBackToMenu} className="mt-12 text-white/20 hover:text-white uppercase font-black text-[10px] tracking-[0.3em] transition-all">{t.exit}</button>
        </div>
      )}
    </div>
  );
};

export default App;
