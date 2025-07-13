import React from 'react';
import { motion } from 'framer-motion';
import {
  TbClock,
  TbQuestionMark,
  TbPlayerPlay,
  TbStar,
  TbCheck,
  TbX,
  TbBrain,
} from 'react-icons/tb';
import './modern-quiz.css';

const ModernQuizCard = ({
  quiz,
  onStart,
  userResult = null,
  className = '',
  ...props
}) => {
  // Get quiz status and styling based on user result
  const getQuizStatus = () => {
    if (!userResult) {
      return {
        status: 'not-attempted',
        statusBg: 'bg-blue-500',
        cardBg: 'bg-white',
        borderColor: 'border-blue-200',
        statusText: 'Not Attempted',
        hoverBg: 'hover:bg-blue-50',
        shadowColor: ''
      };
    }

    const passingMarks = quiz.passingMarks || 60;
    const passed = userResult.percentage >= passingMarks;

    if (passed) {
      return {
        status: 'passed',
        statusBg: 'bg-green-500',
        cardBg: 'bg-white',
        borderColor: 'border-green-200',
        statusText: 'Passed',
        hoverBg: 'hover:bg-green-50',
        shadowColor: 'shadow-emerald-200/50'
      };
    } else {
      return {
        status: 'failed',
        statusBg: 'bg-red-500',
        cardBg: 'bg-white',
        borderColor: 'border-red-200',
        statusText: 'Failed',
        hoverBg: 'hover:bg-red-50',
        shadowColor: 'shadow-rose-200/50'
      };
    }
  };

  const status = getQuizStatus();

  // Get header colors based on status
  const getHeaderColors = () => {
    if (!userResult) {
      return 'bg-gradient-to-r from-blue-600 to-blue-700';
    } else if (status.status === 'passed') {
      return 'bg-gradient-to-r from-emerald-600 to-emerald-700';
    } else {
      return 'bg-gradient-to-r from-rose-600 to-rose-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`h-full ${className}`}
    >
      <div
        className="h-full rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer overflow-hidden flex flex-col transform hover:scale-110"
        onClick={() => onStart && onStart(quiz)}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          border: userResult
            ? (status.status === 'passed' ? '4px solid #10b981' : '4px solid #ef4444')
            : '4px solid #3b82f6',
          boxShadow: userResult
            ? (status.status === 'passed'
                ? '0 25px 50px rgba(16, 185, 129, 0.4), 0 0 0 2px rgba(16, 185, 129, 0.2), inset 0 0 0 1px rgba(255,255,255,0.8)'
                : '0 25px 50px rgba(239, 68, 68, 0.4), 0 0 0 2px rgba(239, 68, 68, 0.2), inset 0 0 0 1px rgba(255,255,255,0.8)')
            : '0 25px 50px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.2), inset 0 0 0 1px rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)'
        }}
        {...props}
      >
        {/* Enhanced Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          {userResult ? (
            <div className="flex flex-col gap-1">
              <div
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                style={{
                  backgroundColor: status.status === 'passed' ? '#10b981' : '#ef4444'
                }}
              >
                {status.status === 'passed' ? (
                  <>
                    <TbCheck className="w-3 h-3 inline mr-1" />
                    ✅ PASSED
                  </>
                ) : (
                  <>
                    <TbX className="w-3 h-3 inline mr-1" />
                    ❌ FAILED
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
                {userResult.percentage}%
              </div>
            </div>
          ) : (
            <div
              className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
              style={{ backgroundColor: '#3b82f6' }}
            >
              🆕 NOT ATTEMPTED
            </div>
          )}
        </div>

        {/* Enhanced Header */}
        <div className={`${getHeaderColors()} p-4 text-white relative`}>
          <div className="text-center mb-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white border-opacity-30">
              <TbBrain className="w-6 h-6" />
            </div>

            {/* Quiz Title - At Top */}
            <h3
              className="font-bold text-xl leading-tight line-clamp-2 mb-4 text-center"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: '1.3'
              }}
            >
              {quiz.name || 'Quiz Title'}
            </h3>

            {/* Class and Subject Tags Together */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs px-3 py-1 rounded-full bg-white bg-opacity-20 font-medium border border-white border-opacity-30">
                📖 {quiz.level === 'primary' ? `Class ${quiz.class || 'N/A'}` : quiz.class || 'N/A'}
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
                🎯 {quiz.level || 'Primary'}
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
                📖 {quiz.level === 'primary' ? `Class ${quiz.class}` : quiz.class || 'N/A'}
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
                📂 {quiz.category || 'General'}
              </span>

              {/* Topic Tag - Show actual topic or "General" if not defined */}
              <span
                className="text-xs px-3 py-1 rounded-full font-medium shadow-lg"
                style={{
                  backgroundColor: quiz.topic && quiz.topic !== 'General' ? '#10b981' : '#6b7280',
                  color: '#ffffff',
                  border: quiz.topic && quiz.topic !== 'General' ? '1px solid #86efac' : '1px solid #9ca3af'
                }}
              >
                📚 {quiz.topic || 'General'}
              </span>
              {quiz.difficulty && (
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  quiz.difficulty.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                  quiz.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {quiz.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">


          {/* Enhanced Quiz Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col items-center bg-gray-50 rounded-lg py-3 px-2">
              <TbClock className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-lg font-bold text-gray-800">
                {Math.round((quiz.duration || 180) / 60)}m
              </span>
              <span className="text-xs text-gray-600">Duration</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 rounded-lg py-3 px-2">
              <TbQuestionMark className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-lg font-bold text-gray-800">
                {quiz.questions?.length || 0}
              </span>
              <span className="text-xs text-gray-600">Questions</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 rounded-lg py-3 px-2">
              <TbStar className="w-5 h-5 text-yellow-500 mb-1" />
              <span className="text-lg font-bold text-yellow-600">
                {quiz.xpPoints || 100}
              </span>
              <span className="text-xs text-gray-600">XP Points</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 rounded-lg py-3 px-2">
              <span className="text-2xl mb-1">🎯</span>
              <span className="text-lg font-bold text-gray-800">
                {quiz.passingMarks || 60}%
              </span>
              <span className="text-xs text-gray-600">Pass Mark</span>
            </div>
          </div>

          {/* Enhanced User Result */}
          {userResult && (
            <div className={`
              border-2 rounded-xl p-4 mb-4 shadow-lg
              ${status.status === 'passed'
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
              }
            `}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {status.status === 'passed' ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <TbCheck className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <TbX className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-gray-800">Last Result</span>
                </div>
                <span className={`text-xl font-bold ${
                  status.status === 'passed' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {userResult.percentage}%
                </span>
              </div>

              <div className={`grid gap-2 ${userResult.timeTaken && userResult.timeTaken > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="text-center bg-white bg-opacity-80 rounded-lg py-2 border border-white border-opacity-50">
                  <div className="text-sm font-bold text-gray-800">
                    {Array.isArray(userResult.correctAnswers) ? userResult.correctAnswers.length : (userResult.correctAnswers || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Correct</div>
                </div>
                <div className="text-center bg-white bg-opacity-80 rounded-lg py-2 border border-white border-opacity-50">
                  <div className="text-sm font-bold text-yellow-600">
                    {userResult.xpEarned || userResult.points || userResult.xpGained || 0}
                  </div>
                  <div className="text-xs text-gray-600">XP</div>
                </div>
                {userResult.timeTaken && userResult.timeTaken > 0 && (
                  <div className="text-center bg-white bg-opacity-80 rounded-lg py-2 border border-white border-opacity-50">
                    <div className="text-sm font-bold text-gray-800">
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

          {/* Enhanced Start Button */}
          <div className="mt-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart && onStart(quiz);
              }}
              className={`
                w-full py-3 px-4 rounded-lg font-bold text-sm
                transition-all duration-200
                flex items-center justify-center gap-2
                shadow-lg hover:shadow-xl transform hover:scale-105
                ${userResult
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                }
              `}
            >
              <TbPlayerPlay className="w-5 h-5" />
              {userResult ? '🔄 Retake Quiz' : '🚀 Start Quiz'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernQuizCard;
