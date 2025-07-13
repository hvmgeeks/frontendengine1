import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TbFlame, TbTrophy, TbBolt } from 'react-icons/tb';

const XPProgressBar = ({
  currentXP = 0,
  totalXP = 0,
  currentLevel = 1,
  xpToNextLevel = 100,
  showAnimation = true,
  size = 'medium', // 'small', 'medium', 'large'
  showLevel = true,
  showXPNumbers = true,
  className = ''
}) => {
  const [animatedXP, setAnimatedXP] = useState(0);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  // Calculate progress percentage
  const xpForCurrentLevel = totalXP - xpToNextLevel;
  const xpProgressInLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = totalXP - xpForCurrentLevel;
  const progressPercentage = Math.min(100, Math.max(0, (xpProgressInLevel / xpNeededForLevel) * 100));

  // Size configurations
  const sizeConfig = {
    small: {
      height: 'h-2',
      levelSize: 'w-6 h-6 text-xs',
      textSize: 'text-xs',
      padding: 'px-2 py-1'
    },
    medium: {
      height: 'h-3',
      levelSize: 'w-8 h-8 text-sm',
      textSize: 'text-sm',
      padding: 'px-3 py-2'
    },
    large: {
      height: 'h-4',
      levelSize: 'w-10 h-10 text-base',
      textSize: 'text-base',
      padding: 'px-4 py-3'
    }
  };

  const config = sizeConfig[size];

  // Animate XP changes
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimatedXP(currentXP);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedXP(currentXP);
    }
  }, [currentXP, showAnimation]);

  // Level up animation
  const triggerLevelUpAnimation = () => {
    setIsLevelingUp(true);
    setTimeout(() => setIsLevelingUp(false), 2000);
  };

  // Get level color based on level
  const getLevelColor = (level) => {
    if (level >= 10) return 'from-purple-600 to-pink-600';
    if (level >= 8) return 'from-yellow-500 to-orange-600';
    if (level >= 6) return 'from-green-500 to-blue-600';
    if (level >= 4) return 'from-blue-500 to-purple-600';
    if (level >= 2) return 'from-indigo-500 to-blue-600';
    return 'from-gray-500 to-gray-600';
  };

  // Get XP bar gradient based on progress
  const getXPBarGradient = () => {
    if (progressPercentage >= 90) return 'from-yellow-400 via-orange-500 to-red-500';
    if (progressPercentage >= 70) return 'from-green-400 via-blue-500 to-purple-500';
    if (progressPercentage >= 50) return 'from-blue-400 via-purple-500 to-pink-500';
    if (progressPercentage >= 25) return 'from-indigo-400 via-blue-500 to-cyan-500';
    return 'from-gray-400 via-gray-500 to-gray-600';
  };

  return (
    <div className={`xp-progress-container ${className}`}>
      {/* Level Up Animation Overlay */}
      <AnimatePresence>
        {isLevelingUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-4xl mb-2"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold mb-1">LEVEL UP!</h2>
              <p className="text-lg">You reached Level {currentLevel}!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center space-x-3">
        {/* Level Badge */}
        {showLevel && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`
              ${config.levelSize} rounded-full flex items-center justify-center
              bg-gradient-to-r ${getLevelColor(currentLevel)}
              text-white font-bold shadow-lg border-2 border-white
              relative overflow-hidden
            `}
          >
            {/* Level glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            
            {/* Level number */}
            <span className={`relative z-10 ${config.textSize}`}>
              {currentLevel}
            </span>

            {/* Level icon for high levels */}
            {currentLevel >= 10 && (
              <TbTrophy className="absolute top-0 right-0 w-3 h-3 text-yellow-300" />
            )}
          </motion.div>
        )}

        {/* XP Progress Bar Container */}
        <div className="flex-1">
          {/* XP Numbers */}
          {showXPNumbers && (
            <div className={`flex justify-between items-center mb-1 ${config.textSize} text-gray-600`}>
              <span className="font-medium">
                {animatedXP.toLocaleString()} XP
              </span>
              <span className="text-gray-500">
                {xpToNextLevel > 0 ? `${xpToNextLevel} to next level` : 'Max Level'}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className={`
            relative ${config.height} bg-gray-200 rounded-full overflow-hidden
            shadow-inner border border-gray-300
          `}>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200" />
            
            {/* Progress fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`
                absolute inset-y-0 left-0 rounded-full
                bg-gradient-to-r ${getXPBarGradient()}
                shadow-lg relative overflow-hidden
              `}
            >
              {/* Animated shine effect */}
              <motion.div
                animate={{ x: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform skew-x-12"
              />
              
              {/* Progress glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>

            {/* XP gain animation particles */}
            <AnimatePresence>
              {showAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: -20 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <TbBolt className="w-4 h-4 text-yellow-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Level progress indicators */}
          {xpToNextLevel > 0 && (
            <div className="flex justify-between mt-1">
              <span className={`${config.textSize} text-gray-500 font-medium`}>
                Level {currentLevel}
              </span>
              <span className={`${config.textSize} text-gray-500 font-medium`}>
                Level {currentLevel + 1}
              </span>
            </div>
          )}
        </div>

        {/* XP Boost Indicator */}
        {currentLevel > 1 && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center space-x-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-2 py-1 rounded-full border border-yellow-300"
          >
            <TbFlame className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-medium text-orange-700">
              +{((currentLevel - 1) * 10)}% XP
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default XPProgressBar;
