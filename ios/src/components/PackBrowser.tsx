/**
 * Pack Browser Component
 *
 * Two views:
 * 1. Pack list — shows available puzzle packs as cards with stats
 * 2. Puzzle list — shows puzzles within a selected pack with filtering
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import {
  BookOpen,
  Hash,
  Layers,
  ChevronLeft,
  Search,
} from "lucide-react-native";

import { PuzzlePack } from "../engine/packs";
import { Puzzle } from "../engine/types";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../styles/theme";

interface PackBrowserProps {
  packs: PuzzlePack[];
  activePackId: string;
  onSelectPack: (pack: PuzzlePack) => void;
  onSelectPuzzle?: (puzzle: Puzzle, pack: PuzzlePack) => void;
  asModal?: boolean;
}

type DifficultyLevel = "all" | "easy" | "medium" | "hard";

const CATEGORY_COLORS: Record<string, string> = {
  PHRASE: colors.blue[500],
  THING: colors.green[500],
  PLACE: colors.purple[500],
  FOOD_AND_DRINK: colors.orange[500],
  TITLE: colors.yellow[400],
  EVENT: colors.pink[500],
  PERSON: colors.red[500],
  WHAT_ARE_YOU_DOING: colors.amber[400],
  MIXED: colors.slate[400],
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? colors.slate[500];
}

function formatCategoryLabel(category: string): string {
  return category
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function getDifficultyLabel(score: number): string {
  if (score < 0.33) return "Easy";
  if (score <= 0.66) return "Medium";
  return "Hard";
}

function getDifficultyColor(score: number): string {
  if (score < 0.33) return colors.green[400];
  if (score <= 0.66) return colors.yellow[400];
  return colors.red[400];
}

function maskPhrase(phrase: string): string {
  return phrase
    .toUpperCase()
    .split("")
    .map((ch) => {
      if (/[A-Z]/.test(ch)) return "_";
      if (ch === " ") return "  ";
      return ch;
    })
    .join(" ");
}

function getWordCount(phrase: string): number {
  return phrase.trim().split(/\s+/).length;
}

function matchesDifficulty(puzzle: Puzzle, level: DifficultyLevel): boolean {
  if (level === "all") return true;
  const score = puzzle.difficulty?.score ?? 0.5;
  if (level === "easy") return score < 0.33;
  if (level === "medium") return score >= 0.33 && score <= 0.66;
  return score > 0.66;
}

// ─── Category Chip ───────────────────────────────────────────────────

function CategoryChip({
  category,
  count,
}: {
  category: string;
  count?: number;
}) {
  const chipColor = getCategoryColor(category);

  return (
    <View style={[styles.categoryChip, { borderColor: chipColor }]}>
      <Text style={[styles.categoryChipText, { color: chipColor }]}>
        {formatCategoryLabel(category)}
        {count != null ? ` (${count})` : ""}
      </Text>
    </View>
  );
}

// ─── Pack Card ───────────────────────────────────────────────────────

function PackCard({
  pack,
  isActive,
  onPress,
}: {
  pack: PuzzlePack;
  isActive: boolean;
  onPress: () => void;
}) {
  const categoryCounts = computeCategoryCounts(pack);

  return (
    <TouchableOpacity
      style={[styles.packCard, isActive && styles.packCardActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.packCardHeader}>
        <View style={styles.packIconContainer}>
          <BookOpen
            size={24}
            color={isActive ? colors.yellow[400] : colors.white}
          />
        </View>
        <View style={styles.packCardInfo}>
          <Text style={[styles.packName, isActive && styles.packNameActive]}>
            {pack.name}
          </Text>
          <Text style={styles.packDescription}>{pack.description}</Text>
        </View>
      </View>

      <View style={styles.packStats}>
        <View style={styles.statBadge}>
          <Hash size={12} color={colors.slate[400]} />
          <Text style={styles.statBadgeText}>{pack.puzzleCount} puzzles</Text>
        </View>
        <View style={styles.statBadge}>
          <Layers size={12} color={colors.slate[400]} />
          <Text style={styles.statBadgeText}>
            {pack.categories.length} categories
          </Text>
        </View>
      </View>

      <View style={styles.categoryChips}>
        {categoryCounts.map(({ category, count }) => (
          <CategoryChip key={category} category={category} count={count} />
        ))}
      </View>

      {isActive && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>ACTIVE</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function computeCategoryCounts(
  pack: PuzzlePack,
): Array<{ category: string; count: number }> {
  const counts = new Map<string, number>();
  for (const puzzle of pack.puzzles) {
    const current = counts.get(puzzle.category) ?? 0;
    counts.set(puzzle.category, current + 1);
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Category Filter Chips ──────────────────────────────────────────

function CategoryFilterChips({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterChipsContent}
      style={styles.filterChipsScroll}
    >
      <TouchableOpacity
        style={[
          styles.filterChip,
          selected === "all" && styles.filterChipActive,
        ]}
        onPress={() => onSelect("all")}
      >
        <Text
          style={[
            styles.filterChipLabel,
            selected === "all" && styles.filterChipLabelActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.filterChip,
            selected === cat && styles.filterChipActive,
            selected === cat && { borderColor: getCategoryColor(cat) },
          ]}
          onPress={() => onSelect(cat)}
        >
          <Text
            style={[
              styles.filterChipLabel,
              selected === cat && { color: getCategoryColor(cat) },
            ]}
          >
            {formatCategoryLabel(cat)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Difficulty Segmented Control ───────────────────────────────────

const DIFFICULTY_OPTIONS: Array<{ key: DifficultyLevel; label: string }> = [
  { key: "all", label: "All" },
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

function DifficultySegmentedControl({
  selected,
  onSelect,
}: {
  selected: DifficultyLevel;
  onSelect: (level: DifficultyLevel) => void;
}) {
  return (
    <View style={styles.segmentedControl}>
      {DIFFICULTY_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.segmentedOption,
            selected === opt.key && styles.segmentedOptionActive,
          ]}
          onPress={() => onSelect(opt.key)}
        >
          <Text
            style={[
              styles.segmentedLabel,
              selected === opt.key && styles.segmentedLabelActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Puzzle Row ─────────────────────────────────────────────────────

function PuzzleRow({
  puzzle,
  onPress,
}: {
  puzzle: Puzzle;
  onPress: () => void;
}) {
  const diffScore = puzzle.difficulty?.score ?? 0.5;
  const diffLabel = getDifficultyLabel(diffScore);
  const diffColor = getDifficultyColor(diffScore);
  const wordCount = getWordCount(puzzle.phrase);
  const masked = maskPhrase(puzzle.phrase);
  const catColor = getCategoryColor(puzzle.category);

  return (
    <TouchableOpacity
      style={styles.puzzleRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.puzzleRowTop}>
        <View
          style={[
            styles.puzzleCategoryBadge,
            { backgroundColor: catColor + "22", borderColor: catColor },
          ]}
        >
          <Text style={[styles.puzzleCategoryText, { color: catColor }]}>
            {formatCategoryLabel(puzzle.category)}
          </Text>
        </View>
        <View style={styles.puzzleMetaRight}>
          <View
            style={[
              styles.puzzleDiffBadge,
              { backgroundColor: diffColor + "22" },
            ]}
          >
            <Text style={[styles.puzzleDiffText, { color: diffColor }]}>
              {diffLabel}
            </Text>
          </View>
          <Text style={styles.puzzleWordCount}>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </Text>
        </View>
      </View>
      <Text style={styles.puzzleMasked} numberOfLines={2}>
        {masked}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Puzzle List View ───────────────────────────────────────────────

function PuzzleListView({
  pack,
  onBack,
  onSelectPuzzle,
}: {
  pack: PuzzlePack;
  onBack: () => void;
  onSelectPuzzle: (puzzle: Puzzle) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyLevel>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of pack.puzzles) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return Array.from(counts.keys()).sort();
  }, [pack.puzzles]);

  const filteredPuzzles = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();

    return pack.puzzles.filter((puzzle) => {
      if (categoryFilter !== "all" && puzzle.category !== categoryFilter) {
        return false;
      }
      if (!matchesDifficulty(puzzle, difficultyFilter)) {
        return false;
      }
      if (query.length > 0 && !puzzle.phrase.toUpperCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [pack.puzzles, categoryFilter, difficultyFilter, searchQuery]);

  const renderPuzzle = useCallback(
    ({ item }: { item: Puzzle }) => (
      <PuzzleRow puzzle={item} onPress={() => onSelectPuzzle(item)} />
    ),
    [onSelectPuzzle],
  );

  const keyExtractor = useCallback((item: Puzzle) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.puzzleListHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.puzzleListHeaderInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {pack.name}
          </Text>
          <Text style={styles.subtitle}>
            {filteredPuzzles.length}{" "}
            {filteredPuzzles.length === 1 ? "puzzle" : "puzzles"}
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.slate[400]} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search puzzles..."
          placeholderTextColor={colors.slate[500]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Category filter chips */}
      <CategoryFilterChips
        categories={uniqueCategories}
        selected={categoryFilter}
        onSelect={setCategoryFilter}
      />

      {/* Difficulty filter */}
      <View style={styles.difficultyFilterRow}>
        <DifficultySegmentedControl
          selected={difficultyFilter}
          onSelect={setDifficultyFilter}
        />
      </View>

      {/* Puzzle list */}
      <FlatList
        data={filteredPuzzles}
        renderItem={renderPuzzle}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.puzzleListContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={PuzzleSeparator}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No puzzles match your filters</Text>
          </View>
        }
      />
    </View>
  );
}

function PuzzleSeparator() {
  return <View style={styles.puzzleSeparator} />;
}

// ─── Pack List View ─────────────────────────────────────────────────

function PackListView({
  packs,
  activePackId,
  onSelectPack,
}: {
  packs: PuzzlePack[];
  activePackId: string;
  onSelectPack: (pack: PuzzlePack) => void;
}) {
  const renderItem = useCallback(
    ({ item }: { item: PuzzlePack }) => (
      <PackCard
        pack={item}
        isActive={item.id === activePackId}
        onPress={() => onSelectPack(item)}
      />
    ),
    [activePackId, onSelectPack],
  );

  const keyExtractor = useCallback((item: PuzzlePack) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Puzzle Packs</Text>
        <Text style={styles.subtitle}>{packs.length} packs available</Text>
      </View>
      <FlatList
        data={packs}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

// ─── Main Component ─────────────────────────────────────────────────

export function PackBrowser({
  packs,
  activePackId,
  onSelectPack,
  onSelectPuzzle,
  asModal,
}: PackBrowserProps) {
  const [selectedPack, setSelectedPack] = useState<PuzzlePack | null>(null);

  const handleSelectPuzzle = useCallback(
    (puzzle: Puzzle) => {
      if (selectedPack && onSelectPuzzle) {
        onSelectPuzzle(puzzle, selectedPack);
      } else if (selectedPack) {
        onSelectPack(selectedPack);
      }
    },
    [selectedPack, onSelectPuzzle, onSelectPack],
  );

  const containerStyle = asModal ? styles.modalContainer : styles.container;

  if (selectedPack) {
    return (
      <View style={containerStyle}>
        <PuzzleListView
          pack={selectedPack}
          onBack={() => setSelectedPack(null)}
          onSelectPuzzle={handleSelectPuzzle}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <PackListView
        packs={packs}
        activePackId={activePackId}
        onSelectPack={setSelectedPack}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing[3],
  },
  modalContainer: {
    flex: 1,
    paddingTop: spacing[1],
    maxHeight: 500,
  },
  headerRow: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    marginTop: spacing[0.5],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  separator: {
    height: spacing[3],
  },

  // Pack card
  packCard: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.slate[700],
    ...shadows.md,
  },
  packCardActive: {
    borderColor: colors.yellow[400],
    backgroundColor: "rgba(250, 204, 21, 0.08)",
  },
  packCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  packIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  packCardInfo: {
    flex: 1,
  },
  packName: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  packNameActive: {
    color: colors.yellow[400],
  },
  packDescription: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    marginTop: spacing[0.5],
  },
  packStats: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[3],
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  statBadgeText: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1.5],
    marginTop: spacing[3],
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  categoryChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.xs * 1.3,
  },
  activeBadge: {
    position: "absolute",
    top: spacing[3],
    right: spacing[3],
    backgroundColor: colors.yellow[400],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    color: colors.slate[900],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },

  // Puzzle list header
  puzzleListHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  puzzleListHeaderInfo: {
    flex: 1,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate[700],
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: typography.sizes.base,
    paddingVertical: spacing[2],
  },

  // Category filter chips
  filterChipsScroll: {
    marginBottom: spacing[2],
  },
  filterChipsContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    alignItems: "center",
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.slate[600],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    alignSelf: "center",
  },
  filterChipActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: colors.yellow[400],
  },
  filterChipLabel: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.sm * 1.3,
  },
  filterChipLabelActive: {
    color: colors.yellow[400],
  },

  // Difficulty segmented control
  difficultyFilterRow: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate[700],
    overflow: "hidden",
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: spacing[1.5],
    alignItems: "center",
  },
  segmentedOptionActive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  segmentedLabel: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  segmentedLabelActive: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },

  // Puzzle row
  puzzleRow: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  puzzleRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  puzzleCategoryBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  puzzleCategoryText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  puzzleMetaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  puzzleDiffBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  puzzleDiffText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  puzzleWordCount: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
  },
  puzzleMasked: {
    color: colors.slate[400],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    letterSpacing: 2,
  },

  // Puzzle list content
  puzzleListContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  puzzleSeparator: {
    height: spacing[2],
  },

  // Empty state
  emptyState: {
    paddingVertical: spacing[10],
    alignItems: "center",
  },
  emptyText: {
    color: colors.slate[500],
    fontSize: typography.sizes.base,
  },
});
