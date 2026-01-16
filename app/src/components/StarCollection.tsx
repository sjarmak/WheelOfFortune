/**
 * Star Collection Component
 *
 * Shows the child's star progress:
 * - Total stars earned
 * - Star milestones with rewards/badges
 * - Simple, fun visualization
 */

import React, { useMemo, useState, useEffect } from 'react';
import { X, Star, Trophy, Award, Crown, Sparkles } from 'lucide-react';

interface StarCollectionProps {
  totalStars: number;
  onClose: () => void;
}

interface Milestone {
  stars: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  unlocked: boolean;
}

export const StarCollection: React.FC<StarCollectionProps> = ({
  totalStars,
  onClose
}) => {
  // Define milestones
  const milestones: Milestone[] = useMemo(() => [
    {
      stars: 5,
      icon: <Star className="w-8 h-8" />,
      title: 'First Stars!',
      description: 'You earned your first 5 stars!',
      color: 'from-yellow-400 to-yellow-600',
      unlocked: totalStars >= 5
    },
    {
      stars: 15,
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Shining Bright',
      description: '15 stars! Keep going!',
      color: 'from-blue-400 to-blue-600',
      unlocked: totalStars >= 15
    },
    {
      stars: 30,
      icon: <Award className="w-8 h-8" />,
      title: 'Star Player',
      description: '30 stars! Amazing!',
      color: 'from-green-400 to-green-600',
      unlocked: totalStars >= 30
    },
    {
      stars: 50,
      icon: <Trophy className="w-8 h-8" />,
      title: 'Star Champion',
      description: '50 stars! Incredible!',
      color: 'from-purple-400 to-purple-600',
      unlocked: totalStars >= 50
    },
    {
      stars: 100,
      icon: <Crown className="w-8 h-8" />,
      title: 'Star Superstar!',
      description: '100 stars! You are amazing!',
      color: 'from-pink-400 to-orange-500',
      unlocked: totalStars >= 100
    }
  ], [totalStars]);

  // Find current progress level
  const currentMilestoneIndex = milestones.findIndex(m => !m.unlocked);
  const nextMilestone = currentMilestoneIndex >= 0 ? milestones[currentMilestoneIndex] : null;
  const previousMilestone = currentMilestoneIndex > 0
    ? milestones[currentMilestoneIndex - 1]
    : (currentMilestoneIndex === -1 ? milestones[milestones.length - 1] : null);

  // Calculate progress to next milestone
  const progressPercent = nextMilestone
    ? ((totalStars - (previousMilestone?.stars || 0)) / (nextMilestone.stars - (previousMilestone?.stars || 0))) * 100
    : 100;

  // Reduce motion support
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">My Stars</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Total stars display */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4 rounded-2xl ${
            !reduceMotion ? 'animate-pulse' : ''
          }`}>
            <Star className="w-10 h-10 text-white fill-white" />
            <span className="text-4xl font-bold text-white">{totalStars}</span>
          </div>
          <p className="text-white/70 mt-2">Total Stars Earned</p>
        </div>

        {/* Progress bar to next milestone */}
        {nextMilestone && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-white/70 mb-2">
              <span>{previousMilestone?.stars || 0} ⭐</span>
              <span>{nextMilestone.stars} ⭐</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <p className="text-center text-white/60 text-sm mt-2">
              {nextMilestone.stars - totalStars} more to unlock: {nextMilestone.title}
            </p>
          </div>
        )}

        {/* Milestone grid */}
        <div className="grid gap-4">
          {milestones.map((milestone, i) => (
            <div
              key={i}
              className={`
                flex items-center gap-4 p-4 rounded-xl
                ${milestone.unlocked
                  ? `bg-gradient-to-r ${milestone.color}`
                  : 'bg-gray-700/50'
                }
                transition-all duration-300
              `}
            >
              {/* Icon */}
              <div className={`
                p-2 rounded-full
                ${milestone.unlocked ? 'bg-white/20 text-white' : 'bg-gray-600 text-gray-400'}
              `}>
                {milestone.icon}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className={`font-bold ${milestone.unlocked ? 'text-white' : 'text-gray-400'}`}>
                  {milestone.title}
                </h3>
                <p className={`text-sm ${milestone.unlocked ? 'text-white/80' : 'text-gray-500'}`}>
                  {milestone.description}
                </p>
              </div>

              {/* Star count */}
              <div className={`
                flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold
                ${milestone.unlocked ? 'bg-white/20 text-white' : 'bg-gray-600 text-gray-400'}
              `}>
                {milestone.stars} ⭐
              </div>
            </div>
          ))}
        </div>

        {/* Encouragement */}
        <p className="text-center text-white/60 text-sm mt-6">
          Keep playing to earn more stars!
        </p>
      </div>
    </div>
  );
};
