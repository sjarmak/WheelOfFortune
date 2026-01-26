/**
 * Kid Mode App Component
 *
 * Complete Kid Mode experience for iOS.
 */

import React, { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  Settings,
  Star,
  DollarSign,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react-native';

import { GradientBackground } from './GradientBackground';
import { InteractiveBoard } from './InteractiveBoard';
import { Keyboard } from './Keyboard';
import { KidWheel } from './KidWheel';
import { KidModeHUD } from './KidModeHUD';
import { KidOutcomeCard } from './KidOutcomeCard';
import { LetterSuggestions } from './LetterSuggestions';
import { StarCollection } from './StarCollection';
import { TreasureShop } from './TreasureShop';
import { Vanna } from './Vanna';

import {
  kidGameReducer,
  INITIAL_KID_GAME_STATE,
  getKidBankBalance,
} from '../engine/kidGame';
import { KidModeSettings, DEFAULT_KID_SETTINGS, KidWedgeOutcome } from '../engine/kidTypes';
import { PuzzlePack, ALL_PACKS, getPackById } from '../engine/packs';
import { speakCelebration, isTTSAvailable, cancelSpeech, initTTS } from '../engine/tts';
import { loadState, saveState, STORAGE_KEYS } from '../services/storage';
import { colors, typography, spacing, borderRadius, shadows, layout } from '../styles/theme';

interface KidModeAppProps {
  onModeChange?: () => void;
}

export function KidModeApp({ onModeChange }: KidModeAppProps): React.JSX.Element {
  // Loading state for initial data
  const [isLoading, setIsLoading] = useState(true);

  // Game state
  const [state, dispatch] = useReducer(kidGameReducer, INITIAL_KID_GAME_STATE);

  // Settings
  const [settings, setSettings] = useState<KidModeSettings>(DEFAULT_KID_SETTINGS);

  // UI state
  const [activePack, setActivePack] = useState<PuzzlePack>(
    getPackById('kid-pack') || ALL_PACKS[0]
  );
  const [showStarCollection, setShowStarCollection] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Derived state
  const kidBankBalance = getKidBankBalance(state);
  const formattedKidBank = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(kidBankBalance),
    [kidBankBalance]
  );

  const { equippedWheelTheme, equippedDressColor, equippedHairColor, ownedItems } =
    state.kidState.treasure;

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedState = await loadState(STORAGE_KEYS.KID_STATE, null);
        const savedSettings = await loadState(STORAGE_KEYS.KID_SETTINGS, DEFAULT_KID_SETTINGS);

        if (savedState) {
          // Restore state by dispatching a hydrate action
          dispatch({ type: 'KID_HYDRATE_STATE', state: savedState });
        }

        setSettings(savedSettings);
        setIsLoading(false);

        // Initialize TTS
        initTTS();
      } catch (error) {
        console.warn('Error loading saved state:', error);
        setIsLoading(false);
      }
    };

    loadSavedState();

    return () => cancelSpeech();
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!isLoading) {
      saveState(STORAGE_KEYS.KID_STATE, state);
    }
  }, [state, isLoading]);

  // Persist settings changes
  useEffect(() => {
    if (!isLoading) {
      saveState(STORAGE_KEYS.KID_SETTINGS, settings);
    }
  }, [settings, isLoading]);

  // Start next round
  const nextRound = useCallback(() => {
    const puzzles = activePack.puzzles.filter((p) => {
      const letterCount = p.phrase.replace(/[^A-Z]/gi, '').length;
      const words = p.phrase.split(' ');
      const maxWordLen = Math.max(...words.map((w) => w.replace(/[^A-Z]/gi, '').length));

      return letterCount <= settings.maxLetters && maxWordLen <= settings.maxWordLength;
    });

    if (puzzles.length === 0) {
      const next = activePack.puzzles[Math.floor(Math.random() * activePack.puzzles.length)];
      dispatch({ type: 'KID_START_ROUND', puzzle: next });
    } else {
      const next = puzzles[Math.floor(Math.random() * puzzles.length)];
      dispatch({ type: 'KID_START_ROUND', puzzle: next });
    }
  }, [activePack, settings.maxLetters, settings.maxWordLength]);

  // Load initial puzzle
  useEffect(() => {
    if (!isLoading && !state.currentPuzzle) {
      nextRound();
    }
  }, [isLoading, state.currentPuzzle, nextRound]);

  // Handle spin
  const handleSpinStart = () => {
    dispatch({ type: 'KID_SPIN_WHEEL' });
  };

  const handleSpinComplete = (outcome: KidWedgeOutcome) => {
    dispatch({ type: 'KID_SPIN_RESULT', outcome });
  };

  // Handle letter guess
  const handleGuess = (letter: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'KID_GUESS_LETTER', letter });
  };

  // Handle outcome dismiss
  const handleDismissOutcome = () => {
    dispatch({ type: 'KID_DISMISS_OUTCOME' });
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
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (settings.readAloud && isTTSAvailable()) {
        speakCelebration(state.kidState.starsThisRound);
      }

      showToast(`⭐ You earned ${state.kidState.starsThisRound} stars! ⭐`);

      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [state.turnState, state.kidState.starsThisRound, settings.readAloud]);

  // Handle shop purchase
  const handleBuyItem = (itemId: string) => {
    dispatch({ type: 'KID_BUY_ITEM', itemId });
    showToast('🎉 You bought a new treasure!');
  };

  // Determine what UI to show based on turn state
  const canSpin = state.turnState === 'IDLE';
  const isSpinning = state.turnState === 'SPINNING';
  const showOutcome = state.turnState === 'SHOWING_OUTCOME' && state.kidState.lastOutcome;
  const canGuess =
    state.turnState === 'GUESSING_LETTER' ||
    state.turnState === 'PICKING_VOWEL' ||
    state.turnState === 'PICKING_CONSONANT';
  const showSuggestions =
    state.turnState === 'CHOOSING_LETTER' && state.kidState.letterSuggestions.length > 0;
  const isRoundOver = state.turnState === 'ROUND_OVER';
  const isVowelPhase = state.turnState === 'PICKING_VOWEL';

  // Loading screen
  if (isLoading || !state.currentPuzzle) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>WHEEL FUN!</Text>

          <View style={styles.headerRight}>
            {/* Stars/Bank button */}
            <TouchableOpacity
              onPress={() => setShowStarCollection(true)}
              style={styles.bankButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.yellow[500], colors.orange[500]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bankButtonGradient}
              >
                <DollarSign size={14} color={colors.white} />
                <Text style={styles.bankText}>{formattedKidBank}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Shop button */}
            <TouchableOpacity
              onPress={() => setShowShop(true)}
              style={styles.iconButton}
              activeOpacity={0.8}
            >
              <ShoppingBag size={18} color={colors.green[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Toast message */}
        {message && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{message}</Text>
          </View>
        )}

        {/* Main content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* HUD with speak buttons */}
          <KidModeHUD
            category={state.currentPuzzle.category}
            phrase={state.currentPuzzle.phrase}
            revealedPositions={state.revealedPositions}
            isSolved={isRoundOver}
            readAloudEnabled={settings.readAloud}
          />

          {/* Puzzle Board */}
          <View style={styles.boardSection}>
            <InteractiveBoard
              phrase={state.currentPuzzle.phrase}
              revealedPositions={state.revealedPositions}
              category={state.currentPuzzle.category}
              puzzleId={state.currentPuzzle.id}
              isPuzzleSolved={isRoundOver}
              readAloudEnabled={settings.readAloud}
              dressColorId={equippedDressColor}
              hairColorId={equippedHairColor}
            />
          </View>

          {/* Outcome Card */}
          {showOutcome && state.kidState.lastOutcome && (
            <View style={styles.outcomeSection}>
              <KidOutcomeCard
                outcome={state.kidState.lastOutcome}
                onDismiss={handleDismissOutcome}
                readAloudEnabled={settings.readAloud}
              />
            </View>
          )}

          {/* Letter Suggestions */}
          {showSuggestions && (
            <LetterSuggestions
              letters={state.kidState.letterSuggestions}
              onSelect={handleGuess}
              disabled={false}
              readAloudEnabled={settings.readAloud}
              autoSpeak
            />
          )}

          {/* Wheel and Input Area */}
          {!showOutcome && !showSuggestions && !isRoundOver && (
            <View style={styles.gameArea}>
              {/* Wheel */}
              <View style={styles.wheelContainer}>
                <KidWheel
                  onSpinStart={handleSpinStart}
                  onSpinComplete={handleSpinComplete}
                  isSpinning={isSpinning}
                  seed={state.seed + state.spinCount}
                  canSpin={canSpin}
                  wheelThemeId={equippedWheelTheme}
                />
              </View>

              {/* Keyboard for guessing */}
              {canGuess && (
                <View style={styles.keyboardSection}>
                  <Keyboard
                    guessedLetters={state.guessedLetters}
                    onGuess={handleGuess}
                    disabled={!canGuess}
                    vowelsOnly={isVowelPhase}
                    highlightVowels={isVowelPhase}
                  />
                </View>
              )}
            </View>
          )}

          {/* Round Over - Next Puzzle Button */}
          {isRoundOver && (
            <View style={styles.roundOverSection}>
              <View style={styles.vannaContainer}>
                <Vanna
                  isPuzzleSolved={true}
                  dressColorId={equippedDressColor}
                  hairColorId={equippedHairColor}
                />
              </View>
              <TouchableOpacity onPress={nextRound} activeOpacity={0.8}>
                <LinearGradient
                  colors={[colors.green[500], colors.green[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButton}
                >
                  <RotateCcw size={20} color={colors.white} />
                  <Text style={styles.nextButtonText}>Next Puzzle!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Confetti */}
        {showConfetti && (
          <ConfettiCannon
            count={100}
            origin={{ x: layout.screenWidth / 2, y: 0 }}
            fadeOut
            colors={['#FFD700', '#FF69B4', '#00CED1', '#98FB98']}
          />
        )}

        {/* Modals */}
        <StarCollection
          totalStars={state.kidState.stars}
          visible={showStarCollection}
          onClose={() => setShowStarCollection(false)}
        />

        <TreasureShop
          balance={kidBankBalance}
          ownedItems={ownedItems}
          onBuy={handleBuyItem}
          visible={showShop}
          onClose={() => setShowShop(false)}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    marginTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.yellow[300],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  bankButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.md,
  },
  bankButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  bankText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  iconButton: {
    padding: spacing[1],
  },
  toast: {
    position: 'absolute',
    top: 80,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
    zIndex: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  toastText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    fontSize: typography.sizes.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[2],
    paddingBottom: spacing[8],
  },
  boardSection: {
    marginBottom: spacing[3],
  },
  outcomeSection: {
    marginVertical: spacing[4],
  },
  gameArea: {
    gap: spacing[4],
  },
  wheelContainer: {
    width: '80%',
    alignSelf: 'center',
    maxWidth: 300,
  },
  keyboardSection: {
    marginTop: spacing[2],
  },
  roundOverSection: {
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
  },
  vannaContainer: {
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[3],
    borderRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  nextButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
  },
});
