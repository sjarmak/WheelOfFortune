/**
 * Star Collection Component
 *
 * Shows the child's star progress with milestones.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Star, Trophy, Award, Crown, Sparkles } from 'lucide-react-native';
import { Modal } from './Modal';
import { colors, typography, spacing, borderRadius } from '../styles/theme';

interface StarCollectionProps {
  totalStars: number;
  visible: boolean;
  onClose: () => void;
}

interface Milestone {
  stars: number;
  icon: typeof Star;
  title: string;
  description: string;
  gradientColors: [string, string];
  unlocked: boolean;
}

export function StarCollection({
  totalStars,
  visible,
  onClose,
}: StarCollectionProps): React.JSX.Element {
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const milestones: Milestone[] = useMemo(
    () => [
      {
        stars: 5,
        icon: Star,
        title: 'First Stars!',
        description: 'You earned your first 5 stars!',
        gradientColors: [colors.yellow[400], colors.yellow[500]],
        unlocked: totalStars >= 5,
      },
      {
        stars: 15,
        icon: Sparkles,
        title: 'Shining Bright',
        description: '15 stars! Keep going!',
        gradientColors: [colors.blue[400], colors.blue[600]],
        unlocked: totalStars >= 15,
      },
      {
        stars: 30,
        icon: Award,
        title: 'Star Player',
        description: '30 stars! Amazing!',
        gradientColors: [colors.green[400], colors.green[600]],
        unlocked: totalStars >= 30,
      },
      {
        stars: 50,
        icon: Trophy,
        title: 'Star Champion',
        description: '50 stars! Incredible!',
        gradientColors: [colors.purple[500], colors.purple[700]],
        unlocked: totalStars >= 50,
      },
      {
        stars: 100,
        icon: Crown,
        title: 'Star Superstar!',
        description: '100 stars! You are amazing!',
        gradientColors: [colors.pink[400], colors.orange[500]],
        unlocked: totalStars >= 100,
      },
    ],
    [totalStars]
  );

  const currentMilestoneIndex = milestones.findIndex((m) => !m.unlocked);
  const nextMilestone =
    currentMilestoneIndex >= 0 ? milestones[currentMilestoneIndex] : null;
  const previousMilestone =
    currentMilestoneIndex > 0
      ? milestones[currentMilestoneIndex - 1]
      : currentMilestoneIndex === -1
      ? milestones[milestones.length - 1]
      : null;

  const progressPercent = nextMilestone
    ? ((totalStars - (previousMilestone?.stars || 0)) /
        (nextMilestone.stars - (previousMilestone?.stars || 0))) *
      100
    : 100;

  return (
    <Modal visible={visible} onClose={onClose} title="My Stars">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Total stars display */}
        <View style={styles.totalContainer}>
          <Animated.View style={pulseStyle}>
            <LinearGradient
              colors={[colors.yellow[400], colors.orange[500]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.totalBadge}
            >
              <Star size={40} color={colors.white} fill={colors.white} />
              <Text style={styles.totalNumber}>{totalStars}</Text>
            </LinearGradient>
          </Animated.View>
          <Text style={styles.totalLabel}>Total Stars Earned</Text>
        </View>

        {/* Progress bar to next milestone */}
        {nextMilestone && (
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                {previousMilestone?.stars || 0} ⭐
              </Text>
              <Text style={styles.progressLabel}>{nextMilestone.stars} ⭐</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[colors.yellow[400], colors.orange[500]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, progressPercent)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressHint}>
              {nextMilestone.stars - totalStars} more to unlock:{' '}
              {nextMilestone.title}
            </Text>
          </View>
        )}

        {/* Milestone list */}
        <View style={styles.milestoneList}>
          {milestones.map((milestone, i) => {
            const IconComponent = milestone.icon;
            return (
              <View key={i} style={styles.milestoneItem}>
                {milestone.unlocked ? (
                  <LinearGradient
                    colors={milestone.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.milestoneGradient}
                  >
                    <View style={styles.milestoneIconUnlocked}>
                      <IconComponent size={32} color={colors.white} />
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneTitleUnlocked}>
                        {milestone.title}
                      </Text>
                      <Text style={styles.milestoneDescUnlocked}>
                        {milestone.description}
                      </Text>
                    </View>
                    <View style={styles.milestoneStarsBadge}>
                      <Text style={styles.milestoneStarsText}>
                        {milestone.stars} ⭐
                      </Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.milestoneLocked}>
                    <View style={styles.milestoneIconLocked}>
                      <IconComponent size={32} color={colors.slate[500]} />
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneTitleLocked}>
                        {milestone.title}
                      </Text>
                      <Text style={styles.milestoneDescLocked}>
                        {milestone.description}
                      </Text>
                    </View>
                    <View style={styles.milestoneStarsLocked}>
                      <Text style={styles.milestoneStarsLockedText}>
                        {milestone.stars} ⭐
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.encouragement}>
          Keep playing to earn more stars!
        </Text>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  totalContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: borderRadius['2xl'],
  },
  totalNumber: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  totalLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing[2],
  },
  progressSection: {
    marginBottom: spacing[8],
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBar: {
    height: 16,
    backgroundColor: colors.slate[700],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressHint: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: typography.sizes.sm,
    marginTop: spacing[2],
  },
  milestoneList: {
    gap: spacing[4],
  },
  milestoneItem: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  milestoneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[4],
  },
  milestoneLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[4],
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
  },
  milestoneIconUnlocked: {
    padding: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
  },
  milestoneIconLocked: {
    padding: spacing[2],
    backgroundColor: colors.slate[600],
    borderRadius: borderRadius.full,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitleUnlocked: {
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  milestoneTitleLocked: {
    fontWeight: typography.weights.bold,
    color: colors.slate[400],
  },
  milestoneDescUnlocked: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  milestoneDescLocked: {
    fontSize: typography.sizes.sm,
    color: colors.slate[500],
  },
  milestoneStarsBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
  },
  milestoneStarsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  milestoneStarsLocked: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.slate[600],
    borderRadius: borderRadius.full,
  },
  milestoneStarsLockedText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.slate[400],
  },
  encouragement: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: typography.sizes.sm,
    marginTop: spacing[6],
  },
});
