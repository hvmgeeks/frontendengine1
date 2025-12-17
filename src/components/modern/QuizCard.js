import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { message } from 'antd';
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
  TbDownload,
  TbCheck as TbCheckCircle,
  TbTrophy,
  TbStar,
  TbFlame,
  TbCertificate,
} from 'react-icons/tb';
import {
  extractQuizData,
  getQuizStatus,
  safeString
} from '../../utils/quizDataUtils';
import { getExamStats } from '../../apicalls/exams';
import { downloadQuizForOffline, isQuizDownloaded } from '../../utils/offlineQuiz';

// Helper function to get level styling
const getLevelStyle = (level) => {
  const normalizedLevel = (level || 'primary').toLowerCase();

  switch (normalizedLevel) {
    case 'primary':
      return {
        name: 'Primary Level',
        shortName: 'Primary',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#667eea',
        icon: '🎓',
        badge: 'bg-purple-500',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-400'
      };
    case 'secondary':
    case 'o-level':
      return {
        name: 'O-Level',
        shortName: 'O-Level',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: '#f5576c',
        icon: '🏆',
        badge: 'bg-pink-500',
        textColor: 'text-pink-600',
        borderColor: 'border-pink-400'
      };
    case 'advance':
    case 'a-level':
      return {
        name: 'A-Level',
        shortName: 'A-Level',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: '#fa709a',
        icon: '👑',
        badge: 'bg-orange-500',
        textColor: 'text-orange-600',
        borderColor: 'border-orange-400'
      };
    default:
      return {
        name: 'General',
        shortName: 'General',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#667eea',
        icon: '📚',
        badge: 'bg-blue-500',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-400'
      };
  }
};

const QuizCard = ({
  quiz,
  onStart,
  showResults = false,
  userResult = null,
  className = '',
  ...props
}) => {

  const [examStats, setExamStats] = useState(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Extract safe quiz data to prevent object rendering errors
  const quizData = extractQuizData(quiz);
  const quizStatus = getQuizStatus(userResult, quizData.passingMarks);
  const levelStyle = getLevelStyle(quizData.level);

  // Check if quiz is downloaded
  useEffect(() => {
    const checkDownloaded = async () => {
      if (quiz?._id) {
        const downloaded = await isQuizDownloaded(quiz._id);
        setIsDownloaded(downloaded);
      }
    };
    checkDownloaded();
  }, [quiz?._id]);

  // Handle quiz download
  const handleDownloadQuiz = async (e) => {
    e.stopPropagation(); // Prevent card click

    if (!quiz?._id) {
      message.error('Invalid quiz');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      await downloadQuizForOffline(
        quiz,
        (progress) => setDownloadProgress(progress),
        () => {
          message.success(`${quiz.name} downloaded for offline access!`);
          setIsDownloaded(true);
          setDownloading(false);
        },
        (error) => {
          message.error(`Download failed: ${error}`);
          setDownloading(false);
        },
        userResult // Pass user result to save with quiz
      );
    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
    }
  };

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
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`h-full ${className}`}
    >
      <div
        className="h-full shadow-2xl hover:shadow-3xl transition-all duration-500 relative rounded-3xl overflow-hidden"
        style={{
          background: userResult
            ? (quizStatus.status === 'passed'
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)')
            : 'rgba(251, 146, 60, 0.15)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: userResult
            ? (quizStatus.status === 'passed'
                ? '2px solid rgba(16, 185, 129, 0.3)'
                : '2px solid rgba(239, 68, 68, 0.3)')
            : '2px solid rgba(251, 146, 60, 0.4)',
          boxShadow: userResult
            ? (quizStatus.status === 'passed'
                ? '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)')
            : '0 8px 32px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
        {...props}
      >
        {/* Status Badge - Top Right - Responsive */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
          {userResult ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white shadow-lg"
              style={{
                backgroundColor: quizStatus.status === 'passed' ? '#10b981' : '#ef4444'
              }}
            >
              {quizStatus.status === 'passed' ? (
                <>
                  <TbCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
                  <span className="hidden xs:inline">PASSED</span>
                  <span className="xs:hidden">✓</span>
                </>
              ) : (
                <>
                  <TbX className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
                  <span className="hidden xs:inline">FAILED</span>
                  <span className="xs:hidden">✗</span>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg"
              style={{
                background: 'rgba(251, 146, 60, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: 'white'
              }}
            >
              <TbClock className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">NOT ATTEMPTED</span>
              <span className="xs:hidden">NEW</span>
            </motion.div>
          )}
        </div>

        {/* Decorative Corner Elements */}
        <div className="absolute top-0 left-0 w-20 h-20 opacity-20">
          <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full"></div>
          <div className="absolute top-6 left-6 w-2 h-2 bg-white rounded-full"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20 opacity-20">
          <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-full"></div>
          <div className="absolute bottom-6 right-6 w-2 h-2 bg-white rounded-full"></div>
        </div>

        {/* Glassmorphism Background Gradient */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: levelStyle.gradient,
            zIndex: 0
          }}
        ></div>

        <div
          className="p-4 relative overflow-hidden"
          style={{
            background: userResult
              ? (quizStatus.status === 'passed'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)')
              : 'rgba(251, 146, 60, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: userResult
              ? (quizStatus.status === 'passed' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)')
              : '1px solid rgba(251, 146, 60, 0.4)',
            color: '#1f2937'
          }}
        >
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full -translate-x-16 -translate-y-16"
                 style={{ background: levelStyle.gradient }}></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full translate-x-16 translate-y-16"
                 style={{ background: levelStyle.gradient }}></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full -translate-x-12 -translate-y-12"
                 style={{ background: levelStyle.gradient }}></div>
          </div>

          {/* Compact header */}
          <div className="text-center relative z-10">
            {/* Difficulty Badge */}
            <div className="flex justify-center mb-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  color: '#1f2937',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                {quizData.difficulty === 'intense' ? (
                  <><TbFlame className="w-3 h-3 text-purple-600" /> Intense</>
                ) : quizData.difficulty === 'hard' ? (
                  <><TbFlame className="w-3 h-3 text-red-600" /> Hard</>
                ) : quizData.difficulty === 'easy' ? (
                  <><TbStar className="w-3 h-3 text-green-600" /> Easy</>
                ) : (
                  <><TbTarget className="w-3 h-3 text-orange-600" /> Medium</>
                )}
              </span>
            </div>

            {/* Quiz Title - Responsive sizing */}
            <h3
              className="text-sm sm:text-base md:text-lg lg:text-xl font-bold line-clamp-2 leading-tight mb-3 break-words"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                lineHeight: '1.3',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                color: '#111827'
              }}
            >
              {quizData.name}
            </h3>

            {/* Compact info tags - responsive with glassmorphism */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap text-[10px] sm:text-xs">
              <motion.span
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold whitespace-nowrap"
                style={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  color: '#1f2937',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                📖 {quizData.level === 'primary' ? `Class ${quizData.class}` : quizData.class}
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold whitespace-nowrap"
                style={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  color: '#1f2937',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                📂 {quizData.category || 'General'}
              </motion.span>
              {quizData.topic && quizData.topic !== 'General' && (
                <motion.span
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold whitespace-nowrap"
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    color: '#1f2937',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  📚 {quizData.topic}
                </motion.span>
              )}
              <motion.span
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold whitespace-nowrap flex items-center gap-1"
                style={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  color: '#1f2937',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <TbQuestionMark className="w-3 h-3" />
                {quizData.totalQuestions}
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold whitespace-nowrap flex items-center gap-1"
                style={{
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  color: '#1f2937',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <TbClock className="w-3 h-3" />
                {Math.round((quizData.duration || 180) / 60)}m
              </motion.span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col relative">
          {/* Description - only if exists */}
          {quizData.description && quizData.description !== 'No description' && (
            <p className="text-sm mb-3 line-clamp-2 relative z-10"
               style={{
                 color: '#4b5563',
                 textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)'
               }}>
              {quizData.description}
            </p>
          )}



          {userResult && (
            <div
              className="rounded-xl p-3 mb-3 relative overflow-hidden"
              style={{
                background: quizStatus.status === 'passed'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: quizStatus.status === 'passed'
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Compact result header with percentage and XP */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {quizStatus.status === 'passed' ? (
                    <TbCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <TbX className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm font-bold text-gray-800">Last Result</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                  <span>{userResult.percentage}%</span>
                  <span>•</span>
                  <span>{userResult.xpEarned || 0} XP</span>
                </div>
              </div>

              {/* Compact stats - single row */}
              <div className="flex items-center justify-around text-xs text-gray-800">
                <div className="flex items-center gap-1">
                  <TbCheck className="w-4 h-4 text-green-600" />
                  <span className="font-bold">
                    {Array.isArray(userResult.correctAnswers) ? userResult.correctAnswers.length : (userResult.correctAnswers || 0)} correct
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TbX className="w-4 h-4 text-red-600" />
                  <span className="font-bold">
                    {Array.isArray(userResult.wrongAnswers) ? userResult.wrongAnswers.length : (userResult.wrongAnswers || 0)} wrong
                  </span>
                </div>
                {userResult.timeTaken && userResult.timeTaken > 0 && (
                  <div className="flex items-center gap-1">
                    <TbClock className="w-4 h-4 text-gray-700" />
                    <span className="font-bold">
                      {Math.floor(userResult.timeTaken / 60) > 0 ?
                        `${Math.floor(userResult.timeTaken / 60)}m ${userResult.timeTaken % 60}s` :
                        `${userResult.timeTaken}s`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto pt-3">
            {/* Pass Count Display with Level Badge - compact with glassmorphism */}
            <div className="mb-2 flex items-center justify-center gap-2">
              {examStats && (
                <div
                  className="flex items-center justify-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    color: '#1f2937',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <TbUsers className="w-3 h-3" />
                  <span>{examStats.uniquePassedUsers} passed</span>
                </div>
              )}

              {/* Level Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg flex items-center gap-1 sm:gap-1.5"
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
                }}
              >
                <span className="text-sm sm:text-base">{levelStyle.icon}</span>
                <span className="font-extrabold tracking-wide hidden sm:inline">{levelStyle.shortName}</span>
              </motion.div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              {/* Start/Retake Button with enhanced styling - Responsive */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStart && quiz?._id && onStart(quiz)}
                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xl hover:shadow-3xl relative overflow-hidden ${
                  showResults && userResult
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                }`}
                style={{
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  minHeight: '44px'
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transition-opacity duration-500"
                     style={{ transform: 'skewX(-20deg)' }}></div>

                <TbPlayerPlay className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 flex-shrink-0" />
                <span className="whitespace-nowrap relative z-10 text-xs sm:text-sm md:text-base">
                  {showResults && userResult ? '🔄 Retake Quiz' : '🚀 Start Quiz'}
                </span>
              </motion.button>

              {/* Download Button with enhanced styling - Responsive */}
              {isDownloaded ? (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-full sm:w-auto sm:flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-default"
                  title="Quiz downloaded for offline access"
                  style={{
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
                    minHeight: '44px',
                    minWidth: '44px'
                  }}
                >
                  <TbCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="sm:hidden">Downloaded</span>
                </motion.button>
              ) : downloading ? (
                <motion.button
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-full sm:w-auto sm:flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xl bg-gradient-to-r from-blue-400 to-blue-500 text-white cursor-wait"
                  disabled
                  style={{
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    minHeight: '44px',
                    minWidth: '44px'
                  }}
                >
                  <span className="whitespace-nowrap text-xs sm:text-sm">{downloadProgress}%</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadQuiz}
                  className="w-full sm:w-auto sm:flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xl hover:shadow-3xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white relative overflow-hidden"
                  title="Download for offline access"
                  style={{
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
                    minHeight: '44px',
                    minWidth: '44px'
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transition-opacity duration-500"
                       style={{ transform: 'skewX(-20deg)' }}></div>

                  <TbDownload className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 flex-shrink-0" />
                  <span className="sm:hidden relative z-10">Download</span>
                </motion.button>
              )}
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