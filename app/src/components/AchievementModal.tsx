/**
 * Achievement Modal Component
 *
 * Celebrates when a kid unlocks a new achievement milestone
 * Shows confetti animation and announces the reward
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement, getShopItem } from '../engine/shopTypes';
import { speak } from '../engine/tts';

interface AchievementModalProps {
  achievement: Achievement;
  onClose: () => void;
  onClaim: () => void;
}

// Generate random confetti pieces
const generateConfetti = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // percentage across screen
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF69B4'][
      Math.floor(Math.random() * 6)
    ],
    rotation: Math.random() * 360,
    size: 8 + Math.random() * 12,
  }));
};

export const AchievementModal: React.FC<AchievementModalProps> = ({
  achievement,
  onClose,
  onClaim,
}) => {
  const [confetti] = useState(() => generateConfetti(50));
  const [claimed, setClaimed] = useState(false);

  // Get reward items info
  const rewardItems = achievement.rewardItemIds
    .map(id => getShopItem(id))
    .filter(item => item !== undefined);

  // Announce achievement with TTS
  useEffect(() => {
    const rewardNames = rewardItems.map(item => item?.name).join(' and ');
    speak(`Congratulations! You earned ${achievement.title}! You got a free ${rewardNames}!`);
  }, [achievement.title]);

  const handleClaim = () => {
    setClaimed(true);
    onClaim();
    // Close after animation
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80"
        onClick={claimed ? undefined : onClose}
      />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              x: `${piece.x}vw`,
              y: -20,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              rotate: piece.rotation + 720,
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.size > 12 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* Modal content */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="relative z-10 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500
          rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
      >
        {/* Star burst decoration */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-8 -right-8 w-24 h-24 opacity-30"
        >
          <div className="w-full h-full bg-white rounded-full blur-xl" />
        </motion.div>

        {/* Achievement icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="text-7xl mb-4"
        >
          {achievement.icon}
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-2 drop-shadow-lg"
        >
          {achievement.title}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/90 text-lg mb-6"
        >
          {achievement.description}
        </motion.p>

        {/* Reward section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/20 rounded-2xl p-4 mb-6"
        >
          <p className="text-white/80 text-sm mb-3">You earned:</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {rewardItems.map((item) => (
              <div
                key={item?.id}
                className="flex flex-col items-center bg-white/20 rounded-xl px-4 py-3"
              >
                <span className="text-4xl mb-1">{item?.icon}</span>
                <span className="text-white font-bold text-sm">{item?.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Claim button */}
        <AnimatePresence mode="wait">
          {!claimed ? (
            <motion.button
              key="claim"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClaim}
              className="w-full py-4 bg-white rounded-2xl font-bold text-2xl
                text-orange-500 shadow-lg hover:shadow-xl transition-shadow"
            >
              Claim Reward!
            </motion.button>
          ) : (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full py-4 bg-green-500 rounded-2xl font-bold text-2xl text-white"
            >
              Added to Treasure Box!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stars decoration */}
        <div className="absolute -bottom-4 -left-4 text-4xl opacity-50">⭐</div>
        <div className="absolute top-4 -left-6 text-3xl opacity-50">✨</div>
        <div className="absolute -top-4 left-1/2 text-3xl opacity-50">🌟</div>
      </motion.div>
    </div>
  );
};
