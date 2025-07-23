import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TbClock,
  TbQuestionMark,
  TbPlayerPlay,
  TbTarget,
  TbBrain,
  TbCheck,
  TbX,
  TbEye,
  TbPhoto,
  TbEdit,
  TbUsers,
  TbAward,
} from 'react-icons/tb';
import {
  extractQuizData,
  getQuizStatus,
  safeString
} from '../../utils/quizDataUtils';
import { getExamStats } from '../../apicalls/exams';

const QuizCard = ({
  quiz,
  onStart,
  showResults = false,
  userResult = null,
  className = '',
  ...props
}) => {

  const [examStats, setExamStats] = useState(null);

  // Extract safe quiz data to prevent object rendering errors
  const quizData = extractQuizData(quiz);
  const quizStatus = getQuizStatus(userResult, quizData.passingMarks);

  // Fetch exam statistics with caching
  useEffect(() => {
    const fetchExamStats = async () => {
      if (quiz?._id) {
        try {
          // Check cache first
          const cacheKey = `exam_stats_${quiz._id}`;
          const cachedStats = localStorage.getItem(cacheKey);
          const cacheTime = localStorage.getItem(`${cacheKey}_time`);
          const now = Date.now();

          // Use cache if less than 10 minutes old
          if (cachedStats && cacheTime && (now - parseInt(cacheTime)) < 600000) {
            setExamStats(JSON.parse(cachedStats));
            return;
          }

          const response = await getExamStats(quiz._id);
          if (response.success) {
            setExamStats(response.data);
            // Cache the stats
            localStorage.setItem(cacheKey, JSON.stringify(response.data));
            localStorage.setItem(`${cacheKey}_time`, now.toString());
          }
        } catch (error) {
          console.error('Failed to fetch exam stats:', error);
          // Set default stats to prevent loading issues
          setExamStats({ totalAttempts: 0, averageScore: 0 });
        }
      }
    };

    fetchExamStats();
  }, [quiz?._id]);



  const getDifficultyColor = (difficulty) => {
    switch (safeString(difficulty).toLowerCase()) {
      case 'easy':
        return 'bg-green-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'hard':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };






  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`h-full ${className}`}
    >
      <div
        className="h-full shadow-2xl hover:shadow-3xl transition-all duration-500 relative rounded-3xl overflow-hidden transform hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: userResult
            ? (quizStatus.status === 'passed' ? '4px solid #10b981' : '4px solid #ef4444')
            : '4px solid #3b82f6',
          boxShadow: userResult
            ? (quizStatus.status === 'passed'
                ? '0 25px 50px rgba(16, 185, 129, 0.4), 0 0 0 2px rgba(16, 185, 129, 0.3), inset 0 0 0 1px rgba(255,255,255,0.3)'
                : '0 25px 50px rgba(239, 68, 68, 0.4), 0 0 0 2px rgba(239, 68, 68, 0.3), inset 0 0 0 1px rgba(255,255,255,0.3)')
            : '0 25px 50px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.3), inset 0 0 0 1px rgba(255,255,255,0.3)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff'
        }}
        {...props}
      >
        <div className="absolute top-3 right-3 z-10">
          {userResult ? (
            <div className="flex flex-col gap-2">
              <div
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                style={{
                  backgroundColor: quizStatus.status === 'passed' ? '#10b981' : '#ef4444'
                }}
              >
                {quizStatus.status === 'passed' ? (
                  <>
                    <TbCheck className="w-3 h-3 inline mr-1" />
                    PASSED
                  </>
                ) : (
                  <>
                    <TbX className="w-3 h-3 inline mr-1" />
                    FAILED
                  </>
                )}
              </div>
              <div
                className="px-3 py-1 rounded-full text-xs font-bold text-center shadow-md"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb'
                }}
              >
                {userResult.percentage}% • {userResult.xpEarned || 0} XP
              </div>
            </div>
          ) : (
            <div
              className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
              style={{ backgroundColor: '#3b82f6' }}
            >
              <TbClock className="w-3 h-3 inline mr-1" />
              NOT ATTEMPTED
            </div>
          )}
        </div>

        <div
          className="p-4 text-white"
          style={{
            backgroundColor: !userResult
              ? '#2563eb' // blue-600
              : quizStatus.status === 'passed'
                ? '#059669' // emerald-600
                : '#e11d48' // rose-600
          }}
        >
          {/* Enhanced header with subject prominence */}
          <div className="text-center mb-4">


            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white border-opacity-30">
              <TbBrain className="w-6 h-6 text-white" />
            </div>

            {/* Quiz Title - At Top */}
            <h3
              className="text-xl font-bold line-clamp-2 leading-tight mb-4 text-white text-center"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: '1.3'
              }}
            >
              {quizData.name}
            </h3>

            {/* Class and Subject Tags Together */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs px-3 py-1 rounded-full text-white bg-white bg-opacity-20 font-medium border border-white border-opacity-30">
                📖 {quizData.level === 'primary' ? `Class ${quizData.class}` : quizData.class}
              </span>
              {/* Level Tag */}
              <span
                className="text-xs px-3 py-1 rounded-full font-medium shadow-lg"
                style={{
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  border: '1px solid #a78bfa'
                }}
              >
                🎯 {quizData.level || 'Primary'}
              </span>

              {/* Class Tag */}
              <span
                className="text-xs px-3 py-1 rounded-full font-medium shadow-lg"
                style={{
                  backgroundColor: '#4ade80',
                  color: '#ffffff',
                  border: '1px solid #86efac'
                }}
              >
                📖 {quizData.level === 'primary' ? `Class ${quizData.class}` : quizData.class || 'N/A'}
              </span>

              {/* Category Tag */}
              <span
                className="text-xs px-3 py-1 rounded-full font-medium shadow-lg"
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  border: '1px solid #fb923c'
                }}
              >
                📂 {quizData.category || 'General'}
              </span>

              {/* Topic Tag - Show actual topic or "General" if not defined */}
              <span
                className="text-xs px-3 py-1 rounded-full font-medium shadow-lg"
                style={{
                  backgroundColor: quizData.topic && quizData.topic !== 'General' ? '#10b981' : '#6b7280',
                  color: '#ffffff',
                  border: quizData.topic && quizData.topic !== 'General' ? '1px solid #86efac' : '1px solid #9ca3af'
                }}
              >
                📚 {quizData.topic || 'General'}
              </span>
              {quizData.difficulty && (
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  quizData.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                  quizData.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {quizData.difficulty}
                </span>
              )}
            </div>
          </div>



          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col items-center bg-white bg-opacity-20 rounded-lg py-2 px-1 border border-white border-opacity-30">
              <TbQuestionMark className="w-4 h-4 mb-1" />
              <span className="font-bold">{quizData.totalQuestions}</span>
              <span className="text-xs opacity-90">Questions</span>
            </div>
            <div className="flex flex-col items-center bg-white bg-opacity-20 rounded-lg py-2 px-1 border border-white border-opacity-30">
              <TbClock className="w-4 h-4 mb-1" />
              <span className="font-bold">{Math.round((quizData.duration || 180) / 60)}m</span>
              <span className="text-xs opacity-90">Duration</span>
            </div>
            <div className="flex flex-col items-center bg-white bg-opacity-20 rounded-lg py-2 px-1 border border-white border-opacity-30">
              <TbTarget className="w-4 h-4 mb-1" />
              <span className="font-bold">{quizData.passingMarks}%</span>
              <span className="text-xs opacity-90">Pass Mark</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {quizData.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {quizData.topic && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{quizData.topic}</span>
            )}
            {quizData.difficulty && (
              <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(quizData.difficulty)}`}>
                {quizData.difficulty}
              </span>
            )}
            {quizData.category && quizData.category !== 'General' && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">📂 {quizData.category}</span>
            )}
          </div>



          {userResult && (
            <div className={`rounded-xl p-4 mb-4 border-2 shadow-lg ${
              quizStatus.status === 'passed'
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
            }`}>
              {/* Enhanced Header with status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {quizStatus.status === 'passed' ? (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <TbCheck className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <TbX className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-bold text-gray-800">Last Result</span>
                    <div className="text-xs text-gray-600">
                      {new Date(userResult.completedAt || userResult.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-lg font-bold shadow-md ${
                  quizStatus.status === 'passed'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {userResult.percentage}%
                </div>
              </div>

              {/* Enhanced Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center bg-white bg-opacity-80 rounded-lg px-2 py-3 shadow-sm border border-white border-opacity-50">
                  <TbTarget className="w-5 h-5 text-blue-500 mb-1" />
                  <div className="text-lg font-bold text-gray-800">
                    {Array.isArray(userResult.correctAnswers) ? userResult.correctAnswers.length : (userResult.correctAnswers || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Correct</div>
                </div>

                <div className="flex flex-col items-center bg-white bg-opacity-80 rounded-lg px-2 py-3 shadow-sm border border-white border-opacity-50">
                  <TbAward className="w-5 h-5 text-yellow-500 mb-1" />
                  <div className="text-lg font-bold text-yellow-600">
                    {userResult.xpEarned || userResult.points || userResult.xpGained || 0}
                  </div>
                  <div className="text-xs text-gray-600">XP Earned</div>
                </div>

                {userResult.timeTaken && userResult.timeTaken > 0 && (
                  <div className="flex flex-col items-center bg-white bg-opacity-80 rounded-lg px-2 py-3 shadow-sm border border-white border-opacity-50">
                    <TbClock className="w-5 h-5 text-purple-500 mb-1" />
                    <div className="text-lg font-bold text-gray-800">
                      {Math.floor(userResult.timeTaken / 60) > 0 ?
                        `${Math.floor(userResult.timeTaken / 60)}m ${userResult.timeTaken % 60}s` :
                        `${userResult.timeTaken}s`}
                    </div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-gray-100">
            {/* Pass Count Display */}
            {examStats && (
              <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg py-2 px-3">
                <TbUsers className="w-4 h-4 text-blue-500" />
                <span className="font-medium">
                  {examStats.uniquePassedUsers} {examStats.uniquePassedUsers === 1 ? 'user' : 'users'} passed
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {/* Single Action Button - Full width */}
              <button
                onClick={() => onStart && quiz?._id && onStart(quiz)}
                className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  showResults && userResult
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                }`}
              >
                <TbPlayerPlay className="w-5 h-5" />
                {showResults && userResult ? '🔄 Retake Quiz' : '🚀 Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const QuizGrid = ({ quizzes, onQuizStart, showResults = false, userResults = {}, className = '' }) => {
  return (
    <div className={`quiz-grid-container ${className}`}>
      {quizzes.map((quiz, index) => (
        <motion.div
          key={quiz._id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(index * 0.1, 0.8) }}
          className="h-full"
        >
          <QuizCard
            quiz={quiz}
            onStart={() => onQuizStart(quiz)}
            showResults={showResults}
            userResult={userResults[quiz._id]}
            className="h-full"
          />
        </motion.div>
      ))}
    </div>
  );
};

export default QuizCard;