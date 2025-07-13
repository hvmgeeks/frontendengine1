import React, { useState, useEffect, useCallback, startTransition, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  TbSearch,
  TbFilter,
  TbClock,
  TbQuestionMark,
  TbTrophy,
  TbPlayerPlay,
  TbBrain,
  TbTarget,
  TbCheck,
  TbX,
  TbStar,
  TbHome,
  TbBolt
} from 'react-icons/tb';
import { getAllExams, getExamById } from '../../../apicalls/exams';
import { getAllReportsByUser } from '../../../apicalls/reports';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import './animations.css';

const Quiz = () => {
  const [exams, setExams] = useState([]);
  // Remove filteredExams state - will use useMemo instead
  const [searchTerm, setSearchTerm] = useState(() => {
    // Restore search term from localStorage
    return localStorage.getItem('quiz-search-term') || '';
  });
  const [selectedClass, setSelectedClass] = useState(() => {
    // Restore selected class from localStorage
    return localStorage.getItem('quiz-selected-class') || '';
  });
  const [userResults, setUserResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [quizCache, setQuizCache] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili, getClassName } = useLanguage();

  // Function to clear all quiz caches
  const clearAllQuizCaches = () => {
    const allLevels = ['primary', 'secondary', 'advance'];
    allLevels.forEach(level => {
      localStorage.removeItem(`user_exams_cache_${level}`);
      localStorage.removeItem(`user_exams_cache_time_${level}`);
    });
    // Also clear old cache keys for backward compatibility
    localStorage.removeItem('user_exams_cache');
    localStorage.removeItem('user_exams_cache_time');

    // Clear quiz data cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('quiz_data_')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Preload quiz data for instant loading
  const preloadQuizData = async (quizId) => {
    if (quizCache[quizId]) {
      return; // Already cached
    }

    try {
      // Check localStorage cache first
      const cacheKey = `quiz_data_${quizId}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      const now = Date.now();

      // Use cache if less than 10 minutes old
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 600000) {
        const parsed = JSON.parse(cachedData);
        setQuizCache(prev => ({ ...prev, [quizId]: parsed }));
        return;
      }

      // Fetch from server
      const response = await getExamById({ examId: quizId });
      if (response.success && response.data) {
        // Cache in memory
        setQuizCache(prev => ({ ...prev, [quizId]: response.data }));

        // Cache in localStorage
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
        localStorage.setItem(`${cacheKey}_time`, now.toString());

        console.log(`📚 Quiz ${quizId} preloaded and cached`);
      }
    } catch (error) {
      console.error('Error preloading quiz:', error);
    }
  };

  // Remove white space on component mount and handle cleanup
  useEffect(() => {
    // Add class to body to remove spacing
    document.body.classList.add('quiz-page-active');

    // Cleanup on unmount (when user navigates away or logs out)
    return () => {
      document.body.classList.remove('quiz-page-active');
      // Note: We don't clear localStorage here to maintain search persistence
      // Search is only cleared on manual refresh or explicit clear action
    };
  }, []);

  // Clear search when user changes (logout scenario)
  useEffect(() => {
    if (!user) {
      clearSearchAndFilters();
    }
  }, [user]);

  // Handle search term change with localStorage persistence
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    localStorage.setItem('quiz-search-term', value);
  };

  // Handle class selection change with localStorage persistence
  const handleClassChange = (value) => {
    setSelectedClass(value);
    localStorage.setItem('quiz-selected-class', value);
  };

  // Clear search and filters (for manual refresh)
  const clearSearchAndFilters = () => {
    setSearchTerm('');
    setSelectedClass('');
    localStorage.removeItem('quiz-search-term');
    localStorage.removeItem('quiz-selected-class');
  };

  const getUserResults = useCallback(async () => {
    try {
      if (!user?._id) return;

      const response = await getAllReportsByUser({ userId: user._id });

      if (response.success) {
        const resultsMap = {};
        response.data.forEach(report => {
          const examId = report.exam?._id;
          if (!examId || !report.result) return;

          // Extract data from the result object
          const result = report.result;

          if (!resultsMap[examId] || new Date(report.createdAt) > new Date(resultsMap[examId].createdAt)) {
            resultsMap[examId] = {
              verdict: result.verdict,
              percentage: result.percentage,
              correctAnswers: result.correctAnswers,
              wrongAnswers: result.wrongAnswers,
              totalQuestions: result.totalQuestions,
              obtainedMarks: result.obtainedMarks,
              totalMarks: result.totalMarks,
              score: result.score,
              points: result.points,
              xpEarned: result.xpEarned || result.points || result.xpGained || 0,
              timeTaken: report.timeTaken,
              completedAt: report.createdAt,
            };
          }
        });
        setUserResults(resultsMap);
      }
    } catch (error) {
      console.error('Error fetching user results:', error);
    }
  }, [user?._id]);

  // Define getExams function to load exams once
  const getExams = useCallback(async () => {
      try {
        // Safety check: ensure user exists before proceeding
        if (!user) {
          console.log("User not loaded yet, skipping exam fetch");
          return;
        }

        // Level-specific cache to prevent cross-level contamination
        const userLevel = user?.level || 'primary';
        const cacheKey = `user_exams_cache_${userLevel}`;
        const cacheTimeKey = `user_exams_cache_time_${userLevel}`;

        // Clear caches for other levels
        const allLevels = ['primary', 'secondary', 'advance'];
        allLevels.forEach(level => {
          if (level !== userLevel) {
            localStorage.removeItem(`user_exams_cache_${level}`);
            localStorage.removeItem(`user_exams_cache_time_${level}`);
          }
        });

        // Check level-specific cache first
        const cachedExams = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(cacheTimeKey);
        const now = Date.now();

        // Use cache if less than 10 minutes old (increased cache time)
        if (cachedExams && cacheTime && (now - parseInt(cacheTime)) < 600000) {
          const cached = JSON.parse(cachedExams);
          setExams(cached);
          setLastRefresh(new Date(parseInt(cacheTime)));
          setLoading(false);
          console.log(`📋 Using cached exams for ${userLevel} level:`, cached.length);
          return;
        }

        dispatch(ShowLoading());
        const response = await getAllExams();
        dispatch(HideLoading());

        if (response.success) {
          console.log('Raw exams from API:', response.data.length);
          console.log('User level:', user?.level);

          // Filter exams by user's level with proper null checks
          const userLevelExams = response.data.filter(exam => {
            if (!exam.level || !user || !user.level) return false;
            return exam.level.toLowerCase() === user.level.toLowerCase();
          });

          console.log('User level exams after filtering:', userLevelExams.length);
          const sortedExams = userLevelExams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setExams(sortedExams);
          setLastRefresh(new Date());

          // Cache the exams data with level-specific key
          localStorage.setItem(cacheKey, JSON.stringify(sortedExams));
          localStorage.setItem(cacheTimeKey, Date.now().toString());

          // Set default class filter to user's class
          if (user?.class) {
            setSelectedClass(String(user.class));
          }
        } else {
          message.error(response.message);
        }
      } catch (error) {
        dispatch(HideLoading());
        message.error(error.message);
      } finally {
        setLoading(false);
      }
  }, [dispatch, user]);

  useEffect(() => {
    // Clear ALL caches when component mounts to ensure fresh data
    clearAllQuizCaches();

    getExams(); // Initial load only
    getUserResults();
  }, [getExams, getUserResults]);

  // Real-time updates for quiz completion and new exams
  useEffect(() => {
    // Listen for real-time updates from quiz completion
    const handleRankingUpdate = () => {
      console.log('🔄 Quiz listing - refreshing data after quiz completion...');
      getUserResults(); // Refresh user results to show updated XP
    };

    // Listen for new exam creation events
    const handleNewExam = () => {
      console.log('🆕 New exam created - refreshing user results only...');
      if (user) {
        getUserResults(); // Only refresh user results, keep filters intact
      }
    };

    // Listen for window focus to refresh user results only (not exams)
    const handleWindowFocus = () => {
      console.log('🎯 Quiz listing - window focused, refreshing user results...');
      getUserResults(); // Only refresh user results, keep filters intact
    };

    window.addEventListener('rankingUpdate', handleRankingUpdate);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('newExamCreated', handleNewExam);

    return () => {
      window.removeEventListener('rankingUpdate', handleRankingUpdate);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('newExamCreated', handleNewExam);
    };
  }, []);



  // Optimized filtering with useMemo to prevent unnecessary recalculations
  const filteredExams = useMemo(() => {
    console.log('Filtering exams:', { exams: exams.length, searchTerm, selectedClass });
    let filtered = exams;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(exam => {
        // Search in multiple fields for comprehensive results
        const searchableFields = [
          exam.name,
          exam.subject,
          exam.topic,
          exam.description,
          exam.category,
          exam.level,
          // Search in questions if available
          ...(exam.questions || []).map(q => q.questionText),
          ...(exam.questions || []).map(q => q.subject),
          ...(exam.questions || []).map(q => q.topic)
        ];

        return searchableFields.some(field =>
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    if (selectedClass) {
      filtered = filtered.filter(exam => String(exam.class) === String(selectedClass));
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log('Filtered exams result:', filtered.length);
    return filtered;
  }, [exams, searchTerm, selectedClass]);

  // Optimize available classes calculation
  const availableClasses = useMemo(() => {
    return [...new Set(exams.map(e => e.class).filter(Boolean))].sort();
  }, [exams]);

  const handleQuizStart = (quiz) => {
    if (!quiz || !quiz._id) {
      message.error('Invalid quiz selected. Please try again.');
      return;
    }

    // Validate MongoDB ObjectId format (24 character hex string)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(quiz._id)) {
      message.error('Invalid quiz ID format. Please try again.');
      return;
    }

    // Store cached quiz data for instant loading
    if (quizCache[quiz._id]) {
      localStorage.setItem(`quiz_instant_${quiz._id}`, JSON.stringify(quizCache[quiz._id]));
    }

    startTransition(() => {
      navigate(`/quiz/${quiz._id}/play`);
    });
  };



  const handleQuizView = (quiz) => {
    if (!quiz || !quiz._id) {
      message.error('Invalid quiz selected. Please try again.');
      return;
    }
    // Check if user has attempted this quiz
    const userResult = userResults[quiz._id];
    if (!userResult) {
      message.info('You need to attempt this quiz first to view results.');
      return;
    }
    startTransition(() => {
      navigate(`/quiz/${quiz._id}/result`);
    });
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{isKiswahili ? 'Inapakia mitihani...' : 'Loading quizzes...'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS for compact header and optimized layout */}
      <style jsx global>{`
        /* Completely remove all white space from ProtectedRoute main wrapper */
        body.quiz-page-active main {
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Remove all spacing from layout containers */
        body.quiz-page-active .safe-content-animation {
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Remove any inherited spacing from all parent containers */
        body.quiz-page-active main > div,
        body.quiz-page-active main * {
          margin-top: 0 !important;
        }

        /* Ensure Quiz container starts immediately */
        .quiz-container-immediate {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        .quiz-grid {
          gap: 1rem !important;
          margin-top: 1rem !important;
        }
        @media (min-width: 640px) {
          .quiz-grid {
            gap: 1.25rem !important;
            margin-top: 1rem !important;
          }
        }
        @media (min-width: 1024px) {
          .quiz-grid {
            gap: 1.5rem !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 quiz-container-immediate">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 pt-3 pb-3 sm:pb-4 lg:pb-6">


        {/* Compact Search and Filter with User Level */}
        <div className="max-w-4xl mx-auto mb-3 sm:mb-4 opacity-100">
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
            {/* User Level and Quiz Count */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Level: {user?.level || 'All Levels'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <span>{filteredExams.length} Available Quizzes</span>
                </div>
              </div>
              {lastRefresh && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 sm:mt-0">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Updated: {lastRefresh.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* Search, Filter, and Refresh Controls */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <TbSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search quizzes by subject, topic, or name..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
              </div>
              <div className="w-36 sm:w-40">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <TbFilter className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={selectedClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none text-sm"
                  >
                    <option value="">All Classes</option>
                    {availableClasses.map((className) => (
                      <option key={className} value={className}>
                        {user?.level === 'primary' ? `Class ${className}` : className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || selectedClass) && (
                <button
                  onClick={clearSearchAndFilters}
                  className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all shadow-md"
                  title="Clear all search and filters"
                >
                  <TbX className="h-4 w-4" />
                  <span className="ml-1.5 hidden sm:inline text-sm">Clear</span>
                </button>
              )}


            </div>
          </div>
        </div>

        {/* Quiz Grid */}
        <div className="opacity-100" style={{ marginTop: '0.5rem' }}>


          {filteredExams.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-md mx-auto">
                <TbTarget className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Quizzes Found</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  {searchTerm || selectedClass
                    ? "Try adjusting your search or filter criteria."
                    : "No quizzes are available for your level at the moment."
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="quiz-grid">
                {filteredExams.map((quiz, index) => (
                  <QuizCard
                    key={quiz._id}
                    quiz={quiz}
                    userResult={userResults[quiz._id]}
                    showResults={true}
                    onStart={handleQuizStart}
                    onView={() => handleQuizView(quiz)}
                    onPreload={preloadQuizData}
                    index={index}
                  />
                ))}
              </div>

            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

// Optimized QuizCard component with React.memo
const QuizCard = React.memo(({ quiz, userResult, onStart, onView, onPreload, index }) => {
  const { isKiswahili, getClassName } = useLanguage();

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.round(seconds / 60);
    return `${minutes} ${isKiswahili ? 'dak' : 'min'}`;
  };

  const formatCompletionTime = (timeInSeconds) => {
    // Handle different possible time formats
    if (!timeInSeconds && timeInSeconds !== 0) return '0s';

    let totalSeconds = timeInSeconds;

    // If it's a string, try to parse it
    if (typeof timeInSeconds === 'string') {
      totalSeconds = parseInt(timeInSeconds, 10);
    }

    // If it's still not a valid number, return 0s
    if (isNaN(totalSeconds) || totalSeconds < 0) return '0s';

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${timeInSeconds}s`;
  };

  // Safety checks for quiz object
  if (!quiz || typeof quiz !== 'object') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <p className="text-gray-500">Invalid quiz data</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 transform hover:scale-105 opacity-100 relative flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
        border: userResult
          ? (userResult.verdict === 'Pass' ? '2px solid #10b981' : '2px solid #ef4444')
          : '2px solid #3b82f6',
        boxShadow: userResult
          ? (userResult.verdict === 'Pass'
              ? '0 8px 20px rgba(16, 185, 129, 0.3)'
              : '0 8px 20px rgba(239, 68, 68, 0.3)')
          : '0 8px 20px rgba(59, 130, 246, 0.3)',
        minHeight: window.innerWidth <= 768 ? '240px' : '320px',
        height: 'auto'
      }}
      onMouseEnter={() => {
        // Preload quiz data on hover for instant loading
        if (onPreload && quiz._id) {
          onPreload(quiz._id);
        }
      }}
    >
      {/* Quiz Title - At Top */}
      <div className="mb-2 text-center">
        <h3
          className="font-bold mb-1 line-clamp-2"
          style={{
            color: '#1f2937',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            lineHeight: '1.1',
            fontSize: window.innerWidth <= 768 ? '14px' : '16px'
          }}
        >
          {typeof quiz.name === 'string' ? quiz.name : 'Untitled Quiz'}
        </h3>
      </div>

      {/* Status Tags - Centered */}
      <div className="mb-2 text-center">
        {userResult ? (
          <div className="flex items-center justify-center gap-1">
            <div
              className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-md"
              style={{
                backgroundColor: userResult.verdict === 'Pass' ? '#10b981' : '#ef4444',
                fontSize: window.innerWidth <= 768 ? '9px' : '10px'
              }}
            >
              {userResult.verdict === 'Pass' ? '✅ PASSED' : '❌ FAILED'}
            </div>
            <div
              className="px-2 py-1 rounded-full text-xs font-bold text-center shadow-md"
              style={{
                backgroundColor: '#ffffff',
                color: '#1f2937',
                fontSize: window.innerWidth <= 768 ? '9px' : '10px'
              }}
            >
              {typeof userResult.percentage === 'number' ? userResult.percentage : 0}%
            </div>
          </div>
        ) : (
          <div
            className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-md"
            style={{
              backgroundColor: '#3b82f6',
              fontSize: window.innerWidth <= 768 ? '9px' : '10px'
            }}
          >
            🆕 NOT ATTEMPTED
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <div className="flex-1">

          {/* Questions and Duration - Horizontal */}
          <div className="flex gap-1 mb-2 justify-center">
            <div
              className="flex items-center gap-1 rounded-lg py-1 px-2 border shadow-sm"
              style={{
                background: 'linear-gradient(to right, #eff6ff, #e0e7ff)',
                borderColor: '#bfdbfe'
              }}
            >
              <TbQuestionMark className="w-3 h-3" style={{ color: '#2563eb' }} />
              <span
                className="font-bold"
                style={{
                  color: '#1e40af',
                  fontSize: window.innerWidth <= 768 ? '11px' : '12px'
                }}
              >
                {Array.isArray(quiz.questions) ? quiz.questions.length : 0}
              </span>
            </div>
            <div
              className="flex items-center gap-1 rounded-lg py-1 px-2 border shadow-sm"
              style={{
                background: 'linear-gradient(to right, #fdf4ff, #fce7f3)',
                borderColor: '#e9d5ff'
              }}
            >
              <TbClock className="w-3 h-3" style={{ color: '#9333ea' }} />
              <span
                className="font-bold"
                style={{
                  color: '#7c3aed',
                  fontSize: window.innerWidth <= 768 ? '11px' : '12px'
                }}
              >
                3m
              </span>
            </div>
          </div>



          <div className="flex items-center justify-center gap-1 flex-wrap mb-2">
            {/* Level Tag */}
            <span
              className="inline-block px-1 py-1 font-bold rounded-full text-white shadow-sm"
              style={{
                background: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
                fontSize: window.innerWidth <= 768 ? '8px' : '10px'
              }}
            >
              🎯{quiz.level || 'Primary'}
            </span>

            {/* Class Tag */}
            <span
              className="inline-block px-1 py-1 font-bold rounded-full text-white shadow-sm"
              style={{
                background: 'linear-gradient(to right, #4ade80, #3b82f6)',
                fontSize: window.innerWidth <= 768 ? '8px' : '10px'
              }}
            >
              📖{typeof quiz.class === 'string' || typeof quiz.class === 'number' ?
                (quiz.level === 'primary' || quiz.level === 'primary_kiswahili' ?
                  (isKiswahili ? `Darasa la ${quiz.class}` : `Class ${quiz.class}`) :
                  quiz.class) : 'N/A'}
            </span>

            {/* Category Tag */}
            <span
              className="inline-block px-1 py-1 font-bold rounded-full text-white shadow-sm"
              style={{
                background: 'linear-gradient(to right, #f97316, #ea580c)',
                fontSize: window.innerWidth <= 768 ? '8px' : '10px'
              }}
            >
              📂{quiz.category || 'General'}
            </span>

            {/* Topic Tag - Show actual topic or "General" if not defined */}
            <span
              className="inline-block px-1 py-1 font-bold rounded-full text-white shadow-sm"
              style={{
                background: quiz.topic && quiz.topic !== 'General' && quiz.topic !== ''
                  ? 'linear-gradient(to right, #10b981, #059669)'
                  : 'linear-gradient(to right, #6b7280, #4b5563)',
                fontSize: window.innerWidth <= 768 ? '8px' : '10px'
              }}
            >
              📚{quiz.topic || (isKiswahili ? 'Jumla' : 'General')}
            </span>
          </div>
        </div>
      </div>



      {userResult && typeof userResult === 'object' && (
        <div
          className="mb-2 p-2 rounded-lg border shadow-md"
          style={{
            background: userResult.verdict === 'Pass'
              ? 'linear-gradient(to bottom right, #f0fdf4, #ecfdf5)'
              : 'linear-gradient(to bottom right, #fef2f2, #fdf2f8)',
            borderColor: userResult.verdict === 'Pass' ? '#86efac' : '#fca5a5'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {userResult.verdict === 'Pass' ? (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 animate-pulse"
                  style={{
                    background: 'linear-gradient(to right, #10b981, #059669)',
                    borderColor: '#86efac'
                  }}
                >
                  <TbCheck className="w-6 h-6 font-bold" style={{ color: '#ffffff' }} />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 animate-pulse"
                  style={{
                    background: 'linear-gradient(to right, #ef4444, #dc2626)',
                    borderColor: '#fca5a5'
                  }}
                >
                  <TbX className="w-6 h-6 font-bold" style={{ color: '#ffffff' }} />
                </div>
              )}
              <div>
                <span className="text-lg font-bold" style={{ color: '#1f2937' }}>🏆 Last Result</span>
                <div className="text-sm" style={{ color: '#6b7280' }}>
                  {new Date(userResult.completedAt || userResult.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
            <span
              className="text-3xl font-bold shadow-lg"
              style={{
                color: userResult.verdict === 'Pass' ? '#059669' : '#dc2626'
              }}
            >
              {typeof userResult.percentage === 'number' ? userResult.percentage : 0}%
            </span>
          </div>

          {/* Horizontal Layout for Results */}
          <div className="flex gap-1 justify-center flex-wrap">
            {/* Correct/Wrong - Horizontal */}
            <div
              className="flex items-center gap-1 rounded-lg py-1 px-2 border shadow-md"
              style={{
                background: 'linear-gradient(to right, #dcfce7, #fecaca)',
                borderColor: '#86efac'
              }}
            >
              <div className="flex items-center gap-1">
                <TbCheck className="w-3 h-3" style={{ color: '#16a34a' }} />
                <span className="text-sm font-bold" style={{ color: '#15803d' }}>
                  {typeof userResult.correctAnswers === 'number' ? userResult.correctAnswers : 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TbX className="w-3 h-3" style={{ color: '#dc2626' }} />
                <span className="text-sm font-bold" style={{ color: '#b91c1c' }}>
                  {(quiz.questions?.length || 0) - (typeof userResult.correctAnswers === 'number' ? userResult.correctAnswers : 0)}
                </span>
              </div>
            </div>

            {/* XP */}
            <div
              className="flex items-center gap-1 rounded-lg py-1 px-2 border shadow-md"
              style={{
                background: 'linear-gradient(to bottom right, #fef3c7, #fed7aa)',
                borderColor: '#fde047'
              }}
            >
              <span className="text-sm">⭐</span>
              <span className="text-sm font-bold" style={{ color: '#92400e' }}>
                {userResult.xpEarned || userResult.points || 0}
              </span>
            </div>

            {/* Time - Horizontal if available */}
            {userResult.timeTaken && userResult.timeTaken > 0 && (
              <div
                className="flex items-center gap-1 rounded-lg py-1 px-2 border shadow-md"
                style={{
                  background: 'linear-gradient(to bottom right, #e9d5ff, #f3e8ff)',
                  borderColor: '#c4b5fd'
                }}
              >
                <TbClock className="w-3 h-3" style={{ color: '#9333ea' }} />
                <span className="text-sm font-bold" style={{ color: '#7c3aed' }}>
                  {formatCompletionTime(userResult.timeTaken)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer to push buttons to bottom */}
      <div className="flex-1"></div>

      <div className="flex gap-2 mt-3">
        {/* Main Action Button - Bigger for retake */}
        <button
          onClick={() => onStart(quiz)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-white"
          style={{
            background: userResult
              ? 'linear-gradient(to right, #f97316, #ef4444)'
              : 'linear-gradient(to right, #3b82f6, #8b5cf6)',
            fontSize: '13px',
            minHeight: '36px'
          }}
        >
          <TbPlayerPlay className="w-3 h-3" />
          {userResult ? (isKiswahili ? '🔄 Rudia Mtihani' : '🔄 Retake Quiz') : (isKiswahili ? '🚀 Anza Mtihani' : '🚀 Start Quiz')}
        </button>

        {/* Small Trophy Button - Only show when there are results */}
        {userResult && (
          <button
            onClick={() => onView(quiz)}
            className="px-3 py-2 rounded-lg transition-all duration-200 font-bold transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-white"
            style={{
              background: 'linear-gradient(to right, #fbbf24, #f97316)',
              fontSize: '13px',
              minHeight: '36px'
            }}
            title="View Results"
          >
            <TbTrophy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});

export default Quiz;
