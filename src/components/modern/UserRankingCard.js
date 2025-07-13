import React from 'react';
import { TbTrophy, TbMedal, TbCrown, TbStar, TbFlame, TbBolt } from 'react-icons/tb';
import { AchievementList } from './AchievementBadge';
import XPProgressBar from './XPProgressBar';
import LevelBadge from './LevelBadge';
import EnhancedAchievementBadge from './EnhancedAchievementBadge';
import ProfilePicture from '../common/ProfilePicture';

const UserRankingCard = ({
    user,
    rank,
    classRank,
    isCurrentUser = false,
    layout = 'horizontal', // 'horizontal' or 'vertical'
    size = 'medium', // 'small', 'medium', 'large'
    showStats = true,
    className = ''
}) => {
    // Size configurations - Optimized profile circle sizes for better visibility
    const sizeConfig = {
        small: {
            avatar: 'w-12 h-12',
            text: 'text-sm',
            subtext: 'text-xs',
            padding: 'p-3',
            spacing: 'space-x-3'
        },
        medium: {
            avatar: 'w-14 h-14',
            text: 'text-base',
            subtext: 'text-sm',
            padding: 'p-4',
            spacing: 'space-x-4'
        },
        large: {
            avatar: 'w-16 h-16',
            text: 'text-lg',
            subtext: 'text-base',
            padding: 'p-5',
            spacing: 'space-x-5'
        }
    };

    const config = sizeConfig[size];

    // Get subscription status styling with improved status detection
    const getSubscriptionStyling = () => {
        const subscriptionStatus = user?.subscriptionStatus || user?.normalizedSubscriptionStatus || 'free';

        // Normalize status for better handling
        const normalizedStatus = subscriptionStatus.toLowerCase();

        if (normalizedStatus === 'active' || normalizedStatus === 'premium') {
            return {
                avatarClass: 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-white',
                badge: 'status-premium',
                glow: 'shadow-xl shadow-yellow-500/30 hover:shadow-yellow-500/40',
                statusText: 'Premium',
                badgeIcon: '👑',
                borderClass: 'ring-2 ring-yellow-400',
                bgClass: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white shadow-lg border border-yellow-400/50',
                cardBg: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50',
                textColor: 'text-yellow-700',
                borderColor: 'border-yellow-200'
            };
        } else if (normalizedStatus === 'free') {
            return {
                avatarClass: 'ring-2 ring-blue-300 ring-offset-2 ring-offset-white',
                badge: 'status-free',
                glow: 'shadow-md shadow-blue-500/20 hover:shadow-blue-500/30',
                statusText: 'Free',
                badgeIcon: '🆓',
                borderClass: 'ring-2 ring-blue-400',
                bgClass: 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-md border border-blue-400/50',
                cardBg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50',
                textColor: 'text-blue-700',
                borderColor: 'border-blue-200'
            };
        } else {
            return {
                avatarClass: 'ring-2 ring-red-400 ring-offset-2 ring-offset-white opacity-75',
                badge: 'status-expired',
                glow: 'shadow-lg shadow-red-500/25 hover:shadow-red-500/35',
                statusText: 'Expired',
                badgeIcon: '⏰',
                borderClass: 'ring-2 ring-red-400',
                bgClass: 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white shadow-lg border border-red-400/50',
                cardBg: 'bg-gradient-to-br from-red-50 via-pink-50 to-red-50',
                textColor: 'text-red-700',
                borderColor: 'border-red-200'
            };
        }
    };

    const styling = getSubscriptionStyling();

    // Get rank icon and color
    const getRankDisplay = () => {
        const safeRank = rank || 0;
        if (safeRank === 1) {
            return { icon: TbCrown, color: 'text-yellow-500', bg: 'bg-yellow-50' };
        } else if (safeRank === 2) {
            return { icon: TbMedal, color: 'text-gray-400', bg: 'bg-gray-50' };
        } else if (safeRank === 3) {
            return { icon: TbTrophy, color: 'text-amber-600', bg: 'bg-amber-50' };
        } else if (safeRank <= 10 && safeRank > 0) {
            return { icon: TbStar, color: 'text-blue-500', bg: 'bg-blue-50' };
        } else {
            return { icon: null, color: 'text-gray-500', bg: 'bg-gray-50' };
        }
    };

    const rankDisplay = getRankDisplay();
    const RankIcon = rankDisplay.icon;



    // Avatar wrapper with subscription styling (removed unused component)

    if (layout === 'vertical') {
        return (
            <div
                className={`
                    ranking-card flex flex-col items-center text-center ${config.padding}
                    ${styling.cardBg || 'bg-white'} rounded-xl border ${styling.borderColor || 'border-gray-200'}
                    ${styling.glow} transition-all duration-300 hover:scale-105 hover:shadow-xl
                    transform hover:-translate-y-1 animate-fadeInUp
                    ${isCurrentUser ? 'current-user-card ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${className}
                `}
            >
                {/* Rank Badges */}
                <div className="flex items-center space-x-2 mb-3">
                    {/* Overall Rank */}
                    <div className={`
                        rank-badge flex items-center justify-center w-8 h-8 rounded-full
                        ${rankDisplay.bg} ${rankDisplay.color}
                    `}>
                        {RankIcon ? (
                            <RankIcon className="w-4 h-4" />
                        ) : (
                            <span className="text-xs font-bold">#{rank || '?'}</span>
                        )}
                    </div>

                    {/* Class Rank */}
                    {classRank && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
                            <span className="text-xs font-bold">C{classRank}</span>
                        </div>
                    )}
                </div>

                {/* Avatar with Online Status */}
                <div className="mb-3">
                    <ProfilePicture
                        user={user}
                        size="md"
                        showOnlineStatus={true}
                        className="hover:scale-105 transition-transform duration-200"
                        style={{
                            width: config.avatar.includes('w-12') ? '48px' :
                                   config.avatar.includes('w-10') ? '40px' : '32px',
                            height: config.avatar.includes('w-12') ? '48px' :
                                    config.avatar.includes('w-10') ? '40px' : '32px'
                        }}
                    />
                </div>

                {/* User Info */}
                <div className="space-y-1">
                    <h3 className={`font-semibold ${config.text} text-gray-900 truncate max-w-24`}>
                        {user?.name || 'Unknown User'}
                    </h3>

                    {/* XP and Level Info */}
                    <div className="flex items-center space-x-2">
                        <LevelBadge
                            level={user?.currentLevel || 1}
                            size="small"
                            showTitle={false}
                            animated={true}
                        />
                        <div className="flex flex-col">
                            <p className={`${config.subtext} text-blue-600 font-medium`}>
                                {user?.totalXP || 0} XP
                            </p>
                            {user?.xpToNextLevel > 0 && (
                                <p className={`text-xs text-gray-400`}>
                                    {user.xpToNextLevel} to next
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Legacy Points (smaller) */}
                    <p className={`text-xs text-gray-400`}>
                        {user?.totalPoints || 0} pts (legacy)
                    </p>

                    {/* Enhanced Stats */}
                    {user?.averageScore && (
                        <p className={`${config.subtext} text-gray-500`}>
                            Avg: {user.averageScore}%
                        </p>
                    )}

                    {user?.currentStreak > 0 && (
                        <div className="flex items-center space-x-1">
                            <TbFlame className="w-3 h-3 text-orange-500" />
                            <span className={`${config.subtext} text-orange-600 font-medium`}>
                                {user.currentStreak}
                            </span>
                        </div>
                    )}

                    {/* Enhanced Achievements */}
                    {user?.achievements && user.achievements.length > 0 && (
                        <div className="flex items-center space-x-1">
                            {user.achievements.slice(0, 3).map((achievement, index) => (
                                <EnhancedAchievementBadge
                                    key={achievement.id || achievement.type || index}
                                    achievement={achievement}
                                    size="small"
                                    showTooltip={true}
                                    animated={true}
                                    showXP={false}
                                />
                            ))}
                            {user.achievements.length > 3 && (
                                <span className="text-xs text-gray-500 ml-1">
                                    +{user.achievements.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Modern Subscription Badge */}
                    <div className={`
                        inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold
                        ${styling.bgClass} transform hover:scale-105 transition-all duration-200
                        backdrop-blur-sm
                    `}>
                        <span className="text-sm">{styling.badgeIcon}</span>
                        <span>{styling.statusText}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Horizontal layout (default)
    return (
        <div
            className={`
                ranking-card flex items-center ${config.spacing} ${config.padding}
                bg-white rounded-xl border border-gray-200 hover:scale-105 transition-all duration-300
                hover:shadow-xl transform hover:-translate-y-1 animate-fadeInUp
                ${isCurrentUser ? 'current-user-card ring-2 ring-blue-500 ring-offset-2' : ''}
                ${className}
            `}
        >
            {/* Rank Badges */}
            <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Overall Rank */}
                <div className={`
                    rank-badge flex items-center justify-center w-10 h-10 rounded-full
                    ${rankDisplay.bg} ${rankDisplay.color}
                `}>
                    {RankIcon ? (
                        <RankIcon className="w-5 h-5" />
                    ) : (
                        <span className="text-sm font-bold">#{rank || '?'}</span>
                    )}
                </div>

                {/* Class Rank */}
                {classRank && (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700">
                        <span className="text-sm font-bold">C{classRank}</span>
                    </div>
                )}
            </div>

            {/* Avatar with Online Status */}
            <div className="flex-shrink-0">
                <ProfilePicture
                    user={user}
                    size={size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md'}
                    showOnlineStatus={true}
                    className="hover:scale-105 transition-transform duration-200"
                />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`font-semibold ${config.text} text-gray-900 truncate`}>
                        {user?.name || 'Unknown User'}
                    </h3>
                    <LevelBadge
                        level={user?.currentLevel || 1}
                        size="small"
                        showTitle={false}
                        animated={true}
                    />
                    <span className={`
                        px-2 py-1 rounded-full text-xs font-medium flex-shrink-0
                        ${styling.bgClass}
                    `}>
                        {styling.statusText}
                    </span>
                </div>
                
                {showStats && (
                    <div className="flex items-center space-x-4">
                        {/* XP Display */}
                        <div className="flex items-center space-x-1">
                            <TbBolt className="w-3 h-3 text-blue-500" />
                            <span className={`${config.subtext} text-blue-600 font-medium`}>
                                {user?.totalXP || 0} XP
                            </span>
                        </div>

                        {/* Legacy Points (smaller) */}
                        <span className={`text-xs text-gray-400`}>
                            {user?.totalPoints || 0} pts
                        </span>

                        {user?.passedExamsCount !== undefined && (
                            <span className={`${config.subtext} text-green-600`}>
                                {user.passedExamsCount} passed
                            </span>
                        )}
                        {user?.quizzesTaken !== undefined && (
                            <span className={`${config.subtext} text-blue-600`}>
                                {user.quizzesTaken} quizzes
                            </span>
                        )}
                        {user?.averageScore && (
                            <span className={`${config.subtext} text-gray-600`}>
                                {user.averageScore}% avg
                            </span>
                        )}
                        {user?.currentStreak > 0 && (
                            <div className="flex items-center space-x-1">
                                <TbFlame className="w-3 h-3 text-orange-500" />
                                <span className={`${config.subtext} text-orange-600 font-medium`}>
                                    {user.currentStreak}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* XP Progress Bar */}
                {user?.xpToNextLevel > 0 && (
                    <div className="mt-2">
                        <XPProgressBar
                            currentXP={user.totalXP || 0}
                            totalXP={(user.totalXP || 0) + (user.xpToNextLevel || 0)}
                            currentLevel={user.currentLevel || 1}
                            xpToNextLevel={user.xpToNextLevel || 0}
                            size="small"
                            showLevel={false}
                            showXPNumbers={false}
                            showAnimation={false}
                        />
                    </div>
                )}

                {/* Achievements for horizontal layout */}
                {user?.achievements && user.achievements.length > 0 && (
                    <div className="mt-2">
                        <AchievementList
                            achievements={user.achievements}
                            maxDisplay={5}
                            size="small"
                            layout="horizontal"
                        />
                    </div>
                )}
            </div>

            {/* Score and Subscription Badge */}
            <div className="text-right flex-shrink-0 space-y-2">
                <div>
                    <div className={`font-bold ${config.text} ${isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                        {(user.rankingScore || user.score || user.totalXP || user.totalPoints || 0).toLocaleString()}
                    </div>
                    <div className={`${config.subtext} text-gray-500`}>
                        {user.rankingScore ? 'ranking pts' : user.totalXP ? 'XP' : 'points'}
                    </div>
                    {user.breakdown && (
                        <div className="text-xs text-gray-400 mt-1">
                            XP: {(user.totalXP || 0).toLocaleString()}
                        </div>
                    )}
                </div>

                {/* Modern Subscription Badge for Horizontal Layout */}
                <div className={`
                    inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0
                    ${styling.bgClass} transform hover:scale-105 transition-all duration-200
                    backdrop-blur-sm
                `}>
                    <span className="text-xs">{styling.badgeIcon}</span>
                    <span>{styling.statusText}</span>
                </div>
            </div>
        </div>
    );
};

export default UserRankingCard;
