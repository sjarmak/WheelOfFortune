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
  ScrollView,
  Dimensions,
  AppState,
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
  Zap,
  Trophy,
  Shuffle,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import ConfettiCannon from "react-native-confetti-cannon";

import { Vanna } from "./Vanna";
import { gameReducer, INITIAL_STATE } from "../engine/game";
import {
  Puzzle,
  RoundType,
  VOWELS,
  CONSONANTS,
  WheelWedge,
} from "../engine/types";
import { ALL_PACKS, getPuzzlesForMode, PuzzlePack } from "../engine/packs";
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

const MODE_LABELS: Record<RoundType, string> = {
  MAIN: "STANDARD GAME",
  TOSSUP: "TOSS-UP",
  BONUS: "BONUS ROUND",
};

type ActiveScreen = "home" | "game" | "packBrowser" | "packSelect" | "strategy";

export function StandardModeApp(): React.JSX.Element {
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
  const [selectedRoundMode, setSelectedRoundMode] = useState<RoundType>("MAIN");
  const [showSettings, setShowSettings] = useState(false);
  const [showPackBrowserModal, setShowPackBrowserModal] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);
  const [solveInput, setSolveInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const solveInputRef = useRef<TextInput>(null);
  const confettiRef = useRef<ConfettiCannon>(null);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [hideGuessedLetters, setHideGuessedLetters] = useState(false);
  const keyboardTranslateY = useSharedValue(200);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationReady, setCelebrationReady] = useState(false);
  const prevTurnStateRef = useRef(state.turnState);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Toss-Up specific state
  const [showTossUpSolveModal, setShowTossUpSolveModal] = useState(false);
  const [tossUpSolveInput, setTossUpSolveInput] = useState("");
  const tossUpSolveInputRef = useRef<TextInput>(null);
  const tossUpTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bonus Round letter picking state
  const [bonusSelectedConsonants, setBonusSelectedConsonants] = useState<
    string[]
  >([]);
  const [bonusSelectedVowel, setBonusSelectedVowel] = useState<string | null>(
    null,
  );

  // Bonus Round solve phase state
  const [bonusSolveInput, setBonusSolveInput] = useState("");
  const bonusSolveInputRef = useRef<TextInput>(null);
  const bonusTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bonusShakeX = useSharedValue(0);
  const prevBonusTimerSecRef = useRef<number | null>(null);

  // Background/foreground timer catch-up
  const backgroundTimestampRef = useRef<number | null>(null);

  // Trigger confetti + Vanna on successful puzzle solve (or loss feedback for toss-up/bonus)
  useEffect(() => {
    const wasNotRoundOver = prevTurnStateRef.current !== "ROUND_OVER";
    const isNowRoundOver = state.turnState === "ROUND_OVER";

    if (wasNotRoundOver && isNowRoundOver) {
      const isWin = state.roundResult === "win" || state.roundResult === null;
      if (isWin) {
        setShowCelebration(true);
        setCelebrationReady(false);
        confettiRef.current?.start();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Allow Next Round after 3 seconds for wins
        celebrationTimerRef.current = setTimeout(() => {
          setCelebrationReady(true);
        }, 3000);
      } else {
        // Loss — no celebration, show Next Puzzle immediately
        setShowCelebration(false);
        setCelebrationReady(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Close toss-up solve modal if open
      setShowTossUpSolveModal(false);
      setTossUpSolveInput("");

      // Clear bonus solve input
      setBonusSolveInput("");
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
  }, [state.turnState, state.roundResult]);

  // Focus the solve input after modal animation completes
  useEffect(() => {
    if (showSolveModal) {
      const timer = setTimeout(() => {
        solveInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showSolveModal]);

  // Focus toss-up solve input after modal opens
  useEffect(() => {
    if (showTossUpSolveModal) {
      const timer = setTimeout(() => {
        tossUpSolveInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showTossUpSolveModal]);

  // Toss-Up tick interval — runs during TOSSUP_REVEALING and TOSSUP_LOCKED_OUT
  useEffect(() => {
    const isTossUpActive =
      selectedRoundMode === "TOSSUP" &&
      (state.turnState === "TOSSUP_REVEALING" ||
        state.turnState === "TOSSUP_LOCKED_OUT");

    if (isTossUpActive) {
      let lastTime = Date.now();
      tossUpTickRef.current = setInterval(() => {
        const now = Date.now();
        const dtMs = now - lastTime;
        lastTime = now;
        dispatch({ type: "TOSS_UP_TICK", dtMs });
      }, 33);
    } else {
      if (tossUpTickRef.current) {
        clearInterval(tossUpTickRef.current);
        tossUpTickRef.current = null;
      }
    }

    return () => {
      if (tossUpTickRef.current) {
        clearInterval(tossUpTickRef.current);
        tossUpTickRef.current = null;
      }
    };
  }, [selectedRoundMode, state.turnState]);

  // Bonus Round tick interval — runs during BONUS_SOLVE_TIMER
  useEffect(() => {
    const isBonusSolveActive =
      selectedRoundMode === "BONUS" && state.turnState === "BONUS_SOLVE_TIMER";

    if (isBonusSolveActive) {
      let lastTime = Date.now();
      bonusTickRef.current = setInterval(() => {
        const now = Date.now();
        const dtMs = now - lastTime;
        lastTime = now;
        dispatch({ type: "BONUS_TICK", dtMs });
      }, 33);
    } else {
      if (bonusTickRef.current) {
        clearInterval(bonusTickRef.current);
        bonusTickRef.current = null;
      }
    }

    return () => {
      if (bonusTickRef.current) {
        clearInterval(bonusTickRef.current);
        bonusTickRef.current = null;
      }
    };
  }, [selectedRoundMode, state.turnState]);

  // Bonus Round last-5-seconds haptic warning
  useEffect(() => {
    if (state.turnState !== "BONUS_SOLVE_TIMER") {
      prevBonusTimerSecRef.current = null;
      return;
    }

    const currentSec = Math.ceil(state.bonusTimerMs / 1000);
    const prevSec = prevBonusTimerSecRef.current;
    prevBonusTimerSecRef.current = currentSec;

    if (
      prevSec !== null &&
      currentSec !== prevSec &&
      currentSec <= 5 &&
      currentSec > 0
    ) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [state.turnState, state.bonusTimerMs]);

  // Focus bonus solve input when entering BONUS_SOLVE_TIMER
  useEffect(() => {
    if (state.turnState === "BONUS_SOLVE_TIMER") {
      const timer = setTimeout(() => {
        bonusSolveInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [state.turnState]);

  // Background/foreground timer catch-up for TOSSUP and BONUS modes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        backgroundTimestampRef.current = Date.now();
        return;
      }

      if (
        nextAppState === "active" &&
        backgroundTimestampRef.current !== null
      ) {
        const elapsed = Date.now() - backgroundTimestampRef.current;
        backgroundTimestampRef.current = null;

        if (elapsed <= 0) return;

        const { turnState } = state;

        if (
          selectedRoundMode === "TOSSUP" &&
          (turnState === "TOSSUP_REVEALING" ||
            turnState === "TOSSUP_LOCKED_OUT")
        ) {
          dispatch({ type: "TOSS_UP_TICK", dtMs: elapsed });
        }

        if (
          selectedRoundMode === "BONUS" &&
          turnState === "BONUS_SOLVE_TIMER"
        ) {
          dispatch({ type: "BONUS_TICK", dtMs: elapsed });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [selectedRoundMode, state.turnState]);

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
    !state.mustSpin &&
    state.player.currentRoundScore >= VOWEL_COST;

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
    setBonusSelectedConsonants([]);
    setBonusSelectedVowel(null);
    setBonusSolveInput("");
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = null;
    }
    const puzzles = getPuzzlesForMode(activePack.puzzles, selectedRoundMode);
    const nextIndex = puzzleIndex >= puzzles.length - 1 ? 0 : puzzleIndex + 1;
    const next = puzzles[nextIndex];
    setPuzzleIndex(nextIndex);
    dispatch({
      type: "START_ROUND",
      puzzle: { ...next, round_type: selectedRoundMode },
    });
  }, [activePack, puzzleIndex, selectedRoundMode]);

  // Navigate to pack selection for a specific round mode
  const startMode = useCallback((mode: RoundType) => {
    setSelectedRoundMode(mode);
    setActiveScreen("packSelect");
  }, []);

  // Start game with a specific pack and the selected round mode
  const startGameWithPack = useCallback(
    (pack: PuzzlePack) => {
      setActivePack(pack);
      const puzzles = getPuzzlesForMode(pack.puzzles, selectedRoundMode);
      const first = puzzles[0];
      if (first) {
        setPuzzleIndex(0);
        dispatch({
          type: "START_ROUND",
          puzzle: { ...first, round_type: selectedRoundMode },
        });
      }
      setActiveScreen("game");
    },
    [selectedRoundMode],
  );

  // Start game with a random puzzle from all packs (filtered for mode)
  const startShuffleAll = useCallback(() => {
    const allEligible = ALL_PACKS.flatMap((pack) =>
      getPuzzlesForMode(pack.puzzles, selectedRoundMode),
    );
    if (allEligible.length === 0) return;
    const randomPuzzle =
      allEligible[Math.floor(Math.random() * allEligible.length)];
    // Find which pack contains this puzzle
    const containingPack = ALL_PACKS.find((pack) =>
      pack.puzzles.some((p) => p.id === randomPuzzle.id),
    );
    if (containingPack) {
      setActivePack(containingPack);
    }
    setPuzzleIndex(0);
    dispatch({
      type: "START_ROUND",
      puzzle: { ...randomPuzzle, round_type: selectedRoundMode },
    });
    setActiveScreen("game");
  }, [selectedRoundMode]);

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

  // Toss-Up handlers
  const handleBuzzIn = useCallback(() => {
    dispatch({ type: "BUZZ_IN" });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowTossUpSolveModal(true);
  }, []);

  const handleTossUpSolve = useCallback(() => {
    const correct =
      tossUpSolveInput.toUpperCase() ===
      state.currentPuzzle?.phrase.toUpperCase();
    dispatch({ type: "TOSS_UP_SOLVE_ATTEMPT", phrase: tossUpSolveInput });

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Wrong! Locked out...");
    }
    setShowTossUpSolveModal(false);
    setTossUpSolveInput("");
  }, [tossUpSolveInput, state.currentPuzzle, showToast]);

  // Bonus Round letter picking handlers
  const RSTLNE = ["R", "S", "T", "L", "N", "E"];

  const handleBonusLetterPick = useCallback(
    (letter: string) => {
      const upper = letter.toUpperCase();
      if (RSTLNE.includes(upper)) return;

      const isVowel = VOWELS.includes(upper);
      const isConsonant = CONSONANTS.includes(upper);

      if (isConsonant) {
        if (bonusSelectedConsonants.includes(upper)) {
          // Deselect
          setBonusSelectedConsonants(
            bonusSelectedConsonants.filter((c) => c !== upper),
          );
        } else if (bonusSelectedConsonants.length < 3) {
          setBonusSelectedConsonants([...bonusSelectedConsonants, upper]);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else if (isVowel) {
        if (bonusSelectedVowel === upper) {
          // Deselect
          setBonusSelectedVowel(null);
        } else if (
          bonusSelectedVowel === null &&
          bonusSelectedConsonants.length === 3
        ) {
          setBonusSelectedVowel(upper);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [bonusSelectedConsonants, bonusSelectedVowel],
  );

  const handleBonusConfirm = useCallback(() => {
    if (bonusSelectedConsonants.length === 3 && bonusSelectedVowel) {
      dispatch({
        type: "BONUS_CHOOSE_LETTERS",
        consonants: bonusSelectedConsonants as [string, string, string],
        vowel: bonusSelectedVowel,
      });
      setBonusSelectedConsonants([]);
      setBonusSelectedVowel(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [bonusSelectedConsonants, bonusSelectedVowel]);

  // Bonus Round solve handler
  const handleBonusSolve = useCallback(() => {
    if (!bonusSolveInput.trim()) return;
    const correct =
      bonusSolveInput.toUpperCase().trim() ===
      state.currentPuzzle?.phrase.toUpperCase();
    dispatch({ type: "BONUS_SOLVE_ATTEMPT", phrase: bonusSolveInput });

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Shake animation for wrong guess
      bonusShakeX.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      setBonusSolveInput("");
    }
  }, [bonusSolveInput, state.currentPuzzle, bonusShakeX]);

  const bonusSolveShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bonusShakeX.value }],
  }));

  const bonusPicksReady =
    bonusSelectedConsonants.length === 3 && bonusSelectedVowel !== null;

  const bonusPickStatusText = useMemo(() => {
    const cCount = bonusSelectedConsonants.length;
    const vCount = bonusSelectedVowel ? 1 : 0;
    if (cCount < 3) {
      return `Pick ${3 - cCount} more consonant${3 - cCount !== 1 ? "s" : ""}`;
    }
    if (vCount === 0) {
      return "Now pick 1 vowel";
    }
    return "Ready! Tap Confirm";
  }, [bonusSelectedConsonants.length, bonusSelectedVowel]);

  // Letters that are disabled in bonus picking (RSTLNE already in guessedLetters from START_ROUND)
  const bonusDisabledLetters = state.guessedLetters;

  // Letters that are selected (highlighted) during bonus picking
  const bonusHighlightedLetters = useMemo(() => {
    const selected = [...bonusSelectedConsonants];
    if (bonusSelectedVowel) selected.push(bonusSelectedVowel);
    return selected;
  }, [bonusSelectedConsonants, bonusSelectedVowel]);

  const handleSelectPuzzle = useCallback((puzzle: Puzzle, pack: PuzzlePack) => {
    setActivePack(pack);
    const idx = pack.puzzles.findIndex((p) => p.id === puzzle.id);
    setPuzzleIndex(idx >= 0 ? idx : 0);
    dispatch({ type: "SELECT_PUZZLE", puzzle });
    setActiveScreen("game");
    setShowPackBrowserModal(false);
  }, []);

  const isRoundOver = state.turnState === "ROUND_OVER";
  const isTossUpMode = selectedRoundMode === "TOSSUP";
  const isBonusMode = selectedRoundMode === "BONUS";
  const isBonusPicking = isBonusMode && state.turnState === "BONUS_PICKING";
  const isBonusSolving = isBonusMode && state.turnState === "BONUS_SOLVE_TIMER";
  const canSpin = state.turnState === "IDLE" && !isRoundOver;
  const canGuess =
    state.turnState === "GUESSING_CONSONANT" ||
    state.turnState === "BUYING_VOWEL";

  const lockoutSecondsLeft = Math.ceil(state.tossUpLockoutMs / 1000);

  const bonusTimerSeconds = Math.max(0, state.bonusTimerMs / 1000);
  const bonusTimerDisplay = bonusTimerSeconds.toFixed(1);
  const bonusTimerIsLow = bonusTimerSeconds <= 5;

  const tossUpStatusText = useMemo(() => {
    switch (state.turnState) {
      case "TOSSUP_REVEALING":
        return "Buzz in to solve!";
      case "TOSSUP_BUZZED":
        return "Solve the puzzle!";
      case "TOSSUP_LOCKED_OUT":
        return `Locked out... ${lockoutSecondsLeft}s`;
      case "ROUND_OVER":
        return state.roundResult === "win" ? "Correct!" : "Puzzle Revealed";
      default:
        return "";
    }
  }, [state.turnState, state.roundResult, lockoutSecondsLeft]);

  // Animate keyboard slide up/down
  useEffect(() => {
    keyboardTranslateY.value = withTiming(canGuess ? 0 : 200, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [canGuess, keyboardTranslateY]);

  const keyboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardTranslateY.value }],
  }));

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
            <View style={styles.iconButton}>
              <Text style={styles.modeText}>WHEEL PRACTICE</Text>
            </View>
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
                onPress={() => startMode("MAIN")}
              >
                <LinearGradient
                  colors={[colors.green[500], colors.green[600]]}
                  style={styles.navCardGradient}
                >
                  <Play size={40} color={colors.white} />
                  <Text style={styles.navCardTitle}>Standard Game</Text>
                  <Text style={styles.navCardDesc}>
                    Spin the wheel, guess letters, solve the puzzle
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => startMode("TOSSUP")}
              >
                <LinearGradient
                  colors={[colors.orange[500], colors.orange[600]]}
                  style={styles.navCardGradient}
                >
                  <Zap size={40} color={colors.white} />
                  <Text style={styles.navCardTitle}>Toss-Up</Text>
                  <Text style={styles.navCardDesc}>
                    Letters reveal one by one — buzz in to solve!
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => startMode("BONUS")}
              >
                <LinearGradient
                  colors={[colors.purple[500], colors.purple[600]]}
                  style={styles.navCardGradient}
                >
                  <Trophy size={40} color={colors.white} />
                  <Text style={styles.navCardTitle}>Bonus Round</Text>
                  <Text style={styles.navCardDesc}>
                    Pick your letters, solve before time runs out
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
                  colors={[colors.slate[600], colors.slate[700]]}
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

        {activeScreen === "packSelect" && (
          <View style={styles.homeContainer}>
            <Text style={styles.homeTitle}>
              {MODE_LABELS[selectedRoundMode]}
            </Text>
            <Text style={styles.homeSubtitle}>Choose your puzzles</Text>

            <ScrollView
              style={styles.packSelectScroll}
              contentContainerStyle={styles.packSelectContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Shuffle All */}
              <TouchableOpacity
                style={styles.navCard}
                onPress={startShuffleAll}
              >
                <LinearGradient
                  colors={[colors.yellow[500], colors.orange[500]]}
                  style={styles.navCardGradient}
                >
                  <Shuffle size={32} color={colors.white} />
                  <Text style={styles.navCardTitle}>Shuffle All</Text>
                  <Text style={styles.navCardDesc}>
                    Random puzzle from all packs
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Pack cards */}
              {ALL_PACKS.map((pack) => {
                const eligibleCount = getPuzzlesForMode(
                  pack.puzzles,
                  selectedRoundMode,
                ).length;
                if (eligibleCount === 0) return null;
                return (
                  <TouchableOpacity
                    key={pack.id}
                    style={[
                      styles.navCard,
                      activePack.id === pack.id && styles.packSelectActive,
                    ]}
                    onPress={() => startGameWithPack(pack)}
                  >
                    <LinearGradient
                      colors={[colors.slate[600], colors.slate[700]]}
                      style={styles.navCardGradient}
                    >
                      <BookOpen size={24} color={colors.slate[400]} />
                      <Text style={styles.navCardTitle}>{pack.name}</Text>
                      <Text style={styles.navCardDesc}>
                        {eligibleCount} puzzle{eligibleCount !== 1 ? "s" : ""}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

            {/* Round Over */}
            {isRoundOver ? (
              <View style={styles.roundOverSection}>
                {isTossUpMode || isBonusMode ? (
                  <>
                    <Text
                      style={
                        state.roundResult === "win"
                          ? styles.solvedText
                          : styles.lossText
                      }
                    >
                      {state.roundResult === "win"
                        ? "CORRECT!"
                        : isBonusMode
                          ? "TIME'S UP!"
                          : "PUZZLE REVEALED"}
                    </Text>
                    {state.roundResult === "win" && (
                      <Text style={styles.winningsText}>
                        Won: ${state.player.currentRoundScore}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.solvedText}>PUZZLE SOLVED!</Text>
                    <Text style={styles.winningsText}>
                      Won: ${state.player.currentRoundScore}
                    </Text>
                  </>
                )}
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
            ) : isTossUpMode ? (
              <View style={styles.tossUpArea}>
                {/* Toss-Up Status Banner */}
                <View style={styles.tossUpBanner}>
                  <Text style={styles.tossUpBannerTitle}>TOSS-UP</Text>
                  <Text style={styles.tossUpBannerStatus}>
                    {tossUpStatusText}
                  </Text>
                </View>

                {/* Buzz In Button */}
                {state.turnState === "TOSSUP_REVEALING" && (
                  <TouchableOpacity onPress={handleBuzzIn}>
                    <LinearGradient
                      colors={[colors.orange[500], colors.orange[600]]}
                      style={styles.buzzInButton}
                    >
                      <Zap size={28} color={colors.white} />
                      <Text style={styles.buzzInButtonText}>BUZZ IN</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Lockout indicator */}
                {state.turnState === "TOSSUP_LOCKED_OUT" && (
                  <View style={styles.lockoutContainer}>
                    <Text style={styles.lockoutText}>
                      Locked out... {lockoutSecondsLeft}s
                    </Text>
                  </View>
                )}
              </View>
            ) : isBonusPicking ? (
              <View style={styles.bonusPickingArea}>
                {/* Bonus Round Status Banner */}
                <View style={styles.bonusBanner}>
                  <Text style={styles.bonusBannerTitle}>BONUS ROUND</Text>
                  <Text style={styles.bonusBannerStatus}>
                    Pick 3 consonants, then 1 vowel
                  </Text>
                </View>

                {/* Pick progress indicator */}
                <View style={styles.bonusPickProgress}>
                  <Text style={styles.bonusPickProgressText}>
                    Consonants: {bonusSelectedConsonants.length}/3
                    {bonusSelectedConsonants.length > 0 &&
                      ` (${bonusSelectedConsonants.join(", ")})`}
                  </Text>
                  <Text style={styles.bonusPickProgressText}>
                    Vowel: {bonusSelectedVowel ?? "—"}
                  </Text>
                  <Text style={styles.bonusPickStatusHint}>
                    {bonusPickStatusText}
                  </Text>
                </View>

                {/* Keyboard with RSTLNE disabled */}
                <Keyboard
                  guessedLetters={bonusDisabledLetters}
                  onGuess={handleBonusLetterPick}
                  disabled={false}
                  selectedLetters={bonusHighlightedLetters}
                  highlightVowels={
                    bonusSelectedConsonants.length === 3 &&
                    bonusSelectedVowel === null
                  }
                />

                {/* Confirm button */}
                <TouchableOpacity
                  onPress={handleBonusConfirm}
                  disabled={!bonusPicksReady}
                >
                  <LinearGradient
                    colors={
                      bonusPicksReady
                        ? [colors.purple[500], colors.purple[600]]
                        : [colors.slate[600], colors.slate[700]]
                    }
                    style={styles.bonusConfirmButton}
                  >
                    <Text
                      style={[
                        styles.bonusConfirmButtonText,
                        !bonusPicksReady && styles.disabledText,
                      ]}
                    >
                      CONFIRM LETTERS
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : isBonusSolving ? (
              <View style={styles.bonusSolveArea}>
                {/* Bonus Round timed solve phase */}
                <View style={styles.bonusBanner}>
                  <Text style={styles.bonusBannerTitle}>BONUS ROUND</Text>
                  <Text style={styles.bonusBannerStatus}>
                    Solve the puzzle!
                  </Text>
                </View>

                {/* Countdown timer */}
                <View style={styles.bonusTimerContainer}>
                  <Text
                    style={[
                      styles.bonusTimerText,
                      bonusTimerIsLow && styles.bonusTimerTextLow,
                    ]}
                  >
                    {bonusTimerDisplay}
                  </Text>
                  <Text style={styles.bonusTimerLabel}>SECONDS</Text>
                </View>

                {/* Solve input with shake animation */}
                <Animated.View
                  style={[styles.bonusSolveInputRow, bonusSolveShakeStyle]}
                >
                  <TextInput
                    ref={bonusSolveInputRef}
                    style={styles.bonusSolveInput}
                    value={bonusSolveInput}
                    onChangeText={setBonusSolveInput}
                    placeholder="Type your answer..."
                    placeholderTextColor={colors.slate[400]}
                    autoCapitalize="characters"
                    onSubmitEditing={handleBonusSolve}
                    returnKeyType="go"
                  />
                  <TouchableOpacity onPress={handleBonusSolve}>
                    <LinearGradient
                      colors={[colors.purple[500], colors.purple[600]]}
                      style={styles.bonusSolveButton}
                    >
                      <Text style={styles.bonusSolveButtonText}>SOLVE</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : isBonusMode ? (
              <View style={styles.bonusSolveArea}>
                <View style={styles.bonusBanner}>
                  <Text style={styles.bonusBannerTitle}>BONUS ROUND</Text>
                </View>
              </View>
            ) : (
              <View style={styles.gameArea}>
                {/* Wheel with status banner */}
                <View style={styles.wheelContainer}>
                  <StandardWheel
                    onSpinStart={handleSpinStart}
                    onSpinComplete={handleSpinComplete}
                    isSpinning={state.turnState === "SPINNING"}
                    seed={state.seed + state.spinCount}
                    canSpin={state.turnState === "IDLE"}
                  />
                </View>

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
              </View>
            )}

            {/* Bottom bar - keyboard when guessing, status text otherwise */}
            {canGuess ? (
              <Animated.View
                style={[styles.keyboardOverlay, keyboardAnimatedStyle]}
              >
                {/* Status banner above keyboard */}
                <View style={styles.keyboardBanner}>
                  <View style={styles.keyboardBannerContent}>
                    <Text style={styles.keyboardBannerText}>
                      {state.turnState === "GUESSING_CONSONANT"
                        ? "GUESS A CONSONANT"
                        : "SELECT A VOWEL"}
                    </Text>
                    {state.turnState === "GUESSING_CONSONANT" &&
                      typeof state.spinResult === "number" && (
                        <Text style={styles.keyboardBannerSubtext}>
                          ${state.spinResult} per letter
                        </Text>
                      )}
                    {state.turnState === "BUYING_VOWEL" && (
                      <Text style={styles.keyboardBannerSubtext}>
                        ${VOWEL_COST} each
                      </Text>
                    )}
                  </View>
                  {state.turnState === "GUESSING_CONSONANT" && canBuyVowel && (
                    <TouchableOpacity onPress={handleBuyVowel}>
                      <LinearGradient
                        colors={[colors.purple[500], colors.purple[600]]}
                        style={styles.bannerVowelButton}
                      >
                        <Text style={styles.bannerVowelButtonText}>
                          BUY VOWEL ${VOWEL_COST}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
                <Keyboard
                  guessedLetters={state.guessedLetters}
                  onGuess={handleGuess}
                  onAlreadyCalled={(letter) =>
                    showToast(`${letter} - Already called!`)
                  }
                  disabled={!canGuess}
                  vowelsOnly={state.turnState === "BUYING_VOWEL"}
                  consonantsOnly={state.turnState === "GUESSING_CONSONANT"}
                  hideGuessedLetters={hideGuessedLetters}
                />
              </Animated.View>
            ) : (
              !isRoundOver &&
              !isTossUpMode &&
              !isBonusMode &&
              state.turnState !== "SPINNING" && (
                <View style={styles.bottomStatusBar}>
                  <Text style={styles.bottomStatusText}>SPIN THE WHEEL</Text>
                </View>
              )
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

        {/* Toss-Up Solve Modal */}
        <Modal
          visible={showTossUpSolveModal}
          onClose={() => {
            setShowTossUpSolveModal(false);
            setTossUpSolveInput("");
          }}
          title="Solve the Puzzle"
        >
          <TextInput
            ref={tossUpSolveInputRef}
            style={styles.solveInput}
            value={tossUpSolveInput}
            onChangeText={setTossUpSolveInput}
            placeholder="Type your answer..."
            placeholderTextColor={colors.slate[400]}
            autoCapitalize="characters"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => {
                setShowTossUpSolveModal(false);
                setTossUpSolveInput("");
              }}
            >
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTossUpSolve}>
              <LinearGradient
                colors={[colors.orange[500], colors.orange[600]]}
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
    position: "relative",
  },
  keyboardBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[700],
  },
  keyboardBannerContent: {
    flex: 1,
  },
  keyboardBannerText: {
    color: colors.yellow[300],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
    letterSpacing: 1,
  },
  keyboardBannerSubtext: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
    marginTop: spacing[0.5],
  },
  bannerVowelButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
  },
  bannerVowelButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
  },
  bottomStatusBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: spacing[4],
    backgroundColor: colors.slate[900],
    borderTopWidth: 1,
    borderTopColor: colors.slate[700],
  },
  bottomStatusText: {
    color: colors.yellow[300],
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
    letterSpacing: 2,
    textAlign: "center",
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

  keyboardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.slate[900],
    borderTopWidth: 1,
    borderTopColor: colors.slate[700],
    paddingBottom: spacing[2],
    paddingTop: spacing[1],
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
  packSelectScroll: {
    flex: 1,
    width: "100%",
  },
  packSelectContent: {
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  packSelectActive: {
    borderWidth: 2,
    borderColor: colors.yellow[500],
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
  lossText: {
    color: colors.red[400],
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  tossUpArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
  },
  tossUpBanner: {
    alignItems: "center",
    gap: spacing[1],
  },
  tossUpBannerTitle: {
    color: colors.orange[500],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: 3,
  },
  tossUpBannerStatus: {
    color: colors.slate[400],
    fontSize: typography.sizes.base,
  },
  buzzInButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius["2xl"],
    ...shadows.lg,
  },
  buzzInButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes["2xl"],
    letterSpacing: 2,
  },
  lockoutContainer: {
    alignItems: "center",
    paddingVertical: spacing[4],
  },
  lockoutText: {
    color: colors.red[400],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  bonusPickingArea: {
    flex: 1,
    gap: spacing[3],
    marginTop: spacing[2],
  },
  bonusBanner: {
    alignItems: "center",
    gap: spacing[1],
  },
  bonusBannerTitle: {
    color: colors.purple[500],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: 3,
  },
  bonusBannerStatus: {
    color: colors.slate[400],
    fontSize: typography.sizes.base,
  },
  bonusPickProgress: {
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate[700],
    marginHorizontal: spacing[4],
  },
  bonusPickProgressText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  bonusPickStatusHint: {
    color: colors.purple[500],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: spacing[1],
  },
  bonusConfirmButton: {
    alignItems: "center",
    paddingVertical: spacing[3],
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  bonusConfirmButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
    letterSpacing: 1,
  },
  bonusSolveArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
  },
  bonusTimerContainer: {
    alignItems: "center",
    gap: spacing[1],
  },
  bonusTimerText: {
    color: colors.white,
    fontSize: typography.sizes["6xl"],
    fontWeight: typography.weights.bold,
    fontVariant: ["tabular-nums"],
  },
  bonusTimerTextLow: {
    color: colors.red[400],
  },
  bonusTimerLabel: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
    letterSpacing: 2,
  },
  bonusSolveInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    width: "100%",
  },
  bonusSolveInput: {
    flex: 1,
    backgroundColor: colors.slate[800],
    borderWidth: 1,
    borderColor: colors.slate[600],
    borderRadius: borderRadius.base,
    padding: spacing[3],
    fontSize: typography.sizes.lg,
    color: colors.white,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
  },
  bonusSolveButton: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.base,
    ...shadows.md,
  },
  bonusSolveButtonText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
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
