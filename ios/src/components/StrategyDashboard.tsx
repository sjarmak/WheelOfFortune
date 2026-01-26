/**
 * Strategy Dashboard Component
 *
 * Displays letter frequency analysis, optimal strategy recommendations,
 * wheel analysis, and category insights for puzzle packs.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { analyzePuzzlePack, LetterFrequency } from '../engine/strategyAnalytics';
import { Puzzle, VOWELS, CONSONANTS } from '../engine/types';
import { colors, typography, spacing, borderRadius } from '../styles/theme';

type TabId = 'frequency' | 'strategy' | 'wheel' | 'categories';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'frequency', label: 'Letter Frequency' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'wheel', label: 'Wheel' },
  { id: 'categories', label: 'Categories' },
];

interface StrategyDashboardProps {
  puzzles: Puzzle[];
}

function getFrequencyColor(rate: number): string {
  if (rate > 70) return colors.green[500];
  if (rate > 40) return colors.yellow[400];
  if (rate > 20) return colors.orange[500];
  return colors.red[500];
}

function LetterFrequencyTab({ frequencies }: { frequencies: LetterFrequency[] }): React.JSX.Element {
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const frequencyMap = new Map(frequencies.map(f => [f.letter, f]));

  const maxRate = Math.max(...frequencies.map(f => f.occurrenceRate), 1);

  const BAR_WIDTH = 10;
  const BAR_GAP = 2;
  const CHART_HEIGHT = 200;
  const LABEL_HEIGHT = 18;
  const PERCENT_HEIGHT = 16;
  const TOTAL_HEIGHT = CHART_HEIGHT + LABEL_HEIGHT + PERCENT_HEIGHT + 4;
  const CHART_WIDTH = allLetters.length * (BAR_WIDTH + BAR_GAP);

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Letter Frequency Distribution</Text>
      <Text style={styles.sectionDesc}>
        How often each letter appears across all puzzles in this pack
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScrollContainer}>
        <Svg width={CHART_WIDTH + 20} height={TOTAL_HEIGHT}>
          {allLetters.map((letter, i) => {
            const freq = frequencyMap.get(letter);
            const rate = freq?.occurrenceRate ?? 0;
            const barHeight = maxRate > 0 ? (rate / maxRate) * CHART_HEIGHT : 0;
            const x = i * (BAR_WIDTH + BAR_GAP) + 10;
            const barColor = getFrequencyColor(rate);

            return (
              <React.Fragment key={letter}>
                {/* Bar */}
                <Rect
                  x={x}
                  y={PERCENT_HEIGHT + CHART_HEIGHT - barHeight}
                  width={BAR_WIDTH}
                  height={barHeight}
                  fill={barColor}
                  rx={2}
                />
                {/* Percentage label above bar */}
                {rate > 0 && (
                  <SvgText
                    x={x + BAR_WIDTH / 2}
                    y={PERCENT_HEIGHT + CHART_HEIGHT - barHeight - 3}
                    fontSize={7}
                    fill={colors.slate[400]}
                    textAnchor="middle"
                  >
                    {Math.round(rate)}%
                  </SvgText>
                )}
                {/* Letter label below bar */}
                <SvgText
                  x={x + BAR_WIDTH / 2}
                  y={PERCENT_HEIGHT + CHART_HEIGHT + LABEL_HEIGHT - 4}
                  fontSize={9}
                  fill={colors.white}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {letter}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.green[500] }]} />
          <Text style={styles.legendText}>&gt;70%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.yellow[400] }]} />
          <Text style={styles.legendText}>40-70%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.orange[500] }]} />
          <Text style={styles.legendText}>20-40%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.red[500] }]} />
          <Text style={styles.legendText}>&lt;20%</Text>
        </View>
      </View>

      {/* Top 10 list */}
      <Text style={styles.sectionTitle}>Top 10 Letters</Text>
      {frequencies.slice(0, 10).map((freq, index) => (
        <View key={freq.letter} style={styles.topLetterRow}>
          <Text style={styles.topLetterRank}>#{index + 1}</Text>
          <Text style={styles.topLetterName}>{freq.letter}</Text>
          <View style={styles.topLetterBarContainer}>
            <View
              style={[
                styles.topLetterBar,
                {
                  width: `${freq.occurrenceRate}%`,
                  backgroundColor: getFrequencyColor(freq.occurrenceRate),
                },
              ]}
            />
          </View>
          <Text style={styles.topLetterPercent}>
            {freq.occurrenceRate.toFixed(1)}%
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function OptimalStrategyTab({
  frequencies,
  topConsonants,
  topVowels,
  optimalFirstGuesses,
  vowelBuyThreshold,
}: {
  frequencies: LetterFrequency[];
  topConsonants: string[];
  topVowels: string[];
  optimalFirstGuesses: string[];
  vowelBuyThreshold: number;
}): React.JSX.Element {
  const frequencyMap = new Map(frequencies.map(f => [f.letter, f]));

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Top 5 Consonants */}
      <Text style={styles.sectionTitle}>Top 5 Consonants</Text>
      <Text style={styles.sectionDesc}>Best consonant guesses based on frequency</Text>
      <View style={styles.letterGrid}>
        {topConsonants.map((letter, index) => {
          const freq = frequencyMap.get(letter);
          const rate = freq?.occurrenceRate ?? 0;
          return (
            <View key={letter} style={styles.letterCard}>
              <Text style={styles.letterCardRank}>#{index + 1}</Text>
              <Text style={styles.letterCardLetter}>{letter}</Text>
              <View style={styles.letterCardBarContainer}>
                <View
                  style={[
                    styles.letterCardBar,
                    {
                      width: `${rate}%`,
                      backgroundColor: getFrequencyColor(rate),
                    },
                  ]}
                />
              </View>
              <Text style={styles.letterCardPercent}>{rate.toFixed(1)}%</Text>
            </View>
          );
        })}
      </View>

      {/* Top 5 Vowels */}
      <Text style={styles.sectionTitle}>Top 5 Vowels</Text>
      <Text style={styles.sectionDesc}>Best vowel purchases based on frequency</Text>
      <View style={styles.letterGrid}>
        {topVowels.map((letter, index) => {
          const freq = frequencyMap.get(letter);
          const rate = freq?.occurrenceRate ?? 0;
          return (
            <View key={letter} style={styles.letterCard}>
              <Text style={styles.letterCardRank}>#{index + 1}</Text>
              <Text style={styles.letterCardLetter}>{letter}</Text>
              <View style={styles.letterCardBarContainer}>
                <View
                  style={[
                    styles.letterCardBar,
                    {
                      width: `${rate}%`,
                      backgroundColor: getFrequencyColor(rate),
                    },
                  ]}
                />
              </View>
              <Text style={styles.letterCardPercent}>{rate.toFixed(1)}%</Text>
            </View>
          );
        })}
      </View>

      {/* RSTLNE Ranking */}
      <Text style={styles.sectionTitle}>RSTLNE Letters Ranked</Text>
      <Text style={styles.sectionDesc}>
        Bonus round given letters ranked by actual frequency in this pack
      </Text>
      <View style={styles.rstlneContainer}>
        {optimalFirstGuesses.map((letter, index) => {
          const freq = frequencyMap.get(letter);
          const rate = freq?.occurrenceRate ?? 0;
          return (
            <View key={letter} style={styles.rstlneRow}>
              <View style={styles.rstlneRankBadge}>
                <Text style={styles.rstlneRankText}>{index + 1}</Text>
              </View>
              <Text style={styles.rstlneLetter}>{letter}</Text>
              <View style={styles.rstlneBarContainer}>
                <View
                  style={[
                    styles.rstlneBar,
                    {
                      width: `${rate}%`,
                      backgroundColor: getFrequencyColor(rate),
                    },
                  ]}
                />
              </View>
              <Text style={styles.rstlnePercent}>{rate.toFixed(1)}%</Text>
            </View>
          );
        })}
      </View>

      {/* Vowel Buy Threshold */}
      <View style={styles.thresholdCard}>
        <Text style={styles.thresholdTitle}>Vowel Buy Threshold</Text>
        <Text style={styles.thresholdValue}>${vowelBuyThreshold}</Text>
        <Text style={styles.thresholdDesc}>
          Recommended minimum round score before buying a vowel
        </Text>
      </View>
    </ScrollView>
  );
}

function PlaceholderTab({ title }: { title: string }): React.JSX.Element {
  return (
    <View style={styles.placeholderTab}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderDesc}>Coming soon</Text>
    </View>
  );
}

export function StrategyDashboard({ puzzles }: StrategyDashboardProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('frequency');

  const analytics = useMemo(() => analyzePuzzlePack(puzzles), [puzzles]);

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      {activeTab === 'frequency' && (
        <LetterFrequencyTab frequencies={analytics.letterFrequencies} />
      )}
      {activeTab === 'strategy' && (
        <OptimalStrategyTab
          frequencies={analytics.letterFrequencies}
          topConsonants={analytics.recommendations.topConsonants}
          topVowels={analytics.recommendations.topVowels}
          optimalFirstGuesses={analytics.recommendations.optimalFirstGuesses}
          vowelBuyThreshold={analytics.recommendations.vowelBuyThreshold}
        />
      )}
      {activeTab === 'wheel' && (
        <PlaceholderTab title="Wheel Analysis" />
      )}
      {activeTab === 'categories' && (
        <PlaceholderTab title="Category Insights" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[700],
  },
  tabBarContent: {
    paddingHorizontal: spacing[3],
    gap: spacing[1],
  },
  tab: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.yellow[400],
  },
  tabText: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  activeTabText: {
    color: colors.yellow[400],
    fontWeight: typography.weights.bold,
  },
  tabContent: {
    flex: 1,
    padding: spacing[4],
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: spacing[4],
    marginBottom: spacing[1],
  },
  sectionDesc: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    marginBottom: spacing[3],
  },
  chartScrollContainer: {
    marginVertical: spacing[3],
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing[2],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
  },
  topLetterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1.5],
    gap: spacing[2],
  },
  topLetterRank: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    width: 24,
  },
  topLetterName: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    width: 20,
  },
  topLetterBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  topLetterBar: {
    height: '100%',
    borderRadius: 6,
  },
  topLetterPercent: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    width: 48,
    textAlign: 'right',
  },
  letterGrid: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  letterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.base,
    padding: spacing[3],
    gap: spacing[2],
  },
  letterCardRank: {
    color: colors.slate[400],
    fontSize: typography.sizes.xs,
    width: 20,
  },
  letterCardLetter: {
    color: colors.white,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    width: 28,
  },
  letterCardBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  letterCardBar: {
    height: '100%',
    borderRadius: 4,
  },
  letterCardPercent: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    width: 48,
    textAlign: 'right',
  },
  rstlneContainer: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  rstlneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  rstlneRankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.yellow[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rstlneRankText: {
    color: colors.slate[900],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  rstlneLetter: {
    color: colors.white,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    width: 24,
  },
  rstlneBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  rstlneBar: {
    height: '100%',
    borderRadius: 5,
  },
  rstlnePercent: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    width: 48,
    textAlign: 'right',
  },
  thresholdCard: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderWidth: 1,
    borderColor: colors.yellow[400],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[8],
  },
  thresholdTitle: {
    color: colors.yellow[400],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  thresholdValue: {
    color: colors.white,
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
  },
  thresholdDesc: {
    color: colors.slate[400],
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  placeholderTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  placeholderDesc: {
    color: colors.slate[400],
    fontSize: typography.sizes.base,
  },
});
