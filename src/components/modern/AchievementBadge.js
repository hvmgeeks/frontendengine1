import React from 'react';
import { motion } from 'framer-motion';
import { 
  TbTrophy, 
  TbMedal, 
  TbCrown, 
  TbStar, 
  TbFlame, 
  TbTarget, 
  TbTrendingUp, 
  TbBolt,
  TbAward,
  TbDiamond
} from 'react-icons/tb';

const AchievementBadge = ({ 
  achievement, 
  size = 'medium', 
  showDetails = true, 
  className = '',
  onClick = null 
}) => {
  // Achievement type configurations
  const achievementConfig = {
    first_quiz: {
      icon: TbStar,
      title: 'First Steps',
      description: 'Completed your first quiz',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    perfect_score: {
      icon: TbTrophy,
      title: 'Perfect Score',
      description: 'Achieved 100% on a quiz',
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    streak_5: {
      icon: TbFlame,
      title: 'Hot Streak',
      description: '5 correct answers in a row',
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    streak_10: {
      icon: TbFlame,
      title: 'Fire Streak',
      description: '10 correct answers in a row',
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    streak_20: {
      icon: TbFlame,
      title: 'Blazing Streak',
      description: '20 correct answers in a row',
      color: 'from-red-500 to-purple-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    subject_master: {
      icon: TbCrown,
      title: 'Subject Master',
      description: 'Mastered a subject',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    speed_demon: {
      icon: TbBolt,
      title: 'Speed Demon',
      description: 'Completed quiz in record time',
      color: 'from-cyan-400 to-blue-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700'
    },
    consistent_learner: {
      icon: TbTarget,
      title: 'Consistent Learner',
      description: 'Maintained consistent performance',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    improvement_star: {
      icon: TbTrendingUp,
      title: 'Improvement Star',
      description: 'Showed remarkable improvement',
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-xs',
      padding: 'p-2'
    },
    medium: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-sm',
      padding: 'p-3'
    },
    large: {
      container: 'w-20 h-20',
      icon: 'w-10 h-10',
      text: 'text-base',
      padding: 'p-4'
    }
  };

  const config = achievementConfig[achievement.type] || achievementConfig.first_quiz;
  const sizes = sizeConfig[size];
  const IconComponent = config.icon;

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    hover: { 
      scale: 1.1, 
      rotate: 5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const glowVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={badgeVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={onClick}
      className={`
        relative cursor-pointer group
        ${className}
      `}
    >
      {/* Glow effect */}
      <motion.div
        variants={glowVariants}
        className={`
          absolute inset-0 rounded-full blur-md opacity-75
          bg-gradient-to-r ${config.color}
          ${sizes.container}
        `}
      />
      
      {/* Main badge */}
      <div className={`
        relative flex items-center justify-center rounded-full
        bg-gradient-to-r ${config.color}
        ${sizes.container} ${sizes.padding}
        shadow-lg border-2 border-white
        group-hover:shadow-xl transition-shadow duration-200
      `}>
        <IconComponent className={`${sizes.icon} text-white drop-shadow-sm`} />
      </div>

      {/* Achievement details tooltip */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          whileHover={{ opacity: 1, y: 0, scale: 1 }}
          className={`
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
            ${config.bgColor} ${config.textColor}
            px-3 py-2 rounded-lg shadow-lg border
            whitespace-nowrap z-10
            pointer-events-none
            ${sizes.text}
          `}
        >
          <div className="font-semibold">{config.title}</div>
          <div className="text-xs opacity-75">{config.description}</div>
          {achievement.subject && (
            <div className="text-xs font-medium mt-1">
              Subject: {achievement.subject}
            </div>
          )}
          {achievement.earnedAt && (
            <div className="text-xs opacity-60 mt-1">
              {new Date(achievement.earnedAt).toLocaleDateString()}
            </div>
          )}
          
          {/* Tooltip arrow */}
          <div className={`
            absolute top-full left-1/2 transform -translate-x-1/2
            w-0 h-0 border-l-4 border-r-4 border-t-4
            border-l-transparent border-r-transparent
            ${config.bgColor.replace('bg-', 'border-t-')}
          `} />
        </motion.div>
      )}
    </motion.div>
  );
};

// Achievement list component
export const AchievementList = ({
  achievements = [],
  maxDisplay = 5,
  size = 'medium',
  layout = 'horizontal', // 'horizontal' or 'grid'
  className = ''
}) => {
  const displayAchievements = achievements.slice(0, maxDisplay);
  const remainingCount = Math.max(0, achievements.length - maxDisplay);

  // Size configurations for the list
  const sizeConfig = {
    small: {
      container: 'w-12 h-12',
      text: 'text-xs',
      padding: 'p-2'
    },
    medium: {
      container: 'w-16 h-16',
      text: 'text-sm',
      padding: 'p-3'
    },
    large: {
      container: 'w-20 h-20',
      text: 'text-base',
      padding: 'p-4'
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const layoutClasses = layout === 'grid'
    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4'
    : 'flex flex-wrap gap-2';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`${layoutClasses} ${className}`}
    >
      {displayAchievements.map((achievement, index) => (
        <AchievementBadge
          key={`${achievement.type}-${index}`}
          achievement={achievement}
          size={size}
          showDetails={true}
        />
      ))}

      {remainingCount > 0 && (
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 }
          }}
          className={`
            flex items-center justify-center rounded-full
            bg-gray-100 border-2 border-gray-200
            ${sizeConfig[size]?.container} ${sizeConfig[size]?.padding}
            text-gray-600 font-semibold
            ${sizeConfig[size]?.text}
          `}
        >
          +{remainingCount}
        </motion.div>
      )}
    </motion.div>
  );
};

// Achievement notification component
export const AchievementNotification = ({
  achievement,
  onClose,
  autoClose = true,
  duration = 4000
}) => {
  // Achievement type configurations for notifications
  const achievementConfig = {
    first_quiz: {
      icon: TbStar,
      title: 'First Steps',
      description: 'Completed your first quiz',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    perfect_score: {
      icon: TbTrophy,
      title: 'Perfect Score',
      description: 'Achieved 100% on a quiz',
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    streak_5: {
      icon: TbFlame,
      title: 'Hot Streak',
      description: '5 correct answers in a row',
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    streak_10: {
      icon: TbFlame,
      title: 'Fire Streak',
      description: '10 correct answers in a row',
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    streak_20: {
      icon: TbFlame,
      title: 'Blazing Streak',
      description: '20 correct answers in a row',
      color: 'from-red-500 to-purple-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    subject_master: {
      icon: TbCrown,
      title: 'Subject Master',
      description: 'Mastered a subject',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    speed_demon: {
      icon: TbBolt,
      title: 'Speed Demon',
      description: 'Completed quiz in record time',
      color: 'from-cyan-400 to-blue-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700'
    },
    consistent_learner: {
      icon: TbTarget,
      title: 'Consistent Learner',
      description: 'Maintained consistent performance',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    improvement_star: {
      icon: TbTrendingUp,
      title: 'Improvement Star',
      description: 'Showed remarkable improvement',
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  };

  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const config = achievementConfig[achievement.type] || achievementConfig.first_quiz;
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`
        fixed top-4 right-4 z-50
        ${config.bgColor} border border-gray-200
        rounded-lg shadow-lg p-4 max-w-sm
      `}
    >
      <div className="flex items-center space-x-3">
        <div className={`
          flex items-center justify-center w-12 h-12 rounded-full
          bg-gradient-to-r ${config.color}
        `}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <div className={`font-semibold ${config.textColor}`}>
            Achievement Unlocked!
          </div>
          <div className="text-sm text-gray-600">
            {config.title}
          </div>
          <div className="text-xs text-gray-500">
            {config.description}
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default AchievementBadge;
