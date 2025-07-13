import React from 'react';
import { motion } from 'framer-motion';
import { TbStar, TbCrown, TbTrophy, TbDiamond, TbFlame, TbBolt } from 'react-icons/tb';

const LevelBadge = ({
  level = 1,
  size = 'medium', // 'small', 'medium', 'large', 'xl'
  showTitle = false,
  showGlow = true,
  animated = true,
  className = ''
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-8 h-8',
      text: 'text-xs',
      icon: 'w-3 h-3',
      titleText: 'text-xs'
    },
    medium: {
      container: 'w-12 h-12',
      text: 'text-sm',
      icon: 'w-4 h-4',
      titleText: 'text-sm'
    },
    large: {
      container: 'w-16 h-16',
      text: 'text-lg',
      icon: 'w-5 h-5',
      titleText: 'text-base'
    },
    xl: {
      container: 'w-20 h-20',
      text: 'text-xl',
      icon: 'w-6 h-6',
      titleText: 'text-lg'
    }
  };

  const config = sizeConfig[size];

  // Level configurations with colors, shapes, and titles
  const getLevelConfig = (level) => {
    if (level >= 10) {
      return {
        title: 'Elite',
        icon: TbCrown,
        gradient: 'from-purple-600 via-pink-600 to-red-600',
        glow: 'shadow-purple-500/50',
        shape: 'diamond',
        rarity: 'mythic',
        animation: 'rotate'
      };
    } else if (level >= 8) {
      return {
        title: 'Legend',
        icon: TbTrophy,
        gradient: 'from-yellow-500 via-orange-500 to-red-500',
        glow: 'shadow-yellow-500/50',
        shape: 'star',
        rarity: 'legendary',
        animation: 'bounce'
      };
    } else if (level >= 6) {
      return {
        title: 'Master',
        icon: TbDiamond,
        gradient: 'from-emerald-500 via-blue-500 to-purple-500',
        glow: 'shadow-blue-500/50',
        shape: 'crown',
        rarity: 'epic',
        animation: 'pulse'
      };
    } else if (level >= 4) {
      return {
        title: 'Expert',
        icon: TbFlame,
        gradient: 'from-blue-500 via-purple-500 to-pink-500',
        glow: 'shadow-blue-500/50',
        shape: 'hexagon',
        rarity: 'rare',
        animation: 'glow'
      };
    } else if (level >= 2) {
      return {
        title: 'Student',
        icon: TbBolt,
        gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
        glow: 'shadow-indigo-500/50',
        shape: 'circle',
        rarity: 'uncommon',
        animation: 'pulse'
      };
    } else {
      return {
        title: 'Beginner',
        icon: TbStar,
        gradient: 'from-gray-500 to-gray-600',
        glow: 'shadow-gray-500/50',
        shape: 'circle',
        rarity: 'common',
        animation: 'none'
      };
    }
  };

  const levelConfig = getLevelConfig(level);
  const IconComponent = levelConfig.icon;

  // Animation variants
  const animationVariants = {
    none: {},
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity }
    },
    bounce: {
      y: [0, -2, 0],
      transition: { duration: 1.5, repeat: Infinity }
    },
    rotate: {
      rotate: [0, 360],
      transition: { duration: 3, repeat: Infinity, ease: "linear" }
    },
    glow: {
      boxShadow: [
        '0 0 10px rgba(59, 130, 246, 0.5)',
        '0 0 20px rgba(59, 130, 246, 0.8)',
        '0 0 10px rgba(59, 130, 246, 0.5)'
      ],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  // Shape variants
  const getShapeClasses = (shape) => {
    switch (shape) {
      case 'diamond':
        return 'transform rotate-45';
      case 'star':
        return 'clip-path-star';
      case 'crown':
        return 'clip-path-crown';
      case 'hexagon':
        return 'clip-path-hexagon';
      default:
        return 'rounded-full';
    }
  };

  // Rarity border effects
  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'mythic':
        return 'border-4 border-purple-400 shadow-2xl';
      case 'legendary':
        return 'border-3 border-yellow-400 shadow-xl';
      case 'epic':
        return 'border-2 border-blue-400 shadow-lg';
      case 'rare':
        return 'border-2 border-purple-300 shadow-md';
      case 'uncommon':
        return 'border border-blue-300 shadow-sm';
      default:
        return 'border border-gray-300';
    }
  };

  return (
    <div className={`level-badge-container ${className}`}>
      {/* Main Badge */}
      <motion.div
        variants={animationVariants[levelConfig.animation]}
        animate={animated ? levelConfig.animation : 'none'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          ${config.container} relative flex items-center justify-center
          bg-gradient-to-br ${levelConfig.gradient}
          ${getShapeClasses(levelConfig.shape)}
          ${getRarityBorder(levelConfig.rarity)}
          ${showGlow ? `shadow-lg ${levelConfig.glow}` : ''}
          cursor-pointer overflow-hidden
        `}
      >
        {/* Background pattern for high-level badges */}
        {level >= 6 && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse" />
          </div>
        )}

        {/* Level number or icon */}
        <div className="relative z-10 flex items-center justify-center text-white font-bold">
          {level >= 8 ? (
            <IconComponent className={`${config.icon} drop-shadow-lg`} />
          ) : (
            <span className={`${config.text} drop-shadow-lg`}>
              {level}
            </span>
          )}
        </div>

        {/* Sparkle effects for legendary+ levels */}
        {level >= 8 && (
          <>
            <motion.div
              animate={{ 
                scale: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: 0
              }}
              className="absolute top-1 right-1 w-1 h-1 bg-yellow-300 rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [0, 1, 0],
                rotate: [0, -180, -360]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: 0.5
              }}
              className="absolute bottom-1 left-1 w-1 h-1 bg-white rounded-full"
            />
          </>
        )}

        {/* Premium glow ring for mythic levels */}
        {level >= 10 && (
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-full opacity-75 blur-sm animate-pulse" />
        )}
      </motion.div>

      {/* Level Title */}
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center"
        >
          <p className={`${config.titleText} font-semibold text-gray-700`}>
            {levelConfig.title}
          </p>
          <p className="text-xs text-gray-500">
            Level {level}
          </p>
        </motion.div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
        Level {level} - {levelConfig.title}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

export default LevelBadge;
