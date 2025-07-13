import React, { useState, useRef } from 'react';
import { TbUser, TbUsers, TbTrophy, TbPlayerPlay, TbPlayerPause, TbClock, TbSearch, TbFilter } from 'react-icons/tb';
import UserRankingCard from './UserRankingCard';

const UserRankingList = ({
    users = [],
    currentUserId = null,
    layout = 'horizontal', // 'horizontal', 'vertical', 'grid'
    size = 'medium',
    showStats = true,
    className = '',
    currentUserRef = null,
    showFindMe = false,
    lastUpdated = null,
    autoRefresh = false,
    onAutoRefreshToggle = null
}) => {
    // State for search and filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'premium', 'free', 'expired'
    const [sortBy, setSortBy] = useState('rank'); // 'rank', 'xp', 'name'
    const [viewMode, setViewMode] = useState('card'); // 'card', 'compact', 'detailed'
    const [showOnlyMyClass, setShowOnlyMyClass] = useState(false);
    const [localShowFindMe, setLocalShowFindMe] = useState(false);
    const localCurrentUserRef = useRef(null);

    // Use passed refs or local ones
    const userRef = currentUserRef || localCurrentUserRef;
    const findMeActive = showFindMe || localShowFindMe;

    // Get current user's class and level for filtering
    const currentUser = users.find(user => user.userId === currentUserId || user._id === currentUserId);
    const currentUserClass = currentUser?.class;
    const currentUserLevel = currentUser?.level;

    // Filter and search users
    const filteredUsers = users.filter(user => {
        // Search filter
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.class?.toLowerCase().includes(searchTerm.toLowerCase());

        // Class filter
        const matchesClass = !showOnlyMyClass || user.class === currentUserClass;

        // Subscription filter
        const userStatus = user.normalizedSubscriptionStatus?.toLowerCase() || user.subscriptionStatus?.toLowerCase() || 'free';
        let matchesFilter = true;

        switch (filterType) {
            case 'premium':
                matchesFilter = userStatus === 'premium' || userStatus === 'active';
                break;
            case 'expired':
                matchesFilter = userStatus === 'expired';
                break;
            case 'free':
                matchesFilter = userStatus === 'free';
                break;
            default:
                matchesFilter = true;
        }

        return matchesSearch && matchesFilter && matchesClass;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'xp':
                return (b.totalXP || 0) - (a.totalXP || 0);
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'score':
                return (b.rankingScore || b.score || 0) - (a.rankingScore || a.score || 0);
            case 'class':
                return (a.class || '').localeCompare(b.class || '');
            default:
                return (a.rank || 0) - (b.rank || 0);
        }
    });

    // Calculate class ranks for filtered users
    const usersWithClassRank = filteredUsers.map(user => {
        // Group users by class and calculate class rank
        const sameClassUsers = filteredUsers.filter(u => u.class === user.class);
        const classRank = sameClassUsers.findIndex(u => u._id === user._id || u.userId === user.userId) + 1;
        return { ...user, classRank };
    });

    // Scroll to current user
    const scrollToCurrentUser = () => {
        if (userRef.current) {
            userRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            setLocalShowFindMe(true);
            // Hide the highlight after 3 seconds
            setTimeout(() => setLocalShowFindMe(false), 3000);
        }
    };

    // Get layout classes based on view mode and layout
    const getLayoutClasses = () => {
        if (viewMode === 'compact') {
            return 'space-y-2';
        }

        switch (layout) {
            case 'vertical':
                return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4';
            case 'grid':
                return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
            case 'horizontal':
            default:
                return 'space-y-4';
        }
    };



    // Stats summary with enhanced calculations
    const totalUsers = users.length;
    const premiumUsers = users.filter(u =>
        u.subscriptionStatus === 'active' ||
        u.subscriptionStatus === 'premium' ||
        u.normalizedSubscriptionStatus === 'premium'
    ).length;

    // Use ranking score or XP as the primary metric
    const topScore = users.length > 0 ? Math.max(...users.map(u =>
        u.rankingScore || u.totalXP || u.totalPoints || 0
    )) : 0;

    // Calculate additional stats
    const activeUsers = users.filter(u => (u.totalQuizzesTaken || 0) > 0).length;
    const averageXP = users.length > 0 ?
        Math.round(users.reduce((sum, u) => sum + (u.totalXP || 0), 0) / users.length) : 0;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header with Stats */}
            {showStats && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 animate-fadeInUp">
                    {/* Enhanced Search and Filter Section */}
                    <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
                        <div className="flex flex-col gap-4">
                            {/* Top Row - Search and Quick Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Search Input */}
                                <div className="flex-1 relative">
                                    <TbSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        id="ranking-search"
                                        name="ranking-search"
                                        type="text"
                                        placeholder="Search by name, email, or class..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoComplete="off"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Quick Filter Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowOnlyMyClass(!showOnlyMyClass)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                            showOnlyMyClass
                                                ? 'bg-blue-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        My Class Only
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Row - Dropdowns and View Mode */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Filter Dropdown */}
                                <div className="relative">
                                    <TbFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <select
                                        id="ranking-filter"
                                        name="ranking-filter"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        autoComplete="off"
                                        className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                                    >
                                        <option value="all">All Subscriptions</option>
                                        <option value="premium">👑 Premium Users</option>
                                        <option value="free">🆓 Free Users</option>
                                        <option value="expired">⏰ Expired Users</option>
                                    </select>
                                </div>

                                {/* Sort Dropdown */}
                                <select
                                    id="ranking-sort"
                                    name="ranking-sort"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    autoComplete="off"
                                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                                >
                                    <option value="rank">🏆 Sort by Rank</option>
                                    <option value="xp">⚡ Sort by XP</option>
                                    <option value="score">📊 Sort by Score</option>
                                    <option value="name">📝 Sort by Name</option>
                                    <option value="class">🎓 Sort by Class</option>
                                </select>

                                {/* View Mode Toggle */}
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('card')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                            viewMode === 'card'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        Cards
                                    </button>
                                    <button
                                        onClick={() => setViewMode('compact')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                            viewMode === 'compact'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        Compact
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Results Count and Stats */}
                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-800">
                                    {usersWithClassRank.length}
                                </span> of <span className="font-semibold text-gray-800">{users.length}</span> users
                                {searchTerm && (
                                    <span className="ml-1">
                                        matching <span className="font-medium text-blue-600">"{searchTerm}"</span>
                                    </span>
                                )}
                                {filterType !== 'all' && (
                                    <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        {filterType}
                                    </span>
                                )}
                                {showOnlyMyClass && currentUserClass && (
                                    <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        {currentUserLevel === 'primary' ? `Class ${currentUserClass}` : currentUserClass}
                                    </span>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-4 text-xs text-gray-500">
                                <span>🏆 Top: {Math.max(...usersWithClassRank.map(u => u.rankingScore || u.totalXP || 0)).toLocaleString()}</span>
                                <span>📊 Avg: {Math.round(usersWithClassRank.reduce((sum, u) => sum + (u.rankingScore || u.totalXP || 0), 0) / usersWithClassRank.length || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl shadow-lg">
                                    <TbTrophy className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                                        Leaderboard
                                    </h2>
                                    <p className="text-sm text-gray-600 font-medium">Top performers across all levels</p>
                                </div>
                            </div>

                            {lastUpdated && (
                                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <TbClock className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-blue-700 font-medium">
                                        Updated {new Date(lastUpdated).toLocaleTimeString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Auto-refresh toggle */}
                            {onAutoRefreshToggle && (
                                <button
                                    onClick={onAutoRefreshToggle}
                                    className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105 active:scale-95 ${
                                        autoRefresh
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                >
                                    {autoRefresh ? <TbPlayerPause className="w-4 h-4" /> : <TbPlayerPlay className="w-4 h-4" />}
                                    <span className="hidden sm:inline">
                                        {autoRefresh ? 'Auto' : 'Manual'}
                                    </span>
                                </button>
                            )}



                            {/* Find Me button */}
                            {currentUserId && (
                                <button
                                    onClick={scrollToCurrentUser}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 hover:scale-105 active:scale-95"
                                >
                                    <TbUser className="w-4 h-4" />
                                    <span className="hidden sm:inline">Find Me</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <TbUsers className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-blue-700">Total Users</span>
                            </div>
                            <div className="text-3xl font-black text-blue-900 mb-1">{totalUsers}</div>
                            <div className="text-xs text-blue-600 font-medium">{activeUsers} active</div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                                    <TbTrophy className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-yellow-700">Premium Users</span>
                            </div>
                            <div className="text-3xl font-black text-yellow-900 mb-1">{premiumUsers}</div>
                            <div className="text-xs text-yellow-600 font-medium">
                                {totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0}% premium
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-green-500 rounded-lg">
                                    <TbUser className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-green-700">Top Score</span>
                            </div>
                            <div className="text-3xl font-black text-green-900 mb-1">{topScore.toLocaleString()}</div>
                            <div className="text-xs text-green-600 font-medium">ranking points</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-purple-500 rounded-lg">
                                    <TbTrophy className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-purple-700">Avg XP</span>
                            </div>
                            <div className="text-3xl font-black text-purple-900 mb-1">{averageXP.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 mt-1">experience points</div>
                        </div>
                    </div>
                </div>
            )}

            {/* User List */}
            <div className={`animate-fadeInUp ${getLayoutClasses()}`}>
                {usersWithClassRank.map((user, index) => {
                    const isCurrentUser = user.userId === currentUserId || user._id === currentUserId;
                    const rank = user.rank || index + 1;

                    // Render compact view for better performance with large lists
                    if (viewMode === 'compact') {
                        return (
                            <div
                                key={user.userId || user._id}
                                ref={isCurrentUser ? userRef : null}
                                className={`animate-slideInLeft transition-all duration-200 p-3 rounded-lg border ${
                                    isCurrentUser && findMeActive
                                        ? 'find-me-highlight ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                                        : isCurrentUser
                                        ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-200'
                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {/* Rank Badge */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            rank <= 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                                            rank <= 10 ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {rank}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex items-center space-x-2">
                                            <img
                                                src={user.profilePicture || '/default-avatar.png'}
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {user.level === 'primary' ? `Class ${user.class}` : user.class}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score and Badge */}
                                    <div className="flex items-center space-x-3">
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900 text-sm">
                                                {(user.rankingScore || user.totalXP || 0).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {user.rankingScore ? 'pts' : 'XP'}
                                            </div>
                                        </div>

                                        {/* Subscription Badge */}
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            (user.normalizedSubscriptionStatus || user.subscriptionStatus)?.toLowerCase() === 'premium' ||
                                            (user.normalizedSubscriptionStatus || user.subscriptionStatus)?.toLowerCase() === 'active'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : (user.normalizedSubscriptionStatus || user.subscriptionStatus)?.toLowerCase() === 'expired'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {(user.normalizedSubscriptionStatus || user.subscriptionStatus)?.toLowerCase() === 'premium' ||
                                             (user.normalizedSubscriptionStatus || user.subscriptionStatus)?.toLowerCase() === 'active' ? '👑' :
                                             (user.normalizedSubscriptionStatus || user.subscriptionStatus)?.toLowerCase() === 'expired' ? '⏰' : '🆓'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Regular card view
                    return (
                        <div
                            key={user.userId || user._id}
                            ref={isCurrentUser ? userRef : null}
                            className={`animate-slideInLeft transition-all duration-300 ${
                                isCurrentUser && findMeActive
                                    ? 'find-me-highlight ring-4 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-2xl'
                                    : isCurrentUser
                                    ? 'ring-2 ring-blue-400 bg-blue-50/50 rounded-lg'
                                        : ''
                                }`}
                            >
                                <UserRankingCard
                                    user={user}
                                    rank={rank}
                                    classRank={user.classRank}
                                    isCurrentUser={isCurrentUser}
                                    layout={layout}
                                    size={size}
                                    showStats={showStats}
                                />
                            </div>
                        );
                    })}
            </div>

            {/* Empty State */}
            {usersWithClassRank.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 animate-fadeInUp">
                    <TbUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">
                        {users.length === 0 ? 'No ranking data available.' : 'Try adjusting your search or filter criteria.'}
                    </p>
                </div>
            )}

            {/* Floating Action Button for Current User */}
            {currentUserId && usersWithClassRank.length > 10 && (
                <button
                    onClick={scrollToCurrentUser}
                    className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 hover:scale-110 active:scale-95 animate-bounce"
                    title="Find me in ranking"
                >
                    <TbUser className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};

export default UserRankingList;
