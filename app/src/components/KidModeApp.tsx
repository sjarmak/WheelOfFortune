/**
 * Kid Mode App Component
 *
 * Complete Kid Mode experience with:
 * - Kid-friendly wheel
 * - Star rewards
 * - Hint system
 * - Read-aloud support
 * - Word builder solve mode
 * - Positive-only feedback
 */

import React, { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import { InteractiveBoard } from './InteractiveBoard';
import { Keyboard } from './Keyboard';
import { KidWheel } from './KidWheel';
import { KidModeHUD } from './KidModeHUD';
import { KidOutcomeCard } from './KidOutcomeCard';
import { LetterSuggestions } from './LetterSuggestions';
import { WordBuilder } from './WordBuilder';
import { StarCollection } from './StarCollection';
import { ModeIndicator } from './ModeSelector';
import { PackSelector } from './PackSelector';
import { PictureClue } from './PictureClue';
import { PhonicsHelper } from './PhonicsHelper';
import { HearWords } from './HearWords';
import { WheelLegend } from './WheelLegend';
import { TreasureShop } from './TreasureShop';
import { TreasureBox } from './TreasureBox';
import { MusicRoom } from './MusicRoom';
import { AchievementModal } from './AchievementModal';
import { PuzzlePack, ALL_PACKS, getPackById } from '../engine/packs';
import {
  kidGameReducer,
  INITIAL_KID_GAME_STATE,
  shouldShowHintNudge,
  getKidBankBalance,
  checkForNewAchievements
} from '../engine/kidGame';
import { KidModeSettings, DEFAULT_KID_SETTINGS } from '../engine/kidTypes';
import { Achievement, ShopCategory, INSTRUMENTS } from '../engine/shopTypes';
import { speakCelebration, isTTSAvailable, cancelSpeech, initTTS } from '../engine/tts';
import {
  Settings as SettingsIcon,
  RotateCcw,
  X,
  Library,
  Volume2,
  VolumeX,
  Puzzle as PuzzleIcon,
  DollarSign,
  ShoppingBag,
  Package,
  Music
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface KidModeAppProps {
  onModeChange: () => void;
}

export const KidModeApp: React.FC<KidModeAppProps> = ({ onModeChange }) => {
  // Game state
  const [state, dispatch] = useReducer(kidGameReducer, INITIAL_KID_GAME_STATE, (initial) => {
    const saved = localStorage.getItem('wof_kid_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      } catch {
        return initial;
      }
    }
    return initial;
  });

  // UI state
  const [activePack, setActivePack] = useState<PuzzlePack>(
    getPackById('kid-pack') || ALL_PACKS[0]
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showPackSelector, setShowPackSelector] = useState(false);
  const [showStarCollection, setShowStarCollection] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showTreasureBox, setShowTreasureBox] = useState(false);
  const [showMusicRoom, setShowMusicRoom] = useState(false);
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const kidBankBalance = getKidBankBalance(state);
  const formattedKidBank = useMemo(() => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(kidBankBalance), [kidBankBalance]);

  // Get equipped customizations from treasure state
  const { equippedWheelTheme, equippedDressColor, equippedHairColor, ownedItems } = state.kidState.treasure;
  const ownedInstruments = useMemo(() =>
    ownedItems.filter(id => INSTRUMENTS.some(i => i.id === id)),
    [ownedItems]
  );

  // Settings
  const [settings, setSettings] = useState<KidModeSettings>(() => {
    const saved = localStorage.getItem('wof_kid_settings');
    if (saved) {
      try {
        return { ...DEFAULT_KID_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_KID_SETTINGS;
      }
    }
    return DEFAULT_KID_SETTINGS;
  });

  // Persist game state
  useEffect(() => {
    localStorage.setItem('wof_kid_state', JSON.stringify(state));
  }, [state]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('wof_kid_settings', JSON.stringify(settings));
  }, [settings]);

  // Start next round
  const nextRound = useCallback(() => {
    const puzzles = activePack.puzzles.filter(p => {
      // Apply kid-friendly filters
      const letterCount = p.phrase.replace(/[^A-Z]/gi, '').length;
      const words = p.phrase.split(' ');
      const maxWordLen = Math.max(...words.map(w => w.replace(/[^A-Z]/gi, '').length));

      return letterCount <= settings.maxLetters && maxWordLen <= settings.maxWordLength;
    });

    if (puzzles.length === 0) {
      // Fallback to all puzzles in pack if filters too strict
      const next = activePack.puzzles[Math.floor(Math.random() * activePack.puzzles.length)];
      dispatch({ type: 'KID_START_ROUND', puzzle: next });
    } else {
      const next = puzzles[Math.floor(Math.random() * puzzles.length)];
      dispatch({ type: 'KID_START_ROUND', puzzle: next });
    }
  }, [activePack, settings.maxLetters, settings.maxWordLength]);

  // Load initial puzzle
  useEffect(() => {
    if (!state.currentPuzzle) {
      nextRound();
    }
  }, [state.currentPuzzle, nextRound]);

  // Handle pack selection
  const selectPack = useCallback((pack: PuzzlePack) => {
    setActivePack(pack);
    setShowPackSelector(false);
    const next = pack.puzzles[Math.floor(Math.random() * pack.puzzles.length)];
    dispatch({ type: 'KID_START_ROUND', puzzle: next });
  }, []);

  // Handle spin
  const handleSpinStart = () => {
    dispatch({ type: 'KID_SPIN_WHEEL' });
  };

  const handleSpinComplete = (outcome: any) => {
    dispatch({ type: 'KID_SPIN_RESULT', outcome });
  };

  // Handle letter guess
  const handleGuess = (letter: string) => {
    dispatch({ type: 'KID_GUESS_LETTER', letter });
  };

  // Handle hint
  const handleUseHint = () => {
    dispatch({ type: 'KID_USE_HINT' });
  };

  // Handle outcome dismiss
  const handleDismissOutcome = () => {
    dispatch({ type: 'KID_DISMISS_OUTCOME' });
  };

  // Handle word builder
  const handleEnterWordBuilder = () => {
    dispatch({ type: 'KID_ENTER_WORD_BUILDER' });
  };

  const handleExitWordBuilder = () => {
    dispatch({ type: 'KID_EXIT_WORD_BUILDER' });
  };

  // Toast messages
  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // Handle round over
  useEffect(() => {
    if (state.turnState === 'ROUND_OVER') {
      // Celebrate!
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF69B4', '#00CED1', '#98FB98']
      });

      if (settings.readAloud && isTTSAvailable()) {
        speakCelebration(state.kidState.starsThisRound);
      }

      showToast(`⭐ You earned ${state.kidState.starsThisRound} stars! ⭐`);

      // Check for new achievements after round ends
      const newAchievements = checkForNewAchievements(state);
      if (newAchievements.length > 0 && !pendingAchievement) {
        // Show achievement modal after a brief delay for stars toast
        setTimeout(() => {
          setPendingAchievement(newAchievements[0]);
        }, 2000);
      }
    }
  }, [state.turnState, state.kidState.starsThisRound, settings.readAloud, pendingAchievement]);

  // Initialize TTS on mount, cleanup on unmount
  useEffect(() => {
    initTTS();
    return () => cancelSpeech();
  }, []);

  // Handlers for shop/treasure actions
  const handleBuyItem = (itemId: string) => {
    dispatch({ type: 'KID_BUY_ITEM', itemId });
    showToast('🎉 You bought a new treasure!');
  };

  const handleEquipItem = (itemId: string, category: ShopCategory) => {
    dispatch({ type: 'KID_EQUIP_ITEM', itemId, category });
  };

  const handleUnequipItem = (category: ShopCategory) => {
    dispatch({ type: 'KID_UNEQUIP_ITEM', category });
  };

  const handleClaimAchievement = () => {
    if (pendingAchievement) {
      dispatch({
        type: 'KID_CLAIM_ACHIEVEMENT',
        achievementId: pendingAchievement.id,
        rewardItemIds: pendingAchievement.rewardItemIds
      });
    }
  };

  const handleCloseAchievement = () => {
    setPendingAchievement(null);
    // Check for more achievements
    const newAchievements = checkForNewAchievements(state);
    if (newAchievements.length > 0) {
      setTimeout(() => {
        setPendingAchievement(newAchievements[0]);
      }, 500);
    }
  };

  // Check if should show hint nudge
  const showNudge = shouldShowHintNudge(state, settings.showNudgeAfterActions);

  // Filter packs appropriate for kids
  const kidFriendlyPacks = useMemo(() => {
    return ALL_PACKS.filter(p =>
      p.id === 'kid-pack' ||
      p.id === 'original' ||
      p.id.includes('easy') ||
      p.id === 'quick-10' ||
      p.id === 'quick-25'
    );
  }, []);

  if (!state.currentPuzzle) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 flex flex-col text-white pb-safe overflow-hidden">
      {/* Header */}
      <header className="py-2 px-3 flex justify-between items-center bg-black/30 shadow-lg z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-pink-300">
            WHEEL FUN!
          </h1>
          <ModeIndicator mode="KID" onClick={onModeChange} />
        </div>

        <div className="flex gap-1 sm:gap-2 items-center">
          {/* Stars/Bank button */}
          <button
            onClick={() => setShowStarCollection(true)}
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label="View kid bank and star collection"
          >
            <DollarSign className="w-4 h-4 text-white" />
            <div className="flex flex-col leading-tight text-left">
              <span className="text-[0.55rem] uppercase tracking-widest text-white/80">Kid Bank</span>
              <span className="text-sm font-bold text-white">{formattedKidBank}</span>
            </div>
          </button>

          {/* Shop button */}
          <button
            onClick={() => setShowShop(true)}
            className="p-2 hover:bg-white/10 rounded-full"
            title="Shop"
            aria-label="Open shop"
          >
            <ShoppingBag size={20} className="text-green-400" />
          </button>

          {/* Treasure Box button */}
          <button
            onClick={() => setShowTreasureBox(true)}
            className="p-2 hover:bg-white/10 rounded-full relative"
            title="Treasure Box"
            aria-label="View treasure box"
          >
            <Package size={20} className="text-amber-400" />
            {ownedItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[0.6rem] w-4 h-4 rounded-full flex items-center justify-center">
                {ownedItems.length}
              </span>
            )}
          </button>

          {/* Music Room button */}
          {ownedInstruments.length > 0 && (
            <button
              onClick={() => setShowMusicRoom(true)}
              className="p-2 hover:bg-white/10 rounded-full"
              title="Music Room"
              aria-label="Open music room"
            >
              <Music size={20} className="text-pink-400" />
            </button>
          )}

          {/* Pack selector */}
          <button
            onClick={() => setShowPackSelector(true)}
            className="p-2 hover:bg-white/10 rounded-full"
            title="Select Pack"
            aria-label="Select puzzle pack"
          >
            <Library size={20} />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/10 rounded-full"
            aria-label="Settings"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      {/* Kid Mode HUD */}
      <KidModeHUD
        kidState={state.kidState}
        category={state.currentPuzzle.category}
        phrase={state.currentPuzzle.phrase}
        revealedPositions={state.revealedPositions}
        isSolved={state.turnState === 'ROUND_OVER'}
        showNudge={showNudge}
        onUseHint={handleUseHint}
        readAloudEnabled={settings.readAloud}
      />

      <main className="flex-1 w-full px-2 sm:px-4 pb-4 overflow-y-auto relative flex flex-col items-center gap-3">
        {message && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce bg-gradient-to-r from-yellow-400 to-pink-500 text-white px-6 py-2 rounded-full font-bold shadow-xl text-base">
            {message}
          </div>
        )}

        <div className="w-full max-w-5xl flex flex-col gap-3">
          {/* Hear Words - easy tap to hear */}
          <HearWords
            phrase={state.currentPuzzle.phrase}
            revealedPositions={state.revealedPositions}
            readAloudEnabled={settings.readAloud}
          />

          <div className="bg-black/10 rounded-3xl p-2">
            <InteractiveBoard
              phrase={state.currentPuzzle.phrase}
              revealedPositions={state.revealedPositions}
              category={state.currentPuzzle.category}
              puzzleId={state.currentPuzzle.id}
              isPuzzleSolved={state.turnState === 'ROUND_OVER'}
              readAloudEnabled={settings.readAloud}
              dressColorId={equippedDressColor}
              hairColorId={equippedHairColor}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="flex-1 bg-black/20 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-xl">
              {state.turnState === 'ROUND_OVER' ? (
                <button
                  onClick={nextRound}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
                  aria-label="Next puzzle"
                >
                  NEXT PUZZLE
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Legend on the left (desktop) */}
                  <div className="hidden sm:block">
                    <WheelLegend readAloudEnabled={settings.readAloud} />
                  </div>

                  {/* Wheel in the center */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
                      <KidWheel
                        onSpinStart={handleSpinStart}
                        onSpinComplete={handleSpinComplete}
                        isSpinning={state.turnState === 'SPINNING'}
                        seed={state.seed + state.spinCount}
                        canSpin={state.turnState === 'IDLE'}
                        wheelThemeId={equippedWheelTheme}
                      />
                    </div>
                    <div className="font-bold text-yellow-200 text-base text-center min-h-[1.75rem]">
                      {state.turnState === 'SPINNING' && '🎡 Spinning...'}
                      {state.turnState === 'IDLE' && 'Tap the wheel to spin!'}
                      {state.turnState === 'CHOOSING_LETTER' && '🎯 Pick one of the 3 letters!'}
                      {state.turnState === 'GUESSING_LETTER' && (
                        state.kidState.guessesRemaining > 1
                          ? `🔤 Guess ${state.kidState.guessesRemaining} letters!`
                          : '🔤 Guess a letter!'
                      )}
                      {state.turnState === 'PICKING_VOWEL' && '🌟 Pick a VOWEL (yellow)!'}
                      {state.turnState === 'PICKING_CONSONANT' && '🌟 Now pick any other letter!'}
                    </div>
                  </div>

                  {/* Legend below wheel (mobile - horizontal) */}
                  <div className="sm:hidden">
                    <WheelLegend readAloudEnabled={settings.readAloud} horizontal />
                  </div>
                </div>
              )}
            </div>

            <aside className="w-full lg:w-80 flex flex-col gap-3">
              <PictureClue
                phrase={state.currentPuzzle.phrase}
                category={state.currentPuzzle.category}
              />

              {state.turnState === 'CHOOSING_LETTER' && (
                <LetterSuggestions
                  letters={state.kidState.letterSuggestions}
                  onSelect={handleGuess}
                  title="Pick one of these 3!"
                  readAloudEnabled={settings.readAloud}
                  autoSpeak={true}
                />
              )}

              {(state.turnState === 'IDLE' || state.turnState === 'ROUND_OVER') && (
                <button
                  onClick={handleEnterWordBuilder}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-transform flex items-center gap-2 justify-center"
                  aria-label="Solve puzzle"
                >
                  <PuzzleIcon className="w-4 h-4" />
                  SOLVE IT
                </button>
              )}

              <PhonicsHelper
                phrase={state.currentPuzzle.phrase}
                readAloudEnabled={settings.readAloud}
              />
            </aside>
          </div>
        </div>

        {/* Always show keyboard except during spinning, showing outcome, word builder, or round over */}
        {!['SPINNING', 'SHOWING_OUTCOME', 'WORD_BUILDER', 'ROUND_OVER'].includes(state.turnState) && (
          <div className={`w-full max-w-4xl rounded-3xl p-3 ${
            state.turnState === 'GUESSING_LETTER'
              ? 'bg-green-500/30 ring-4 ring-green-400'
              : state.turnState === 'PICKING_VOWEL'
                ? 'bg-yellow-500/30 ring-4 ring-yellow-400'
                : state.turnState === 'PICKING_CONSONANT'
                  ? 'bg-blue-500/30 ring-4 ring-blue-400'
                  : 'bg-black/30'
          }`}>
            {state.turnState === 'GUESSING_LETTER' && state.kidState.guessesRemaining > 0 && (
              <div className="text-center text-green-300 font-bold text-lg mb-2 animate-bounce">
                👆 Pick {state.kidState.guessesRemaining === 1 ? 'a letter' : `${state.kidState.guessesRemaining} letters`}!
              </div>
            )}
            {state.turnState === 'PICKING_VOWEL' && (
              <div className="text-center text-yellow-300 font-bold text-lg mb-2 animate-bounce">
                🌟 Pick a VOWEL! (A, E, I, O, U - the yellow ones!)
              </div>
            )}
            {state.turnState === 'PICKING_CONSONANT' && (
              <div className="text-center text-blue-300 font-bold text-lg mb-2 animate-bounce">
                🌟 Great! Now pick any other letter!
              </div>
            )}
            {state.turnState === 'IDLE' && (
              <div className="text-center text-white/70 text-sm mb-2">
                Spin the wheel, or guess a letter below!
              </div>
            )}
            <Keyboard
              guessedLetters={state.guessedLetters}
              onGuess={handleGuess}
              disabled={state.turnState === 'SPINNING'}
              highlightVowels={true}
              large={true}
              vowelsOnly={state.turnState === 'PICKING_VOWEL'}
              consonantsOnly={state.turnState === 'PICKING_CONSONANT'}
            />
          </div>
        )}
      </main>

      {/* Outcome Card */}
      {state.turnState === 'SHOWING_OUTCOME' && state.kidState.lastOutcome && (
        <KidOutcomeCard
          outcome={state.kidState.lastOutcome}
          onDismiss={handleDismissOutcome}
          readAloudEnabled={settings.readAloud}
        />
      )}

      {/* Word Builder */}
      {state.turnState === 'WORD_BUILDER' && (
        <WordBuilder
          phrase={state.currentPuzzle.phrase}
          currentWordIndex={state.kidState.currentBuildWord}
          inputLetters={state.kidState.wordBuilderInput}
          revealedPositions={state.revealedPositions}
          onInputLetter={(letter) => dispatch({ type: 'KID_WORD_BUILDER_INPUT', letter })}
          onClear={() => dispatch({ type: 'KID_WORD_BUILDER_CLEAR' })}
          onCheck={() => dispatch({ type: 'KID_WORD_BUILDER_CHECK' })}
          onNextWord={() => dispatch({ type: 'KID_WORD_BUILDER_NEXT_WORD' })}
          onExit={handleExitWordBuilder}
          readAloudEnabled={settings.readAloud}
        />
      )}

      {/* Star Collection */}
      {showStarCollection && (
        <StarCollection
          totalStars={state.kidState.stars + state.kidState.starsThisRound}
          onClose={() => setShowStarCollection(false)}
        />
      )}

      {/* Pack Selector */}
      {showPackSelector && (
        <PackSelector
          packs={kidFriendlyPacks}
          currentPackId={activePack.id}
          onSelectPack={selectPack}
          onClose={() => setShowPackSelector(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 text-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-600">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Kid Mode Settings</h2>
              <button onClick={() => setShowSettings(false)} aria-label="Close">
                <X />
              </button>
            </div>

            <div className="space-y-6">
              {/* Read Aloud toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Read Aloud</label>
                  <p className="text-sm text-slate-400">
                    Speak letters, outcomes, and puzzles
                  </p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, readAloud: !s.readAloud }))}
                  className={`p-3 rounded-full transition-colors ${
                    settings.readAloud
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={settings.readAloud ? 'Disable read aloud' : 'Enable read aloud'}
                >
                  {settings.readAloud ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              </div>

              {/* Max letters slider */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Max Letters: {settings.maxLetters}
                </label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={settings.maxLetters}
                  onChange={e => setSettings(s => ({ ...s, maxLetters: Number(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Puzzles with more letters will be filtered out
                </p>
              </div>

              {/* Max word length slider */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Max Word Length: {settings.maxWordLength}
                </label>
                <input
                  type="range"
                  min="4"
                  max="10"
                  value={settings.maxWordLength}
                  onChange={e => setSettings(s => ({ ...s, maxWordLength: Number(e.target.value) }))}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Words longer than this will be filtered out
                </p>
              </div>

              {/* Current pack */}
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

              {/* Reset buttons */}
              <div className="border-t border-slate-700 pt-4 space-y-2">
                <button
                  onClick={() => {
                    nextRound();
                    setShowSettings(false);
                  }}
                  className="w-full py-3 bg-yellow-700/50 text-yellow-200 rounded font-bold hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} /> New Puzzle
                </button>
                <button
                  onClick={() => {
                    dispatch({ type: 'KID_RESET_GAME' });
                    setShowSettings(false);
                  }}
                  className="w-full py-3 bg-red-900/50 text-red-200 rounded font-bold hover:bg-red-900 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} /> Reset All Stars
                </button>
              </div>

              {/* Switch to Standard Mode */}
              <div className="border-t border-slate-700 pt-4">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    onModeChange();
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-500 transition-colors"
                >
                  Switch to Standard Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Treasure Shop Modal */}
      {showShop && (
        <TreasureShop
          balance={kidBankBalance}
          ownedItems={ownedItems}
          onBuy={handleBuyItem}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* Treasure Box Modal */}
      {showTreasureBox && (
        <TreasureBox
          treasure={state.kidState.treasure}
          onEquip={handleEquipItem}
          onUnequip={handleUnequipItem}
          onOpenMusicRoom={() => {
            setShowTreasureBox(false);
            setShowMusicRoom(true);
          }}
          onClose={() => setShowTreasureBox(false)}
        />
      )}

      {/* Music Room Modal */}
      {showMusicRoom && (
        <MusicRoom
          ownedInstruments={ownedInstruments}
          onClose={() => setShowMusicRoom(false)}
        />
      )}

      {/* Achievement Modal */}
      {pendingAchievement && (
        <AchievementModal
          achievement={pendingAchievement}
          onClaim={handleClaimAchievement}
          onClose={handleCloseAchievement}
        />
      )}
    </div>
  );
};
