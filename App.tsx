
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Trophy, Clock, Infinity as InfinityIcon, Delete, Calculator, ArrowRight, Settings, AlertTriangle, Flag, HelpCircle, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { GameMode, Difficulty, GameState, CardItem, Operator } from './types';
import { generateInitialDeck, evaluateExpression, generateTarget } from './services/mathService';
import { Card } from './components/Card';

const INITIAL_STATE: GameState = {
  mode: GameMode.MENU,
  difficulty: Difficulty.EASY,
  level: 1,
  score: 0,
  timer: 0,
  isPlaying: false,
  isInputtingTarget: false,
  isGameOver: false,
  target: 0,
  deck: generateInitialDeck(),
  expression: [],
  history: [],
  message: null,
  messageType: 'info'
};

const OPERATORS: Operator[] = ['+', '−', '×', '÷', '^', '√', '!', '(', ')'];

const TUTORIAL_STEPS = [
  {
    title: "Cara Bermain",
    content: "Tujuan Anda adalah membuat rumus matematika yang hasilnya sama dengan angka **TARGET** di atas layar.",
    icon: <Calculator className="w-12 h-12 text-indigo-400" />
  },
  {
    title: "Stok Kartu",
    content: "Kartu **Angka** terbatas! Lihat badge kecil di pojok kartu. Jika habis, angka itu tidak bisa dipakai lagi. Kartu **Operator** tidak terbatas.",
    icon: <div className="relative w-12 h-16 bg-slate-700 rounded border border-slate-600 flex items-center justify-center font-bold text-white">5<div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full text-[10px] flex items-center justify-center">2</div></div>
  },
  {
    title: "Aturan Dasar",
    content: "Dua kartu Angka **tidak boleh** bersebelahan. Anda harus memisahkannya dengan operator.\n\n✅ 5 + 2\n❌ 5 2",
    icon: <AlertTriangle className="w-12 h-12 text-rose-400" />
  },
  {
    title: "Operator Spesial",
    content: (
      <div className="text-left text-sm space-y-2">
        <p><strong className="text-indigo-400">^ (Pangkat):</strong> 2 ^ 3 = 8</p>
        <p><strong className="text-indigo-400">√ (Akar):</strong> √ 9 = 3 (Taruh √ dulu, baru angka)</p>
        <p><strong className="text-indigo-400">! (Faktorial):</strong> 3! = 3×2×1 = 6 (Taruh angka dulu, baru !)</p>
      </div>
    ),
    icon: <div className="text-3xl font-mono font-bold text-white">√ ! ^</div>
  }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Game Logic ---

  const startGame = (mode: GameMode) => {
    const isCustom = gameState.difficulty === Difficulty.CUSTOM;
    
    // Initial target generation
    let target = 0;
    if (!isCustom) {
      target = generateTarget(1, gameState.difficulty);
    }

    // Timer setup logic for Race Mode
    let initialTime = 0;
    if (mode === GameMode.RACE) {
        switch (gameState.difficulty) {
            case Difficulty.EASY: initialTime = 60; break;   // 1 Minute
            case Difficulty.MEDIUM: initialTime = 120; break; // 2 Minutes
            case Difficulty.HARD: initialTime = 240; break;   // 4 Minutes
            default: initialTime = 60;
        }
    }

    setGameState({
      ...INITIAL_STATE,
      mode,
      difficulty: gameState.difficulty,
      target: target,
      isPlaying: !isCustom, // If custom, we wait for input
      isInputtingTarget: isCustom,
      deck: generateInitialDeck(),
      timer: initialTime
    });
    
    // If Custom, clear any previous input
    if (isCustom) setCustomTargetInput('');
  };

  const handleGameOver = () => {
    setGameState(prev => ({
        ...prev,
        isPlaying: false,
        isGameOver: true,
        message: null
    }));
  };

  const submitCustomTarget = () => {
    const val = parseInt(customTargetInput);
    if (!isNaN(val)) {
        setGameState(prev => ({
            ...prev,
            target: val,
            isInputtingTarget: false,
            isPlaying: true
        }));
        setCustomTargetInput('');
    }
  };

  const nextLevel = () => {
    // Score Calculation
    let pointsEarned = 0;
    if (gameState.mode === GameMode.POINT) {
      // Sum of numbers used + bonus
      const numberSum = gameState.expression
        .filter(i => i.type === 'NUMBER')
        .reduce((acc, curr) => acc + Number(curr.value), 0);
      const opBonus = gameState.expression.length * 10;
      pointsEarned = numberSum + opBonus;
    } else {
      pointsEarned = 100 * gameState.level;
    }

    // --- MODIFICATION FOR POINT MODE (1 Round Only) ---
    if (gameState.mode === GameMode.POINT) {
        setGameState(prev => ({
            ...prev,
            score: prev.score + pointsEarned,
            isPlaying: false,
            isGameOver: true, // End game immediately
            message: null
        }));
        return; // Stop here, do not proceed to level increment
    }
    // --------------------------------------------------

    const nextLvl = gameState.level + 1;
    const isCustom = gameState.difficulty === Difficulty.CUSTOM;
    
    // Generate next target if not custom
    const nextTarget = !isCustom ? generateTarget(nextLvl, gameState.difficulty) : 0;

    // Timer Logic for Race Mode: TIME DOES NOT INCREASE on correct answer
    // For other modes (Infinity/Point), timer usually counts up, so we leave it.

    setGameState(prev => ({
      ...prev,
      level: nextLvl,
      score: prev.score + pointsEarned,
      target: nextTarget,
      expression: [],
      // deck: prev.deck, // Implicitly kept
      timer: prev.timer, 
      message: `Level ${prev.level} Complete! +${pointsEarned} pts`,
      messageType: 'success',
      isPlaying: !isCustom,
      isInputtingTarget: isCustom
    }));

    if (isCustom) {
        setCustomTargetInput('');
    }

    setTimeout(() => setGameState(p => ({ ...p, message: null })), 2000);
  };

  const handleCardClick = (item: CardItem) => {
    if (!gameState.isPlaying || gameState.isInputtingTarget) return;

    // RULE: Cannot place number next to number
    if (item.type === 'NUMBER') {
        const lastItem = gameState.expression[gameState.expression.length - 1];
        if (lastItem && lastItem.type === 'NUMBER') {
            setGameState(prev => ({
                ...prev,
                message: "Cannot place two numbers together! Use an operator.",
                messageType: 'error'
            }));
            setTimeout(() => setGameState(p => ({ ...p, message: null })), 1500);
            return;
        }
    }

    // Add to expression
    setGameState(prev => {
      const newDeck = { ...prev.deck };
      if (item.type === 'NUMBER') {
        const val = Number(item.value);
        if (newDeck[val] > 0) {
          newDeck[val]--;
        } else {
          return prev; // No cards left
        }
      }

      return {
        ...prev,
        deck: newDeck,
        expression: [...prev.expression, { ...item, id: Math.random().toString(36).substr(2, 9) }]
      };
    });
  };

  const handleBackspace = () => {
    if (gameState.expression.length === 0) return;

    setGameState(prev => {
      const lastItem = prev.expression[prev.expression.length - 1];
      const newDeck = { ...prev.deck };
      
      // Return card to deck if it's a number
      if (lastItem.type === 'NUMBER') {
        newDeck[Number(lastItem.value)]++;
      }

      return {
        ...prev,
        deck: newDeck,
        expression: prev.expression.slice(0, -1)
      };
    });
  };

  const clearExpression = () => {
    setGameState(prev => {
        // Return all numbers to deck
        const newDeck = { ...prev.deck };
        prev.expression.forEach(item => {
            if (item.type === 'NUMBER') {
                newDeck[Number(item.value)]++;
            }
        });
        return { ...prev, deck: newDeck, expression: [] };
    });
  };

  const checkWinCondition = useCallback(() => {
    if (currentValue === gameState.target) {
       nextLevel();
    }
  }, [currentValue, gameState.target, gameState.mode]); 

  // --- Effects ---

  // Timer
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isInputtingTarget && !gameState.isGameOver) {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.mode === GameMode.RACE) {
            if (prev.timer <= 0) {
              clearInterval(timerRef.current!);
              // TRIGGER GAME OVER
              return { ...prev, isPlaying: false, isGameOver: true };
            }
            return { ...prev, timer: prev.timer - 1 };
          } else {
            return { ...prev, timer: prev.timer + 1 };
          }
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState.isPlaying, gameState.mode, gameState.isInputtingTarget, gameState.isGameOver]);

  // Evaluate Expression
  useEffect(() => {
    const res = evaluateExpression(gameState.expression);
    setCurrentValue(res);
  }, [gameState.expression]);

  // Auto-Win Check (debounce slightly for UX)
  useEffect(() => {
    if (currentValue === gameState.target && gameState.isPlaying && !gameState.isInputtingTarget && !gameState.isGameOver) {
       const timeout = setTimeout(() => {
           nextLevel();
       }, 500);
       return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, gameState.target, gameState.isPlaying, gameState.isInputtingTarget, gameState.isGameOver]);


  // --- Renders ---

  const renderTutorial = () => {
    if (!isTutorialOpen) return null;
    const step = TUTORIAL_STEPS[tutorialStep];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
        <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
              Cara Bermain
            </h2>
            <button 
              onClick={() => setIsTutorialOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 flex-1 flex flex-col items-center text-center overflow-y-auto">
             <div className="mb-6 p-6 bg-slate-800/50 rounded-full">
               {step.icon}
             </div>
             <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
             <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
               {step.content}
             </div>
          </div>

          {/* Footer / Navigation */}
          <div className="p-6 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
            <div className="flex gap-1">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${idx === tutorialStep ? 'bg-indigo-500 w-6' : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                disabled={tutorialStep === 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => {
                  if (tutorialStep === TUTORIAL_STEPS.length - 1) {
                    setIsTutorialOpen(false);
                    setTutorialStep(0);
                  } else {
                    setTutorialStep(prev => prev + 1);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
              >
                {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Selesai' : 'Lanjut'}
                {tutorialStep !== TUTORIAL_STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 animate-fade-in relative z-10">
      
      {/* Top Bar for Tutorial */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-30">
        <button 
          onClick={() => { setIsTutorialOpen(true); setTutorialStep(0); }}
          className="flex items-center gap-2 bg-slate-800/80 hover:bg-indigo-600 backdrop-blur px-4 py-2 rounded-full border border-slate-700 transition-all text-sm font-bold shadow-lg group"
        >
          <HelpCircle className="w-4 h-4 text-indigo-400 group-hover:text-white" />
          <span>Cara Main</span>
        </button>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-lg">
          TARGET X
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-mono">Math Strategy Game</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl z-20">
        <button 
          onClick={() => startGame(GameMode.INFINITY)}
          className="group relative overflow-hidden p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-indigo-500 transition-all hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <InfinityIcon className="w-12 h-12 mb-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-white mb-2">Infinity</h3>
          <p className="text-slate-400 text-sm">Bertahan selama mungkin. Kartu terbatas!</p>
        </button>

        <button 
          onClick={() => startGame(GameMode.POINT)}
          className="group relative overflow-hidden p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500 transition-all hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Trophy className="w-12 h-12 mb-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-white mb-2">Points</h3>
          <p className="text-slate-400 text-sm">1 Babak. Buat persamaan terpanjang untuk skor maksimal.</p>
        </button>

        <button 
          onClick={() => startGame(GameMode.RACE)}
          className="group relative overflow-hidden p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-rose-500 transition-all hover:shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Clock className="w-12 h-12 mb-4 text-rose-400 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold text-white mb-2">Race</h3>
          <p className="text-slate-400 text-sm">Pacu waktu. 1-4 Menit tergantung kesulitan.</p>
        </button>
      </div>

      {/* Difficulty Selector */}
      <div className="flex flex-col items-center gap-4 bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 w-full max-w-lg">
        <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span className="text-slate-200 font-bold uppercase tracking-widest text-sm">Tingkat Kesulitan</span>
        </div>
        <div className="grid grid-cols-4 gap-2 w-full">
            {[
                { id: Difficulty.EASY, label: 'Mudah' },
                { id: Difficulty.MEDIUM, label: 'Sedang' },
                { id: Difficulty.HARD, label: 'Sulit' },
                { id: Difficulty.CUSTOM, label: 'Custom' }
            ].map(diff => (
                <button 
                    key={diff.id}
                    onClick={() => setGameState(p => ({...p, difficulty: diff.id as Difficulty}))}
                    className={`px-2 py-3 rounded-lg text-sm font-bold transition-all ${
                        gameState.difficulty === diff.id 
                        ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    {diff.label}
                </button>
            ))}
        </div>
        <p className="text-xs text-slate-500 text-center mt-2 h-4">
            {gameState.difficulty === Difficulty.EASY && "Target 1-20+. Race: 1 Menit."}
            {gameState.difficulty === Difficulty.MEDIUM && "Target 10-50+. Race: 2 Menit."}
            {gameState.difficulty === Difficulty.HARD && "Target 25-100+. Race: 4 Menit."}
            {gameState.difficulty === Difficulty.CUSTOM && "Anda tentukan target sendiri setiap level."}
        </p>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="flex flex-col h-screen max-w-7xl mx-auto p-2 md:p-6 overflow-hidden relative">
      
      {/* Game Over Modal / Result Modal */}
      {gameState.isGameOver && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in">
              <div className="bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-md text-center transform scale-100 animate-pop-in">
                  <Trophy className="w-20 h-20 mx-auto text-amber-400 mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                  
                  {/* Dynamic Title based on Win/Loss */}
                  <h2 className="text-4xl font-black mb-2 text-white">
                    {gameState.mode === GameMode.POINT && currentValue === gameState.target 
                        ? "SELESAI!" 
                        : "GAME OVER"}
                  </h2>
                  
                  <p className="text-slate-400 mb-8">
                    {gameState.mode === GameMode.POINT && currentValue === gameState.target
                        ? "Target tercapai!"
                        : gameState.mode === GameMode.RACE 
                            ? "Waktu Habis!" 
                            : "Stok Kartu Habis / Menyerah"}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                      {gameState.mode !== GameMode.POINT && (
                        <div className="bg-slate-800 p-4 rounded-2xl">
                            <div className="text-slate-500 text-xs font-bold uppercase">Level Reached</div>
                            <div className="text-3xl font-mono font-bold text-white">{gameState.level}</div>
                        </div>
                      )}
                      <div className={`${gameState.mode === GameMode.POINT ? 'col-span-2' : ''} bg-slate-800 p-4 rounded-2xl`}>
                          <div className="text-slate-500 text-xs font-bold uppercase">Total Score</div>
                          <div className="text-4xl font-mono font-bold text-indigo-400">{gameState.score}</div>
                      </div>
                  </div>

                  <button 
                      onClick={() => setGameState(INITIAL_STATE)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-indigo-500/25"
                  >
                      Kembali ke Menu
                  </button>
              </div>
          </div>
      )}

      {/* Custom Target Modal Overlay */}
      {gameState.isInputtingTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-2">Level {gameState.level}</h2>
                <p className="text-slate-400 mb-6">Masukkan angka target untuk level ini</p>
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        autoFocus
                        value={customTargetInput}
                        onChange={(e) => setCustomTargetInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitCustomTarget()}
                        placeholder="0"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-mono text-center focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                        onClick={submitCustomTarget}
                        disabled={!customTargetInput}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold transition-colors"
                    >
                        GO
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* HUD */}
      <header className="flex items-center justify-between mb-4 md:mb-6 bg-slate-800/80 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-slate-700 shadow-xl z-20">
        <div className="flex items-center gap-3 md:gap-6">
            <button onClick={() => setGameState(INITIAL_STATE)} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white" title="Back to Menu">
                <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            {gameState.mode !== GameMode.POINT && (
                <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 font-bold">Level</span>
                    <span className="text-xl md:text-2xl font-black font-mono">{gameState.level}</span>
                </div>
            )}
            <div className="flex flex-col">
                <span className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 font-bold">Score</span>
                <span className="text-xl md:text-2xl font-black font-mono text-indigo-400">{gameState.score}</span>
            </div>
        </div>

        {/* Target Display */}
        <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
             <div className="text-[10px] md:text-xs uppercase tracking-widest text-indigo-300 font-bold mb-1">Target</div>
             <div className="bg-slate-950 px-6 md:px-8 py-1 md:py-2 rounded-xl border-2 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] min-w-[100px] text-center">
                <span className="text-3xl md:text-5xl font-black text-white font-mono">
                    {gameState.isInputtingTarget ? '?' : gameState.target}
                </span>
             </div>
        </div>

        <div className="flex items-center gap-4">
             <div className={`flex flex-col items-end ${gameState.mode === GameMode.RACE && gameState.timer < 10 ? 'animate-pulse text-red-500' : ''}`}>
                <span className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 font-bold">Time</span>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-xl md:text-2xl font-black font-mono">
                        {Math.floor(gameState.timer / 60)}:{(gameState.timer % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>
        </div>
      </header>

      {/* Message Overlay */}
      {gameState.message && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in w-full max-w-sm text-center px-4">
            <div className={`px-6 py-3 rounded-xl font-bold shadow-2xl border flex items-center justify-center gap-2 ${
                gameState.messageType === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 
                gameState.messageType === 'error' ? 'bg-rose-500 border-rose-400 text-white' :
                'bg-blue-500 border-blue-400 text-white'
            }`}>
                {gameState.messageType === 'error' && <AlertTriangle className="w-5 h-5" />}
                {gameState.message}
            </div>
        </div>
      )}

      {/* Main Play Area */}
      <main className="flex-1 flex flex-col gap-4 relative min-h-0">
        
        {/* Expression Zone */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border border-slate-800 p-2 md:p-6 relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-slate-950" />
            
            <div className="relative z-10 w-full min-h-[100px] md:min-h-[140px] flex items-center justify-center flex-wrap gap-2 md:gap-3 p-4 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/30 transition-colors group-hover:border-slate-600">
                {gameState.expression.length === 0 && (
                    <div className="text-slate-600 font-mono text-sm md:text-lg pointer-events-none select-none text-center">
                        Pilih kartu untuk membuat persamaan...
                    </div>
                )}
                {gameState.expression.map((item, idx) => (
                    <Card key={item.id} type={item.type} small={false} className="animate-pop-in">
                        {item.display}
                    </Card>
                ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-4 md:mt-8">
                 <div className="bg-slate-950 px-4 md:px-6 py-2 md:py-3 rounded-xl border border-slate-700 shadow-inner flex items-center gap-3">
                    <span className="text-slate-400 text-xs md:text-sm font-bold uppercase hidden md:inline">Current Value</span>
                    <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />
                    <span className={`text-2xl md:text-3xl font-mono font-bold ${
                        currentValue === gameState.target ? 'text-emerald-400' : 'text-white'
                    }`}>
                        {currentValue === null ? '?' : currentValue}
                    </span>
                 </div>
                 
                 <div className="h-8 md:h-12 w-px bg-slate-700 mx-1 md:mx-2" />

                 <button onClick={handleBackspace} className="p-3 md:p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all active:scale-95 border border-slate-600 shadow-lg" title="Hapus satu">
                    <Delete className="w-5 h-5 md:w-6 md:h-6" />
                 </button>
                 <button onClick={clearExpression} className="p-3 md:p-4 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 rounded-xl transition-all active:scale-95 border border-rose-900/50" title="Reset Persamaan">
                    <span className="font-bold text-xs md:text-sm">CLR</span>
                 </button>

                 <div className="h-8 md:h-12 w-px bg-slate-700 mx-1 md:mx-2" />

                 {/* Give Up Button */}
                 <button onClick={handleGameOver} className="p-3 md:p-4 bg-red-900/20 hover:bg-red-900/50 text-red-500 hover:text-red-400 rounded-xl transition-all active:scale-95 border border-red-900/50 group" title="Menyerah">
                    <Flag className="w-5 h-5 md:w-6 md:h-6 group-hover:fill-red-500" />
                 </button>
            </div>
        </div>

        {/* Deck Area */}
        <div className="h-[45%] md:h-2/5 flex flex-col gap-2 md:gap-4">
            
            {/* Operators */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 hide-scrollbar min-h-[60px]">
                {OPERATORS.map(op => (
                    <Card 
                        key={op} 
                        type="OPERATOR" 
                        small
                        points={10} 
                        onClick={() => handleCardClick({ id: 'op', type: 'OPERATOR', value: op, display: op })}
                        className="flex-shrink-0"
                    >
                        {op}
                    </Card>
                ))}
            </div>

            {/* Numbers Deck */}
            <div className="flex-1 bg-slate-800/50 rounded-t-3xl border-t border-l border-r border-slate-700 p-4 md:p-6 overflow-y-auto">
                 <div className="grid grid-cols-6 md:grid-cols-11 gap-2 md:gap-4 max-w-5xl mx-auto pb-4">
                    {[0,1,2,3,4,5,6,7,8,9,10].map(num => (
                        <div key={num} className="flex justify-center">
                            <Card 
                                type="NUMBER" 
                                count={gameState.deck[num]} 
                                disabled={gameState.deck[num] === 0}
                                points={num}
                                onClick={() => handleCardClick({ id: `num-${num}`, type: 'NUMBER', value: num, display: num.toString() })}
                            >
                                {num}
                            </Card>
                        </div>
                    ))}
                 </div>
                 {/* Deck Status Legend */}
                 <div className="text-center mt-4 text-xs text-slate-500">
                    Kartu angka terbatas. Stok berkurang saat digunakan. Hemat kartumu!
                 </div>
            </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-indigo-500 selection:text-white font-inter">
        <style>{`
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes pop-in { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            @keyframes bounce-in { 0% { transform: translate(-50%, -20px); opacity: 0; } 50% { transform: translate(-50%, 5px); } 100% { transform: translate(-50%, 0); opacity: 1; } }
            .animate-fade-in { animation: fade-in 0.5s ease-out; }
            .animate-pop-in { animation: pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        `}</style>
      {renderTutorial()}
      {gameState.mode === GameMode.MENU ? renderMenu() : renderGame()}
    </div>
  );
}
