import React, { useReducer, useEffect, useState, useMemo, useCallback } from 'react';
import { gameReducer, INITIAL_STATE } from './engine/game';
import { Board } from './components/Board';
import { Wheel } from './components/Wheel';
import { Keyboard } from './components/Keyboard';
import { PackSelector } from './components/PackSelector';
import { KidModeApp } from './components/KidModeApp';
import { ModeSelector, ModeIndicator } from './components/ModeSelector';
import { ALL_PACKS, PuzzlePack } from './engine/packs';
import { DEFAULT_PUZZLES } from './engine/defaultPack';
import { VOWELS, WheelWedge, GameMode } from './engine/types';
import { Settings as SettingsIcon, RotateCcw, X, Eye, EyeOff, Library } from 'lucide-react';
import confetti from 'canvas-confetti';

// Error boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{width: '100%', height: '100vh', background: '#1a1a2e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
          <div style={{textAlign: 'center'}}>
            <h1>Error Loading App</h1>
            <p>{this.state.error?.message}</p>
            <pre style={{textAlign: 'left', background: '#0f3460', padding: '10px', borderRadius: '5px', overflow: 'auto', maxHeight: '300px', fontSize: '12px'}}>
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Debug logs
  useEffect(() => {
    console.log('App mounted');
    console.log('ALL_PACKS length:', ALL_PACKS?.length);
    console.log('DEFAULT_PUZZLES length:', DEFAULT_PUZZLES?.length);
  }, []);

  // Game mode state (persisted)
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const saved = localStorage.getItem('wof_game_mode');
    return (saved === 'KID' || saved === 'STANDARD') ? saved : 'STANDARD';
  });
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Persist game mode
  useEffect(() => {
    localStorage.setItem('wof_game_mode', gameMode);
  }, [gameMode]);

  // Mode selector overlay (shown on top of either mode)
  const modeSelectorOverlay = showModeSelector && (
    <ModeSelector
      currentMode={gameMode}
      onSelectMode={(mode) => {
        setGameMode(mode);
        setShowModeSelector(false);
      }}
      onClose={() => setShowModeSelector(false)}
    />
  );

  // If in Kid Mode, render the KidModeApp
  if (gameMode === 'KID') {
    return (
      <>
        <KidModeApp onModeChange={() => setShowModeSelector(true)} />
        {modeSelectorOverlay}
      </>
    );
  }

  return (
    <>
      <StandardModeApp
        onModeChange={() => setShowModeSelector(true)}
        gameMode={gameMode}
      />
      {modeSelectorOverlay}
    </>
  );
}

interface StandardModeAppProps {
  onModeChange: () => void;
  gameMode: GameMode;
}

function StandardModeApp({ onModeChange, gameMode }: StandardModeAppProps) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, (initial) => {
    const saved = localStorage.getItem('wof_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure spinCount exists (missing in old saved states)
        const restored = { ...initial, ...parsed, spinCount: parsed.spinCount ?? 0 };

        // Validate state consistency: guessedLetters should match revealedPositions
        // If a letter is revealed but not in guessedLetters, the state is corrupt
        if (restored.currentPuzzle && restored.revealedPositions && restored.guessedLetters) {
          const phrase = restored.currentPuzzle.phrase.toUpperCase();
          const revealedLetters = new Set(
            restored.revealedPositions
              .filter((i: number) => /[A-Z]/.test(phrase[i]))
              .map((i: number) => phrase[i])
          );
          const guessedSet = new Set(restored.guessedLetters);

          // Check if revealed letters are missing from guessedLetters
          const missingFromGuessed = [...revealedLetters].filter(l => !guessedSet.has(l));
          if (missingFromGuessed.length > 0) {
            // State is corrupt, reset the game
            console.warn('Corrupt state detected: revealed letters not in guessedLetters', missingFromGuessed);
            return initial;
          }
        }

        return restored;
      } catch {
        return initial;
      }
    }
    return initial;
  });

  const [activePack, setActivePack] = useState<PuzzlePack>(() => {
    // Fallback if ALL_PACKS is empty
    if (ALL_PACKS && ALL_PACKS.length > 0) {
      return ALL_PACKS[0];
    }
    // Fallback pack
    const fallbackPack: PuzzlePack = {
      id: 'default',
      name: 'Default Pack',
      description: 'Default puzzle pack',
      source: 'default',
      puzzleCount: DEFAULT_PUZZLES.length,
      categories: [],
      difficultyRange: [0, 1],
      puzzles: DEFAULT_PUZZLES,
    };
    return fallbackPack;
  });
  const [solveInput, setSolveInput] = useState('');
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPackSelector, setShowPackSelector] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSunsetEasterEgg, setShowSunsetEasterEgg] = useState(false);
  
  // Settings State
  const [vowelCost, setVowelCost] = useState(250);
  const [customSeed, setCustomSeed] = useState<string>('');
  const [hideKeyboard, setHideKeyboard] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('wof_state', JSON.stringify(state));
  }, [state]);

  const nextRound = useCallback(() => {
    const seed = customSeed ? parseInt(customSeed) + state.roundCount : undefined;
    const puzzles = activePack.puzzles;
    const next = puzzles[Math.floor(Math.random() * puzzles.length)];
    dispatch({ type: 'START_ROUND', puzzle: next, seed });
  }, [activePack, customSeed, state.roundCount]);

  const selectPack = useCallback((pack: PuzzlePack) => {
    setActivePack(pack);
    setShowPackSelector(false);
    // Start a new round from the new pack
    const seed = customSeed ? parseInt(customSeed) + state.roundCount : undefined;
    const next = pack.puzzles[Math.floor(Math.random() * pack.puzzles.length)];
    dispatch({ type: 'START_ROUND', puzzle: next, seed });
  }, [customSeed, state.roundCount]);
  
  // Load puzzle if none
  useEffect(() => {
    if (!state.currentPuzzle) {
      nextRound();
    }
  }, [state.currentPuzzle, activePack]);

  // Vowel Logic - check which puzzle vowels haven't been guessed yet
  const puzzleVowels = useMemo(() => {
    if (!state.currentPuzzle) return [];
    return [...new Set(state.currentPuzzle.phrase.toUpperCase().match(/[AEIOU]/g) || [])];
  }, [state.currentPuzzle]);

  // Also track which consonants in the puzzle haven't been guessed
  const puzzleConsonants = useMemo(() => {
    if (!state.currentPuzzle) return [];
    return [...new Set(state.currentPuzzle.phrase.toUpperCase().match(/[BCDFGHJKLMNPQRSTVWXYZ]/g) || [])];
  }, [state.currentPuzzle]);

  const vowelsLeft = useMemo(() => {
    return puzzleVowels.some(v => !state.guessedLetters.includes(v));
  }, [puzzleVowels, state.guessedLetters]);

  const consonantsLeft = useMemo(() => {
    return puzzleConsonants.some(c => !state.guessedLetters.includes(c));
  }, [puzzleConsonants, state.guessedLetters]);

  // Debug: Detect unsolvable state and warn
  useEffect(() => {
    if (state.currentPuzzle && state.turnState !== 'ROUND_OVER') {
      // If no vowels AND no consonants left to guess, but puzzle isn't solved = bug
      if (!vowelsLeft && !consonantsLeft) {
        const allLettersRevealed = state.currentPuzzle.phrase
          .split('')
          .every((char, i) => !/[A-Z]/.test(char) || state.revealedPositions.includes(i));
        
        if (!allLettersRevealed) {
          console.error('BUG: No letters left to guess but puzzle not fully revealed!', {
            guessedLetters: state.guessedLetters,
            puzzleVowels,
            puzzleConsonants,
            revealedPositions: state.revealedPositions,
            phrase: state.currentPuzzle.phrase
          });
          showToast('Bug detected! Starting new puzzle...', 'error');
          setTimeout(() => nextRound(), 2000);
        }
      }
    }
  }, [vowelsLeft, consonantsLeft, state.currentPuzzle, state.turnState, state.revealedPositions]);


  // Toss-up tick
  useEffect(() => {
    if (state.currentPuzzle?.round_type === 'TOSSUP' && state.turnState !== 'ROUND_OVER') {
      const interval = setInterval(() => {
        dispatch({ type: 'TOSS_UP_TICK' });
      }, 1000); 
      return () => clearInterval(interval);
    }
  }, [state.currentPuzzle?.round_type, state.turnState]);

  // Actions
  const handleSpinStart = () => dispatch({ type: 'SPIN_WHEEL' });
  
  const handleSpinComplete = (wedge: WheelWedge) => {
    dispatch({ type: 'SPIN_RESULT', wedge });
    if (wedge.type === 'BANKRUPT') showToast('BANKRUPT!', 'error');
    if (wedge.type === 'LOSE_TURN') showToast('LOSE TURN!', 'error');
    if (wedge.type === 'FREE_PLAY') showToast('FREE PLAY!', 'success');
  };

  const handleGuess = (letter: string) => {
    const isVowel = VOWELS.includes(letter);
    const cost = isVowel ? vowelCost : 0; 

    if (isVowel && state.player.currentRoundScore < cost && !state.player.freePlay) {
      showToast('Not enough money to buy vowel!', 'error');
      return;
    }

    dispatch({ type: 'GUESS_LETTER', letter, cost });
  };

  const handleSolve = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Easter egg: "MAGNIFICENT SUNSET"
    if (solveInput.toUpperCase() === 'MAGNIFICENT SUNSET') {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      setShowSunsetEasterEgg(true);
      setSolveInput('');
      setShowSolveModal(false);
      return;
    }
    
    dispatch({ type: 'SOLVE_ATTEMPT', phrase: solveInput });
    setSolveInput('');
    setShowSolveModal(false);
  };

  const showToast = (msg: string, _type: 'info' | 'success' | 'error') => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    if (state.turnState === 'ROUND_OVER') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast('PUZZLE SOLVED!', 'success');
    }
  }, [state.turnState]);

  if (!state.currentPuzzle) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-screen bg-game-bg flex flex-col text-white pb-safe overflow-hidden">
      {/* Header */}
      <header className="py-2 px-3 sm:py-3 sm:px-4 flex justify-between items-center bg-game-accent shadow-md z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
            WHEEL PRACTICE
          </h1>
          <ModeIndicator mode={gameMode} onClick={onModeChange} />
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <div className="flex flex-col items-end text-base sm:text-lg font-mono">
             <span className="text-green-400">${state.player.currentRoundScore}</span>
             <span className="text-yellow-400 text-sm">${state.player.totalScore}</span>
          </div>
          <button
            onClick={() => setShowPackSelector(true)}
            className="p-2 hover:bg-white/10 rounded-full"
            title="Select Pack"
          >
            <Library size={24} />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-full">
            <SettingsIcon size={24} />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 overflow-hidden relative w-full gap-1">
        
        <div className="w-full flex-shrink-0">
           <Board 
              phrase={state.currentPuzzle.phrase} 
              revealedPositions={state.revealedPositions}
              category={state.currentPuzzle.category}
              puzzleId={state.currentPuzzle.id}
              isPuzzleSolved={state.turnState === 'ROUND_OVER'}
            />
         </div>

         {message && (
           <div className="fixed top-20 z-50 animate-bounce bg-white text-black px-6 py-2 rounded-full font-bold shadow-xl border-2 border-yellow-400">
             {message}
           </div>
         )}

         <div className="w-full flex flex-col items-center flex-1 min-h-0 gap-0.5">
           
           {state.turnState === 'ROUND_OVER' ? (
               <button 
                 onClick={nextRound}
                 className="px-3 py-1.5 bg-green-600 rounded-lg font-bold text-sm shadow-lg hover:bg-green-500 animate-pulse"
               >
                 NEXT PUZZLE
               </button>
           ) : (
             <>
               {(state.turnState === 'IDLE' || state.turnState === 'SPINNING' || state.turnState === 'GUESSING_CONSONANT') && (
                        <div className="flex items-center justify-center flex-shrink-0 w-80 h-80 sm:w-96 sm:h-96">
                          <Wheel 
                            key={state.currentPuzzle?.id}
                            onSpinStart={handleSpinStart}
                            onSpinComplete={handleSpinComplete}
                            isSpinning={state.turnState === 'SPINNING'}
                            seed={state.seed + state.spinCount}
                            canSpin={state.turnState === 'IDLE'}
                          />
                        </div>
                     )}

               {state.turnState === 'IDLE' && (
                  <div className="flex gap-2 sm:gap-3">
                    <button 
                      onClick={() => setShowSolveModal(true)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 rounded-lg font-bold text-sm sm:text-base shadow-md hover:bg-blue-500"
                    >
                      SOLVE
                    </button>
                    <button 
                      onClick={() => {
                        if (state.player.currentRoundScore < vowelCost && !state.player.freePlay) {
                          showToast('Not enough money to buy vowel!', 'error');
                          return;
                        }
                        dispatch({ type: 'BUY_VOWEL' });
                      }}
                      disabled={!vowelsLeft || (state.player.currentRoundScore < vowelCost && !state.player.freePlay)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 rounded-lg font-bold text-sm sm:text-base shadow-md hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                      {vowelsLeft && state.player.currentRoundScore >= vowelCost || state.player.freePlay ? `VOWEL $${vowelCost}` : vowelsLeft ? 'NEED $$$' : 'NO VOWELS'}
                    </button>
                  </div>
               )}

               <div className="h-3 font-bold text-yellow-300 text-xs px-2 text-center">
                 {state.turnState === 'SPINNING' && "SPINNING..."}
                 {state.turnState === 'GUESSING_CONSONANT' && `GUESS ($${state.spinResult})`}
                 {state.turnState === 'BUYING_VOWEL' && `VOWEL ($${vowelCost})`}
                 {state.turnState === 'IDLE' && "SPIN / SOLVE / VOWEL"}
               </div>
               
               {!hideKeyboard && (
                 <div className="w-full flex-shrink-0">
                   <Keyboard 
                     guessedLetters={state.guessedLetters}
                     onGuess={handleGuess}
                     disabled={state.turnState !== 'GUESSING_CONSONANT' && state.turnState !== 'BUYING_VOWEL'}
                     consonantsOnly={state.turnState === 'GUESSING_CONSONANT'}
                     vowelsOnly={state.turnState === 'BUYING_VOWEL'} 
                   />
                 </div>
               )}
             </>
           )}
         </div>
      </main>

      {/* Solve Modal */}
      {showSolveModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSolve} className="bg-white text-black p-6 rounded-xl w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">SOLVE PUZZLE</h3>
            <input 
              autoFocus
              value={solveInput}
              onChange={e => setSolveInput(e.target.value)}
              className="w-full border-2 border-slate-300 p-3 rounded text-xl uppercase font-bold mb-4"
              placeholder="TYPE ANSWER..."
            />
            <div className="flex gap-4 justify-end">
              <button type="button" onClick={() => setShowSolveModal(false)} className="px-4 py-2 text-slate-600 font-bold">CANCEL</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold">SOLVE</button>
            </div>
          </form>
        </div>
      )}
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
           <div className="bg-slate-800 text-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-600">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold">Settings & Stats</h2>
               <button onClick={() => setShowSettings(false)}><X /></button>
             </div>
             
             <div className="space-y-6">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Vowel Cost</label>
                  <input 
                    type="number" 
                    value={vowelCost} 
                    onChange={e => setVowelCost(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">RNG Seed (Optional)</label>
                  <input 
                    type="number" 
                    placeholder="Random"
                    value={customSeed} 
                    onChange={e => setCustomSeed(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Set a number for deterministic play.</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-700 pt-4">
                    <label htmlFor="hide-keyboard" className="text-sm text-slate-400">Hide Keyboard</label>
                    <button onClick={() => setHideKeyboard(!hideKeyboard)} className="p-2">
                      {hideKeyboard ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <h3 className="font-bold mb-2">Current Pack</h3>
                  <div className="bg-slate-900 p-3 rounded mb-3">
                    <div className="font-medium text-white">{activePack.name}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {activePack.puzzleCount.toLocaleString()} puzzles
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowPackSelector(true);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Library size={16} /> Change Pack
                  </button>
                </div>

                <div className="border-t border-slate-700 pt-4">
                   <h3 className="font-bold mb-2">Statistics</h3>
                   <div className="grid grid-cols-2 gap-4 text-center">
                     <div className="bg-slate-900 p-2 rounded">
                       <div className="text-2xl font-bold text-green-400">${state.player.totalScore}</div>
                       <div className="text-xs text-slate-400">Total Winnings</div>
                     </div>
                     <div className="bg-slate-900 p-2 rounded">
                       <div className="text-2xl font-bold text-blue-400">{state.roundCount}</div>
                       <div className="text-xs text-slate-400">Rounds Played</div>
                     </div>
                   </div>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2">
                   <button 
                      onClick={() => {
                         nextRound();
                         setShowSettings(false);
                      }}
                      className="w-full py-3 bg-yellow-700/50 text-yellow-200 rounded font-bold hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> Reset Puzzle
                    </button>
                   <button 
                      onClick={() => {
                         dispatch({ type: 'RESET_GAME' });
                         setShowSettings(false);
                      }}
                      className="w-full py-3 bg-red-900/50 text-red-200 rounded font-bold hover:bg-red-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> Reset All Progress
                    </button>
                 </div>
                 </div>
                 </div>
                 </div>
                 )}

                 {/* Easter Egg: Magnificent Sunset */}
                 {showSunsetEasterEgg && (
                 <div 
                 className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
                 onClick={() => setShowSunsetEasterEgg(false)}
                 >
                 {/* Sunset gradient background */}
                 <div className="absolute inset-0 bg-gradient-to-b from-orange-400 via-pink-500 to-purple-700 animate-pulse" />
                 
                 {/* Sun */}
                 <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
                 <div className="w-40 h-40 rounded-full bg-gradient-to-t from-yellow-300 to-orange-500 shadow-[0_0_100px_50px_rgba(255,200,50,0.6)] animate-bounce" />
                 </div>
                 
                 {/* Horizon line */}
                 <div className="absolute bottom-1/4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />
                 
                 {/* Water reflection */}
                 <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-purple-900 to-transparent opacity-60" />
                 
                 {/* Text */}
                 <div className="relative z-10 text-center">
                 <h1 className="text-6xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-pulse">
                   MAGNIFICENT SUNSET
                 </h1>
                 <p className="text-white/70 mt-8 text-sm">Click anywhere to close</p>
                 </div>
                 
                 {/* Floating particles */}
                 <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 {[...Array(20)].map((_, i) => (
                 <div
                 key={i}
                 className="absolute w-2 h-2 bg-yellow-200 rounded-full opacity-60 animate-ping"
                 style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                 }}
                 />
                 ))}
                 </div>
                 </div>
                 )}

                 {/* Pack Selector Modal */}
                 {showPackSelector && (
                   <PackSelector
                     packs={ALL_PACKS}
                     currentPackId={activePack.id}
                     onSelectPack={selectPack}
                     onClose={() => setShowPackSelector(false)}
                   />
                 )}
                 </div>
                 );
                 }

                 export default function WrappedApp() {
                   return (
                     <ErrorBoundary>
                       <App />
                     </ErrorBoundary>
                   );
                 }
