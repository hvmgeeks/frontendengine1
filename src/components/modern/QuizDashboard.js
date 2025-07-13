import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import ModernQuizCard from './ModernQuizCard';
import {
  TbSearch,
  TbFilter,
  TbGridDots,
  TbList,
  TbSortAscending,
  TbBook,
  TbClock,
  TbStar,
} from 'react-icons/tb';

const QuizDashboard = ({
  quizzes = [],
  userResults = {},
  onQuizStart,
  loading = false,
  className = ''
}) => {
  const { user } = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  // Set default class filter to user's class
  useEffect(() => {
    if (user?.class) {
      setSelectedClass(user.class);
    }
  }, [user]);

  // Get unique subjects and classes from quizzes
  const subjects = [...new Set(quizzes.map(quiz => quiz.subject).filter(Boolean))];
  const classes = [...new Set(quizzes.map(quiz => quiz.class).filter(Boolean))].sort();

  // Filter and sort quizzes
  const filteredQuizzes = quizzes
    .filter(quiz => {
      const matchesSearch = quiz.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || quiz.subject === selectedSubject;
      const matchesClass = selectedClass === 'all' || quiz.class === selectedClass;
      return matchesSearch && matchesSubject && matchesClass;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        case 'questions':
          return (a.questions?.length || 0) - (b.questions?.length || 0);
        case 'xp':
          return (b.xpPoints || 0) - (a.xpPoints || 0);
        default:
          return 0;
      }
    });

  // Stats - calculate based on filtered quizzes and actual user results
  const stats = {
    total: filteredQuizzes.length,
    completed: filteredQuizzes.filter(quiz => userResults[quiz._id]).length,
    passed: filteredQuizzes.filter(quiz => {
      const result = userResults[quiz._id];
      if (!result) return false;
      const passingMarks = quiz.passingMarks || 60;
      return result.percentage >= passingMarks;
    }).length,
    totalXP: filteredQuizzes.reduce((sum, quiz) => {
      const result = userResults[quiz._id];
      return sum + (result?.xpEarned || 0);
    }, 0)
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quiz Dashboard</h1>
              <p className="text-gray-600 mt-1">Challenge yourself and track your progress</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-blue-500 font-medium">Total Quizzes</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                <div className="text-xs text-green-500 font-medium">Passed</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
                <div className="text-xs text-purple-500 font-medium">Attempted</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.totalXP}</div>
                <div className="text-xs text-yellow-500 font-medium">Total XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <TbSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Subject Filter */}
            <div className="lg:w-48">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="lg:w-48">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="duration">Sort by Duration</option>
                <option value="questions">Sort by Questions</option>
                <option value="xp">Sort by XP</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
              >
                <TbGridDots className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
              >
                <TbList className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <TbBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
            }
          `}>
            {filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.1, 0.8) }}
                className={viewMode === 'list' ? 'w-full' : ''}
              >
                <ModernQuizCard
                  quiz={quiz}
                  userResult={userResults[quiz._id]}
                  onStart={onQuizStart}
                  className="h-full"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizDashboard;
