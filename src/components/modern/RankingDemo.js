import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UserRankingList from './UserRankingList';
import UserRankingCard from './UserRankingCard';

const RankingDemo = () => {
    const [layout, setLayout] = useState('horizontal');
    const [size, setSize] = useState('medium');

    // Sample user data
    const sampleUsers = [
        {
            userId: '1',
            name: 'Alice Johnson',
            profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            subscriptionStatus: 'active',
            totalPoints: 2850,
            passedExamsCount: 15,
            quizzesTaken: 23,
            score: 2850,
            rank: 1
        },
        {
            userId: '2',
            name: 'Bob Smith',
            profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            subscriptionStatus: 'free',
            totalPoints: 2720,
            passedExamsCount: 12,
            quizzesTaken: 20,
            score: 2720,
            rank: 2
        },
        {
            userId: '3',
            name: 'Carol Davis',
            profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            subscriptionStatus: 'premium',
            totalPoints: 2650,
            passedExamsCount: 14,
            quizzesTaken: 19,
            score: 2650,
            rank: 3
        },
        {
            userId: '4',
            name: 'David Wilson',
            profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            subscriptionStatus: 'expired',
            totalPoints: 2400,
            passedExamsCount: 10,
            quizzesTaken: 18,
            score: 2400,
            rank: 4
        },
        {
            userId: '5',
            name: 'Emma Brown',
            profilePicture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
            subscriptionStatus: 'active',
            totalPoints: 2350,
            passedExamsCount: 11,
            quizzesTaken: 16,
            score: 2350,
            rank: 5
        },
        {
            userId: '6',
            name: 'Frank Miller',
            profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
            subscriptionStatus: 'free',
            totalPoints: 2200,
            passedExamsCount: 9,
            quizzesTaken: 15,
            score: 2200,
            rank: 6
        },
        {
            userId: '7',
            name: 'Grace Lee',
            profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
            subscriptionStatus: 'premium',
            totalPoints: 2100,
            passedExamsCount: 8,
            quizzesTaken: 14,
            score: 2100,
            rank: 7
        },
        {
            userId: '8',
            name: 'Henry Taylor',
            profilePicture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
            subscriptionStatus: 'free',
            totalPoints: 1950,
            passedExamsCount: 7,
            quizzesTaken: 13,
            score: 1950,
            rank: 8
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Modern User Ranking Component
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        A beautiful, responsive ranking component with Instagram-style profile circles, 
                        premium user highlighting, and multiple layout options.
                    </p>
                </motion.div>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200"
                >
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Customization Options</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Layout Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Layout Style
                            </label>
                            <div className="space-y-2">
                                {['horizontal', 'vertical', 'grid'].map((layoutOption) => (
                                    <label key={layoutOption} className="flex items-center">
                                        <input
                                            id={`layout-${layoutOption}`}
                                            type="radio"
                                            name="layout"
                                            value={layoutOption}
                                            checked={layout === layoutOption}
                                            onChange={(e) => setLayout(e.target.value)}
                                            className="mr-2 text-blue-600"
                                        />
                                        <span className="capitalize">{layoutOption}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Size Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Component Size
                            </label>
                            <div className="space-y-2">
                                {['small', 'medium', 'large'].map((sizeOption) => (
                                    <label key={sizeOption} className="flex items-center">
                                        <input
                                            id={`size-${sizeOption}`}
                                            type="radio"
                                            name="size"
                                            value={sizeOption}
                                            checked={size === sizeOption}
                                            onChange={(e) => setSize(e.target.value)}
                                            className="mr-2 text-blue-600"
                                        />
                                        <span className="capitalize">{sizeOption}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Individual Card Examples */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Individual Card Examples</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Premium User Card */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium User (Gold Glow)</h3>
                            <UserRankingCard
                                user={sampleUsers[0]}
                                rank={1}
                                isCurrentUser={false}
                                layout="horizontal"
                                size={size}
                                showStats={true}
                            />
                        </div>

                        {/* Current User Card */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current User (Highlighted)</h3>
                            <UserRankingCard
                                user={sampleUsers[1]}
                                rank={2}
                                isCurrentUser={true}
                                layout="horizontal"
                                size={size}
                                showStats={true}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Full Ranking List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Ranking List</h2>
                    
                    <UserRankingList
                        users={sampleUsers}
                        currentUserId="3" // Carol Davis as current user
                        layout={layout}
                        size={size}
                        showSearch={true}
                        showFilters={true}
                        showStats={true}
                    />
                </motion.div>

                {/* Features List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 bg-white rounded-xl p-8 border border-gray-200"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900">🎨 Premium Highlighting</h3>
                            <p className="text-gray-600 text-sm">Gold gradient glow for premium users with vibrant visual distinction</p>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900">📱 Responsive Design</h3>
                            <p className="text-gray-600 text-sm">Adapts perfectly to mobile, tablet, and desktop screens</p>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900">🔍 Search & Filter</h3>
                            <p className="text-gray-600 text-sm">Real-time search and filtering by subscription status</p>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900">✨ Smooth Animations</h3>
                            <p className="text-gray-600 text-sm">Framer Motion powered animations for engaging interactions</p>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900">🏆 Rank Indicators</h3>
                            <p className="text-gray-600 text-sm">Special icons and colors for top performers</p>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900">🎯 Current User Focus</h3>
                            <p className="text-gray-600 text-sm">Automatic highlighting and scroll-to functionality</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RankingDemo;
