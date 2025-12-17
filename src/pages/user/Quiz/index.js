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
  TbPlayerPlay,
  TbBrain,
  TbTarget,
  TbCheck,
  TbStar,
  TbHome,
  TbBolt,
  TbX,
  TbBook,
  TbDownload,
  TbCheck as TbCheckCircle
} from 'react-icons/tb';
import { getAllExams, getExamById } from '../../../apicalls/exams';
import { getAllReportsByUser } from '../../../apicalls/reports';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { downloadQuizForOffline, isQuizDownloaded, getAllOfflineQuizzes } from '../../../utils/offlineQuiz';
import ModernQuizCard from '../../../components/modern/QuizCard';
import './animations.css';

// Function to normalize subject names for primary level
const normalizeSubjectName = (category, userLevel) => {
  if (!category || userLevel !== 'primary') return category;

  const categoryLower = category.toLowerCase().trim();

  // Primary level subject name mappings
  const subjectMappings = {
    // Civics variations
    'civics': 'Civic and Moral',
    'civic': 'Civic and Moral',
    'civic and moral': 'Civic and Moral',
    'civic and moral education': 'Civic and Moral',
    'moral': 'Civic and Moral',

    // Social Studies variations
    'social studies': 'Social Studies',
    'social': 'Social Studies',
    'social science': 'Social Studies',

    // Science variations
    'science': 'Science and Technology',
    'science and technology': 'Science and Technology',
    'science & technology': 'Science and Technology',
    'technology': 'Science and Technology',

    // Mathematics variations
    'math': 'Mathematics',
    'maths': 'Mathematics',
    'mathematics': 'Mathematics',
    'arithmetic': 'Mathematics',

    // English variations
    'english': 'English',
    'english language': 'English',

    // Kiswahili variations
    'kiswahili': 'Kiswahili',
    'swahili': 'Kiswahili',

    // Vocational Skills variations
    'vocational': 'Vocational Skills',
    'vocational skills': 'Vocational Skills',
    'life skills': 'Vocational Skills',
    'practical skills': 'Vocational Skills'
  };

  return subjectMappings[categoryLower] || category;
};

const Quiz = () => {
  const [exams, setExams] = useState([]);
  // Remove filteredExams state - will use useMemo instead
  const [searchTerm, setSearchTerm] = useState(() => {
    // Restore search term from localStorage
    return localStorage.getItem('quiz-search-term') || '';
  });

  const [selectedSubject, setSelectedSubject] = useState(() => {
    // Restore subject filter from localStorage
    return localStorage.getItem('quiz-selected-subject') || 'all';
  });
  const [selectedClass, setSelectedClass] = useState(() => {
    // Restore selected class from localStorage
    return localStorage.getItem('quiz-selected-class') || '';
  });
  const [userResults, setUserResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [quizCache, setQuizCache] = useState({});
  const [examCache, setExamCache] = useState({}); // Memory cache for exam listings
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { t, isKiswahili, getClassName } = useLanguage();

  // Function to clear all quiz caches (manual refresh)
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

    // Clear memory cache
    setExamCache({});
    console.log('🗑️ All quiz caches cleared manually');
  };

  // Function to force refresh quizzes (bypass cache)
  const forceRefreshQuizzes = async () => {
    console.log('🔄 Force refreshing quizzes...');
    clearAllQuizCaches();
    setLoading(true);
    await getExams();
    message.success('Quizzes refreshed successfully!');
  };

  // Enhanced preload quiz data for instant loading
  const preloadQuizData = async (quizId) => {
    if (quizCache[quizId]) {
      return; // Already cached
    }

    try {
      const startTime = performance.now();

      // Check localStorage cache first
      const cacheKey = `quiz_data_${quizId}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      const now = Date.now();

      // Use cache if less than 10 minutes old
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 600000) {
        const parsed = JSON.parse(cachedData);
        setQuizCache(prev => ({ ...prev, [quizId]: parsed }));
        console.log(`📚 Quiz ${quizId} loaded from cache in ${(performance.now() - startTime).toFixed(1)}ms`);
        return;
      }

      // Fetch from server with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await getExamById({ examId: quizId });
      clearTimeout(timeoutId);

      if (response.success && response.data) {
        // Cache in memory
        setQuizCache(prev => ({ ...prev, [quizId]: response.data }));

        // Cache in localStorage
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
        localStorage.setItem(`${cacheKey}_time`, now.toString());

        console.log(`📚 Quiz ${quizId} preloaded and cached in ${(performance.now() - startTime).toFixed(1)}ms`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⏰ Quiz ${quizId} preload timed out after 3s`);
      } else {
        console.error('Error preloading quiz:', error);
      }
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

  // Set default class to user's class and clear search when user changes
  useEffect(() => {
    if (!user) {
      // User logged out - clear everything
      setSearchTerm('');
      setSelectedClass('');
      localStorage.removeItem('quiz-search-term');
      localStorage.removeItem('quiz-selected-class');
    } else if (user.class) {
      // User logged in and has a class - set it as default if no class is currently selected
      const userClass = String(user.class);
      const savedClass = localStorage.getItem('quiz-selected-class');

      // Only set user's class as default if no class is explicitly selected
      if (!savedClass || savedClass === '') {
        setSelectedClass(''); // This will trigger the filtering to use user's class by default
        localStorage.removeItem('quiz-selected-class'); // Remove any saved "All Classes" selection
        console.log(`🎯 Setting default filter to user's class: ${userClass} (will be applied in filtering)`);
      }
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

    // Clear category filter when class changes to show all categories of the selected class
    setSelectedSubject('all');
    localStorage.setItem('quiz-selected-subject', 'all');
    console.log(`🔄 Class changed to "${value}" - cleared category filter to show all categories`);
  };

  // Handle subject selection change with localStorage persistence
  const handleSubjectChange = (value) => {
    setSelectedSubject(value);
    localStorage.setItem('quiz-selected-subject', value);
  };



  const getUserResults = useCallback(async () => {
    try {
      if (!user?._id) return;

      const startTime = performance.now();
      console.log('📊 Loading user quiz results...');

      // Check cache for user results
      const resultsCacheKey = `user_results_${user._id}`;
      const cachedResults = localStorage.getItem(resultsCacheKey);
      const cacheTime = localStorage.getItem(`${resultsCacheKey}_time`);

      // Check if force refresh is needed
      const forceRefresh = sessionStorage.getItem('quiz_results_refresh_needed') === 'true';

      // Use cache if less than 5 minutes old (results change less frequently) AND no force refresh
      if (!forceRefresh && cachedResults && cacheTime && (Date.now() - parseInt(cacheTime)) < 300000) {
        try {
          const parsed = JSON.parse(cachedResults);
          setUserResults(parsed);
          const loadTime = performance.now() - startTime;
          console.log(`📦 User results loaded from cache in ${loadTime.toFixed(1)}ms`);
          return;
        } catch (error) {
          console.warn('Failed to parse cached results:', error);
        }
      }

      if (forceRefresh) {
        console.log('🔄 Bypassing cache due to force refresh flag');
      }

      // Check if offline - skip fetching results from server
      const isOnline = navigator.onLine;
      if (!isOnline) {
        console.log('📡 Offline mode - skipping user results fetch from server');
        // Keep existing cached results if available
        return;
      }

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

        // Cache the results
        const currentTime = Date.now();
        localStorage.setItem(resultsCacheKey, JSON.stringify(resultsMap));
        localStorage.setItem(`${resultsCacheKey}_time`, currentTime.toString());

        const loadTime = performance.now() - startTime;
        console.log(`✅ User results loaded and cached from API in ${loadTime.toFixed(1)}ms`);
      }
    } catch (error) {
      console.error('Error fetching user results:', error);
    }
  }, [user?._id]);

  // Optimized exam fetching with multi-level caching and performance tracking
  const getExams = useCallback(async () => {
      try {
        // Safety check: ensure user exists before proceeding
        if (!user) {
          console.log("User not loaded yet, skipping exam fetch");
          return;
        }

        const startTime = performance.now();
        console.log('🚀 Starting quiz fetch...');

        // Level-specific cache to prevent cross-level contamination
        const userLevel = user?.level || 'primary';
        const cacheKey = `user_exams_cache_${userLevel}`;
        const cacheTimeKey = `user_exams_cache_time_${userLevel}`;
        const memoryCacheKey = `exams_${userLevel}`;

        // Check if offline FIRST - load from IndexedDB only
        const isOnline = navigator.onLine;
        if (!isOnline) {
          console.log('📡 Offline mode detected - loading downloaded quizzes from IndexedDB...');
          try {
            const offlineQuizzes = await getAllOfflineQuizzes();
            if (offlineQuizzes && offlineQuizzes.length > 0) {
              console.log(`✅ Loaded ${offlineQuizzes.length} quizzes from offline storage`);

              // Convert offline quiz format to match expected format
              const formattedQuizzes = offlineQuizzes.map(quiz => ({
                _id: quiz.id,
                name: quiz.name,
                description: quiz.description,
                duration: quiz.duration,
                category: quiz.category,
                subject: quiz.subject,
                topic: quiz.topic,
                level: quiz.level,
                class: quiz.class,
                totalMarks: quiz.totalMarks,
                passingMarks: quiz.passingMarks,
                passingPercentage: quiz.passingPercentage,
                difficulty: quiz.difficulty,
                difficultyLevel: quiz.difficultyLevel,
                questions: quiz.questions,
                totalQuestions: quiz.totalQuestions,
                createdBy: quiz.createdBy,
                createdAt: quiz.createdAt,
                updatedAt: quiz.updatedAt
              }));

              // Build userResults map from stored offline quiz results
              const offlineUserResults = {};
              offlineQuizzes.forEach(quiz => {
                if (quiz.userResult) {
                  offlineUserResults[quiz.id] = quiz.userResult;
                }
              });

              setExams(formattedQuizzes);
              setUserResults(offlineUserResults); // Set user results from offline storage
              setLastRefresh(new Date());
              setLoading(false);
              message.info('📡 Offline mode: Showing downloaded quizzes only');
              return;
            } else {
              message.warning('📡 No quizzes available offline. Please download quizzes when online.');
              setExams([]);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error loading offline quizzes:', error);
            message.error('Failed to load offline quizzes');
            setExams([]);
            setLoading(false);
            return;
          }
        }

        // Online mode - check cache first, then fetch from API
        // Check memory cache first for instant loading
        const memoryCache = examCache[memoryCacheKey];
        if (memoryCache && (Date.now() - memoryCache.timestamp) < 600000) {
          setExams(memoryCache.data);
          setLastRefresh(new Date(memoryCache.timestamp));
          setLoading(false);
          const cacheTime = performance.now() - startTime;
          console.log(`⚡ Quizzes loaded from memory cache in ${cacheTime.toFixed(1)}ms - ${memoryCache.data.length} quizzes`);
          return;
        }

        // Check localStorage cache
        const cachedExams = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(cacheTimeKey);
        const now = Date.now();

        // Use localStorage cache if less than 10 minutes old
        if (cachedExams && cacheTime && (now - parseInt(cacheTime)) < 600000) {
          try {
            const cached = JSON.parse(cachedExams);
            setExams(cached);
            setLastRefresh(new Date(parseInt(cacheTime)));
            setLoading(false);

            // Also store in memory cache for next time
            setExamCache(prev => ({
              ...prev,
              [memoryCacheKey]: {
                data: cached,
                timestamp: parseInt(cacheTime)
              }
            }));

            const loadTime = performance.now() - startTime;
            console.log(`📦 Quizzes loaded from localStorage cache in ${loadTime.toFixed(1)}ms - ${cached.length} quizzes`);
            return;
          } catch (error) {
            console.warn('Failed to parse cached quiz data:', error);
          }
        }

        // Fetch from API when online
        console.log('🌐 Loading quizzes from API...');
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

          const currentTime = Date.now();

          // Cache in memory for instant access
          setExamCache(prev => ({
            ...prev,
            [memoryCacheKey]: {
              data: sortedExams,
              timestamp: currentTime
            }
          }));

          // Cache in localStorage for persistence
          localStorage.setItem(cacheKey, JSON.stringify(sortedExams));
          localStorage.setItem(cacheTimeKey, currentTime.toString());

          const loadTime = performance.now() - startTime;
          console.log(`✅ Quizzes loaded and cached from API in ${loadTime.toFixed(1)}ms - ${sortedExams.length} quizzes`);

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
    // Check if we need to force refresh (coming back from quiz result)
    const refreshNeeded = sessionStorage.getItem('quiz_results_refresh_needed');

    if (refreshNeeded === 'true') {
      console.log('🔄 Force refresh detected - clearing cache and fetching fresh data');
      sessionStorage.removeItem('quiz_results_refresh_needed');

      // Clear cache to force fresh fetch
      if (user) {
        const resultsCacheKey = `user_results_${user._id}`;
        localStorage.removeItem(resultsCacheKey);
        localStorage.removeItem(`${resultsCacheKey}_time`);
      }
    } else {
      console.log('🎯 Quiz component mounted - using cached data if available');
    }

    getExams(); // Initial load with caching
    getUserResults(); // This will fetch fresh data if cache was cleared
  }, [getExams, getUserResults, user]);

  // Refresh results when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('🔄 Page became visible - checking for fresh quiz results...');
        // Force refresh by clearing cache
        const resultsCacheKey = `user_results_${user._id}`;
        const cacheTime = localStorage.getItem(`${resultsCacheKey}_time`);

        // If cache was recently cleared (within last 2 seconds), fetch fresh data
        if (!cacheTime || (Date.now() - parseInt(cacheTime)) > 2000) {
          getUserResults();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, getUserResults]);

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
    console.log('Filtering exams:', { exams: exams.length, searchTerm, selectedClass, userClass: user?.class, userLevel: user?.level });
    console.log('📊 All exams by level:', exams.reduce((acc, exam) => {
      const level = exam.level || 'unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {}));
    console.log('📊 All exams by class:', exams.reduce((acc, exam) => {
      const cls = exam.class || 'unknown';
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {}));
    let filtered = exams;

    // Apply search filter first
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

    // Apply subject/category filter - use same field as orange tags with normalization
    if (selectedSubject && selectedSubject !== 'all') {
      const userLevel = user?.level?.toLowerCase();
      filtered = filtered.filter(exam => {
        const examCategory = exam.category || 'General';
        const normalizedExamCategory = normalizeSubjectName(examCategory, userLevel);
        return normalizedExamCategory.toLowerCase() === selectedSubject.toLowerCase();
      });
      console.log(`🎯 Filtering by category: ${selectedSubject}, found ${filtered.length} quizzes`);
    }

    // Apply class filter - always default to user's class unless explicitly set to "All Classes"
    if (selectedClass) {
      // User explicitly selected a specific class
      const userLevel = user?.level?.toLowerCase();

      filtered = filtered.filter(exam => {
        const examClass = String(exam.class).trim();
        const examLevel = exam.level ? exam.level.toLowerCase() : '';

        // First check if exam is from the same level
        if (examLevel !== userLevel) {
          return false;
        }

        // Extract class numbers for comparison
        let selectedClassNumber;
        if (/^Form[\s-]+(\d+)$/.test(selectedClass)) {
          selectedClassNumber = parseInt(selectedClass.match(/^Form[\s-]+(\d+)$/)[1]);
        } else if (/^\d+$/.test(selectedClass)) {
          selectedClassNumber = parseInt(selectedClass);
        }

        let examClassNumber;
        if (/^Form[\s-]+(\d+)$/.test(examClass)) {
          examClassNumber = parseInt(examClass.match(/^Form[\s-]+(\d+)$/)[1]);
        } else if (/^\d+$/.test(examClass)) {
          examClassNumber = parseInt(examClass);
        }

        const matches = selectedClassNumber === examClassNumber;

        if (matches) {
          console.log(`✅ Manual selection match: selected="${selectedClass}" (${selectedClassNumber}) matches exam="${examClass}" (${examClassNumber})`);
        }

        return matches;
      });
      console.log(`🎯 Filtering by selected class: ${selectedClass}, found ${filtered.length} quizzes`);

      // If no quizzes found, show debug info (but don't fallback - respect user's manual selection)
      if (filtered.length === 0) {
        console.log(`🔍 Debug: No quizzes found for selected class "${selectedClass}"`);
        console.log(`🔍 User level: ${userLevel}`);
        console.log(`🔍 Available exam classes for ${userLevel}:`,
          [...new Set(exams.filter(e => e.level?.toLowerCase() === userLevel).map(e => e.class))]);
        console.log(`🔍 Sample exams for ${userLevel}:`,
          exams.filter(e => e.level?.toLowerCase() === userLevel).slice(0, 3).map(e => ({
            class: e.class,
            level: e.level,
            subject: e.subject
          })));
        console.log(`ℹ️ Respecting manual class selection - showing empty results for "${selectedClass}"`);
      }
    } else if (user?.class) {
      // No class selected, default to user's class
      const userClass = String(user.class).trim();
      const userLevel = user.level?.toLowerCase();

      console.log(`🎯 Filtering by user's class: "${userClass}" (level: ${userLevel})`);

      // Extract class number from user's class (handle "Form 5", "Form-5", "5")
      let userClassNumber;
      if (/^Form[\s-]+(\d+)$/.test(userClass)) {
        userClassNumber = parseInt(userClass.match(/^Form[\s-]+(\d+)$/)[1]);
      } else if (/^\d+$/.test(userClass)) {
        userClassNumber = parseInt(userClass);
      }

      filtered = filtered.filter(exam => {
        const examClass = String(exam.class).trim();
        const examLevel = exam.level ? exam.level.toLowerCase() : '';

        // First check if exam is from the same level
        if (examLevel !== userLevel) {
          return false;
        }

        // Extract class number from exam class
        let examClassNumber;
        if (/^Form[\s-]+(\d+)$/.test(examClass)) {
          examClassNumber = parseInt(examClass.match(/^Form[\s-]+(\d+)$/)[1]);
        } else if (/^\d+$/.test(examClass)) {
          examClassNumber = parseInt(examClass);
        }

        // Match by class number
        const matches = userClassNumber === examClassNumber;

        if (matches) {
          console.log(`✅ Match found: user="${userClass}" (${userClassNumber}) matches exam="${examClass}" (${examClassNumber})`);
        }

        return matches;
      });

      console.log(`🎯 Found ${filtered.length} quizzes for user's class: ${userClass}`);

      // If no quizzes found for specific class, show all quizzes from the same level as fallback
      if (filtered.length === 0) {
        console.log(`🔄 No quizzes for class ${userClass}, showing all ${userLevel} level quizzes`);
        filtered = exams.filter(exam => {
          const examLevel = exam.level ? exam.level.toLowerCase() : '';
          return examLevel === userLevel;
        });
      }
    } else {
      // User has no class, show all quizzes
      console.log(`⚠️ No user class available, showing all ${filtered.length} quizzes`);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log('Final filtered exams result:', filtered.length);
    return filtered;
  }, [exams, searchTerm, selectedClass, selectedSubject, user?.class]);

  // Aggressive preloading of visible quizzes for instant access
  useEffect(() => {
    if (filteredExams.length > 0) {
      // Preload first 5 visible quizzes immediately
      const preloadPromises = filteredExams.slice(0, 5).map(quiz =>
        preloadQuizData(quiz._id)
      );

      // Execute preloading in background
      Promise.allSettled(preloadPromises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`🚀 Preloaded ${successful}/${results.length} quizzes for instant access`);
      });
    }
  }, [filteredExams]);

  // Optimize available classes calculation - show only relevant classes for user's level
  const availableClasses = useMemo(() => {
    if (!user?.level) return [];

    // Define expected classes based on user level only
    let expectedClasses = [];
    if (user.level === 'primary') {
      expectedClasses = ['1', '2', '3', '4', '5', '6', '7'];
    } else if (user.level === 'secondary') {
      expectedClasses = ['1', '2', '3', '4'];
    } else if (user.level === 'advance') {
      expectedClasses = ['5', '6']; // Only Form 5 and Form 6
    }

    console.log('📚 Available classes for', user.level, ':', expectedClasses);

    return expectedClasses;
  }, [user?.level]);

  // Get top 7 quiz categories based on selected class (or user's class if none selected)
  const topCategories = useMemo(() => {
    if (!exams.length) return [];

    const userLevel = user?.level?.toLowerCase();
    // Use selected class if available, otherwise fall back to user's class
    const targetClass = selectedClass || (user?.class ? String(user.class).trim() : '');

    // Extract target class number (selected class or user's class)
    let targetClassNumber;
    if (/^Form[\s-]+(\d+)$/.test(targetClass)) {
      targetClassNumber = parseInt(targetClass.match(/^Form[\s-]+(\d+)$/)[1]);
    } else if (/^\d+$/.test(targetClass)) {
      targetClassNumber = parseInt(targetClass);
    }

    // Filter exams by target class (selected or user's class) and level
    const targetClassExams = exams.filter(exam => {
      const examLevel = exam.level ? exam.level.toLowerCase() : '';
      const examClass = String(exam.class).trim();

      if (examLevel !== userLevel) return false;

      let examClassNumber;
      if (/^Form[\s-]+(\d+)$/.test(examClass)) {
        examClassNumber = parseInt(examClass.match(/^Form[\s-]+(\d+)$/)[1]);
      } else if (/^\d+$/.test(examClass)) {
        examClassNumber = parseInt(examClass);
      }

      return targetClassNumber === examClassNumber;
    });

    // Count categories - use the same field as orange tags on quiz cards
    const categoryCount = {};
    targetClassExams.forEach(exam => {
      // Get the category that appears in orange tags: quiz.category || 'General'
      const category = exam.category || 'General';

      // Skip only if it's exactly 'General' (the fallback)
      if (category === 'General') {
        return;
      }

      // Normalize the category name for primary level
      const normalizedCategory = normalizeSubjectName(category, userLevel);
      categoryCount[normalizedCategory] = (categoryCount[normalizedCategory] || 0) + 1;
    });

    // Sort by count and get top 7
    let sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 7)
      .map(([category, count]) => ({ category, count }));

    // If no categories found for user's class, get categories from user's level
    if (sortedCategories.length === 0 && userLevel) {
      console.log('🔄 No categories for user class, getting from user level');
      const levelExams = exams.filter(exam => {
        const examLevel = exam.level ? exam.level.toLowerCase() : '';
        return examLevel === userLevel;
      });

      const levelCategoryCount = {};
      levelExams.forEach(exam => {
        // Use same logic as orange tags: quiz.category || 'General'
        const category = exam.category || 'General';
        if (category === 'General') {
          return;
        }
        // Normalize the category name for primary level
        const normalizedCategory = normalizeSubjectName(category, userLevel);
        levelCategoryCount[normalizedCategory] = (levelCategoryCount[normalizedCategory] || 0) + 1;
      });

      sortedCategories = Object.entries(levelCategoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 7)
        .map(([category, count]) => ({ category, count }));
    }

    console.log('🏷️ Target class exams found:', targetClassExams.length);
    console.log('🏷️ Target class:', targetClass, '(selected:', selectedClass, ', user:', user?.class, ')');
    console.log('🏷️ All subjects found in target class exams:', Object.keys(categoryCount));
    console.log('🏷️ Top categories for target class:', sortedCategories);
    console.log('🏷️ Will show category tags?', sortedCategories.length > 0);

    // Debug: Show all unique categories in database for this level
    if (userLevel === 'primary') {
      const allPrimaryCategories = [...new Set(exams
        .filter(exam => exam.level?.toLowerCase() === 'primary')
        .map(exam => exam.category)
        .filter(Boolean)
      )];
      console.log('🔍 All primary level categories in database:', allPrimaryCategories);
    }

    return sortedCategories;
  }, [exams, selectedClass, user?.class, user?.level]);

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




  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
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

      <div className="min-h-screen quiz-container-immediate relative overflow-hidden"
           style={{
             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
             fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
           }}>
        {/* Glassmorphism Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl translate-x-48"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300 rounded-full blur-3xl translate-y-48"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-300 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 lg:px-8 pt-3 pb-3 sm:pb-4 lg:pb-6 relative z-10">


        {/* Compact Search and Filter with User Level - Glassmorphism */}
        <div className="max-w-4xl mx-auto mb-3 sm:mb-4 opacity-100">
          <div className="rounded-xl shadow-2xl p-3 sm:p-4"
               style={{
                 background: 'rgba(255, 255, 255, 0.25)',
                 backdropFilter: 'blur(20px) saturate(180%)',
                 WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                 border: '1px solid rgba(255, 255, 255, 0.3)',
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
               }}>
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

            {/* Top Quiz Categories - Responsive Design for All Devices */}
            {topCategories.length > 0 && (
              <div className="mb-6">
                {/* Responsive Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <TbStar className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Popular Categories</h3>
                  </div>
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-sm text-gray-500 font-medium">
                    {selectedClass
                      ? (user?.level === 'primary' ? `Class ${selectedClass}` : `Form ${selectedClass}`)
                      : (user?.level === 'primary' ? `Class ${user.class}` : `Form ${user.class}`)
                    }
                  </span>
                </div>

                {/* Responsive Category Tags - Horizontal with Wrapping */}
                <div className="category-tags-container">
                  {topCategories.map(({ category, count }) => (
                    <button
                      key={category}
                      onClick={() => handleSubjectChange(category)}
                      className="mobile-category-button flex items-center gap-1 md:gap-2 px-2 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl font-medium transition-all duration-200 whitespace-nowrap"
                      style={selectedSubject === category ? {
                        background: 'rgba(59, 130, 246, 0.9)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)',
                        transform: 'scale(1.05)'
                      } : {
                        background: 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        color: '#1f2937',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <TbBook className={`h-3 w-3 md:h-4 md:w-4 ${
                        selectedSubject === category ? 'text-white' : 'text-blue-600'
                      }`} />
                      <span className="text-xs md:text-sm category-button-text">{category}</span>
                      <span
                        className="category-count px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-bold"
                        style={selectedSubject === category ? {
                          background: 'rgba(255, 255, 255, 0.25)',
                          color: 'white'
                        } : {
                          background: 'rgba(59, 130, 246, 0.3)',
                          color: 'white',
                          fontWeight: '700'
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  ))}

                  {/* Clear Filter Button */}
                  {selectedSubject && selectedSubject !== 'all' && (
                    <button
                      onClick={() => handleSubjectChange('all')}
                      className="mobile-category-button flex items-center gap-1 md:gap-2 px-2 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                      <TbX className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="text-xs md:text-sm">Clear</span>
                    </button>
                  )}
                </div>
              </div>
            )}

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
                    <option value="">
                      {user?.class
                        ? `My Class (${
                            user.level === 'primary'
                              ? `Class ${user.class}`
                              : `Form ${user.class.toString().replace(/^Form[\s-]+/, '')}`
                          })`
                        : 'All Classes'
                      }
                    </option>
                    {availableClasses.map((className) => (
                      <option key={className} value={className}>
                        {user?.level === 'primary'
                          ? `Class ${className}`
                          : `Form ${className}`
                        }
                      </option>
                    ))}
                  </select>
                </div>
              </div>




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
                  <ModernQuizCard
                    key={quiz._id}
                    quiz={quiz}
                    userResult={userResults[quiz._id]}
                    showResults={true}
                    onStart={handleQuizStart}
                    className="h-full"
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

export default Quiz;
