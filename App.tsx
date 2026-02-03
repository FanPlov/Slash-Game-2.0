
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
const IconMenu = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconBack = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconPause = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPlay = () => <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconUndo = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const IconRedo = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>;
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
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="text-center space-y-1">
            <h1 className="text-4xl sm:text-6xl font-black orbitron tracking-tighter whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-indigo-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              SLASH GAME
            </h1>
            <p className="text-slate-100 tracking-[0.2em] text-[10px] uppercase font-black opacity-100 drop-shadow-sm">Abstract Intelligence System</p>
          </div>
          
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button 
              onClick={() => startGame(GameMode.PVP)} 
              className="group relative w-full py-4 bg-white text-slate-950 font-black rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative text-xs tracking-widest uppercase flex items-center justify-center gap-3">
                <IconSword /> {t.playPvp}
              </span>
            </button>
            
            <button 
              onClick={() => startGame(GameMode.PVE)} 
              className="w-full py-4 bg-slate-900 border border-white/10 text-white font-black rounded-2xl transition-all hover:bg-slate-800 hover:border-white/20 active:scale-95"
            >
              <span className="text-xs tracking-widest uppercase flex items-center justify-center gap-3">
                <IconBot /> {t.playBot}
              </span>
            </button>
            
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowRules(true)} className="py-3.5 glass rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/10 flex items-center justify-center gap-2"><IconRules /> {t.rules}</button>
                <button onClick={() => setShowSettings(true)} className="py-3.5 glass rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/10 flex items-center justify-center gap-2"><IconSettings /> {t.settings}</button>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="w-10 h-[1px] bg-indigo-500/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              Created by Asadbek
            </span>
          </div>
        </div>
      ) : (
        <>
          <header className="h-10 flex items-center justify-between px-5 glass border-b border-white/5 z-50">
            <button onClick={handleBackToMenu} className="p-2 text-slate-400 hover:text-white transition-colors"><IconBack /></button>
            <div className="flex flex-col items-center">
              <h2 className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em] orbitron whitespace-nowrap">Slash Game</h2>
              <div className="h-0.5 w-6 bg-indigo-500 rounded-full" />
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white transition-colors"><IconSettings /></button>
          </header>
          
          <main className="flex-1 flex flex-col items-center justify-center p-2 gap-1 overflow-hidden">
            <div className={`w-full max-w-sm flex items-center justify-between px-2 transition-all duration-300 ${gameState.currentPlayer === Player.TWO ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
               <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] transition-all ${gameState.currentPlayer === Player.TWO ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'glass text-slate-500'}`}>{mode === GameMode.PVE ? 'AI' : 'P2'}</div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">{mode === GameMode.PVE ? t.bot : t.player2}</span>
                    <span className="text-xs font-mono font-black text-white">
                      {gameState.currentPlayer === Player.TWO ? `0:${timeLeft.toString().padStart(2, '0')}` : `--:--`}
                    </span>
                  </div>
               </div>
               <div className={`px-2 py-0.5 rounded-full border border-white/5 glass text-[6px] font-black uppercase tracking-[0.1em] ${gameState.phase === GamePhase.EXPANSION ? 'text-cyan-400' : 'text-amber-500'}`}>
                 {gameState.phase === GamePhase.EXPANSION ? t.expansion : t.battle}
               </div>
            </div>
            
            <div className="relative p-1.5 glass rounded-[1.2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,1)] border-white/5">
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/40 w-[65vw] h-[65vw] max-w-[210px] max-h-[210px]">
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
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl rounded-[1.2rem] animate-in fade-in zoom-in duration-300 border border-white/10">
                   <div className="text-center p-4 space-y-2">
                      <div className="text-3xl">🏆</div>
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">{gameState.winner === 'DRAW' ? t.draw : t.winner}</h3>
                        <p className="text-slate-500 text-[6px] font-black uppercase tracking-[0.1em]">{gameState.winner !== 'DRAW' ? `P${gameState.winner} Dominates` : 'Equilibrium'}</p>
                      </div>
                      <button onClick={resetGame} className="w-full py-2 bg-white text-slate-950 font-black rounded-lg transition-all uppercase text-[8px] tracking-widest">{t.reset}</button>
                   </div>
                </div>
              )}
            </div>

            <div className={`w-full max-w-sm flex items-center justify-between px-2 transition-all duration-300 ${gameState.currentPlayer === Player.ONE ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
               <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm transition-all ${gameState.currentPlayer === Player.ONE ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'glass text-slate-500'}`}>P1</div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-500">{t.player1}</span>
                    <span className="text-base font-mono font-black text-white">
                       {gameState.currentPlayer === Player.ONE ? `0:${timeLeft.toString().padStart(2, '0')}` : `--:--`}
                    </span>
                  </div>
               </div>
               {isBotThinking && (
                 <div className="flex items-center gap-1 px-2 py-0.5 glass rounded-lg border-cyan-500/20 animate-pulse-soft">
                   <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                   <span className="text-[6px] font-black text-cyan-400 uppercase tracking-widest">AI Thinking</span>
                 </div>
               )}
            </div>
          </main>

          <footer className="glass border-t border-white/5 px-6 pt-3 pb-10 z-50">
            <div className="flex items-center justify-between max-w-sm mx-auto">
              <button onClick={() => setShowMenu(true)} className="flex flex-col items-center gap-0 group">
                <div className="p-1.5 rounded-lg transition-all group-hover:bg-white/10 text-slate-400 group-hover:text-white"><IconMenu /></div>
                <span className="text-[7px] font-black uppercase tracking-widest opacity-40">{t.menu}</span>
              </button>
              
              <div className="flex gap-2">
                <button onClick={handleUndo} disabled={currentStep === 0 || isBotThinking} className={`p-3 rounded-lg transition-all ${currentStep === 0 ? 'opacity-5' : 'glass hover:bg-white/10'}`}><IconUndo /></button>
                <button onClick={handleRedo} disabled={currentStep >= history.length - 1} className={`p-3 rounded-lg transition-all ${currentStep >= history.length - 1 ? 'opacity-5' : 'glass hover:bg-white/10'}`}><IconRedo /></button>
              </div>

              <button onClick={togglePause} className="flex flex-col items-center gap-0 group">
                <div className="p-1.5 rounded-lg transition-all group-hover:bg-white/10 text-slate-400 group-hover:text-white"><IconPause /></div>
                <span className="text-[7px] font-black uppercase tracking-widest opacity-40">{t.paused}</span>
              </button>
            </div>
          </footer>
        </>
      )}

      {showMenu && (
        <div className="fixed inset-0 z-[250] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300">
           <div className="glass w-full max-w-xs rounded-xl p-5 border-white/10 shadow-2xl space-y-2 text-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">{t.menu}</h3>
              <button onClick={() => setShowMenu(false)} className="w-full py-3.5 bg-white text-slate-950 font-black rounded-lg transition-all uppercase tracking-widest text-[9px]">{t.resume}</button>
              <button onClick={resetGame} className="w-full py-3.5 glass text-white font-black rounded-lg transition-all uppercase tracking-widest text-[9px]">{t.reset}</button>
              <button onClick={handleBackToMenu} className="w-full py-3.5 text-slate-500 font-bold transition-all uppercase tracking-widest text-[9px]">{t.exit}</button>
           </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[210] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass w-full max-w-xs rounded-xl p-5 border-white/10 relative shadow-2xl">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><IconX /></button>
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tighter">{t.settings}</h3>
            <div className="space-y-6">
              <div>
                <span className="text-slate-500 text-[7px] font-black uppercase tracking-widest block mb-2">{t.lang}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[Language.RU, Language.EN, Language.UZ].map(l => (
                    <button key={l} onClick={() => setLanguage(l)} className={`py-2 text-[8px] font-black rounded-md transition-all ${language === l ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-500'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-500 text-[7px] font-black uppercase tracking-widest">{t.theme}</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-indigo-400">Dark</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[220] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass w-full max-w-md rounded-xl p-6 border-white/10 relative shadow-2xl max-h-[75vh] overflow-y-auto">
            <button onClick={() => setShowRules(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white"><IconX /></button>
            <h3 className="text-xl font-black text-white mb-5 uppercase tracking-tighter">{t.rulesTitle}</h3>
            <div className="space-y-5 text-[10px] leading-relaxed text-slate-400">
              <div className="space-y-1">
                <p className="font-black text-cyan-400 uppercase tracking-widest text-[8px]">01 // {t.expansion}</p>
                <p>{t.rulesText1}</p>
              </div>
              <div className="space-y-1">
                <p className="font-black text-rose-500 uppercase tracking-widest text-[8px]">02 // {t.battle}</p>
                <p>{t.rulesText2}</p>
              </div>
              <div className="space-y-1">
                <p className="font-black text-amber-500 uppercase tracking-widest text-[8px]">03 // Ko Rule</p>
                <p>{t.rulesText3}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === GameStatus.PAUSED && (
        <div className="fixed inset-0 z-[300] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-500">
           <h2 className="text-4xl font-black text-white uppercase tracking-tighter orbitron italic mb-10">{t.paused}</h2>
           <button onClick={togglePause} className="group relative px-8 py-4 bg-white text-slate-950 font-black rounded-lg flex items-center gap-3 transition-all hover:scale-110 active:scale-95 shadow-2xl">
             <IconPlay /> <span className="text-sm tracking-widest uppercase">{t.resume}</span>
           </button>
           <button onClick={handleBackToMenu} className="mt-10 text-slate-600 hover:text-white uppercase font-black text-[8px] tracking-[0.3em] transition-all">{t.exit}</button>
        </div>
      )}
    </div>
  );
};

export default App;
