/**
 * Standard Mode App Component
 *
 * Full wheel of fortune experience for adults.
 */

import React, {
  useReducer,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Settings,
  RotateCcw,
  X,
  ChevronLeft,
  Play,
  BookOpen,
  BarChart3,
} from "lucide-react-native";
import ConfettiCannon from "react-native-confetti-cannon";

import { Vanna } from "./Vanna";
import { gameReducer, INITIAL_STATE } from "../engine/game";
import { Puzzle, VOWELS, WheelWedge } from "../engine/types";
import { ALL_PACKS, PuzzlePack } from "../engine/packs";
import { DEFAULT_PUZZLES } from "../engine/defaultPack";
import { InteractiveBoard } from "./InteractiveBoard";
import { StandardWheel } from "./StandardWheel";
import { Keyboard } from "./Keyboard";
import { Modal } from "./Modal";
import { PackBrowser } from "./PackBrowser";
import { StrategyDashboard } from "./StrategyDashboard";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
} from "../styles/theme";

const STORAGE_KEY = "wof_standard_state";
const VOWEL_COST = 250;

type ActiveScreen = "home" | "game" | "packBrowser" | "strategy";

interface StandardModeAppProps {
  onModeChange?: () => void;
}

export function StandardModeApp({
  onModeChange,
}: StandardModeAppProps): React.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [activePack, setActivePack] = useState<PuzzlePack>(() => {
    if (ALL_PACKS && ALL_PACKS.length > 0) {
      return ALL_PACKS[0];
    }
    return {
      id: "default",
      name: "Default Pack",
      description: "Default puzzle pack",
      source: "default",
      puzzleCount: DEFAULT_PUZZLES.length,
      categories: [],
      difficultyRange: [0, 1],
      puzzles: DEFAULT_PUZZLES,
    };
  });

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("home");
  const [showSettings, setShowSettings] = useState(false);
  const [showPackBrowserModal, setShowPackBrowserModal] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [solveInput, setSolveInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const solveInputRef = useRef<TextInput>(null);
  const confettiRef = useRef<ConfettiCannon>(null);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [hideGuessedLetters, setHideGuessedLetters] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationReady, setCelebrationReady] = useState(false);
  const prevTurnStateRef = useRef(state.turnState);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Trigger confetti + Vanna + toast on successful puzzle solve
  useEffect(() => {
    const wasNotRoundOver = prevTurnStateRef.current !== "ROUND_OVER";
    const isNowRoundOver = state.turnState === "ROUND_OVER";

    if (wasNotRoundOver && isNowRoundOver) {
      setShowCelebration(true);
      setCelebrationReady(false);
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Allow Next Round after 3 seconds
      celebrationTimerRef.current = setTimeout(() => {
        setCelebrationReady(true);
      }, 3000);
    }

    if (!isNowRoundOver) {
      setShowCelebration(false);
      setCelebrationReady(false);
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
    }

    prevTurnStateRef.current = state.turnState;
  }, [state.turnState]);

  // Focus the solve input after modal animation completes
  useEffect(() => {
    if (showSolveModal) {
      const timer = setTimeout(() => {
        solveInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showSolveModal]);

  // Load saved state
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Would need to restore state here - simplified for now
        } catch {}
      }
    });
  }, []);

  // Save state
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Computed values
  const puzzleVowels = useMemo(() => {
    if (!state.currentPuzzle) return [];
    return [
      ...new Set(
        state.currentPuzzle.phrase.toUpperCase().match(/[AEIOU]/g) || [],
      ),
    ];
  }, [state.currentPuzzle]);

  const puzzleConsonants = useMemo(() => {
    if (!state.currentPuzzle) return [];
    return [
      ...new Set(
        state.currentPuzzle.phrase
          .toUpperCase()
          .match(/[BCDFGHJKLMNPQRSTVWXYZ]/g) || [],
      ),
    ];
  }, [state.currentPuzzle]);

  const vowelsLeft = useMemo(() => {
    return puzzleVowels.some((v) => !state.guessedLetters.includes(v));
  }, [puzzleVowels, state.guessedLetters]);

  const consonantsLeft = useMemo(() => {
    return puzzleConsonants.some((c) => !state.guessedLetters.includes(c));
  }, [puzzleConsonants, state.guessedLetters]);

  const canBuyVowel =
    vowelsLeft &&
    (state.player.currentRoundScore >= VOWEL_COST || state.player.freePlay);

  // Toast message
  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  // Start new round — advances sequentially through the active pack
  const nextRound = useCallback(() => {
    setShowCelebration(false);
    setCelebrationReady(false);
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = null;
    }
    const puzzles = activePack.puzzles;
    const nextIndex = puzzleIndex >= puzzles.length - 1 ? 0 : puzzleIndex + 1;
    const next = puzzles[nextIndex];
    setPuzzleIndex(nextIndex);
    dispatch({ type: "START_ROUND", puzzle: next });
  }, [activePack, puzzleIndex]);

  // Load puzzle on mount — start at first puzzle in pack
  useEffect(() => {
    if (!state.currentPuzzle) {
      const first = activePack.puzzles[0];
      if (first) {
        setPuzzleIndex(0);
        dispatch({ type: "START_ROUND", puzzle: first });
      }
    }
  }, []);

  // Handlers
  const handleSpinStart = useCallback(() => {
    dispatch({ type: "SPIN_WHEEL" });
  }, []);

  const handleSpinComplete = useCallback(
    (wedge: WheelWedge) => {
      dispatch({ type: "SPIN_RESULT", wedge });

      if (wedge.type === "BANKRUPT") {
        showToast("BANKRUPT! 💸");
      } else if (wedge.type === "LOSE_TURN") {
        showToast("LOSE A TURN!");
      } else if (wedge.type === "FREE_PLAY") {
        showToast("FREE PLAY! 🎉");
      }
    },
    [showToast],
  );

  const handleGuess = useCallback(
    (letter: string) => {
      const isVowel = VOWELS.includes(letter);
      const cost = isVowel ? VOWEL_COST : 0;

      dispatch({ type: "GUESS_LETTER", letter, cost });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Check if letter was in puzzle
      const upper = letter.toUpperCase();
      const inPuzzle = state.currentPuzzle?.phrase
        .toUpperCase()
        .includes(upper);

      if (!inPuzzle) {
        showToast(`No ${upper}!`);
      }
    },
    [state.currentPuzzle, showToast],
  );

  const handleBuyVowel = useCallback(() => {
    if (!canBuyVowel) {
      showToast("Not enough money!");
      return;
    }
    dispatch({ type: "BUY_VOWEL" });
  }, [canBuyVowel, showToast]);

  const handleSolve = useCallback(() => {
    dispatch({ type: "SOLVE_ATTEMPT", phrase: solveInput });

    const correct =
      solveInput.toUpperCase() === state.currentPuzzle?.phrase.toUpperCase();
    if (!correct) {
      showToast("Wrong! Try again.");
    }

    setShowSolveModal(false);
    setSolveInput("");
  }, [solveInput, state.currentPuzzle, showToast]);

  const handleSelectPuzzle = useCallback((puzzle: Puzzle, pack: PuzzlePack) => {
    setActivePack(pack);
    const idx = pack.puzzles.findIndex((p) => p.id === puzzle.id);
    setPuzzleIndex(idx >= 0 ? idx : 0);
    dispatch({ type: "SELECT_PUZZLE", puzzle });
    setActiveScreen("game");
    setShowPackBrowserModal(false);
  }, []);

  const isRoundOver = state.turnState === "ROUND_OVER";
  const canSpin = state.turnState === "IDLE" && !isRoundOver;
  const canGuess =
    state.turnState === "GUESSING_CONSONANT" ||
    state.turnState === "BUYING_VOWEL";

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[colors.slate[900], "#1a1a2e", colors.slate[800]]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          {activeScreen !== "home" ? (
            <TouchableOpacity
              onPress={() => setActiveScreen("home")}
              style={styles.iconButton}
            >
              <ChevronLeft size={24} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onModeChange} style={styles.iconButton}>
              <Text style={styles.modeText}>WHEEL PRACTICE</Text>
            </TouchableOpacity>
          )}

          {activeScreen !== "home" && (
            <TouchableOpacity
              onPress={() => setActiveScreen("home")}
              style={styles.headerTitleButton}
            >
              <Text style={styles.headerTitle}>WHEEL PRACTICE</Text>
            </TouchableOpacity>
          )}

          {activeScreen === "game" ? (
            <>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>ROUND</Text>
                <Text style={styles.scoreValue}>
                  ${state.player.currentRoundScore}
                </Text>
              </View>

              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>
                  ${state.player.totalScore}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                style={styles.iconButton}
              >
                <Settings size={24} color={colors.white} />
              </TouchableOpacity>
            </>
          ) : activeScreen !== "home" ? (
            <View style={styles.headerSpacer} />
          ) : (
            <>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>
                  ${state.player.totalScore}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                style={styles.iconButton}
              >
                <Settings size={24} color={colors.white} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Toast */}
        {message && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{message}</Text>
          </View>
        )}

        {/* Main Content */}
        {activeScreen === "home" && (
          <View style={styles.homeContainer}>
            <Text style={styles.homeTitle}>WHEEL PRACTICE</Text>
            <Text style={styles.homeSubtitle}>Choose an activity</Text>

            <View style={styles.navCards}>
              <TouchableOpacity
                style={styles.navCard}
                onPress={() => setActiveScreen("game")}
              >
                <LinearGradient
                  colors={[colors.green[500], colors.green[600]]}
                  style={styles.navCardGradient}
                >
                  <Play size={40} color={colors.white} />
                  <Text style={styles.navCardTitle}>Play</Text>
                  <Text style={styles.navCardDesc}>
                    Spin the wheel and solve puzzles
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => setActiveScreen("packBrowser")}
              >
                <LinearGradient
                  colors={[colors.blue[500], colors.blue[600]]}
                  style={styles.navCardGradient}
                >
                  <BookOpen size={40} color={colors.white} />
                  <Text style={styles.navCardTitle}>Puzzle Packs</Text>
                  <Text style={styles.navCardDesc}>
                    Browse and select puzzle packs
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => setActiveScreen("strategy")}
              >
                <LinearGradient
                  colors={[colors.purple[500], colors.purple[600]]}
                  style={styles.navCardGradient}
                >
                  <BarChart3 size={40} color={colors.white} />
                  <Text style={styles.navCardTitle}>Strategy</Text>
                  <Text style={styles.navCardDesc}>
                    Analyze letter frequencies and patterns
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeScreen === "game" && (
          <View style={styles.gameScreenContainer}>
            {/* Active Pack Indicator */}
            <View style={styles.packIndicator}>
              <BookOpen size={12} color={colors.slate[400]} />
              <Text style={styles.packIndicatorText} numberOfLines={1}>
                {activePack.name}
              </Text>
              {puzzleIndex >= 0 && (
                <Text style={styles.packIndicatorCount}>
                  {puzzleIndex + 1}/{activePack.puzzles.length}
                </Text>
              )}
            </View>

            {/* Puzzle Board */}
            {state.currentPuzzle && (
              <InteractiveBoard
                phrase={state.currentPuzzle.phrase}
                revealedPositions={state.revealedPositions}
                category={state.currentPuzzle.category}
                puzzleId={state.currentPuzzle.id}
                isPuzzleSolved={isRoundOver}
                readAloudEnabled={false}
              />
            )}

            {/* Round Over — Celebration Sequence */}
            {isRoundOver ? (
              <View style={styles.roundOverSection}>
                <Text style={styles.solvedText}>PUZZLE SOLVED!</Text>
                <Text style={styles.winningsText}>
                  Won: ${state.player.currentRoundScore}
                </Text>
                {celebrationReady && (
                  <TouchableOpacity onPress={nextRound}>
                    <LinearGradient
                      colors={[colors.green[500], colors.green[600]]}
                      style={styles.nextButton}
                    >
                      <RotateCcw size={20} color={colors.white} />
                      <Text style={styles.nextButtonText}>Next Puzzle</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.gameArea}>
                {/* Wheel */}
                {!isRoundOver && (
                  <View style={styles.wheelContainer}>
                    <StandardWheel
                      onSpinStart={handleSpinStart}
                      onSpinComplete={handleSpinComplete}
                      isSpinning={state.turnState === "SPINNING"}
                      seed={state.seed + state.spinCount}
                      canSpin={state.turnState === "IDLE"}
                    />
                  </View>
                )}

                {/* Action Buttons */}
                {state.turnState === "IDLE" && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => setShowSolveModal(true)}>
                      <LinearGradient
                        colors={[colors.blue[500], colors.blue[600]]}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionButtonText}>SOLVE</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleBuyVowel}
                      disabled={!canBuyVowel}
                    >
                      <LinearGradient
                        colors={
                          canBuyVowel
                            ? [colors.purple[500], colors.purple[600]]
                            : [colors.slate[600], colors.slate[700]]
                        }
                        style={styles.actionButton}
                      >
                        <Text
                          style={[
                            styles.actionButtonText,
                            !canBuyVowel && styles.disabledText,
                          ]}
                        >
                          {vowelsLeft ? `VOWEL $${VOWEL_COST}` : "NO VOWELS"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Status */}
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>
                    {state.turnState === "SPINNING" && "SPINNING..."}
                    {state.turnState === "GUESSING_CONSONANT" &&
                      `GUESS A CONSONANT ($${state.spinResult})`}
                    {state.turnState === "BUYING_VOWEL" &&
                      `SELECT A VOWEL ($${VOWEL_COST})`}
                    {state.turnState === "IDLE" && "SPIN THE WHEEL"}
                  </Text>
                </View>

                {/* Keyboard */}
                {canGuess && (
                  <View style={styles.keyboardSection}>
                    <Keyboard
                      guessedLetters={state.guessedLetters}
                      onGuess={handleGuess}
                      onAlreadyCalled={(letter) =>
                        showToast(`${letter} — Already called!`)
                      }
                      disabled={!canGuess}
                      vowelsOnly={state.turnState === "BUYING_VOWEL"}
                      consonantsOnly={state.turnState === "GUESSING_CONSONANT"}
                      hideGuessedLetters={hideGuessedLetters}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeScreen === "packBrowser" && (
          <PackBrowser
            packs={ALL_PACKS}
            activePackId={activePack.id}
            onSelectPack={(pack) => {
              setActivePack(pack);
              setPuzzleIndex(-1);
              setActiveScreen("game");
              const first = pack.puzzles[0];
              if (first) {
                setPuzzleIndex(0);
                dispatch({ type: "START_ROUND", puzzle: first });
              }
            }}
            onSelectPuzzle={handleSelectPuzzle}
          />
        )}

        {activeScreen === "strategy" && (
          <StrategyDashboard puzzles={activePack.puzzles} />
        )}

        {/* Solve Modal */}
        <Modal
          visible={showSolveModal}
          onClose={() => setShowSolveModal(false)}
          title="Solve the Puzzle"
        >
          <TextInput
            ref={solveInputRef}
            style={styles.solveInput}
            value={solveInput}
            onChangeText={setSolveInput}
            placeholder="Type your answer..."
            placeholderTextColor={colors.slate[400]}
            autoCapitalize="characters"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={() => setShowSolveModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSolve}>
              <LinearGradient
                colors={[colors.blue[500], colors.blue[600]]}
                style={styles.solveButton}
              >
                <Text style={styles.solveButtonText}>SOLVE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Pack Browser Modal */}
        <Modal
          visible={showPackBrowserModal}
          onClose={() => setShowPackBrowserModal(false)}
          title="Browse Puzzles"
          maxHeight="85%"
        >
          <PackBrowser
            packs={ALL_PACKS}
            activePackId={activePack.id}
            onSelectPack={(pack) => {
              setActivePack(pack);
              setPuzzleIndex(-1);
              setActiveScreen("game");
              setShowPackBrowserModal(false);
              const first = pack.puzzles[0];
              if (first) {
                setPuzzleIndex(0);
                dispatch({ type: "START_ROUND", puzzle: first });
              }
            }}
            onSelectPuzzle={handleSelectPuzzle}
            asModal
          />
        </Modal>

        {/* Celebration Overlays — Confetti + Vanna */}
        {showCelebration && (
          <View style={styles.confettiContainer} pointerEvents="none">
            <ConfettiCannon
              ref={confettiRef}
              count={100}
              origin={{ x: Dimensions.get("window").width / 2, y: -10 }}
              fadeOut
              autoStart={false}
              fallSpeed={3000}
              explosionSpeed={350}
            />
          </View>
        )}
        {showCelebration && (
          <View style={styles.vannaOverlay} pointerEvents="none">
            <Vanna isDancing />
          </View>
        )}

        {/* Settings Modal */}
        <Modal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          title="Settings"
        >
          <View style={styles.settingsContent}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Winnings</Text>
              <Text style={styles.statValue}>${state.player.totalScore}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Rounds Played</Text>
              <Text style={styles.statValue}>{state.roundCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Pack</Text>
              <Text style={styles.statValue}>{activePack.name}</Text>
            </View>

            <View style={styles.settingsDivider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Hide Called Letters</Text>
                <Text style={styles.toggleDesc}>
                  Letters stay visible after guessing — test your memory
                </Text>
              </View>
              <Switch
                value={hideGuessedLetters}
                onValueChange={setHideGuessedLetters}
                trackColor={{
                  false: colors.slate[600],
                  true: colors.green[500],
                }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingsDivider} />

            <TouchableOpacity
              onPress={() => {
                dispatch({ type: "RESET_ROUND" });
                setShowSettings(false);
                showToast("Puzzle reset");
              }}
              style={styles.resetButton}
            >
              <RotateCcw size={16} color={colors.yellow[300]} />
              <Text style={styles.resetButtonText}>Reset Round</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                dispatch({
                  type: "RANDOM_PUZZLE",
                  puzzles: activePack.puzzles,
                });
                setShowSettings(false);
                showToast("New puzzle loaded");
              }}
              style={styles.resetButton}
            >
              <RotateCcw size={16} color={colors.yellow[300]} />
              <Text style={styles.resetButtonText}>Random Puzzle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowSettings(false);
                setShowPackBrowserModal(true);
              }}
              style={styles.browseButton}
            >
              <BookOpen size={16} color={colors.blue[400]} />
              <Text style={styles.browseButtonText}>Browse Puzzles</Text>
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity
              onPress={() => {
                dispatch({ type: "RESET_GAME" });
                setPuzzleIndex(-1);
                const first = activePack.puzzles[0];
                if (first) {
                  setPuzzleIndex(0);
                  dispatch({ type: "START_ROUND", puzzle: first });
                }
                setShowSettings(false);
              }}
              style={styles.resetAllButton}
            >
              <RotateCcw size={16} color={colors.red[400]} />
              <Text style={styles.resetAllText}>Reset All Progress</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.slate[900],
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[700],
  },
  iconButton: {
    padding: spacing[1],
  },
  modeText: {
    color: colors.yellow[400],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
    letterSpacing: 1,
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreLabel: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
  },
  scoreValue: {
    color: colors.green[400],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
  },
  totalValue: {
    color: colors.yellow[400],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
  },
  toast: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    zIndex: 50,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  toastText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  gameScreenContainer: {
    flex: 1,
    padding: spacing[3],
  },
  packIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: spacing[1],
    marginBottom: spacing[2],
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  packIndicatorText: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    flexShrink: 1,
  },
  packIndicatorCount: {
    color: colors.slate[500],
    fontSize: typography.sizes.xs,
  },
  roundOverSection: {
    alignItems: "center",
    gap: spacing[4],
    marginTop: spacing[6],
  },
  solvedText: {
    color: colors.green[400],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  winningsText: {
    color: colors.yellow[400],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius["2xl"],
    ...shadows.lg,
  },
  nextButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
  },
  gameArea: {
    flex: 1,
    gap: spacing[2],
    marginTop: spacing[2],
  },
  wheelContainer: {
    width: "95%",
    alignSelf: "center",
    maxWidth: 400,
    flexShrink: 1,
    maxHeight: 260,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[3],
  },
  actionButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  disabledText: {
    opacity: 0.5,
  },
  statusContainer: {
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  statusText: {
    color: colors.yellow[300],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  keyboardSection: {
    marginTop: "auto",
    paddingBottom: spacing[2],
  },
  solveInput: {
    backgroundColor: colors.slate[800],
    borderWidth: 1,
    borderColor: colors.slate[600],
    borderRadius: borderRadius.base,
    padding: spacing[3],
    fontSize: typography.sizes.xl,
    color: colors.white,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing[4],
    marginTop: spacing[4],
  },
  cancelButton: {
    color: colors.slate[400],
    fontWeight: typography.weights.bold,
  },
  solveButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.base,
  },
  solveButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  settingsContent: {
    gap: spacing[4],
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[700],
  },
  statLabel: {
    color: colors.slate[400],
  },
  statValue: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: "rgba(161, 98, 7, 0.3)",
    paddingVertical: spacing[3],
    borderRadius: borderRadius.base,
    marginTop: spacing[4],
  },
  resetButtonText: {
    color: colors.yellow[300],
    fontWeight: typography.weights.bold,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    paddingVertical: spacing[3],
    borderRadius: borderRadius.base,
  },
  browseButtonText: {
    color: colors.blue[400],
    fontWeight: typography.weights.bold,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  toggleDesc: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
    marginTop: spacing[0.5],
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.slate[700],
    marginVertical: spacing[2],
  },
  resetAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: "rgba(127, 29, 29, 0.3)",
    paddingVertical: spacing[3],
    borderRadius: borderRadius.base,
  },
  resetAllText: {
    color: colors.red[400],
    fontWeight: typography.weights.bold,
  },
  headerTitleButton: {
    padding: spacing[1],
  },
  headerTitle: {
    color: colors.yellow[400],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
    letterSpacing: 1,
  },
  headerSpacer: {
    flex: 1,
  },
  homeContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[8],
    alignItems: "center",
  },
  homeTitle: {
    color: colors.yellow[400],
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
    marginBottom: spacing[1],
  },
  homeSubtitle: {
    color: colors.slate[400],
    fontSize: typography.sizes.base,
    marginBottom: spacing[8],
  },
  navCards: {
    width: "100%",
    gap: spacing[4],
  },
  navCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.lg,
  },
  navCardGradient: {
    padding: spacing[5],
    alignItems: "center",
    gap: spacing[2],
  },
  navCardTitle: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  navCardDesc: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: typography.sizes.sm,
  },
  placeholderScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  placeholderDesc: {
    color: colors.slate[400],
    fontSize: typography.sizes.base,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  vannaOverlay: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    zIndex: 101,
  },
});
