
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

// UI Icons
const IconSword = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M14.5 17.5L3 6l3-3 11.5 11.5M13 19l2-2M19 13l-2 2M21 21l-4-4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconBot = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7V11M8 15V17M16 15V17" strokeLinecap="round" /></svg>;
const IconRules = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V5A2.5 2.5 0 0 1 6.5 2.5H20v14.5H6.5a2.5 2.5 0 0 0-2.5 2.5z" /></svg>;
const IconMenu = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconBack = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconPause = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPlay = () => <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconUndo = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const IconRedo = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconX = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [mode, setMode] = useState<GameMode>(GameMode.PVP);
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
    audioRef.current.volume = 0.15;
    return () => audioRef.current?.pause();
  }, []);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      audioRef.current?.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [status]);

  useEffect(() => {
    let interval: any;
    if (status === GameStatus.PLAYING && !gameState.winner && !isBotThinking) {
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
  }, [status, gameState.winner, gameState.currentPlayer, isBotThinking]);

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

  return (
    <div className="min-h-screen h-[100dvh] flex flex-col overflow-hidden text-slate-100 bg-slate-950">
      
      {status === GameStatus.MENU ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="text-center space-y-2">
            <h1 className="text-5xl sm:text-7xl font-black orbitron tracking-tighter whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-indigo-600 drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]">
              SLASH GAME
            </h1>
            <p className="text-slate-100 tracking-[0.25em] text-[11px] uppercase font-black opacity-100 drop-shadow-md">Abstract Intelligence System</p>
          </div>
          
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <button 
              onClick={() => startGame(GameMode.PVP)} 
              className="group relative w-full py-5 bg-white text-slate-950 font-black rounded-3xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative text-sm tracking-widest uppercase flex items-center justify-center gap-3">
                <IconSword /> {t.playPvp}
              </span>
            </button>
            
            <button 
              onClick={() => startGame(GameMode.PVE)} 
              className="w-full py-5 bg-slate-900 border border-white/10 text-white font-black rounded-3xl transition-all hover:bg-slate-800 hover:border-white/20 active:scale-95 shadow-xl"
            >
              <span className="text-sm tracking-widest uppercase flex items-center justify-center gap-3">
                <IconBot /> {t.playBot}
              </span>
            </button>
            
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowRules(true)} className="py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/10 flex items-center justify-center gap-2 shadow-lg"><IconRules /> {t.rules}</button>
                <button onClick={() => setShowSettings(true)} className="py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/10 flex items-center justify-center gap-2 shadow-lg"><IconSettings /> {t.settings}</button>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 pt-6">
            <div className="w-12 h-[1px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] animate-pulse">
              Created by Asadbek
            </span>
          </div>
        </div>
      ) : (
        <>
          <header className="h-10 flex items-center justify-between px-5 glass border-b border-white/5 z-50">
            <button onClick={handleBackToMenu} className="p-2 text-slate-400 hover:text-white transition-colors"><IconBack /></button>
            <div className="flex flex-col items-center">
              <h2 className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] orbitron whitespace-nowrap">Slash Game</h2>
              <div className="h-0.5 w-6 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white transition-colors"><IconSettings /></button>
          </header>
          
          <main className="flex-1 flex flex-col items-center justify-between py-6 px-4 gap-2 overflow-hidden">
            <div className={`w-full max-w-md flex items-center justify-between px-4 transition-all duration-300 ${gameState.currentPlayer === Player.TWO ? 'opacity-100 scale-105' : 'opacity-30 scale-95'}`}>
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${gameState.currentPlayer === Player.TWO ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' : 'glass text-slate-500'}`}>{mode === GameMode.PVE ? 'AI' : 'P2'}</div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{mode === GameMode.PVE ? t.bot : t.player2}</span>
                    <span className="text-sm font-mono font-black text-white">
                      {gameState.currentPlayer === Player.TWO ? `0:${timeLeft.toString().padStart(2, '0')}` : `--:--`}
                    </span>
                  </div>
               </div>
               <div className={`px-3 py-1 rounded-full border border-white/10 glass text-[8px] font-black uppercase tracking-[0.2em] ${gameState.phase === GamePhase.EXPANSION ? 'text-cyan-400' : 'text-amber-500'}`}>
                 {gameState.phase === GamePhase.EXPANSION ? t.expansion : t.battle}
               </div>
            </div>
            
            <div className="relative p-2.5 glass rounded-[1.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] border-white/10">
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-black/50 w-[82vw] h-[82vw] max-w-[300px] max-h-[300px]">
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
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/85 backdrop-blur-2xl rounded-[1.5rem] animate-in fade-in zoom-in duration-300 border border-white/10">
                   <div className="text-center p-6 space-y-4">
                      <div className="text-5xl drop-shadow-lg">🏆</div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{gameState.winner === 'DRAW' ? t.draw : t.winner}</h3>
                        <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">{gameState.winner !== 'DRAW' ? `P${gameState.winner} Dominates` : 'Equilibrium'}</p>
                      </div>
                      <button onClick={resetGame} className="w-full py-3 bg-white text-slate-950 font-black rounded-xl transition-all uppercase text-[10px] tracking-widest shadow-xl">{t.reset}</button>
                   </div>
                </div>
              )}
            </div>

            <div className={`w-full max-w-md flex items-center justify-between px-4 transition-all duration-300 ${gameState.currentPlayer === Player.ONE ? 'opacity-100 scale-105' : 'opacity-30 scale-95'}`}>
               <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all ${gameState.currentPlayer === Player.ONE ? 'bg-cyan-500 text-slate-950 shadow-xl shadow-cyan-500/30' : 'glass text-slate-500'}`}>P1</div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{t.player1}</span>
                    <span className="text-lg font-mono font-black text-white">
                       {gameState.currentPlayer === Player.ONE ? `0:${timeLeft.toString().padStart(2, '0')}` : `--:--`}
                    </span>
                  </div>
               </div>
               {isBotThinking && (
                 <div className="flex items-center gap-2 px-3 py-1 glass rounded-xl border-cyan-500/30 animate-pulse-soft shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                   <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                   <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">AI Thinking</span>
                 </div>
               )}
            </div>
          </main>

          <footer className="glass border-t border-white/10 px-6 pt-5 pb-16 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <button onClick={() => setShowMenu(true)} className="flex flex-col items-center gap-1 group">
                <div className="p-2.5 rounded-xl transition-all group-hover:bg-white/10 text-slate-400 group-hover:text-white bg-white/5"><IconMenu /></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{t.menu}</span>
              </button>
              
              <div className="flex gap-3">
                <button onClick={handleUndo} disabled={currentStep === 0 || isBotThinking} className={`p-4 rounded-xl transition-all shadow-lg ${currentStep === 0 ? 'opacity-5' : 'glass hover:bg-white/10 border-white/20'}`}><IconUndo /></button>
                <button onClick={handleRedo} disabled={currentStep >= history.length - 1} className={`p-4 rounded-xl transition-all shadow-lg ${currentStep >= history.length - 1 ? 'opacity-5' : 'glass hover:bg-white/10 border-white/20'}`}><IconRedo /></button>
              </div>

              <button onClick={togglePause} className="flex flex-col items-center gap-1 group">
                <div className="p-2.5 rounded-xl transition-all group-hover:bg-white/10 text-slate-400 group-hover:text-white bg-white/5"><IconPause /></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{t.paused}</span>
              </button>
            </div>
          </footer>
        </>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-[250] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="glass w-full max-w-xs rounded-2xl p-6 border-white/20 shadow-2xl space-y-3 text-center">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">{t.menu}</h3>
              <button onClick={() => setShowMenu(false)} className="w-full py-4 bg-white text-slate-950 font-black rounded-xl transition-all uppercase tracking-widest text-[11px] shadow-lg">{t.resume}</button>
              <button onClick={resetGame} className="w-full py-4 glass text-white font-black rounded-xl transition-all uppercase tracking-widest text-[11px] shadow-lg">{t.reset}</button>
              <button onClick={handleBackToMenu} className="w-full py-4 text-slate-500 font-bold transition-all uppercase tracking-widest text-[11px]">{t.exit}</button>
           </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[210] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass w-full max-w-xs rounded-2xl p-6 border-white/20 relative shadow-2xl">
            <button onClick={() => setShowSettings(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><IconX /></button>
            <h3 className="text-xl font-black text-white mb-8 uppercase tracking-tighter">{t.settings}</h3>
            <div className="space-y-8">
              <div>
                <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest block mb-3">{t.lang}</span>
                <div className="grid grid-cols-3 gap-2">
                  {[Language.RU, Language.EN, Language.UZ].map(l => (
                    <button key={l} onClick={() => setLanguage(l)} className={`py-3 text-[10px] font-black rounded-lg transition-all ${language === l ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-105' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/60 border border-white/10 shadow-inner">
                <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{t.theme}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]">Dark</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[220] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass w-full max-w-md rounded-2xl p-8 border-white/20 relative shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><IconX /></button>
            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">{t.rulesTitle}</h3>
            <div className="space-y-6 text-[11px] leading-relaxed text-slate-300">
              <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="font-black text-cyan-400 uppercase tracking-widest text-[9px]">01 // {t.expansion}</p>
                <p>{t.rulesText1}</p>
              </div>
              <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="font-black text-rose-500 uppercase tracking-widest text-[9px]">02 // {t.battle}</p>
                <p>{t.rulesText2}</p>
              </div>
              <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="font-black text-amber-500 uppercase tracking-widest text-[9px]">03 // Ko Rule</p>
                <p>{t.rulesText3}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === GameStatus.PAUSED && (
        <div className="fixed inset-0 z-[300] bg-slate-950/99 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-500 px-6">
           <h2 className="text-5xl font-black text-white uppercase tracking-tighter orbitron italic mb-12 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{t.paused}</h2>
           <button onClick={togglePause} className="group relative px-10 py-5 bg-white text-slate-950 font-black rounded-2xl flex items-center gap-4 transition-all hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]">
             <IconPlay /> <span className="text-lg tracking-widest uppercase">{t.resume}</span>
           </button>
           <button onClick={handleBackToMenu} className="mt-12 text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-[0.4em] transition-all py-2 px-4">{t.exit}</button>
        </div>
      )}
    </div>
  );
};

export default App;
