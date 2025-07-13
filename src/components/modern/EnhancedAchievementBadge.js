import React from 'react';
import { motion } from 'framer-motion';
import { TbTrophy, TbMedal, TbStar, TbFlame, TbTarget, TbCrown, TbDiamond, TbBolt, TbUsers, TbBrain, TbRocket } from 'react-icons/tb';

const EnhancedAchievementBadge = ({
    achievement,
    size = 'medium', // 'small', 'medium', 'large'
    showTooltip = true,
    animated = true,
    showXP = false,
    className = ''
}) => {
    if (!achievement) return null;

    // Size configurations
    const sizeConfig = {
        small: {
            container: 'w-6 h-6',
            icon: 'w-3 h-3',
            text: 'text-xs'
        },
        medium: {
            container: 'w-8 h-8',
            icon: 'w-4 h-4',
            text: 'text-sm'
        },
        large: {
            container: 'w-12 h-12',
            icon: 'w-6 h-6',
            text: 'text-base'
        }
    };

    const config = sizeConfig[size];

    // Enhanced achievement mapping with new XP system achievements
    const getAchievementIcon = (id) => {
        const iconMap = {
            // Legacy achievements
            'first_quiz': TbTarget,
            'perfect_score': TbDiamond,
            'streak_5': TbFlame,
            'streak_10': TbFlame,
            'streak_20': TbFlame,
            'subject_master': TbCrown,
            'speed_demon': TbBolt,
            'consistent_learner': TbStar,
            'improvement_star': TbTrophy,
            
            // New XP system achievements
            'first_steps': TbTarget,
            'quick_learner': TbBolt,
            'perfectionist': TbDiamond,
            'on_fire': TbFlame,
            'unstoppable': TbRocket,
            'math_master': TbBrain,
            'science_genius': TbBrain,
            'top_performer': TbCrown,
            'helping_hand': TbUsers
        };
        return iconMap[id] || iconMap[achievement.type] || TbMedal;
    };

    // Enhanced rarity-based colors
    const getRarityColor = (rarity) => {
        const rarityColors = {
            'common': 'from-gray-400 to-gray-600',
            'uncommon': 'from-green-400 to-green-600',
            'rare': 'from-blue-400 to-blue-600',
            'epic': 'from-purple-400 to-purple-600',
            'legendary': 'from-yellow-400 to-orange-500',
            'mythic': 'from-pink-500 to-purple-600'
        };
        return rarityColors[rarity] || rarityColors.common;
    };

    // Fallback to type-based colors for legacy achievements
    const getAchievementColor = (type) => {
        const colorMap = {
            'first_quiz': 'from-green-400 to-green-600',
            'perfect_score': 'from-purple-400 to-purple-600',
            'streak_5': 'from-orange-400 to-red-500',
            'streak_10': 'from-red-400 to-red-600',
            'streak_20': 'from-red-500 to-pink-600',
            'subject_master': 'from-yellow-400 to-yellow-600',
            'speed_demon': 'from-blue-400 to-blue-600',
            'consistent_learner': 'from-indigo-400 to-indigo-600',
            'improvement_star': 'from-pink-400 to-pink-600'
        };
        return colorMap[type] || 'from-gray-400 to-gray-600';
    };

    const IconComponent = getAchievementIcon(achievement.id);
    const colorGradient = achievement.rarity ? 
        getRarityColor(achievement.rarity) : 
        getAchievementColor(achievement.type);

    // Get rarity glow effect
    const getRarityGlow = (rarity) => {
        const glowMap = {
            'common': 'shadow-gray-500/50',
            'uncommon': 'shadow-green-500/50',
            'rare': 'shadow-blue-500/50',
            'epic': 'shadow-purple-500/50',
            'legendary': 'shadow-yellow-500/50',
            'mythic': 'shadow-pink-500/50'
        };
        return glowMap[rarity] || glowMap.common;
    };

    // Enhanced animation based on rarity
    const getRarityAnimation = (rarity) => {
        switch (rarity) {
            case 'legendary':
            case 'mythic':
                return {
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                    transition: { duration: 2, repeat: Infinity, repeatDelay: 2 }
                };
            case 'epic':
                return {
                    y: [0, -2, 0],
                    transition: { duration: 2, repeat: Infinity, repeatDelay: 3 }
                };
            case 'rare':
                return {
                    scale: [1, 1.02, 1],
                    transition: { duration: 3, repeat: Infinity }
                };
            default:
                return {
                    rotate: [0, 2, -2, 0],
                    transition: { duration: 4, repeat: Infinity, repeatDelay: 5 }
                };
        }
    };

    return (
        <div className={`achievement-badge relative group ${className}`}>
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={animated ? getRarityAnimation(achievement.rarity) : {}}
                className={`
                    ${config.container} rounded-full flex items-center justify-center
                    bg-gradient-to-br ${colorGradient}
                    shadow-lg ${getRarityGlow(achievement.rarity)}
                    border-2 border-white
                    cursor-pointer relative overflow-hidden
                `}
            >
                {/* Enhanced shine effect for rare+ achievements */}
                {achievement.rarity && ['rare', 'epic', 'legendary', 'mythic'].includes(achievement.rarity) && (
                    <motion.div
                        animate={{
                            x: ['-100%', '100%'],
                            transition: { duration: 2, repeat: Infinity, repeatDelay: 4 }
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform skew-x-12"
                    />
                )}
                
                {/* Sparkle effects for legendary+ */}
                {achievement.rarity && ['legendary', 'mythic'].includes(achievement.rarity) && (
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
                            className="absolute top-0 right-0 w-1 h-1 bg-yellow-300 rounded-full"
                        />
                        <motion.div
                            animate={{ 
                                scale: [0, 1, 0],
                                rotate: [0, -180, -360]
                            }}
                            transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                delay: 1
                            }}
                            className="absolute bottom-0 left-0 w-1 h-1 bg-white rounded-full"
                        />
                    </>
                )}
                
                {/* Icon */}
                <IconComponent className={`${config.icon} text-white drop-shadow-lg relative z-10`} />

                {/* XP indicator for achievements with XP rewards */}
                {showXP && achievement.xpReward && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {achievement.xpReward}
                    </div>
                )}
            </motion.div>

            {/* Enhanced Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 shadow-xl max-w-xs">
                    <div className="font-semibold">
                        {achievement.name || achievement.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    {achievement.description && (
                        <div className="text-gray-300 text-xs mt-1">
                            {achievement.description}
                        </div>
                    )}
                    {achievement.rarity && (
                        <div className={`text-xs mt-1 font-medium ${
                            achievement.rarity === 'mythic' ? 'text-pink-300' :
                            achievement.rarity === 'legendary' ? 'text-yellow-300' :
                            achievement.rarity === 'epic' ? 'text-purple-300' :
                            achievement.rarity === 'rare' ? 'text-blue-300' :
                            achievement.rarity === 'uncommon' ? 'text-green-300' :
                            'text-gray-300'
                        }`}>
                            {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                        </div>
                    )}
                    {achievement.xpReward && (
                        <div className="text-yellow-300 text-xs mt-1">
                            +{achievement.xpReward} XP
                        </div>
                    )}
                    {achievement.earnedAt && (
                        <div className="text-gray-400 text-xs mt-1">
                            Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                        </div>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
};

export default EnhancedAchievementBadge;
