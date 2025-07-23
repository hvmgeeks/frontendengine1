import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  TbTrophy,
  TbCrown,
  TbStar,
  TbFlame,
  TbBrain,

  TbRefresh,
  TbMedal,
  TbRocket,
  TbDiamond,
  TbAward,
  TbShield,
  TbUsers
} from 'react-icons/tb';
import { getAllReportsForRanking, getXPLeaderboard, getUserRanking } from '../../../apicalls/reports';
import { getAllUsers } from '../../../apicalls/users';
import ProfilePicture from '../../../components/common/ProfilePicture';
import OnlineStatusIndicator from '../../../components/common/OnlineStatusIndicator';

const AmazingRankingPage = () => {
  const userState = useSelector((state) => state.users || {});
  const reduxUser = userState.user || null;

  // Try multiple sources for user data
  const localStorageUser = (() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  })();

  const tokenUser = (() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      }
      return null;
    } catch {
      return null;
    }
  })();

  // Use the first available user data
  const user = reduxUser || localStorageUser || tokenUser;

  // State for full user data
  const [fullUserData, setFullUserData] = useState(null);

  // Debug: Log all user sources
  console.log('🔍 User Data Sources:', {
    redux: reduxUser,
    localStorage: localStorageUser,
    token: tokenUser,
    final: user
  });

  // Debug: Log user data structure for migrated users (simplified)
  if (user && !fullUserData) {
    console.log('🔍 Loading user data for:', user.userId);
  }
  const navigate = useNavigate();
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [viewMode, setViewMode] = useState('global');
  const [showStats, setShowStats] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [motivationalQuote, setMotivationalQuote] = useState('');

  const [currentUserLeague, setCurrentUserLeague] = useState(null);
  const [leagueUsers, setLeagueUsers] = useState([]);
  const [showLeagueView, setShowLeagueView] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagueGroups, setLeagueGroups] = useState({});
  const [userHasBeenShown, setUserHasBeenShown] = useState(false);
  const [autoScrollCompleted, setAutoScrollCompleted] = useState(false);

  // Refs for league sections
  const leagueRefs = useRef({});
  const headerRef = useRef(null);
  const currentUserRef = useRef(null);
  const podiumUserRef = useRef(null);
  const listUserRef = useRef(null);

  // Motivational quotes for different performance levels
  const motivationalQuotes = [
    "🚀 Every expert was once a beginner. Keep climbing!",
    "⭐ Your potential is endless. Show them what you're made of!",
    "🔥 Champions are made in the moments when nobody's watching.",
    "💎 Pressure makes diamonds. You're becoming brilliant!",
    "🎯 Success is not final, failure is not fatal. Keep going!",
    "⚡ The only impossible journey is the one you never begin.",
    "🌟 Believe in yourself and all that you are capable of!",
    "🏆 Greatness is not about being better than others, it's about being better than yesterday.",
    "💪 Your only limit is your mind. Break through it!",
    "🎨 Paint your success with the colors of determination!"
  ];

  // Enhanced League System with Duolingo-style progression
  const leagueSystem = {
    mythic: {
      min: 50000,
      color: 'from-purple-300 via-pink-300 via-red-300 to-orange-300',
      bgColor: 'bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-red-900/50',
      textColor: '#FFD700',
      nameColor: '#FF1493',
      shadowColor: 'rgba(255, 20, 147, 0.9)',
      glow: 'shadow-pink-500/90',
      icon: TbCrown,
      title: 'MYTHIC',
      description: 'Legendary Master',
      borderColor: '#FF1493',
      effect: 'mythic-aura',
      leagueIcon: '👑',
      promotionXP: 0, // Max league
      relegationXP: 40000,
      maxUsers: 10
    },
    legendary: {
      min: 25000,
      color: 'from-purple-400 via-indigo-400 via-blue-400 to-cyan-400',
      bgColor: 'bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-blue-900/40',
      textColor: '#8A2BE2',
      nameColor: '#9370DB',
      shadowColor: 'rgba(138, 43, 226, 0.9)',
      glow: 'shadow-purple-500/80',
      icon: TbDiamond,
      title: 'LEGENDARY',
      description: 'Elite Champion',
      borderColor: '#8A2BE2',
      effect: 'legendary-sparkle',
      leagueIcon: '💎',
      promotionXP: 50000,
      relegationXP: 20000,
      maxUsers: 25
    },
    diamond: {
      min: 12000,
      color: 'from-cyan-300 via-blue-300 via-indigo-300 to-purple-300',
      bgColor: 'bg-gradient-to-br from-cyan-900/40 via-blue-900/40 to-indigo-900/40',
      textColor: '#00CED1',
      nameColor: '#40E0D0',
      shadowColor: 'rgba(0, 206, 209, 0.9)',
      glow: 'shadow-cyan-400/80',
      icon: TbShield,
      title: 'DIAMOND',
      description: 'Expert Level',
      borderColor: '#00CED1',
      effect: 'diamond-shine',
      leagueIcon: '🛡️',
      promotionXP: 25000,
      relegationXP: 8000,
      maxUsers: 50
    },
    platinum: {
      min: 6000,
      color: 'from-slate-300 via-gray-300 via-zinc-300 to-stone-300',
      bgColor: 'bg-gradient-to-br from-slate-800/40 via-gray-800/40 to-zinc-800/40',
      textColor: '#C0C0C0',
      nameColor: '#D3D3D3',
      shadowColor: 'rgba(192, 192, 192, 0.9)',
      glow: 'shadow-slate-400/80',
      icon: TbAward,
      title: 'PLATINUM',
      description: 'Advanced',
      borderColor: '#C0C0C0',
      effect: 'platinum-gleam',
      leagueIcon: '🏆',
      promotionXP: 12000,
      relegationXP: 4000,
      maxUsers: 100
    },
    gold: {
      min: 3000,
      color: 'from-yellow-300 via-amber-300 via-orange-300 to-red-300',
      bgColor: 'bg-gradient-to-br from-yellow-900/40 via-amber-900/40 to-orange-900/40',
      textColor: '#FFD700',
      nameColor: '#FFA500',
      shadowColor: 'rgba(255, 215, 0, 0.9)',
      glow: 'shadow-yellow-400/80',
      icon: TbTrophy,
      title: 'GOLD',
      description: 'Skilled',
      borderColor: '#FFD700',
      effect: 'gold-glow',
      leagueIcon: '🥇',
      promotionXP: 6000,
      relegationXP: 2000,
      maxUsers: 200
    },
    silver: {
      min: 1500,
      color: 'from-gray-300 via-slate-300 via-zinc-300 to-gray-300',
      bgColor: 'bg-gradient-to-br from-gray-800/40 via-slate-800/40 to-zinc-800/40',
      textColor: '#C0C0C0',
      nameColor: '#B8B8B8',
      shadowColor: 'rgba(192, 192, 192, 0.9)',
      glow: 'shadow-gray-400/80',
      icon: TbMedal,
      title: 'SILVER',
      description: 'Improving',
      borderColor: '#C0C0C0',
      effect: 'silver-shimmer',
      leagueIcon: '🥈',
      promotionXP: 3000,
      relegationXP: 800,
      maxUsers: 300
    },
    bronze: {
      min: 500,
      color: 'from-orange-300 via-amber-300 via-yellow-300 to-orange-300',
      bgColor: 'bg-gradient-to-br from-orange-900/40 via-amber-900/40 to-yellow-900/40',
      textColor: '#CD7F32',
      nameColor: '#D2691E',
      shadowColor: 'rgba(205, 127, 50, 0.9)',
      glow: 'shadow-orange-400/80',
      icon: TbStar,
      title: 'BRONZE',
      description: 'Learning',
      borderColor: '#CD7F32',
      effect: 'bronze-warm',
      leagueIcon: '🥉',
      promotionXP: 1500,
      relegationXP: 200,
      maxUsers: 500
    },
    rookie: {
      min: 0,
      color: 'from-green-300 via-emerald-300 via-teal-300 to-cyan-300',
      bgColor: 'bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-teal-900/40',
      textColor: '#32CD32',
      nameColor: '#90EE90',
      shadowColor: 'rgba(50, 205, 50, 0.9)',
      glow: 'shadow-green-400/80',
      icon: TbRocket,
      title: 'ROOKIE',
      description: 'Starting Out',
      borderColor: '#32CD32',
      effect: 'rookie-glow',
      leagueIcon: '🚀',
      promotionXP: 500,
      relegationXP: 0, // Can't be relegated from rookie
      maxUsers: 1000
    }
  };

  // Get user's league based on XP with enhanced progression
  const getUserLeague = (xp) => {
    for (const [league, config] of Object.entries(leagueSystem)) {
      if (xp >= config.min) return { league, ...config };
    }
    return { league: 'rookie', ...leagueSystem.rookie };
  };

  // Group users by their leagues for better organization
  const groupUsersByLeague = (users) => {
    const leagues = {};

    users.forEach(user => {
      const userLeague = getUserLeague(user.totalXP);
      if (!leagues[userLeague.league]) {
        leagues[userLeague.league] = {
          config: userLeague,
          users: []
        };
      }
      leagues[userLeague.league].users.push({
        ...user,
        tier: userLeague // Update to use league instead of tier
      });
    });

    // Sort users within each league by XP
    Object.keys(leagues).forEach(leagueKey => {
      leagues[leagueKey].users.sort((a, b) => b.totalXP - a.totalXP);
    });

    return leagues;
  };

  // Get current user's league and friends in the same league
  const getCurrentUserLeagueData = (allUsers, currentUser) => {
    if (!currentUser) return null;

    const userLeague = getUserLeague(currentUser.totalXP || 0);
    const leagueUsers = allUsers.filter(user => {
      const league = getUserLeague(user.totalXP);
      return league.league === userLeague.league;
    }).sort((a, b) => b.totalXP - a.totalXP);

    return {
      league: userLeague,
      users: leagueUsers,
      userRank: leagueUsers.findIndex(u => u._id === currentUser._id) + 1,
      totalInLeague: leagueUsers.length
    };
  };

  // Handle league selection with unique visual effect
  const handleLeagueSelect = (leagueKey) => {
    console.log('🎯 League selected:', leagueKey);

    // Set selected league with unique visual effect
    setSelectedLeague(leagueKey);
    setShowLeagueView(true);
    setLeagueUsers(leagueGroups[leagueKey]?.users || []);

    // Scroll to league section with smooth animation
    setTimeout(() => {
      const leagueElement = document.querySelector(`[data-league="${leagueKey}"]`) ||
                           document.getElementById(`league-${leagueKey}`) ||
                           leagueRefs.current[leagueKey];

      if (leagueElement) {
        leagueElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Add unique visual effect - pulse animation
        leagueElement.style.transform = 'scale(1.02)';
        leagueElement.style.transition = 'all 0.3s ease';
        leagueElement.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)';

        setTimeout(() => {
          leagueElement.style.transform = 'scale(1)';
          leagueElement.style.boxShadow = '';
        }, 600);
      }
    }, 100);
  };

  // Get ordered league keys from best to worst
  const getOrderedLeagues = () => {
    const leagueOrder = ['mythic', 'legendary', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'rookie'];
    return leagueOrder.filter(league => leagueGroups[league] && leagueGroups[league].users.length > 0);
  };



  // Fetch ranking data using enhanced XP system
  const fetchRankingData = async (forceRefresh = false) => {
    try {
      // Clear old caches for other levels to prevent contamination
      const currentLevel = user?.level || 'primary';
      const allLevels = ['primary', 'secondary', 'advance'];
      allLevels.forEach(level => {
        if (level !== currentLevel) {
          localStorage.removeItem(`ranking_cache_${level}`);
          localStorage.removeItem(`ranking_cache_time_${level}`);
        }
      });
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const userLevel = user?.level || 'primary';
        const cachedRanking = localStorage.getItem(`ranking_cache_${userLevel}`);
        const cacheTime = localStorage.getItem(`ranking_cache_time_${userLevel}`);
        const now = Date.now();

        // Use cache if less than 2 minutes old and for the same level
        if (cachedRanking && cacheTime && (now - parseInt(cacheTime)) < 120000) {
          const cached = JSON.parse(cachedRanking);
          setRankingData(cached.data || []);
          setCurrentUserRank(cached.userRank);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      console.log('🚀 Fetching enhanced XP ranking data...', forceRefresh ? '(Force Refresh)' : '');

      // Try the new XP-based leaderboard first
      try {
        console.log('📊 Fetching XP leaderboard...');
        const xpLeaderboardResponse = await getXPLeaderboard({
          limit: 1000,
          levelFilter: user?.level || 'all',
          includeInactive: false,
          // Add timestamp for cache busting when force refreshing
          ...(forceRefresh && { _t: Date.now() })
        });

        console.log('✨ XP Leaderboard response:', xpLeaderboardResponse);

        if (xpLeaderboardResponse && xpLeaderboardResponse.success && xpLeaderboardResponse.data) {
          console.log('🎯 Using enhanced XP ranking data');

          // Filter to only include users who have actually taken quizzes and earned XP
          const filteredData = xpLeaderboardResponse.data.filter(userData =>
            (userData.totalXP && userData.totalXP > 0) ||
            (userData.totalQuizzesTaken && userData.totalQuizzesTaken > 0)
          );

          // Debug: Check first few users' profile data
          console.log('🔍 First 3 users profile data:', filteredData.slice(0, 3).map(u => ({
            _id: u._id,
            name: u.name,
            profileImage: u.profileImage,
            profilePicture: u.profilePicture,
            hasProfileData: !!(u.profileImage || u.profilePicture)
          })));

          const transformedData = filteredData.map((userData, index) => ({
            _id: userData._id,
            name: userData.name || 'Anonymous Champion',
            email: userData.email || '',
            class: userData.class || '',
            level: userData.level || '',
            profilePicture: userData.profileImage || userData.profilePicture || '',
            profileImage: userData.profileImage || userData.profilePicture || '',
            totalXP: userData.totalXP || 0,
            totalQuizzesTaken: userData.totalQuizzesTaken || 0,
            averageScore: userData.averageScore || 0,
            currentStreak: userData.currentStreak || 0,
            bestStreak: userData.bestStreak || 0,
            subscriptionStatus: userData.subscriptionStatus || 'free',
            rank: index + 1,
            tier: getUserLeague(userData.totalXP || 0),
            isRealUser: true,
            rankingScore: userData.rankingScore || 0,
            // Enhanced XP data
            currentLevel: userData.currentLevel || 1,
            xpToNextLevel: userData.xpToNextLevel || 100,
            lifetimeXP: userData.lifetimeXP || 0,
            seasonXP: userData.seasonXP || 0,
            achievements: userData.achievements || [],
            dataSource: 'enhanced_xp'
          }));

          // Debug: Check final transformed data for top 3 users
          console.log('🏆 Top 3 transformed users:', transformedData.slice(0, 3).map(u => ({
            _id: u._id,
            name: u.name,
            profileImage: u.profileImage,
            profilePicture: u.profilePicture,
            hasProfileData: !!(u.profileImage || u.profilePicture)
          })));

          setRankingData(transformedData);

          // Find current user's rank
          const userRankIndex = transformedData.findIndex(item => item._id === user?._id);
          setCurrentUserRank(userRankIndex >= 0 ? userRankIndex + 1 : null);

          // Set up league data for current user
          if (user) {
            const userLeagueData = getCurrentUserLeagueData(transformedData, user);
            setCurrentUserLeague(userLeagueData);
            setLeagueUsers(userLeagueData?.users || []);
          }

          // Group all users by their leagues
          const grouped = groupUsersByLeague(transformedData);
          setLeagueGroups(grouped);

          // Cache the results with level-specific key
          const userLevel = user?.level || 'primary';
          const cacheData = {
            data: transformedData,
            userRank: userRankIndex >= 0 ? userRankIndex + 1 : null
          };
          localStorage.setItem(`ranking_cache_${userLevel}`, JSON.stringify(cacheData));
          localStorage.setItem(`ranking_cache_time_${userLevel}`, Date.now().toString());

          setLoading(false);
          return;
        }
      } catch (xpError) {
        console.log('⚠️ XP leaderboard failed, trying fallback:', xpError);
      }

      // Fallback to legacy system if XP leaderboard fails
      console.log('🔄 Falling back to legacy ranking system...');

      let rankingResponse, usersResponse;

      try {
        console.log('📊 Fetching legacy ranking reports...');
        rankingResponse = await getAllReportsForRanking();
        console.log('👥 Fetching all users...');
        usersResponse = await getAllUsers();
      } catch (error) {
        console.log('⚡ Error fetching legacy data:', error);
        try {
          usersResponse = await getAllUsers();
        } catch (userError) {
          console.log('❌ Failed to fetch users:', userError);
        }
      }

      let transformedData = [];

      if (usersResponse && usersResponse.success && usersResponse.data) {
        console.log('🔄 Processing legacy user data...');

        // Create a map of user reports for quick lookup
        const userReportsMap = {};
        if (rankingResponse && rankingResponse.success && rankingResponse.data) {
          rankingResponse.data.forEach(item => {
            const userId = item.user?._id || item.userId;
            if (userId) {
              userReportsMap[userId] = item.reports || [];
            }
          });
        }

        transformedData = usersResponse.data
          .filter(userData => {
            // Filter out invalid users
            if (!userData || !userData._id) return false;

            // Apply level filtering for non-admin users
            if (!userData.isAdmin && user?.level) {
              const userLevel = user.level.toLowerCase();
              const dataLevel = (userData.level || 'primary').toLowerCase();

              if (userLevel === 'primary') {
                // Primary users should only see primary users
                return dataLevel === 'primary';
              } else if (userLevel === 'secondary') {
                // Secondary users should only see secondary users
                return dataLevel === 'secondary';
              } else if (userLevel === 'advance') {
                // Advance users should only see advance users
                return dataLevel === 'advance';
              }
            }

            return true; // Include admins and when no level filtering needed
          })
          .map((userData, index) => {
            // Get reports for this user
            const userReports = userReportsMap[userData._id] || [];

            // Use existing user data or calculate from reports
            let totalQuizzes = userReports.length || userData.totalQuizzesTaken || 0;
            let totalScore = userReports.reduce((sum, report) => sum + (report.score || 0), 0);
            let averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : userData.averageScore || 0;

            // For existing users with old data, make intelligent assumptions
            if (!userReports.length && userData.totalPoints) {
              // Assume higher points = more exams and better performance
              const estimatedQuizzes = Math.max(1, Math.floor(userData.totalPoints / 100)); // Assume ~100 points per quiz
              const estimatedAverage = Math.min(95, Math.max(60, 60 + (userData.totalPoints / estimatedQuizzes / 10))); // Scale average based on points

              totalQuizzes = estimatedQuizzes;
              averageScore = Math.round(estimatedAverage);
              totalScore = Math.round(averageScore * totalQuizzes);

              console.log(`📊 Estimated stats for ${userData.name}: ${estimatedQuizzes} quizzes, ${estimatedAverage}% avg from ${userData.totalPoints} points`);
            }

            // Calculate XP based on performance (enhanced calculation)
            let totalXP = userData.totalXP || 0;

            if (!totalXP) {
              // Calculate XP from available data
              if (userData.totalPoints) {
                // Use existing points as base XP with bonuses
                totalXP = Math.floor(
                  userData.totalPoints + // Base points
                  (totalQuizzes * 25) + // Participation bonus
                  (averageScore > 80 ? totalQuizzes * 15 : 0) + // Excellence bonus
                  (averageScore > 90 ? totalQuizzes * 10 : 0) // Mastery bonus
                );
              } else if (totalQuizzes > 0) {
                // Calculate from quiz performance
                totalXP = Math.floor(
                  (averageScore * totalQuizzes * 8) + // Base XP from scores
                  (totalQuizzes * 40) + // Participation bonus
                  (averageScore > 80 ? totalQuizzes * 20 : 0) // Excellence bonus
                );
              }
            }

            // Calculate streaks (enhanced logic)
            let currentStreak = userData.currentStreak || 0;
            let bestStreak = userData.bestStreak || 0;

            if (userReports.length > 0) {
              // Calculate from actual reports
              let tempStreak = 0;
              userReports.forEach(report => {
                if (report.score >= 60) { // Passing score
                  tempStreak++;
                  bestStreak = Math.max(bestStreak, tempStreak);
                } else {
                  tempStreak = 0;
                }
              });
              currentStreak = tempStreak;
            } else if (userData.totalPoints && !currentStreak) {
              // Estimate streaks from points (higher points = likely better streaks)
              const pointsPerQuiz = totalQuizzes > 0 ? userData.totalPoints / totalQuizzes : 0;
              if (pointsPerQuiz > 80) {
                currentStreak = Math.min(totalQuizzes, Math.floor(pointsPerQuiz / 20)); // Estimate current streak
                bestStreak = Math.max(currentStreak, Math.floor(pointsPerQuiz / 15)); // Estimate best streak
              }
            }

            return {
              _id: userData._id,
              name: userData.name || 'Anonymous Champion',
              email: userData.email || '',
              class: userData.class || '',
              level: userData.level || '',
              profilePicture: userData.profileImage || userData.profilePicture || '',
              profileImage: userData.profileImage || userData.profilePicture || '',
              totalXP: totalXP,
              totalQuizzesTaken: totalQuizzes,
              averageScore: averageScore,
              currentStreak: currentStreak,
              bestStreak: bestStreak,
              subscriptionStatus: userData.subscriptionStatus || 'free',
              rank: index + 1,
              tier: getUserLeague(totalXP),
              isRealUser: true,
              // Additional tracking fields for future updates
              originalPoints: userData.totalPoints || 0,
              hasReports: userReports.length > 0,
              dataSource: userReports.length > 0 ? 'reports' : userData.totalPoints ? 'legacy_points' : 'estimated'
            };
          });

        // Sort by XP descending
        transformedData.sort((a, b) => b.totalXP - a.totalXP);
        
        // Update ranks after sorting
        transformedData.forEach((user, index) => {
          user.rank = index + 1;
        });

        setRankingData(transformedData);

        // Cache the fallback results with level-specific key
        const userLevel = user?.level || 'primary';
        const cacheData = {
          data: transformedData,
          userRank: null // Will be set below after finding user rank
        };

        // Find current user's rank with multiple matching strategies
        let userRank = -1;
        if (user) {
          // Try exact ID match first
          userRank = transformedData.findIndex(item => item._id === user._id);

          // If not found, try string comparison (in case of type differences)
          if (userRank === -1) {
            userRank = transformedData.findIndex(item => String(item._id) === String(user._id));
          }

          // If still not found, try matching by name (as fallback)
          if (userRank === -1 && user.name) {
            userRank = transformedData.findIndex(item => item.name === user.name);
          }
        }

        setCurrentUserRank(userRank >= 0 ? userRank + 1 : null);

        // Update cache with final user rank
        cacheData.userRank = userRank >= 0 ? userRank + 1 : null;
        localStorage.setItem(`ranking_cache_${userLevel}`, JSON.stringify(cacheData));
        localStorage.setItem(`ranking_cache_time_${userLevel}`, Date.now().toString());

        // Set up league data for current user
        if (user) {
          const userLeagueData = getCurrentUserLeagueData(transformedData, user);
          setCurrentUserLeague(userLeagueData);
          setLeagueUsers(userLeagueData?.users || []);
        }

        // Group all users by their leagues
        const grouped = groupUsersByLeague(transformedData);
        setLeagueGroups(grouped);

        // Enhanced debug logging for user ranking (development only)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Enhanced User ranking debug:', {
            currentUser: user?.name,
            userId: user?._id,
            userIdType: typeof user?._id,
            isAdmin: user?.role === 'admin' || user?.isAdmin,
            userXP: user?.totalXP,
            userRankIndex: userRank,
            userRankPosition: userRank >= 0 ? userRank + 1 : null,
            totalRankedUsers: transformedData.length,
            firstFewUserIds: transformedData.slice(0, 5).map(u => ({ id: u._id, type: typeof u._id, name: u.name })),
            exactMatch: transformedData.find(item => item._id === user?._id),
            stringMatch: transformedData.find(item => String(item._id) === String(user?._id)),
            nameMatch: transformedData.find(item => item.name === user?.name)
          });
        }

        // Log data sources for transparency
        const dataSources = {
          reports: transformedData.filter(u => u.dataSource === 'reports').length,
          legacy_points: transformedData.filter(u => u.dataSource === 'legacy_points').length,
          estimated: transformedData.filter(u => u.dataSource === 'estimated').length
        };

        console.log('🎉 Amazing ranking data loaded!', transformedData.length, 'real champions');
        console.log('📊 Data sources:', dataSources);
        console.log('🏆 Top 5 champions:', transformedData.slice(0, 5).map(u => ({
          name: u.name,
          xp: u.totalXP,
          quizzes: u.totalQuizzesTaken,
          avg: u.averageScore,
          source: u.dataSource
        })));
      } else {
        console.log('⚠️ No user data available');
        setRankingData([]);
        setCurrentUserRank(null);
        message.warning('No ranking data available. Please check your connection.');
      }
    } catch (error) {
      console.error('💥 Error fetching ranking data:', error);
      message.error('Failed to load the leaderboard. But champions never give up!');
    } finally {
      setLoading(false);
    }
  };

  // Fetch full user data
  const fetchFullUserData = async () => {
    if (!user?.userId) {
      console.log('❌ No userId available:', user);
      return;
    }

    try {
      console.log('🔍 Fetching full user data for userId:', user.userId);
      const response = await getAllUsers();
      console.log('📋 getAllUsers response:', response);

      if (response.success) {
        console.log('📊 Total users found:', response.data.length);
        console.log('🔍 Looking for userId:', user.userId);
        console.log('📝 First 5 user IDs:', response.data.slice(0, 5).map(u => ({ id: u._id, name: u.name })));

        const userData = response.data.find(u => String(u._id) === String(user.userId));
        if (userData) {
          console.log('✅ Found full user data:', userData);
          // Ensure profile picture properties are set
          const userDataWithProfile = {
            ...userData,
            profilePicture: userData.profileImage || userData.profilePicture || '',
            profileImage: userData.profileImage || userData.profilePicture || ''
          };
          setFullUserData(userDataWithProfile);
        } else {
          console.log('❌ User not found in users list');
          console.log('🔍 Trying alternative search methods...');

          // Try different ID formats
          const userDataAlt = response.data.find(u =>
            u._id === user.userId ||
            u.id === user.userId ||
            String(u._id).includes(user.userId) ||
            String(user.userId).includes(u._id)
          );

          if (userDataAlt) {
            console.log('✅ Found user with alternative method:', userDataAlt);
            // Ensure profile picture properties are set
            const userDataWithProfile = {
              ...userDataAlt,
              profilePicture: userDataAlt.profileImage || userDataAlt.profilePicture || '',
              profileImage: userDataAlt.profileImage || userDataAlt.profilePicture || ''
            };
            setFullUserData(userDataWithProfile);
          } else {
            console.log('❌ User not found with any method');
          }
        }
      } else {
        console.log('❌ getAllUsers failed:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    }
  };

  // Try to find user in ranking data as fallback
  useEffect(() => {
    if (!fullUserData && user?.userId && rankingData.length > 0) {
      console.log('🔍 Trying to find user in ranking data...');
      const userInRanking = rankingData.find(u => String(u._id) === String(user.userId));
      if (userInRanking) {
        console.log('✅ Found user in ranking data:', userInRanking);
        // Ensure profile picture properties are set
        const userDataWithProfile = {
          ...userInRanking,
          profilePicture: userInRanking.profileImage || userInRanking.profilePicture || '',
          profileImage: userInRanking.profileImage || userInRanking.profilePicture || ''
        };
        setFullUserData(userDataWithProfile);
      } else {
        console.log('❌ User not found in ranking data either');
      }
    }
  }, [rankingData, user, fullUserData]);

  // Initialize component
  useEffect(() => {
    fetchRankingData();
    fetchFullUserData(); // Fetch full user data

    // Set random motivational quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setMotivationalQuote(randomQuote);

    // Start animation sequence
    const animationTimer = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 3000);

    // Auto-refresh disabled to prevent interference with Find Me functionality
    // const refreshTimer = setInterval(() => {
    //   console.log('🔄 Auto-refreshing ranking data...');
    //   fetchRankingData();
    // }, 30000);

    // Refresh when user comes back from quiz (window focus)
    const handleWindowFocus = () => {
      console.log('🎯 Window focused - refreshing ranking data...');
      fetchRankingData(true); // Force refresh when returning from quiz
    };

    // Listen for real-time ranking updates from quiz completion
    const handleRankingUpdate = (event) => {
      console.log('🚀 Real-time ranking update triggered:', event.detail);

      // Clear any cached data to ensure fresh fetch
      localStorage.removeItem('rankingCache');
      localStorage.removeItem('userRankingPosition');
      localStorage.removeItem('leaderboardData');

      // Immediate refresh after quiz completion with multiple attempts
      const refreshWithRetry = async (attempts = 3) => {
        for (let i = 0; i < attempts; i++) {
          try {
            console.log(`🔄 Refreshing ranking data (attempt ${i + 1}/${attempts})`);
            await fetchRankingData(true); // Force refresh to bypass cache

            // Verify the XP was updated by checking if user's XP matches the event data
            if (event.detail?.newTotalXP && user) {
              const updatedUser = rankingData.find(u => String(u._id) === String(user._id));
              if (updatedUser && updatedUser.totalXP >= event.detail.newTotalXP) {
                console.log('✅ XP update confirmed in ranking data');
                break;
              }
            }

            // Wait before retry
            if (i < attempts - 1) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          } catch (error) {
            console.error(`❌ Ranking refresh attempt ${i + 1} failed:`, error);
            if (i < attempts - 1) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        }
      };

      // Start refresh with delay to ensure server processing
      setTimeout(() => {
        refreshWithRetry();
      }, 1000);
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('rankingUpdate', handleRankingUpdate);

    return () => {
      clearInterval(animationTimer);
      // clearInterval(refreshTimer); // Commented out since refreshTimer is disabled
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('rankingUpdate', handleRankingUpdate);
    };
  }, []);

  // Auto-select user's current league when data loads
  useEffect(() => {
    if (user && leagueGroups && Object.keys(leagueGroups).length > 0 && !selectedLeague) {
      // Find user's current league
      for (const [leagueKey, leagueData] of Object.entries(leagueGroups)) {
        const userInLeague = leagueData.users.find(u => String(u._id) === String(user._id));
        if (userInLeague) {
          console.log('🎯 Auto-selecting user league:', leagueKey);
          setSelectedLeague(leagueKey);
          setShowLeagueView(true);
          setLeagueUsers(leagueData.users);
          break;
        }
      }
    }
  }, [user, leagueGroups, selectedLeague]);

  // Get top performers for special display (no filtering)
  const topPerformers = rankingData.slice(0, 3);
  const otherPerformers = rankingData.slice(3);



  // Get user's current league information
  const getUserLeagueInfo = () => {
    if (!user?._id) return null;

    // Check if user is in top 3 (podium)
    const isInPodium = topPerformers.some(performer => String(performer._id) === String(user._id));
    if (isInPodium) {
      const podiumPosition = topPerformers.findIndex(performer => String(performer._id) === String(user._id)) + 1;
      return {
        type: 'podium',
        position: podiumPosition,
        league: 'Champion Podium',
        leagueKey: 'podium'
      };
    }

    // Find user's league
    for (const [leagueKey, leagueData] of Object.entries(leagueGroups)) {
      const userInLeague = leagueData.users?.find(u => String(u._id) === String(user._id));
      if (userInLeague) {
        const position = leagueData.users.findIndex(u => String(u._id) === String(user._id)) + 1;
        return {
          type: 'league',
          position: position,
          league: leagueData.title,
          leagueKey: leagueKey,
          totalUsers: leagueData.users.length
        };
      }
    }

    return null;
  };

  const userLeagueInfo = getUserLeagueInfo();

  // Helper function to check if a user is the current user
  const isCurrentUser = (userId) => {
    return user && String(userId) === String(user._id);
  };

  // Helper function to check if user should be highlighted (only before they've been shown)
  const shouldHighlightUser = (userId) => {
    return isCurrentUser(userId) && !userHasBeenShown;
  };

  // Allow users to click anywhere to disable highlighting
  const handlePageClick = () => {
    if (!userHasBeenShown) {
      setUserHasBeenShown(true);
      console.log('👆 User clicked - highlighting disabled');
    }
  };

  // Reset highlighting when user or league changes
  useEffect(() => {
    setUserHasBeenShown(false);
    setAutoScrollCompleted(false); // Reset auto-scroll state
  }, [user?._id, selectedLeague]);

  // Auto-scroll to user position ONLY on first visit
  useEffect(() => {
    console.log('🔄 Auto-scroll check:', {
      userId: user?._id,
      autoScrollCompleted,
      rankingDataLength: rankingData.length
    });

    // Only scroll if user exists, hasn't been scrolled yet, and we have data
    if (!user?._id || autoScrollCompleted || rankingData.length === 0) {
      console.log('❌ Auto-scroll skipped:', {
        hasUser: !!user?._id,
        completed: autoScrollCompleted,
        hasData: rankingData.length > 0
      });
      return;
    }

    const scrollToUser = () => {
      console.log('🎯 Starting auto-scroll for user:', user._id);

      // First, try to find user in any ranking data
      const userInRanking = rankingData.find(u => String(u._id) === String(user._id));
      if (!userInRanking) {
        console.log('❌ User not found in ranking data');
        setAutoScrollCompleted(true); // Mark as completed even if not found
        return;
      }

      console.log('✅ User found in ranking at position:', userInRanking.rank);

      // Check if user is in top 3 (podium)
      const isInPodium = userInRanking.rank <= 3;
      console.log('🏆 Is user in podium?', isInPodium);

      if (isInPodium) {
        // Scroll to podium section
        console.log('📍 Scrolling to podium section...');
        const podiumSection = document.querySelector('[data-section="podium"]');
        console.log('🎪 Podium section found:', !!podiumSection);
        if (podiumSection) {
          setTimeout(() => {
            podiumSection.scrollIntoView({
              behavior: 'auto',
              block: 'center',
              inline: 'nearest'
            });
            console.log('✅ Scrolled to podium');
            // Mark as completed after scroll
            setTimeout(() => {
              setUserHasBeenShown(true);
              setAutoScrollCompleted(true);
              console.log('✅ Auto-scroll completed');
            }, 100);
          }, 100);
        } else {
          setAutoScrollCompleted(true);
        }
      } else {
        // Look for user element in the ranking list
        console.log('📍 Looking for user element with ID:', user._id);
        const userElement = document.querySelector(`[data-user-id="${user._id}"]`);
        console.log('🎯 User element found:', !!userElement);
        if (userElement) {
          setTimeout(() => {
            userElement.scrollIntoView({
              behavior: 'auto',
              block: 'center',
              inline: 'nearest'
            });
            console.log('✅ Scrolled to user position');
            // Mark as completed after scroll
            setTimeout(() => {
              setUserHasBeenShown(true);
              setAutoScrollCompleted(true);
              console.log('✅ Auto-scroll completed');
            }, 100);
          }, 100);
        } else {
          console.log('❌ User element not found in DOM');
          setAutoScrollCompleted(true);
        }
      }
    };

    // Delay to ensure DOM is ready, but make it instant
    const timer = setTimeout(scrollToUser, 500);
    return () => clearTimeout(timer);
  }, [user?._id, rankingData, autoScrollCompleted]);

  // Get subscription status badge - simplified to only ACTIVATED and EXPIRED
  const getSubscriptionBadge = (subscriptionStatus, subscriptionEndDate, subscriptionPlan, activePlanTitle, userIndex = 0) => {
    const now = new Date();
    const endDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;

    console.log('Subscription Debug:', {
      subscriptionStatus,
      subscriptionEndDate,
      subscriptionPlan,
      activePlanTitle,
      endDate,
      now,
      isActive: endDate && endDate > now,
      userIndex
    });

    // Check if user has an active subscription
    if (subscriptionStatus === 'active' || subscriptionStatus === 'premium') {
      // Check if subscription is still valid (not expired)
      if (!endDate || endDate > now) {
        // User has active plan - show ACTIVATED
        return {
          text: 'ACTIVATED',
          color: '#10B981', // Green
          bgColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10B981'
        };
      } else {
        // Subscription status is active but end date has passed - show EXPIRED
        return {
          text: 'EXPIRED',
          color: '#EF4444', // Red
          bgColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: '#EF4444'
        };
      }
    } else {
      // No active subscription - show EXPIRED
      return {
        text: 'EXPIRED',
        color: '#EF4444', // Red
        bgColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#EF4444'
      };
    }
  };

  // Skeleton loading component
  const RankingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="h-12 bg-white/10 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-white/5 rounded w-64 mx-auto animate-pulse"></div>
        </div>

        {/* Podium Skeleton */}
        <div className="flex justify-center items-end mb-16 space-x-8">
          {[2, 1, 3].map((position) => (
            <div key={position} className={`text-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}`}>
              <div className={`w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full mx-auto mb-4 animate-pulse`}></div>
              <div className="h-4 bg-white/10 rounded w-16 mx-auto mb-2 animate-pulse"></div>
              <div className="h-3 bg-white/5 rounded w-12 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-white/5 rounded w-24"></div>
                </div>
                <div className="h-6 bg-white/10 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Show skeleton only on initial load
  if (loading && rankingData.length === 0) {
    return <RankingSkeleton />;
  }

  return (
    <>
      <style>{`
        /* Dark background for better color visibility */
        body {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%) !important;
          min-height: 100vh;
          color: #ffffff !important;
        }

        .ranking-page-container {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          min-height: 100vh;
          color: #ffffff;
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        /* Fix black text visibility - Enhanced */
        .ranking-page-container * {
          color: inherit;
        }

        .ranking-page-container .text-black,
        .ranking-page-container .text-gray-900,
        .ranking-page-container h1,
        .ranking-page-container h2,
        .ranking-page-container h3,
        .ranking-page-container h4,
        .ranking-page-container h5,
        .ranking-page-container h6,
        .ranking-page-container p,
        .ranking-page-container span,
        .ranking-page-container div {
          color: #ffffff !important;
        }

        .ranking-page-container [style*="color: #000000"],
        .ranking-page-container [style*="color: black"],
        .ranking-page-container [style*="color:#000000"],
        .ranking-page-container [style*="color:black"],
        .ranking-page-container [style*="color: #1f2937"],
        .ranking-page-container [style*="color:#1f2937"] {
          color: #ffffff !important;
        }

        /* Force white text for names and content */
        .ranking-page-container .font-bold,
        .ranking-page-container .font-black,
        .ranking-page-container .font-semibold,
        .ranking-page-container .font-medium {
          color: #ffffff !important;
        }


        /* Enhanced hover effects for ranking cards */
        .ranking-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ranking-card:hover {
          transform: translateY(-2px) scale(1.01);
        }

        /* Smooth animations for league badges */
        .league-badge {
          transition: all 0.2s ease-in-out;
        }

        .league-badge:hover {
          transform: scale(1.05);
        }

        /* Gradient text animations */
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animated-gradient {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }

        /* League-specific animations */
        .mythic-aura {
          animation: mythicPulse 2s ease-in-out infinite alternate;
        }

        .legendary-sparkle {
          animation: legendarySparkle 3s ease-in-out infinite;
        }

        .diamond-shine {
          animation: diamondShine 2.5s ease-in-out infinite;
        }

        .platinum-gleam {
          animation: platinumGleam 3s ease-in-out infinite;
        }

        .gold-glow {
          animation: goldGlow 2s ease-in-out infinite alternate;
        }

        .silver-shimmer {
          animation: silverShimmer 2.5s ease-in-out infinite;
        }

        .bronze-warm {
          animation: bronzeWarm 3s ease-in-out infinite;
        }

        .rookie-glow {
          animation: rookieGlow 2s ease-in-out infinite alternate;
        }

        @keyframes mythicPulse {
          0% { box-shadow: 0 0 20px rgba(255, 20, 147, 0.5); }
          100% { box-shadow: 0 0 40px rgba(255, 20, 147, 0.8), 0 0 60px rgba(138, 43, 226, 0.6); }
        }

        @keyframes legendarySparkle {
          0%, 100% { filter: brightness(1) hue-rotate(0deg); }
          50% { filter: brightness(1.2) hue-rotate(10deg); }
        }

        @keyframes diamondShine {
          0%, 100% { filter: brightness(1) saturate(1); }
          50% { filter: brightness(1.3) saturate(1.2); }
        }

        @keyframes platinumGleam {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.1) contrast(1.1); }
        }

        @keyframes goldGlow {
          0% { filter: brightness(1) drop-shadow(0 0 10px #FFD700); }
          100% { filter: brightness(1.2) drop-shadow(0 0 20px #FFD700); }
        }

        @keyframes silverShimmer {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15) contrast(1.05); }
        }

        @keyframes bronzeWarm {
          0%, 100% { filter: brightness(1) hue-rotate(0deg); }
          50% { filter: brightness(1.1) hue-rotate(5deg); }
        }

        @keyframes rookieGlow {
          0% { filter: brightness(1) drop-shadow(0 0 5px #32CD32); }
          100% { filter: brightness(1.15) drop-shadow(0 0 15px #32CD32); }
        }

        /* Horizontal podium animations */
        .podium-animation {
          animation: podiumFloat 4s ease-in-out infinite;
        }

        @keyframes podiumFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <div className="ranking-page-container ranking-page min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black relative" onClick={handlePageClick}>

      {/* Highlighting Notification */}
      {!userHasBeenShown && user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          🎯 Finding your position in the rankings...
        </motion.div>
      )}

      {/* Animated Background Elements - Darker Theme */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/3 w-60 h-60 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-6000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* TOP CONTROLS */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 lg:py-8"
          style={{
            padding: window.innerWidth <= 768 ? '8px' : window.innerWidth <= 1024 ? '16px' : '32px'
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 border border-white/10">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-6 items-center justify-center">



                {/* User League Info Display */}
                {userLeagueInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold shadow-lg"
                    style={{
                      background: userLeagueInfo.type === 'podium'
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                      color: userLeagueInfo.type === 'podium' ? '#1F2937' : '#FFFFFF',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                      fontSize: window.innerWidth < 768 ? '0.9rem' : '1rem'
                    }}
                  >
                    <TbTrophy className="w-5 h-5 md:w-6 md:h-6" />
                    <span>
                      {userLeagueInfo.type === 'podium'
                        ? `🏆 Podium #${userLeagueInfo.position}`
                        : `${userLeagueInfo.league} #${userLeagueInfo.position}`}
                    </span>
                  </motion.div>
                )}

                {/* User Profile Window */}
                {fullUserData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20 backdrop-blur-lg rounded-2xl p-4 border border-blue-400/30 shadow-2xl max-w-sm"
                  >
                    <div className="flex items-center gap-4">
                      {/* Profile Picture with Online Status */}
                      <div className="flex-shrink-0 relative">
                        <ProfilePicture
                          user={fullUserData}
                          size="xl"
                          showOnlineStatus={false}
                          style={{
                            border: '3px solid #facc15',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                          }}
                        />
                        {/* Only show online dot if user is actually online */}
                        {fullUserData.isOnline && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '4px',
                              right: '4px',
                              width: '16px',
                              height: '16px',
                              backgroundColor: '#22c55e',
                              borderRadius: '50%',
                              border: '3px solid #ffffff',
                              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.6)',
                              zIndex: 10
                            }}
                            title="Online"
                          />
                        )}
                      </div>

                      {/* User Details */}
                      <div className="flex-grow">
                        <h3 className="text-lg font-bold text-white mb-2 truncate">
                          {fullUserData.name || fullUserData.username || 'User'}
                        </h3>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-green-500/20 rounded-lg p-2 text-center">
                            <div className="text-green-300 text-xs">Total XP</div>
                            <div className="text-white font-bold">
                              {(() => {
                                // Try multiple XP field names for migrated users
                                const xp = fullUserData.totalXP || fullUserData.xp || fullUserData.points || fullUserData.totalPoints || 0;
                                return xp.toLocaleString();
                              })()}
                            </div>
                          </div>

                          <div className="bg-purple-500/20 rounded-lg p-2 text-center">
                            <div className="text-purple-300 text-xs">Rank</div>
                            <div className="text-white font-bold">
                              {(() => {
                                // Try to find user in ranking data
                                const userInRanking = rankingData.find(u => String(u._id) === String(fullUserData._id));
                                return userInRanking ? `#${userInRanking.rank}` : (currentUserRank ? `#${currentUserRank}` : 'N/A');
                              })()}
                            </div>
                          </div>

                          <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                            <div className="text-blue-300 text-xs">League</div>
                            <div className="text-white font-bold text-xs">
                              {(() => {
                                // Find user's league with icon - try multiple XP sources
                                const userXP = fullUserData.totalXP || fullUserData.xp || fullUserData.points || fullUserData.totalPoints || 0;
                                for (const [leagueKey, leagueData] of Object.entries(leagueGroups)) {
                                  const userInLeague = leagueData.users?.find(u => String(u._id) === String(fullUserData._id));
                                  if (userInLeague) {
                                    const leagueInfo = getUserLeague(userXP);
                                    return `${leagueInfo.leagueIcon} ${leagueKey.toUpperCase()}`;
                                  }
                                }
                                // Fallback: calculate league from XP even if not in league data
                                if (userXP > 0) {
                                  const leagueInfo = getUserLeague(userXP);
                                  return `${leagueInfo.leagueIcon} ${leagueInfo.league.toUpperCase()}`;
                                }
                                return '🔰 Unranked';
                              })()}
                            </div>
                          </div>

                          <div className="bg-orange-500/20 rounded-lg p-2 text-center">
                            <div className="text-orange-300 text-xs">Quizzes</div>
                            <div className="text-white font-bold">
                              {(() => {
                                // Try multiple quiz count field names
                                return fullUserData.quizzesCompleted || fullUserData.totalQuizzesTaken || fullUserData.quizzesTaken || fullUserData.totalQuizzes || 0;
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Additional Stats Row */}
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <div className="bg-yellow-500/20 rounded-lg p-1.5 text-center">
                            <div className="text-yellow-300 text-xs">Level</div>
                            <div className="text-white font-bold">
                              {fullUserData.currentLevel || fullUserData.level || 1}
                            </div>
                          </div>

                          <div className="bg-red-500/20 rounded-lg p-1.5 text-center">
                            <div className="text-red-300 text-xs">Streak</div>
                            <div className="text-white font-bold">
                              {fullUserData.currentStreak || fullUserData.streak || 0}
                            </div>
                          </div>

                          <div className="bg-cyan-500/20 rounded-lg p-1.5 text-center">
                            <div className="text-cyan-300 text-xs">Avg Score</div>
                            <div className="text-white font-bold">
                              {(() => {
                                const avgScore = fullUserData.averageScore || fullUserData.avgScore || 0;
                                return Math.round(avgScore);
                              })()}%
                            </div>
                          </div>
                        </div>

                        {/* League Position */}
                        {(() => {
                          // Find user's position in their league
                          for (const [leagueKey, leagueData] of Object.entries(leagueGroups)) {
                            const userIndex = leagueData.users?.findIndex(u => String(u._id) === String(fullUserData._id));
                            if (userIndex !== -1) {
                              return (
                                <div className="mt-2 text-center">
                                  <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg p-1.5">
                                    <div className="text-yellow-300 text-xs">League Position</div>
                                    <div className="text-white font-bold text-sm">
                                      #{userIndex + 1} of {leagueData.users.length}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </motion.div>
                )}











                {/* League Selection Section */}
                <div className="flex flex-col items-center gap-4 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 max-w-4xl mx-auto">
                  {/* LEAGUES Title */}
                  <motion.h3
                    className="text-2xl md:text-3xl font-black mb-2"
                    style={{
                      background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6B35)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      filter: 'drop-shadow(0 0 10px #FFD700)'
                    }}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🏆 LEAGUES 🏆
                  </motion.h3>

                  {/* League Icons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                    {getOrderedLeagues().map((leagueKey) => {
                      const league = leagueSystem[leagueKey];
                      const isSelected = selectedLeague === leagueKey;
                      const userCount = leagueGroups[leagueKey]?.users.length || 0;

                      return (
                        <motion.div
                          key={leagueKey}
                          className="flex flex-col items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                        >
                          <motion.button
                            whileHover={{ scale: 1.1, y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLeagueSelect(leagueKey)}
                            className={`relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl transition-all duration-300 ${
                              isSelected
                                ? 'ring-4 ring-yellow-400 ring-opacity-100 shadow-2xl'
                                : 'hover:ring-2 hover:ring-white/30'
                            }`}
                            style={{
                              background: isSelected
                                ? `linear-gradient(135deg, ${league.borderColor}80, ${league.textColor}50, ${league.borderColor}80)`
                                : `linear-gradient(135deg, ${league.borderColor}60, ${league.textColor}30)`,
                              border: `3px solid ${isSelected ? '#FFD700' : league.borderColor + '80'}`,
                              boxShadow: isSelected
                                ? `0 0 30px ${league.shadowColor}80, 0 0 60px #FFD70080, 0 6px 30px ${league.shadowColor}80`
                                : `0 4px 15px ${league.shadowColor}40`,
                              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                              filter: isSelected ? 'brightness(1.3) saturate(1.2)' : 'brightness(1)'
                            }}
                            animate={isSelected ? {
                              boxShadow: [
                                `0 0 30px ${league.shadowColor}80, 0 0 60px #FFD70080`,
                                `0 0 40px ${league.shadowColor}100, 0 0 80px #FFD700A0`,
                                `0 0 30px ${league.shadowColor}80, 0 0 60px #FFD70080`
                              ],
                              scale: [1.1, 1.15, 1.1]
                            } : {}}
                            transition={{
                              duration: 2,
                              repeat: isSelected ? Infinity : 0,
                              ease: "easeInOut"
                            }}
                            title={`Click to view ${league.title} League (${userCount} users)`}
                          >
                            <span className="text-3xl md:text-4xl">{league.leagueIcon}</span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -360, opacity: 0 }}
                                animate={{
                                  scale: [1, 1.3, 1],
                                  rotate: [0, 360, 720],
                                  opacity: 1,
                                  boxShadow: [
                                    '0 0 15px rgba(255, 215, 0, 1), 0 0 30px rgba(255, 215, 0, 0.8)',
                                    '0 0 25px rgba(255, 215, 0, 1), 0 0 50px rgba(255, 215, 0, 1)',
                                    '0 0 15px rgba(255, 215, 0, 1), 0 0 30px rgba(255, 215, 0, 0.8)'
                                  ]
                                }}
                                transition={{
                                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                                  boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                                  opacity: { duration: 0.3 }
                                }}
                                className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg"
                                style={{
                                  background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
                                  border: '3px solid white',
                                  zIndex: 10
                                }}
                              >
                                <motion.span
                                  className="text-sm font-black text-gray-900"
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, -10, 10, 0]
                                  }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                >
                                  ✓
                                </motion.span>
                              </motion.div>
                            )}
                            <div
                              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
                              style={{
                                background: league.borderColor,
                                color: '#FFFFFF',
                                fontSize: '11px'
                              }}
                            >
                              {userCount}
                            </div>
                          </motion.button>

                          {/* League Name */}
                          <motion.div
                            className="text-center"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div
                              className="text-xs md:text-sm font-bold px-2 py-1 rounded-lg"
                              style={{
                                color: league.nameColor,
                                textShadow: `1px 1px 2px ${league.shadowColor}`,
                                background: `${league.borderColor}20`,
                                border: `1px solid ${league.borderColor}40`
                              }}
                            >
                              {league.title}
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="text-white/70 text-sm text-center mt-2">
                    Click any league to view its members and scroll to their section
                  </p>
                </div>



                {/* Refresh Button */}
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchRankingData}
                  disabled={loading}
                  className="flex items-center gap-3 px-6 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 w-full sm:w-auto"
                  style={{
                    fontSize: window.innerWidth < 768 ? '1rem' : '1.1rem'
                  }}
                >
                  <TbRefresh className={`w-5 h-5 md:w-6 md:h-6 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin Notice - DISABLED FOR TESTING */}
        {false && (user?.role === 'admin' || user?.isAdmin) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="px-3 sm:px-4 md:px-6 lg:px-8 mb-6"
          >
            <div className="max-w-7xl mx-auto">
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-purple-300/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">👑</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Admin View</h3>
                    <p className="text-sm text-white/80">
                      You're viewing as an admin. Admin accounts are excluded from student rankings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header removed - using ProtectedRoute header only */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative overflow-hidden mb-8"
        >
          {/* Header Background with Modern Gradient */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-500 via-purple-500 via-cyan-500 to-teal-500 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

            {/* Animated Header Content */}
            <div className="relative z-10 px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-20">
              <div className="max-w-7xl mx-auto text-center">

                {/* Main Title with Epic Animation */}
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                    rotateY: [0, 5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mb-6 md:mb-8"
                >
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-2 md:mb-4 tracking-tight">
                    <motion.span
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="bg-gradient-to-r from-yellow-300 via-pink-300 via-cyan-300 via-purple-300 to-yellow-300 bg-clip-text text-transparent bg-400%"
                      style={{
                        backgroundSize: '400% 400%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                      }}
                    >
                      HALL OF
                    </motion.span>
                    <br />
                    <motion.span
                      animate={{
                        textShadow: [
                          '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.6)',
                          '0 0 30px rgba(255,215,0,1), 0 0 60px rgba(255,215,0,0.8)',
                          '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.6)'
                        ]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{
                        color: '#FFD700',
                        fontWeight: '900',
                        textShadow: '3px 3px 6px rgba(0,0,0,0.9)'
                      }}
                    >
                      CHAMPIONS
                    </motion.span>
                  </h1>
                </motion.div>

                {/* Epic Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-4 md:mb-6 max-w-4xl mx-auto leading-relaxed px-2"
                  style={{
                    color: '#F3F4F6',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    background: 'linear-gradient(45deg, #F3F4F6, #E5E7EB)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  ✨ Where legends are born and greatness is celebrated ✨
                </motion.p>

                {/* Motivational Quote */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="mb-6 md:mb-8"
                >
                  <p className="text-sm sm:text-base md:text-lg font-medium text-yellow-200 bg-black/20 backdrop-blur-sm rounded-xl px-4 py-3 max-w-3xl mx-auto border border-yellow-400/30"
                     style={{
                       textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                       fontStyle: 'italic'
                     }}>
                    {motivationalQuote}
                  </p>
                </motion.div>

                {/* Enhanced Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto"
                >
                  {[
                    {
                      icon: TbUsers,
                      value: rankingData.length,
                      label: 'Champions',
                      bgGradient: 'from-blue-600/20 via-indigo-600/20 to-purple-600/20',
                      iconColor: '#60A5FA',
                      borderColor: '#3B82F6'
                    },
                    {
                      icon: TbTrophy,
                      value: topPerformers.length,
                      label: 'Top Performers',
                      bgGradient: 'from-yellow-600/20 via-orange-600/20 to-red-600/20',
                      iconColor: '#FBBF24',
                      borderColor: '#F59E0B'
                    },
                    {
                      icon: TbFlame,
                      value: rankingData.filter(u => u.currentStreak > 0).length,
                      label: 'Active Streaks',
                      bgGradient: 'from-red-600/20 via-pink-600/20 to-rose-600/20',
                      iconColor: '#F87171',
                      borderColor: '#EF4444'
                    },
                    {
                      icon: TbStar,
                      value: rankingData.reduce((sum, u) => sum + (u.totalXP || 0), 0).toLocaleString(),
                      label: 'Total XP',
                      bgGradient: 'from-green-600/20 via-emerald-600/20 to-teal-600/20',
                      iconColor: '#34D399',
                      borderColor: '#10B981'
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-lg rounded-xl p-3 md:p-4 text-center relative overflow-hidden`}
                      style={{
                        border: `2px solid ${stat.borderColor}40`,
                        boxShadow: `0 8px 32px ${stat.borderColor}20`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                      <stat.icon
                        className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 relative z-10"
                        style={{ color: stat.iconColor, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                      />
                      <div
                        className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black mb-1 relative z-10"
                        style={{
                          color: stat.iconColor,
                          textShadow: `3px 3px 6px rgba(0,0,0,0.9)`,
                          filter: 'drop-shadow(0 0 10px currentColor)',
                          fontSize: 'clamp(1rem, 4vw, 2.5rem)'
                        }}
                      >
                        {stat.value}
                      </div>
                      <div
                        className="text-xs sm:text-sm font-bold relative z-10"
                        style={{
                          color: '#FFFFFF',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                          fontSize: 'clamp(0.75rem, 2vw, 1rem)'
                        }}
                      >
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* LOADING STATE */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
            />
            <p className="text-white/80 text-lg font-medium">Loading champions...</p>
          </motion.div>
        )}

        {/* EPIC LEADERBOARD */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="px-4 sm:px-6 md:px-8 lg:px-12 pb-20 md:pb-24 lg:pb-32"
          >
            <div className="max-w-7xl mx-auto">

              {/* TOP 3 PODIUM */}
              {topPerformers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="mb-12"
                >
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-center mb-6 md:mb-8 lg:mb-12 px-4" style={{
                    background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6B35)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(0 0 15px #FFD700)'
                  }}>
                    🏆 CHAMPIONS PODIUM 🏆
                  </h2>

                  {/* Horizontal Podium Layout with Moving Animations */}
                  <div
                    className="flex items-end justify-center max-w-5xl mx-auto mb-4 md:mb-8"
                    style={{
                      gap: window.innerWidth <= 480 ? '4px' : window.innerWidth <= 768 ? '8px' : window.innerWidth <= 1024 ? '16px' : '32px',
                      padding: window.innerWidth <= 480 ? '4px' : window.innerWidth <= 768 ? '8px' : '16px 24px',
                      overflowX: window.innerWidth <= 480 ? 'auto' : 'visible'
                    }}
                  >
                    {/* Second Place - Left */}
                    {topPerformers[1] && (
                      <motion.div
                        key={`second-${topPerformers[1]._id}`}
                        ref={user && String(topPerformers[1]._id) === String(user._id) ? podiumUserRef : null}
                        data-user-id={topPerformers[1]._id}
                        data-user-rank={2}
                        initial={{ opacity: 0, x: -100, y: 50 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          y: 0,
                          scale: [1, 1.02, 1],
                          rotateY: [0, 5, 0]
                        }}
                        transition={{
                          delay: 0.8,
                          duration: 1.2,
                          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                          rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                        }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className={`relative order-1 ${
                          shouldHighlightUser(topPerformers[1]._id)
                            ? 'ring-8 ring-yellow-400 ring-opacity-100'
                            : ''
                        }`}
                        style={{
                          height: window.innerWidth <= 768 ? '200px' : '280px',
                          transform: shouldHighlightUser(topPerformers[1]._id) ? 'scale(1.08)' : 'scale(1)',
                          filter: shouldHighlightUser(topPerformers[1]._id)
                            ? 'brightness(1.3) saturate(1.2) drop-shadow(0 0 30px rgba(255, 215, 0, 1))'
                            : 'none',
                          transition: 'all 0.3s ease',
                          border: shouldHighlightUser(topPerformers[1]._id) ? '4px solid #FFD700' : 'none',
                          borderRadius: isCurrentUser(topPerformers[1]._id) ? '20px' : '0px',
                          background: isCurrentUser(topPerformers[1]._id) ? 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))' : 'transparent'
                        }}
                      >
                        {/* Second Place Podium Base */}
                        <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg border-2 border-gray-500 flex items-center justify-center z-0">
                          <span className="text-2xl font-black text-gray-800 relative z-10">2nd</span>
                        </div>

                        {/* Second Place Champion Card */}
                        <div
                          className={`relative bg-gradient-to-br ${topPerformers[1].tier.color} p-1 rounded-xl ${topPerformers[1].tier.glow} shadow-xl mb-20`}
                          style={{
                            boxShadow: `0 6px 20px ${topPerformers[1].tier.shadowColor}50`,
                            width: window.innerWidth <= 480 ? '140px' : window.innerWidth <= 768 ? '160px' : '200px'
                          }}
                        >
                          <div
                            className={`${topPerformers[1].tier.bgColor} backdrop-blur-lg rounded-xl p-4 text-center relative overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

                            {/* Silver Medal */}
                            <div
                              className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center font-black text-lg shadow-lg relative z-20"
                              style={{
                                color: '#1f2937',
                                border: '2px solid #FFFFFF'
                              }}
                            >
                              🥈
                            </div>

                            {/* Profile Picture */}
                            <div className={`relative mx-auto mb-3 ${user && topPerformers[1]._id === user._id ? 'ring-1 ring-yellow-400 ring-opacity-80' : ''}`}>

                              <ProfilePicture
                                user={topPerformers[1]}
                                size="md"
                                showOnlineStatus={true}
                                style={{
                                  width: '40px',
                                  height: '40px'
                                }}
                              />
                              {/* Debug: Show user data */}
                              {console.log('🥈 Second place user:', topPerformers[1])}
                            </div>

                            {/* Name and Stats */}
                            <h3
                              className="text-sm font-bold mb-2 truncate"
                              style={{ color: topPerformers[1].tier.nameColor }}
                            >
                              {topPerformers[1].name}
                            </h3>

                            <div className="text-lg font-black mb-2" style={{ color: topPerformers[1].tier.textColor }}>
                              {topPerformers[1].totalXP.toLocaleString()} XP
                            </div>

                            <div className="flex justify-center gap-3 text-xs">
                              <span style={{ color: topPerformers[1].tier.textColor }}>
                                🧠 {topPerformers[1].totalQuizzesTaken}
                              </span>
                              <span style={{ color: topPerformers[1].tier.textColor }}>
                                🔥 {topPerformers[1].currentStreak}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* First Place - Center and Elevated */}
                    {topPerformers[0] && (
                      <motion.div
                        key={`first-${topPerformers[0]._id}`}
                        ref={user && String(topPerformers[0]._id) === String(user._id) ? podiumUserRef : null}
                        data-user-id={topPerformers[0]._id}
                        data-user-rank={1}
                        initial={{ opacity: 0, y: -100, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          rotateY: [0, 10, -10, 0],
                          y: [0, -10, 0]
                        }}
                        transition={{
                          delay: 0.5,
                          duration: 1.5,
                          rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                          y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        }}
                        whileHover={{ scale: 1.08, y: -15 }}
                        className={`relative order-2 z-10 ${
                          shouldHighlightUser(topPerformers[0]._id)
                            ? 'ring-8 ring-yellow-400 ring-opacity-100'
                            : ''
                        }`}
                        style={{
                          height: window.innerWidth <= 768 ? '240px' : '320px',
                          transform: shouldHighlightUser(topPerformers[0]._id) ? 'scale(1.08)' : 'scale(1)',
                          filter: shouldHighlightUser(topPerformers[0]._id)
                            ? 'brightness(1.3) saturate(1.2) drop-shadow(0 0 30px rgba(255, 215, 0, 1))'
                            : 'none',
                          transition: 'all 0.3s ease',
                          border: shouldHighlightUser(topPerformers[0]._id) ? '4px solid #FFD700' : 'none',
                          borderRadius: isCurrentUser(topPerformers[0]._id) ? '20px' : '0px',
                          background: isCurrentUser(topPerformers[0]._id) ? 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))' : 'transparent'
                        }}
                        data-section="podium"

                      >
                        {/* First Place Podium Base - Tallest */}
                        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-lg border-2 border-yellow-600 flex items-center justify-center z-0">
                          <span className="text-3xl font-black text-yellow-900 relative z-10">1st</span>
                        </div>

                        {/* Crown Animation */}
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-30"
                        >
                          <TbCrown className="w-16 h-16 text-yellow-400 drop-shadow-lg" />
                        </motion.div>

                        {/* First Place Champion Card */}
                        <div
                          className={`relative bg-gradient-to-br ${topPerformers[0].tier.color} p-1.5 rounded-2xl ${topPerformers[0].tier.glow} shadow-2xl mb-32 transform ${window.innerWidth <= 480 ? 'scale-100' : 'scale-110'}`}
                          style={{
                            boxShadow: `0 8px 32px ${topPerformers[0].tier.shadowColor}60, 0 0 0 1px rgba(255,255,255,0.1)`,
                            width: window.innerWidth <= 480 ? '160px' : window.innerWidth <= 768 ? '200px' : '240px'
                          }}
                        >
                          <div
                            className={`${topPerformers[0].tier.bgColor} backdrop-blur-lg rounded-xl p-6 text-center relative overflow-hidden`}
                            style={{
                              background: `${topPerformers[0].tier.bgColor}, radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)`
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>

                            {/* Gold Medal */}
                            <div
                              className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center font-black text-xl shadow-lg relative z-20"
                              style={{
                                color: '#1f2937',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                border: '2px solid #FFFFFF'
                              }}
                            >
                              👑
                            </div>

                            {/* Profile Picture */}
                            <div className={`relative mx-auto mb-4 ${user && topPerformers[0]._id === user._id ? 'ring-1 ring-yellow-400 ring-opacity-80' : ''}`}>

                              <div className="relative">
                                <ProfilePicture
                                  user={topPerformers[0]}
                                  size="lg"
                                  showOnlineStatus={false}
                                  style={{
                                    width: '48px',
                                    height: '48px'
                                  }}
                                />
                                {/* Only show online dot if user is actually online */}
                                {topPerformers[0].isOnline && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: '-2px',
                                      right: '-2px',
                                      width: '14px',
                                      height: '14px',
                                      backgroundColor: '#22c55e',
                                      borderRadius: '50%',
                                      border: '2px solid #ffffff',
                                      boxShadow: '0 2px 8px rgba(34, 197, 94, 0.6)',
                                      zIndex: 10
                                    }}
                                    title="Online"
                                  />
                                )}
                              </div>
                              {/* Debug: Show user data */}
                              {console.log('🥇 First place user:', topPerformers[0])}
                              {user && topPerformers[0]._id === user._id && (
                                <div
                                  className="absolute -bottom-2 -right-2 rounded-full p-2 animate-pulse"
                                  style={{
                                    background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                  }}
                                >
                                  <TbStar className="w-6 h-6 text-gray-900" />
                                </div>
                              )}
                            </div>

                            {/* Champion Info */}
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <h3
                                className="text-lg font-black truncate"
                                style={{
                                  color: topPerformers[0].tier.nameColor,
                                  textShadow: `2px 2px 4px ${topPerformers[0].tier.shadowColor}`,
                                  filter: 'drop-shadow(0 0 8px currentColor)'
                                }}
                              >
                                {topPerformers[0].name}
                              </h3>
                              {isCurrentUser(topPerformers[0]._id) && (
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-black animate-pulse"
                                  style={{
                                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                    color: '#1f2937',
                                    boxShadow: '0 2px 8px rgba(255,215,0,0.8)',
                                    border: '1px solid #FFFFFF',
                                    fontSize: '10px'
                                  }}
                                >
                                  🎯 YOU
                                </span>
                              )}
                            </div>

                            <div
                              className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${topPerformers[0].tier.color} rounded-full text-sm font-black mb-3 relative z-10`}
                              style={{
                                background: `linear-gradient(135deg, ${topPerformers[0].tier.borderColor}, ${topPerformers[0].tier.textColor})`,
                                color: '#FFFFFF',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                boxShadow: `0 4px 15px ${topPerformers[0].tier.shadowColor}60`,
                                border: '2px solid rgba(255,255,255,0.2)'
                              }}
                            >
                              {topPerformers[0].tier.icon && React.createElement(topPerformers[0].tier.icon, {
                                className: "w-4 h-4",
                                style: { color: '#FFFFFF' }
                              })}
                              <span style={{ color: '#FFFFFF' }}>{topPerformers[0].tier.title}</span>
                            </div>

                            {/* Enhanced Stats */}
                            <div className="space-y-2 relative z-10">
                              <div className="text-xl font-black" style={{
                                color: topPerformers[0].tier.nameColor,
                                textShadow: `2px 2px 4px ${topPerformers[0].tier.shadowColor}`,
                                filter: 'drop-shadow(0 0 8px currentColor)'
                              }}>
                                {topPerformers[0].totalXP.toLocaleString()} XP
                              </div>

                              <div className="flex justify-center gap-4 text-sm">
                                <div className="text-center">
                                  <div className="flex items-center gap-1 justify-center">
                                    <TbBrain className="w-4 h-4" style={{ color: topPerformers[0].tier.textColor }} />
                                    <span className="font-bold" style={{ color: topPerformers[0].tier.textColor }}>
                                      {topPerformers[0].totalQuizzesTaken}
                                    </span>
                                  </div>
                                  <div className="text-xs opacity-80" style={{ color: topPerformers[0].tier.textColor }}>Quizzes</div>
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center gap-1 justify-center">
                                    <TbFlame className="w-4 h-4" style={{ color: '#FF6B35' }} />
                                    <span className="font-bold" style={{ color: topPerformers[0].tier.textColor }}>
                                      {topPerformers[0].currentStreak}
                                    </span>
                                  </div>
                                  <div className="text-xs opacity-80" style={{ color: topPerformers[0].tier.textColor }}>Streak</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Third Place - Right */}
                    {topPerformers[2] && (
                      <motion.div
                        key={`third-${topPerformers[2]._id}`}
                        ref={user && String(topPerformers[2]._id) === String(user._id) ? podiumUserRef : null}
                        data-user-id={topPerformers[2]._id}
                        data-user-rank={3}
                        initial={{ opacity: 0, x: 100, y: 50 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          y: 0,
                          scale: [1, 1.02, 1],
                          rotateY: [0, -5, 0]
                        }}
                        transition={{
                          delay: 1.0,
                          duration: 1.2,
                          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                          rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                        }}
                        whileHover={{ scale: 1.05, y: -10 }}
                        className={`relative order-3 ${
                          shouldHighlightUser(topPerformers[2]._id)
                            ? 'ring-8 ring-yellow-400 ring-opacity-100'
                            : ''
                        }`}
                        style={{
                          height: window.innerWidth <= 768 ? '200px' : '280px',
                          transform: shouldHighlightUser(topPerformers[2]._id) ? 'scale(1.08)' : 'scale(1)',
                          filter: shouldHighlightUser(topPerformers[2]._id)
                            ? 'brightness(1.3) saturate(1.2) drop-shadow(0 0 30px rgba(255, 215, 0, 1))'
                            : 'none',
                          transition: 'all 0.3s ease',
                          border: shouldHighlightUser(topPerformers[2]._id) ? '4px solid #FFD700' : 'none',
                          borderRadius: isCurrentUser(topPerformers[2]._id) ? '20px' : '0px',
                          background: isCurrentUser(topPerformers[2]._id) ? 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))' : 'transparent'
                        }}
                      >
                        {/* Third Place Podium Base */}
                        <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg border-2 border-amber-700 flex items-center justify-center z-0">
                          <span className="text-xl font-black text-amber-900 relative z-10">3rd</span>
                        </div>

                        {/* Third Place Champion Card */}
                        <div
                          className={`relative bg-gradient-to-br ${topPerformers[2].tier.color} p-1 rounded-xl ${topPerformers[2].tier.glow} shadow-xl mb-16`}
                          style={{
                            boxShadow: `0 6px 20px ${topPerformers[2].tier.shadowColor}50`,
                            width: window.innerWidth <= 480 ? '140px' : window.innerWidth <= 768 ? '160px' : '200px'
                          }}
                        >
                          <div
                            className={`${topPerformers[2].tier.bgColor} backdrop-blur-lg rounded-xl p-4 text-center relative overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

                            {/* Bronze Medal */}
                            <div
                              className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center font-black text-lg shadow-lg relative z-20"
                              style={{
                                color: '#1f2937',
                                border: '2px solid #FFFFFF'
                              }}
                            >
                              🥉
                            </div>

                            {/* Profile Picture */}
                            <div className={`relative mx-auto mb-3 ${user && topPerformers[2]._id === user._id ? 'ring-1 ring-yellow-400 ring-opacity-80' : ''}`}>
                              <ProfilePicture
                                user={topPerformers[2]}
                                size="md"
                                showOnlineStatus={true}
                                style={{
                                  width: '40px',
                                  height: '40px'
                                }}
                              />
                            </div>

                            {/* Name and Stats */}
                            <h3
                              className="text-sm font-bold mb-2 truncate"
                              style={{ color: topPerformers[2].tier.nameColor }}
                            >
                              {topPerformers[2].name}
                            </h3>

                            <div className="text-lg font-black mb-2" style={{ color: topPerformers[2].tier.textColor }}>
                              {topPerformers[2].totalXP.toLocaleString()} XP
                            </div>

                            <div className="flex justify-center gap-3 text-xs">
                              <span style={{ color: topPerformers[2].tier.textColor }}>
                                🧠 {topPerformers[2].totalQuizzesTaken}
                              </span>
                              <span style={{ color: topPerformers[2].tier.textColor }}>
                                🔥 {topPerformers[2].currentStreak}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>








                </motion.div>
              )}

              {/* LEAGUE-BASED RANKING DISPLAY */}
              {selectedLeague ? (
                /* SELECTED LEAGUE VIEW */
                leagueUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="mt-16 main-ranking-section"
                  >
                    {/* Selected League Header */}
                    <div className="text-center mb-8 md:mb-12">
                      <motion.h2
                        className="text-2xl sm:text-3xl md:text-4xl font-black mb-3"
                        style={{
                          background: `linear-gradient(45deg, ${leagueSystem[selectedLeague].borderColor}, ${leagueSystem[selectedLeague].textColor})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          filter: `drop-shadow(0 0 12px ${leagueSystem[selectedLeague].borderColor})`
                        }}
                        animate={{ scale: [1, 1.01, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        {leagueSystem[selectedLeague].leagueIcon} {leagueSystem[selectedLeague].title} LEAGUE {leagueSystem[selectedLeague].leagueIcon}
                      </motion.h2>
                      <p className="text-white/70 text-sm md:text-base font-medium">
                        {leagueUsers.length} champions in this league
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedLeague(null)}
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        ← Back to All Leagues
                      </motion.button>
                    </div>

                    {/* Selected League Users */}
                    <div className="max-w-6xl mx-auto px-4">
                      <div className="grid gap-3 md:gap-4">
                        {leagueUsers.map((champion, index) => {
                          const actualRank = index + 1;
                          const isCurrentUser = user && String(champion._id) === String(user._id);

                          return (
                            <motion.div
                              key={champion._id}
                              ref={isCurrentUser ? listUserRef : null}
                              data-user-id={champion._id}
                              data-user-rank={actualRank}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                              whileHover={{ scale: 1.01, y: -2 }}
                              className={`ranking-card group relative ${
                                shouldHighlightUser(champion._id)
                                  ? 'ring-8 ring-yellow-400 ring-opacity-100'
                                  : ''
                              }`}
                              style={{
                                transform: shouldHighlightUser(champion._id) ? 'scale(1.05)' : 'scale(1)',
                                filter: shouldHighlightUser(champion._id)
                                  ? 'brightness(1.25) saturate(1.3) drop-shadow(0 0 25px rgba(255, 215, 0, 1))'
                                  : 'none',
                                transition: 'all 0.3s ease',
                                border: shouldHighlightUser(champion._id) ? '4px solid #FFD700' : 'none',
                                borderRadius: shouldHighlightUser(champion._id) ? '16px' : '0px',
                                background: isCurrentUser ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.15))' : 'transparent',
                                position: 'relative',
                                zIndex: isCurrentUser ? 10 : 1
                              }}
                            >
                              {/* League User Card */}
                              <div
                                className={`bg-gradient-to-r ${champion.tier.color} p-0.5 rounded-2xl ${champion.tier.glow} transition-all duration-300 group-hover:scale-[1.01]`}
                                style={{
                                  boxShadow: `0 4px 20px ${champion.tier.shadowColor}40`
                                }}
                              >
                                <div
                                  className={`${champion.tier.bgColor} backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden`}
                                  style={{
                                    border: `1px solid ${champion.tier.borderColor}30`
                                  }}
                                >
                                  {/* Subtle Background Gradient */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/3 to-transparent rounded-2xl"></div>

                                  {/* Left Section: Rank & Profile */}
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    {/* Rank Badge */}
                                    <div className="relative">
                                      <div
                                        className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-black text-sm shadow-lg relative z-10"
                                        style={{
                                          color: '#FFFFFF',
                                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                          border: '2px solid rgba(255,255,255,0.2)',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                        }}
                                      >
                                        #{actualRank}
                                      </div>
                                    </div>

                                    {/* Profile Picture with Online Status */}
                                    <div className="relative">
                                      <ProfilePicture
                                        user={champion}
                                        size="sm"
                                        showOnlineStatus={false}
                                        style={{
                                          width: '32px',
                                          height: '32px'
                                        }}
                                      />
                                      {/* Only show online dot if user is actually online */}
                                      {champion.isOnline && (
                                        <div
                                          style={{
                                            position: 'absolute',
                                            bottom: '-2px',
                                            right: '-2px',
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: '#22c55e',
                                            borderRadius: '50%',
                                            border: '2px solid #ffffff',
                                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.6)',
                                            zIndex: 10
                                          }}
                                          title="Online"
                                        />
                                      )}
                                      {/* Current User Indicator */}
                                      {isCurrentUser && (
                                        <div
                                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center animate-pulse"
                                          style={{
                                            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                            boxShadow: '0 2px 6px rgba(255,215,0,0.6)'
                                          }}
                                        >
                                          <TbStar className="w-2.5 h-2.5 text-gray-900" />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Center Section: User Info */}
                                  <div className="flex-1 min-w-0 px-2">
                                    <div className="space-y-1">
                                      {/* User Name */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3
                                          className="text-base md:text-lg font-bold truncate"
                                          style={{
                                            color: champion.tier.nameColor,
                                            textShadow: `1px 1px 2px ${champion.tier.shadowColor}`,
                                            filter: 'drop-shadow(0 0 4px currentColor)'
                                          }}
                                        >
                                          {champion.name}
                                        </h3>
                                        {isCurrentUser && (
                                          <span
                                            className="px-3 py-1 rounded-full text-sm font-black animate-pulse"
                                            style={{
                                              background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
                                              color: '#1f2937',
                                              boxShadow: '0 4px 12px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.6)',
                                              border: '2px solid #FFFFFF',
                                              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                              fontSize: '12px',
                                              fontWeight: '900'
                                            }}
                                          >
                                            🎯 YOU
                                          </span>
                                        )}
                                      </div>

                                      {/* Class Info */}
                                      <div className="text-xs text-white/70 mt-0.5">
                                        {champion.level} • Class {champion.class}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Section: Stats */}
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    {/* XP Display */}
                                    <div
                                      className="text-lg md:text-xl font-black mb-2"
                                      style={{
                                        color: champion.tier.nameColor,
                                        textShadow: `1px 1px 2px ${champion.tier.shadowColor}`,
                                        filter: 'drop-shadow(0 0 6px currentColor)'
                                      }}
                                    >
                                      {champion.totalXP.toLocaleString()} XP
                                    </div>

                                    {/* Compact Stats */}
                                    <div className="flex items-center gap-3 text-xs">
                                      <div
                                        className="flex items-center gap-1 px-2 py-1 rounded-md"
                                        style={{
                                          backgroundColor: `${champion.tier.borderColor}20`,
                                          color: champion.tier.textColor
                                        }}
                                      >
                                        <TbBrain className="w-3 h-3" />
                                        <span className="font-medium">{champion.totalQuizzesTaken}</span>
                                      </div>
                                      <div
                                        className="flex items-center gap-1 px-2 py-1 rounded-md"
                                        style={{
                                          backgroundColor: '#FF6B3520',
                                          color: '#FF6B35'
                                        }}
                                      >
                                        <TbFlame className="w-3 h-3" />
                                        <span className="font-medium">{champion.currentStreak}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )
              ) : (
                /* ALL LEAGUES GROUPED VIEW */
                Object.keys(leagueGroups).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="mt-16 main-ranking-section"
                    id="grouped-leagues-section"
                  >
                    {/* All Leagues Header */}
                    <div className="text-center mb-8 md:mb-12">
                      <motion.h2
                        className="text-2xl sm:text-3xl md:text-4xl font-black mb-3"
                        style={{
                          background: 'linear-gradient(45deg, #8B5CF6, #06B6D4, #10B981)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          filter: 'drop-shadow(0 0 12px #8B5CF6)'
                        }}
                        animate={{ scale: [1, 1.01, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        🏆 LEAGUE RANKINGS 🏆
                      </motion.h2>
                      <p className="text-white/70 text-sm md:text-base font-medium">
                        Click on any league icon above to see its members
                      </p>
                    </div>

                    {/* Grouped Leagues Display */}
                    <div className="max-w-6xl mx-auto px-4 space-y-8">
                      {getOrderedLeagues().map((leagueKey) => {
                        const league = leagueSystem[leagueKey];
                        const leagueData = leagueGroups[leagueKey];
                        const topUsers = leagueData.users.slice(0, 3); // Show top 3 from each league

                        return (
                          <motion.div
                            key={leagueKey}
                            ref={(el) => (leagueRefs.current[leagueKey] = el)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                            id={`league-${leagueKey}`}
                            data-league={leagueKey}
                          >
                            {/* League Header */}
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4">
                                <div
                                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                                  style={{
                                    background: `linear-gradient(135deg, ${league.borderColor}40, ${league.textColor}20)`,
                                    border: `2px solid ${league.borderColor}60`,
                                    boxShadow: `0 4px 20px ${league.shadowColor}40`
                                  }}
                                >
                                  {league.leagueIcon}
                                </div>
                                <div>
                                  <h3
                                    className="text-2xl font-black mb-1"
                                    style={{
                                      color: league.nameColor,
                                      textShadow: `2px 2px 4px ${league.shadowColor}`,
                                      filter: 'drop-shadow(0 0 8px currentColor)'
                                    }}
                                  >
                                    {league.title} LEAGUE
                                  </h3>
                                  <p className="text-white/70 text-sm">
                                    {leagueData.users.length} champions • {league.description}
                                  </p>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleLeagueSelect(leagueKey)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                View All ({leagueData.users.length})
                              </motion.button>
                            </div>

                            {/* Top 3 Users from League */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {topUsers.map((champion, index) => {
                                const isCurrentUser = user && champion._id === user._id;
                                const leagueRank = index + 1;

                                return (
                                  <motion.div
                                    key={champion._id}
                                    data-user-id={champion._id}
                                    data-user-rank={leagueRank}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    className={`relative ${
                                      shouldHighlightUser(champion._id)
                                        ? 'ring-2 ring-yellow-400/60'
                                        : ''
                                    }`}
                                  >
                                    <div
                                      className={`bg-gradient-to-br ${champion.tier.color} p-0.5 rounded-xl ${champion.tier.glow} shadow-lg`}
                                      style={{
                                        boxShadow: `0 4px 15px ${champion.tier.shadowColor}30`
                                      }}
                                    >
                                      <div
                                        className={`${champion.tier.bgColor} backdrop-blur-lg rounded-xl p-4 text-center relative overflow-hidden`}
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

                                        {/* League Rank Badge */}
                                        <div
                                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs"
                                          style={{
                                            background: league.borderColor,
                                            color: '#FFFFFF',
                                            border: '2px solid #FFFFFF'
                                          }}
                                        >
                                          #{leagueRank}
                                        </div>

                                        {/* Profile Picture */}
                                        <div className={`relative mx-auto mb-3 ${
                                          isCurrentUser
                                            ? 'ring-1 ring-yellow-400 ring-opacity-80'
                                            : ''
                                        }`}>
                                          <ProfilePicture
                                            user={champion}
                                            size="md"
                                            showOnlineStatus={true}
                                            style={{
                                              width: '40px',
                                              height: '40px'
                                            }}
                                          />
                                          {isCurrentUser && (
                                            <div
                                              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center animate-pulse"
                                              style={{
                                                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                                boxShadow: '0 2px 6px rgba(255,215,0,0.6)'
                                              }}
                                            >
                                              <TbStar className="w-2.5 h-2.5 text-gray-900" />
                                            </div>
                                          )}
                                        </div>

                                        {/* Name and Stats */}
                                        <h4
                                          className="text-sm font-bold mb-2 truncate"
                                          style={{ color: champion.tier.nameColor }}
                                        >
                                          {champion.name}
                                          {isCurrentUser && (
                                            <span className="ml-1 text-xs text-yellow-400">👑</span>
                                          )}
                                        </h4>

                                        <div className="text-lg font-black mb-2" style={{ color: champion.tier.textColor }}>
                                          {champion.totalXP.toLocaleString()} XP
                                        </div>

                                        <div className="flex justify-center gap-3 text-xs">
                                          <span style={{ color: champion.tier.textColor }}>
                                            🧠 {champion.totalQuizzesTaken}
                                          </span>
                                          <span style={{ color: champion.tier.textColor }}>
                                            🔥 {champion.currentStreak}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Show More Indicator */}
                            {leagueData.users.length > 3 && (
                              <div className="text-center mt-4">
                                <p className="text-white/60 text-sm">
                                  +{leagueData.users.length - 3} more champions in this league
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )
              )}




              {/* EMPTY STATE */}
              {rankingData.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <TbTrophy className="w-24 h-24 text-white/30 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4" style={{
                    color: '#ffffff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontWeight: '800'
                  }}>No Champions Yet</h3>
                  <p className="text-lg" style={{
                    color: '#e5e7eb',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontWeight: '600'
                  }}>
                    Be the first to take a quiz and claim your spot in the Hall of Champions!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
};

export default AmazingRankingPage;
