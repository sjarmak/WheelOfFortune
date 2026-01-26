/**
 * Pack Browser Component
 *
 * Displays available puzzle packs as cards with stats.
 * Each card shows pack name, puzzle count, and category breakdown chips.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Hash, Layers } from 'lucide-react-native';

import { PuzzlePack } from '../engine/packs';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

interface PackBrowserProps {
  packs: PuzzlePack[];
  activePackId: string;
  onSelectPack: (pack: PuzzlePack) => void;
}

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
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function CategoryChip({ category, count }: { category: string; count?: number }) {
  const chipColor = getCategoryColor(category);

  return (
    <View style={[styles.categoryChip, { borderColor: chipColor }]}>
      <Text style={[styles.categoryChipText, { color: chipColor }]}>
        {formatCategoryLabel(category)}
        {count != null ? ` (${count})` : ''}
      </Text>
    </View>
  );
}

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
          <BookOpen size={24} color={isActive ? colors.yellow[400] : colors.white} />
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
          <Text style={styles.statBadgeText}>
            {pack.puzzleCount} puzzles
          </Text>
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

function computeCategoryCounts(pack: PuzzlePack): Array<{ category: string; count: number }> {
  const counts = new Map<string, number>();
  for (const puzzle of pack.puzzles) {
    const current = counts.get(puzzle.category) ?? 0;
    counts.set(puzzle.category, current + 1);
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function PackBrowser({ packs, activePackId, onSelectPack }: PackBrowserProps) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing[3],
  },
  headerRow: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  title: {
    color: colors.white,
    fontSize: typography.sizes['2xl'],
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
  packCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.slate[700],
    ...shadows.md,
  },
  packCardActive: {
    borderColor: colors.yellow[400],
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
  },
  packCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  packIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statBadgeText: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
    marginTop: spacing[3],
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  categoryChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  activeBadge: {
    position: 'absolute',
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
});
