import React, { useReducer, useEffect, useState, useMemo } from 'react';
import { gameReducer, INITIAL_STATE } from './engine/game';
import { Board } from './components/Board';
import { Wheel } from './components/Wheel';
import { Keyboard } from './components/Keyboard';
import { DEFAULT_PUZZLES } from './engine/defaultPack';
import { Puzzle, VOWELS, WheelWedge } from './engine/types';
import { Settings as SettingsIcon, RotateCcw, Upload, X, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';

function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, (initial) => {
    const saved = localStorage.getItem('wof_state');
    return saved ? { ...initial, ...JSON.parse(saved) } : initial;
  });

  const [activePack, setActivePack] = useState<Puzzle[]>(DEFAULT_PUZZLES);
  const [solveInput, setSolveInput] = useState('');
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Settings State
  const [vowelCost, setVowelCost] = useState(250);
  const [customSeed, setCustomSeed] = useState<string>('');
  const [hideKeyboard, setHideKeyboard] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('wof_state', JSON.stringify(state));
  }, [state]);

  const nextRound = () => {
    const seed = customSeed ? parseInt(customSeed) + state.roundCount : undefined;
    const next = activePack[Math.floor(Math.random() * activePack.length)];
    dispatch({ type: 'START_ROUND', puzzle: next, seed });
  };
  
  // Load puzzle if none
  useEffect(() => {
    if (!state.currentPuzzle) {
      nextRound();
    }
  }, [state.currentPuzzle, activePack]);

  // Vowel Logic
  const puzzleVowels = useMemo(() => {
    if (!state.currentPuzzle) return [];
    return [...new Set(state.currentPuzzle.phrase.match(/[AEIOU]/g) || [])];
  }, [state.currentPuzzle]);

  const vowelsLeft = useMemo(() => {
    return puzzleVowels.some(v => !state.guessedLetters.includes(v));
  }, [puzzleVowels, state.guessedLetters]);

  useEffect(() => {
    if (state.currentPuzzle && !vowelsLeft) {
      const allVowelsGuessed = puzzleVowels.every(v => state.guessedLetters.includes(v));
      if(allVowelsGuessed && puzzleVowels.length > 0) {
        // This will fire multiple times, but it is safe.
        // The user can be annoyed but the app will work.
      }
    }
  }, [vowelsLeft, state.currentPuzzle, puzzleVowels, state.guessedLetters]);


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
    dispatch({ type: 'SOLVE_ATTEMPT', phrase: solveInput });
    setSolveInput('');
    setShowSolveModal(false);
  };

  const showToast = (msg: string, type: 'info' | 'success' | 'error') => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    if (state.turnState === 'ROUND_OVER') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast('PUZZLE SOLVED!', 'success');
    }
  }, [state.turnState]);

  const handleImportPack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.puzzles && Array.isArray(json.puzzles)) {
          const newPuzzles = json.puzzles.map((p: any) => ({
             id: p.id,
             phrase: p.phrase,
             category: p.category,
             round_type: p.round_type
          }));
          setActivePack(newPuzzles);
          showToast(`Imported ${newPuzzles.length} puzzles`, 'success');
          setShowSettings(false);
          // Use a timeout to allow the settings modal to close before resetting
          setTimeout(() => dispatch({ type: 'RESET_GAME' }), 200);
        } else {
          showToast('Invalid pack format', 'error');
        }
      } catch (err) {
        showToast('Failed to parse JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (!state.currentPuzzle) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-screen bg-game-bg flex flex-col text-white pb-safe overflow-hidden">
      {/* Header */}
      <header className="p-2 sm:p-4 flex justify-between items-center bg-game-accent shadow-md z-10 flex-shrink-0">
        <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
          WHEEL PRACTICE
        </h1>
        <div className="flex gap-2 sm:gap-4 items-center">
          <div className="flex flex-col items-end text-sm font-mono">
             <span className="text-green-400">${state.player.currentRoundScore}</span>
             <span className="text-yellow-400 text-xs">${state.player.totalScore}</span>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-full">
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto relative w-full">
        
        <div className="w-full max-w-4xl flex-shrink-0">
          <Board 
            phrase={state.currentPuzzle.phrase} 
            revealedPositions={state.revealedPositions}
            category={state.currentPuzzle.category}
          />
        </div>

        {message && (
          <div className="fixed top-20 z-50 animate-bounce bg-white text-black px-6 py-2 rounded-full font-bold shadow-xl border-2 border-yellow-400">
            {message}
          </div>
        )}

        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0">
          
          {state.turnState === 'ROUND_OVER' ? (
             <button 
               onClick={nextRound}
               className="px-8 py-4 bg-green-600 rounded-xl font-bold text-2xl shadow-lg hover:bg-green-500 animate-pulse"
             >
               NEXT PUZZLE
             </button>
          ) : (
            <>
              {(state.turnState === 'IDLE' || state.turnState === 'SPINNING') && (
                 <div className="max-h-[40vh] aspect-square flex items-center justify-center overflow-hidden">
                   <Wheel 
                     onSpinStart={handleSpinStart}
                     onSpinComplete={handleSpinComplete}
                     isSpinning={state.turnState === 'SPINNING'}
                     seed={state.seed}
                   />
                 </div>
              )}

              {state.turnState === 'IDLE' && (
                 <div className="flex gap-4 my-2">
                   <button 
                     onClick={() => setShowSolveModal(true)}
                     className="px-4 py-2 bg-blue-600 rounded-lg font-bold shadow-md hover:bg-blue-500"
                   >
                     SOLVE
                   </button>
                   <button 
                     onClick={() => showToast(`Vowels cost $${vowelCost}`, 'info')}
                     disabled={!vowelsLeft}
                     className="px-4 py-2 bg-purple-600 rounded-lg font-bold shadow-md hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                   >
                     {vowelsLeft ? `BUY VOWEL ($${vowelCost})` : 'NO MORE VOWELS'}
                   </button>
                 </div>
              )}

              <div className="h-6 mb-1 font-bold text-yellow-300 text-sm sm:text-base px-4 text-center">
                {state.turnState === 'SPINNING' && "SPINNING..."}
                {state.turnState === 'GUESSING_CONSONANT' && `SPUN $${state.spinResult}! GUESS A CONSONANT`}
                {state.turnState === 'IDLE' && "SPIN, SOLVE, OR BUY VOWEL"}
              </div>
              
              {!hideKeyboard && (
                <div className="w-full flex-shrink-0 overflow-y-auto pb-2">
                  <Keyboard 
                    guessedLetters={state.guessedLetters}
                    onGuess={handleGuess}
                    disabled={state.turnState !== 'GUESSING_CONSONANT'}
                    consonantsOnly={state.turnState === 'GUESSING_CONSONANT'}
                    vowelsOnly={false} 
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
                  <h3 className="font-bold mb-2">Import Pack</h3>
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded cursor-pointer hover:bg-slate-600 transition-colors">
                    <Upload size={16} />
                    <span>Select JSON File</span>
                    <input type="file" accept=".json" onChange={handleImportPack} className="hidden" />
                  </label>
                  <p className="text-xs text-slate-500 mt-2">
                    Active Pack: {activePack.length} puzzles loaded.
                  </p>
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
    </div>
  );
}

export default App;
