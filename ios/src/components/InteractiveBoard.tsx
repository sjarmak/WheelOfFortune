/**
 * Interactive Board Component
 *
 * Kid-mode puzzle board that adds:
 * - Tap letters to hear their phonetic sound
 * - Animated letter reveals with Vanna
 */

import React, { useCallback, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { getLetterSound } from "../engine/phonics";
import { speak, cancelSpeech } from "../engine/tts";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
} from "../styles/theme";

interface InteractiveBoardProps {
  phrase: string;
  revealedPositions: number[];
  category: string;
  puzzleId?: string;
  isPuzzleSolved?: boolean;
  readAloudEnabled: boolean;
  dressColorId?: string | null;
  hairColorId?: string | null;
}

interface WordInfo {
  word: string;
  startIndex: number;
}

const MAX_COLS_PER_ROW = layout.isSmallScreen ? 10 : 12;

export function InteractiveBoard({
  phrase,
  revealedPositions,
  category,
  puzzleId,
  isPuzzleSolved = false,
  readAloudEnabled,
}: InteractiveBoardProps): React.JSX.Element {
  const [visiblePositions, setVisiblePositions] = useState<number[]>([]);
  const [tileSize, setTileSize] = useState({ width: 28, height: 36 });

  // Build word lookup: for each character index, what word is it in?
  const wordLookup = useMemo(() => {
    const lookup: Map<number, WordInfo> = new Map();
    const words = phrase.split(" ");
    let charIndex = 0;

    for (const word of words) {
      const startIndex = charIndex;
      for (let i = 0; i < word.length; i++) {
        lookup.set(charIndex, { word, startIndex });
        charIndex++;
      }
      charIndex++; // space
    }

    return lookup;
  }, [phrase]);

  const boardRows = useMemo(() => {
    type Tile = { char: string; index: number };

    const rows: Tile[][] = [];
    let currentRow: Tile[] = [];
    let currentCount = 0;
    let wordBuffer: Tile[] = [];

    const trimTrailingSpaces = () => {
      while (
        currentRow.length > 0 &&
        currentRow[currentRow.length - 1].char === " "
      ) {
        currentRow.pop();
        currentCount--;
      }
    };

    const pushWordBuffer = () => {
      if (wordBuffer.length === 0) return;

      if (
        currentCount > 0 &&
        currentCount + wordBuffer.length > MAX_COLS_PER_ROW
      ) {
        trimTrailingSpaces();
        rows.push(currentRow);
        currentRow = [];
        currentCount = 0;
      }

      while (wordBuffer.length > 0) {
        const available = MAX_COLS_PER_ROW - currentCount;
        const take =
          available <= 0
            ? wordBuffer.length
            : Math.min(wordBuffer.length, available);
        const chunk = wordBuffer.splice(0, take);
        currentRow.push(...chunk);
        currentCount += chunk.length;

        if (currentCount >= MAX_COLS_PER_ROW) {
          trimTrailingSpaces();
          rows.push(currentRow);
          currentRow = [];
          currentCount = 0;
        }
      }
    };

    for (let index = 0; index < phrase.length; index++) {
      const char = phrase[index];
      if (char === " ") {
        pushWordBuffer();
        if (currentCount === 0) {
          continue;
        }
        if (currentCount + 1 > MAX_COLS_PER_ROW) {
          trimTrailingSpaces();
          rows.push(currentRow);
          currentRow = [];
          currentCount = 0;
        }
        currentRow.push({ char: " ", index });
        currentCount += 1;
      } else {
        wordBuffer.push({ char, index });
      }
    }

    pushWordBuffer();
    if (currentRow.length > 0) {
      trimTrailingSpaces();
      rows.push(currentRow);
    }

    if (rows.length === 0) {
      rows.push([]);
    }

    return rows;
  }, [phrase]);

  // Update visible positions when revealed positions change
  React.useEffect(() => {
    // Animate letters appearing one by one with delay
    const newPositions = revealedPositions.filter(
      (p) => !visiblePositions.includes(p),
    );

    newPositions.forEach((pos, idx) => {
      setTimeout(() => {
        setVisiblePositions((prev) =>
          prev.includes(pos) ? prev : [...prev, pos],
        );
      }, idx * 100);
    });
  }, [revealedPositions]);

  // Reset visible positions when puzzle changes
  React.useEffect(() => {
    setVisiblePositions([]);
  }, [puzzleId, phrase]);

  // Handle letter tap - speak the phonetic sound
  const handleLetterTap = useCallback(
    (char: string, globalIndex: number) => {
      if (!readAloudEnabled) return;
      if (!visiblePositions.includes(globalIndex)) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const wordInfo = wordLookup.get(globalIndex);
      if (!wordInfo) return;

      const posInWord = globalIndex - wordInfo.startIndex;
      const sound = getLetterSound(char, wordInfo.word, posInWord);

      if (sound === "silent") {
        speak(`Silent ${char}`, { rate: 0.85 });
      } else {
        speak(sound, { rate: 0.85 });
      }
    },
    [readAloudEnabled, visiblePositions, wordLookup],
  );

  // Calculate tile size based on board width
  const handleBoardLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    const padding = spacing[2] * 2;
    const gap = spacing[1] * (MAX_COLS_PER_ROW - 1);
    const availableWidth = width - padding - gap;
    const tileWidth = Math.floor(availableWidth / MAX_COLS_PER_ROW);
    const tileHeight = Math.floor(tileWidth * 1.3);
    setTileSize({
      width: Math.max(24, tileWidth),
      height: Math.max(32, tileHeight),
    });
  }, []);

  const renderLetter = (char: string, globalIndex: number) => {
    const isRevealed = visiblePositions.includes(globalIndex);
    const isLetter = /[A-Z]/.test(char);
    const isPunctuation = /[^A-Z ]/.test(char);

    if (char === " ") {
      return (
        <View
          key={globalIndex}
          style={[styles.spaceTile, { width: tileSize.width * 0.6 }]}
        />
      );
    }

    const tileStyle = [
      styles.tile,
      { width: tileSize.width, height: tileSize.height },
    ];

    if (isPunctuation) {
      return (
        <View key={globalIndex} style={tileStyle}>
          <Text style={styles.punctuation}>{char}</Text>
        </View>
      );
    }

    if (!isLetter) {
      return <View key={globalIndex} style={tileStyle} />;
    }

    return (
      <TouchableOpacity
        key={globalIndex}
        onPress={() => handleLetterTap(char, globalIndex)}
        activeOpacity={isRevealed ? 0.7 : 1}
        style={tileStyle}
      >
        {isRevealed && (
          <Animated.View
            entering={ZoomIn.duration(300)}
            style={styles.letterContainer}
          >
            <Animated.View entering={FadeIn.delay(100).duration(200)}>
              <Text style={styles.letter}>{char}</Text>
            </Animated.View>
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.container}
      onLayout={handleBoardLayout}
    >
      <View style={styles.board}>
        {boardRows.map((row, rowIdx) => (
          <View key={`${puzzleId}-row-${rowIdx}`} style={styles.row}>
            {row.map((tile) => renderLetter(tile.char, tile.index))}
          </View>
        ))}
      </View>

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{category.replace(/_/g, " ")}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[3],
    backgroundColor: "#1a365d", // game board blue
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.gold[500],
    width: "100%",
    ...shadows.lg,
  },
  board: {
    gap: spacing[1],
    marginTop: spacing[2],
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[1],
    flexWrap: "wrap",
  },
  tile: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[400],
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  spaceTile: {
    height: 36,
  },
  letterContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  letter: {
    fontSize: layout.isSmallScreen
      ? typography.sizes.lg
      : typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  punctuation: {
    fontSize: layout.isSmallScreen
      ? typography.sizes.lg
      : typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  categoryBadge: {
    marginTop: spacing[2],
    backgroundColor: colors.slate[800],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.slate[600],
  },
  categoryText: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
