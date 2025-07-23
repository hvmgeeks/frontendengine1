import React, { useState, useEffect, useCallback, startTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { message } from 'antd';
import {
  TbClock,
  TbArrowLeft,
  TbArrowRight,
  TbCheck
} from 'react-icons/tb';
import { getExamById } from '../../../apicalls/exams';
import { addReport } from '../../../apicalls/reports';
import { getUserInfo } from '../../../apicalls/users';
import { SetUser } from '../../../redux/usersSlice';

// Professional Sound System
const playSound = (type) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const createTone = (frequency, duration, type = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };

    switch(type) {
      case 'select':
        // Professional click sound
        createTone(800, 0.1, 'square');
        break;
      case 'navigate':
        // Smooth navigation sound
        createTone(600, 0.15, 'sine');
        setTimeout(() => createTone(800, 0.1, 'sine'), 50);
        break;
      case 'submit':
        // Success sound
        createTone(523, 0.2, 'sine'); // C
        setTimeout(() => createTone(659, 0.2, 'sine'), 100); // E
        setTimeout(() => createTone(784, 0.3, 'sine'), 200); // G
        break;
      default:
        createTone(600, 0.1, 'sine');
    }
  } catch (error) {
    // Fallback for browsers that don't support Web Audio API
    console.log('Audio not supported');
  }
};

const QuizPlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [navigatingToResults, setNavigatingToResults] = useState(false);

  // Load quiz data with optimized caching
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const loadStartTime = performance.now();
        console.log('🚀 Loading quiz with ID:', id);

        // Quick user validation without blocking
        if (!user || !user._id) {
          const token = localStorage.getItem('token');
          if (!token) {
            console.log('No token found, redirecting to login');
            message.error('Please login to access quizzes');
            startTransition(() => {
              navigate('/login');
            });
            return;
          }
        }

        // Check for instant cached data first (highest priority)
        const instantCacheKey = `quiz_instant_${id}`;
        const instantCached = localStorage.getItem(instantCacheKey);

        if (instantCached) {
          try {
            const cachedQuiz = JSON.parse(instantCached);
            const cacheLoadTime = performance.now() - loadStartTime;
            console.log(`⚡ Using instant cached quiz data (${cacheLoadTime.toFixed(1)}ms)`);

            setQuiz(cachedQuiz);
            setQuestions(cachedQuiz.questions);
            setAnswers(new Array(cachedQuiz.questions.length).fill(''));
            setTimeLeft(cachedQuiz.duration || 180);
            setStartTime(new Date());
            setLoading(false);

            // Clean up instant cache
            localStorage.removeItem(instantCacheKey);
            return;
          } catch (error) {
            console.error('Error parsing instant cache:', error);
            localStorage.removeItem(instantCacheKey); // Clean up corrupted cache
          }
        }

        // Check regular cache (second priority)
        const cacheKey = `quiz_data_${id}`;
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        const now = Date.now();

        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 600000) {
          try {
            const cachedQuiz = JSON.parse(cachedData);
            const cacheLoadTime = performance.now() - loadStartTime;
            console.log(`📚 Using cached quiz data (${cacheLoadTime.toFixed(1)}ms)`);

            setQuiz(cachedQuiz);
            setQuestions(cachedQuiz.questions);
            setAnswers(new Array(cachedQuiz.questions.length).fill(''));
            setTimeLeft(cachedQuiz.duration || 180);
            setStartTime(new Date());
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing cached data:', error);
            // Clean up corrupted cache
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(`${cacheKey}_time`);
          }
        }

        // Last resort: fetch from server
        console.log('🌐 Fetching quiz from server...');
        setLoading(true);

        const apiStartTime = performance.now();
        const response = await getExamById({ examId: id });
        const apiTime = performance.now() - apiStartTime;
        console.log(`🌐 Quiz API response received in ${apiTime.toFixed(1)}ms:`, response);
        
        if (response.success) {
          if (!response.data) {
            message.error('Quiz data not found');
            startTransition(() => {
              navigate('/quiz');
            });
            return;
          }
          
          if (!response.data.questions || response.data.questions.length === 0) {
            message.error('This quiz has no questions available');
            startTransition(() => {
              navigate('/quiz');
            });
            return;
          }

          setQuiz(response.data);
          setQuestions(response.data.questions);
          setAnswers(new Array(response.data.questions.length).fill(''));
          // Duration is already in seconds, no need to multiply by 60
          setTimeLeft(response.data.duration || 180);
          setStartTime(new Date());

          // Cache the quiz data for future use
          const cacheKey = `quiz_data_${id}`;
          localStorage.setItem(cacheKey, JSON.stringify(response.data));
          localStorage.setItem(`${cacheKey}_time`, Date.now().toString());

          const totalLoadTime = performance.now() - loadStartTime;
          console.log(`✅ Quiz loaded successfully in ${totalLoadTime.toFixed(1)}ms:`, response.data);
          console.log('Quiz duration (seconds):', response.data.duration);
        } else {
          console.error('Quiz API error:', response.message);
          message.error(response.message || 'Failed to load quiz');
          startTransition(() => {
            navigate('/quiz');
          });
        }
      } catch (error) {
        console.error('Quiz loading error:', error);
        message.error('Failed to load quiz. Please try again.');
        startTransition(() => {
          navigate('/quiz');
        });
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      loadQuizData();
    }
  }, [id, navigate, user]);

  // Function to refresh user data after quiz completion
  const refreshUserData = async () => {
    try {
      const response = await getUserInfo();
      if (response.success) {
        dispatch(SetUser(response.data));
        localStorage.setItem("user", JSON.stringify(response.data));
        console.log('🔄 User data refreshed with updated XP:', response.data.totalXP);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Submit quiz function
  const handleSubmitQuiz = useCallback(async () => {
    console.log('🚀 Submit button clicked - showing loading overlay');
    console.log('Current submitting state:', submitting);

    try {
      // Play submit sound
      playSound('submit');

      // Show loading immediately
      setSubmitting(true);
      console.log('✅ setSubmitting(true) called');
      console.log('📝 Starting quiz marking process...');

      // Check if quiz data is available
      if (!quiz || !questions || questions.length === 0) {
        console.error('❌ Quiz data not available for submission');
        message.error('Quiz data not loaded. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      let currentUser = user;
      if (!currentUser || !currentUser._id) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            currentUser = JSON.parse(storedUser);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            startTransition(() => {
              navigate('/login');
            });
            return;
          }
        }
      }

      if (!currentUser || !currentUser._id) {
        message.error('User session expired. Please login again.');
        startTransition(() => {
          navigate('/login');
        });
        return;
      }

      const endTime = new Date();
      const timeTaken = Math.floor((endTime - startTime) / 1000);

      let correctAnswers = 0;
      console.log('📝 Processing quiz answers:', answers);
      const resultDetails = questions.map((question, index) => {
        const userAnswer = answers[index];
        console.log(`Question ${index + 1}: userAnswer =`, userAnswer, typeof userAnswer);
        let isCorrect = false;
        let actualCorrectAnswer = '';

        // Determine the correct answer based on question type
        const questionType = question.type || question.answerType || 'mcq';
        console.log(`Question ${index + 1} type:`, questionType, 'Raw question:', question);

        if (questionType.toLowerCase() === 'mcq' || questionType === 'Options') {
          // For MCQ questions, check both correctAnswer and correctOption
          if (question.options && typeof question.options === 'object') {
            // If correctAnswer is a key (like "B"), get the actual text
            if (question.correctAnswer && question.options[question.correctAnswer]) {
              actualCorrectAnswer = question.options[question.correctAnswer];
              isCorrect = userAnswer === actualCorrectAnswer;
            }
            // If correctOption is available, use it
            else if (question.correctOption && question.options[question.correctOption]) {
              actualCorrectAnswer = question.options[question.correctOption];
              isCorrect = userAnswer === actualCorrectAnswer;
            }
            // If correctAnswer is already the full text
            else if (question.correctAnswer) {
              actualCorrectAnswer = question.correctAnswer;
              isCorrect = userAnswer === actualCorrectAnswer;
            }
          } else {
            // Fallback for other option formats
            actualCorrectAnswer = question.correctAnswer || question.correctOption || '';
            isCorrect = userAnswer === actualCorrectAnswer;
          }
        } else {
          // For fill-in-the-blank and other types, direct comparison
          actualCorrectAnswer = question.correctAnswer || '';
          const userAnswerStr = userAnswer ? String(userAnswer).toLowerCase().trim() : '';
          const correctAnswerStr = actualCorrectAnswer ? String(actualCorrectAnswer).toLowerCase().trim() : '';
          isCorrect = userAnswerStr === correctAnswerStr && userAnswerStr !== '';
          console.log(`Fill-in comparison: "${userAnswerStr}" === "${correctAnswerStr}" = ${isCorrect}`);
        }

        if (isCorrect) correctAnswers++;

        return {
          questionId: question._id || `question_${index}`,
          questionName: typeof question.name === 'string' ? question.name : `Question ${index + 1}`,
          questionText: question.name || `Question ${index + 1}`,
          userAnswer: userAnswer !== null && userAnswer !== undefined ? String(userAnswer).trim() : '',
          correctAnswer: actualCorrectAnswer,
          isCorrect,
          questionType: questionType,
          options: question.options || null,
          questionImage: question.image || question.questionImage || question.imageUrl || null,
          image: question.image || question.questionImage || question.imageUrl || null
        };
      });

      const percentage = Math.round((correctAnswers / questions.length) * 100);
      // Use the exam's actual passing marks instead of hardcoded 60% with proper null checks
      const passingPercentage = (quiz && (quiz.passingMarks || quiz.passingPercentage)) || 60;
      const verdict = percentage >= passingPercentage ? 'Pass' : 'Fail';

      const reportData = {
        exam: id,
        user: currentUser._id,
        result: {
          correctAnswers,
          wrongAnswers: questions.length - correctAnswers,
          percentage,
          score: percentage,
          verdict: verdict,
          timeTaken,
          timeSpent: timeTaken, // Add timeSpent for XP calculation
          points: correctAnswers * 10,
          totalQuestions: questions.length
        }
      };

      try {
        console.log('📤 Submitting quiz report:', reportData);
        const response = await addReport(reportData);
        console.log('📥 Server response:', response);

        if (response.success) {
          console.log('✅ Quiz submitted successfully, preparing results...');
          console.log('🎯 XP Data received from server:', response.xpData);

          // Include XP data in navigation state
          const navigationState = {
            percentage,
            correctAnswers,
            totalQuestions: questions.length,
            timeTaken,
            resultDetails,
            xpData: response.xpData || null, // Include XP data from server response
            quizName: (quiz && quiz.name) || 'Quiz',
            quizSubject: (quiz && (quiz.subject || quiz.category)) || 'General',
            passingPercentage: passingPercentage, // Include actual passing marks
            verdict: verdict // Include calculated verdict
          };

          console.log('🚀 Navigation state with XP data:', navigationState);

          // Refresh user data to get updated XP
          await refreshUserData();

          // Set navigating state to prevent quiz component flicker
          setNavigatingToResults(true);
          console.log('🎯 Preparing for results navigation...');

          // Longer delay to ensure marking window is fully processed
          await new Promise(resolve => setTimeout(resolve, 1500));

          console.log('🎯 Navigating to results page...');

          // Use replace instead of push to prevent back navigation issues
          navigate(`/quiz/${id}/result`, {
            state: navigationState,
            replace: true
          });
        } else {
          console.error('❌ Quiz submission failed:', response.message);
          // Just log the error, don't show notification to user
          setTimeout(() => {
            setSubmitting(false);
            // message.error(response.message || 'Failed to submit quiz'); // Removed notification
          }, 1000);
          return;
        }
      } catch (apiError) {
        console.error('❌ API Error during submission:', apiError);
        // Just log the error, don't show notification to user
        setTimeout(() => {
          setSubmitting(false);
          // message.error('Network error while submitting quiz'); // Removed notification
        }, 1000);
        return;
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      // Just log the error, don't show notification to user
      setTimeout(() => {
        setSubmitting(false);
        // message.error('Failed to submit quiz'); // Removed notification
      }, 1000);
      return;
    } finally {
      setSubmitting(false);
    }
  }, [startTime, questions, answers, id, navigate, user]);

  // Timer countdown with auto-submit
  useEffect(() => {
    if (timeLeft <= 0) {
      // Auto-submit when timer reaches 0, but only if quiz data is available
      if (quiz && questions && questions.length > 0) {
        console.log('⏰ Time up! Auto-submitting quiz...');
        handleSubmitQuiz();
      } else {
        console.log('⏰ Time up but quiz data not available, skipping auto-submit');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmitQuiz, quiz, questions]);

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    console.log(`📝 Answer selected for question ${currentQuestion + 1}:`, answer, typeof answer);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
    console.log('📝 Updated answers array:', newAnswers);
  };

  // Navigation functions
  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      playSound('navigate');
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      playSound('navigate');
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Duolingo-style time formatting (min:sec format)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Render different answer sections based on question type
  const renderAnswerSection = () => {
    const questionType = currentQ.type || currentQ.answerType || 'mcq';
    console.log(`🎯 Rendering question ${currentQuestion + 1} with type:`, questionType, 'Current question:', currentQ);

    switch (questionType.toLowerCase()) {
      case 'mcq':
      case 'multiple-choice':
      case 'multiplechoice':
        return renderMultipleChoice();

      case 'fill':
      case 'fill-in-the-blank':
      case 'fillblank':
      case 'text':
        return renderFillInTheBlank();

      case 'image':
      case 'diagram':
        return renderImageQuestion();

      default:
        // Default to multiple choice if type is unclear
        return renderMultipleChoice();
    }
  };

  // Render multiple choice options
  const renderMultipleChoice = () => {
    let options = [];

    // Handle different option formats
    if (Array.isArray(currentQ.options)) {
      options = currentQ.options;
    } else if (currentQ.options && typeof currentQ.options === 'object') {
      // Handle object format like {A: "option1", B: "option2"}
      options = Object.values(currentQ.options);
    } else if (currentQ.option1 && currentQ.option2) {
      // Handle individual option properties
      options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean);
    }

    if (!options || options.length === 0) {
      // Show debug info and fallback options for testing
      return (
        <div className="space-y-4">
          <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">No options found for this question</p>
            <details className="mt-2">
              <summary className="text-sm text-yellow-600 cursor-pointer">Show question data</summary>
              <pre className="text-xs text-left mt-2 bg-yellow-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(currentQ, null, 2)}
              </pre>
            </details>
          </div>

          {/* Fallback test options */}
          <div className="space-y-3">
            {['Option A (Test)', 'Option B (Test)', 'Option C (Test)', 'Option D (Test)'].map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index);
              const isSelected = answers[currentQuestion] === option;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {optionLetter}
                    </div>
                    <span className="text-lg leading-relaxed flex-1 text-left text-gray-900">
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index);
          const isSelected = answers[currentQuestion] === option;

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {optionLetter}
                </div>
                <span className="text-lg leading-relaxed flex-1 text-left text-gray-900">
                  {typeof option === 'string' ? option : JSON.stringify(option)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // Render fill in the blank input
  const renderFillInTheBlank = () => {
    const currentAnswer = answers[currentQuestion] || '';
    console.log(`🎯 Rendering fill-in-blank for question ${currentQuestion + 1}, current answer:`, currentAnswer);

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm font-medium mb-2">Fill in the blank:</p>
          <p className="text-gray-700">Type your answer in the box below</p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => handleAnswerSelect(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            autoFocus
          />
        </div>
      </div>
    );
  };

  // Render image/diagram question (could have options or be fill-in)
  const renderImageQuestion = () => {
    if (currentQ.options && Array.isArray(currentQ.options) && currentQ.options.length > 0) {
      return renderMultipleChoice();
    } else {
      return renderFillInTheBlank();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md mx-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">No Questions Available</h2>
            <p className="text-gray-600 mb-6">This quiz doesn't have any questions yet.</p>
            <button
              onClick={() => startTransition(() => navigate('/quiz'))}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safety check for current question
  if (!questions[currentQuestion]) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md mx-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Question Not Found</h2>
            <p className="text-gray-600 mb-6">Unable to load the current question.</p>
            <button
              onClick={() => startTransition(() => navigate('/quiz'))}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  // Ensure currentQ is a valid object
  if (!currentQ || typeof currentQ !== 'object') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md mx-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invalid Question Data</h2>
            <p className="text-gray-600 mb-6">The question data is corrupted or invalid.</p>
            <button
              onClick={() => startTransition(() => navigate('/quiz'))}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }



  // Show enhanced loading screen when submitting or navigating to results
  if (submitting || navigatingToResults) {
    return (
      <>
        <style>{`
          @keyframes professionalSpin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
          }
          @keyframes elegantPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
          @keyframes smoothBounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
            40% { transform: translateY(-8px) scale(1.2); }
            60% { transform: translateY(-4px) scale(1.1); }
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes orbitalSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .professional-dot {
            animation: smoothBounce 1.6s infinite ease-in-out both;
          }
          .professional-dot:nth-child(1) { animation-delay: -0.32s; }
          .professional-dot:nth-child(2) { animation-delay: -0.16s; }
          .professional-dot:nth-child(3) { animation-delay: 0s; }
          .professional-dot:nth-child(4) { animation-delay: 0.16s; }
          .gradient-bg {
            background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
            background-size: 400% 400%;
            animation: gradientShift 4s ease infinite;
          }

          /* Enhanced Quiz Modal Centering */
          .quiz-marking-overlay,
          .quiz-result-overlay,
          .quiz-modal-overlay {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            padding: 20px !important;
            box-sizing: border-box !important;
          }

          .quiz-marking-modal,
          .quiz-result-modal,
          .quiz-modal-content {
            position: relative !important;
            margin: 0 auto !important;
            transform: none !important;
            max-width: 90vw !important;
            max-height: 90vh !important;
          }
        `}</style>
        <div className="gradient-bg quiz-marking-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: window.innerWidth <= 480 ? '16px' : window.innerWidth <= 768 ? '20px' : '24px',
            padding: window.innerWidth <= 480 ? '24px 16px' : window.innerWidth <= 768 ? '32px 24px' : '48px 40px',
            textAlign: 'center',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.2), 0 16px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            maxWidth: window.innerWidth <= 480 ? '280px' : window.innerWidth <= 768 ? '320px' : '450px',
            width: window.innerWidth <= 480 ? '95%' : '90%',
            animation: 'fadeInUp 0.6s ease-out',
            margin: window.innerWidth <= 480 ? '0 auto' : 'auto'
          }}>
            {/* Professional Animated Icon */}
            <div style={{
              width: window.innerWidth <= 480 ? '80px' : window.innerWidth <= 768 ? '100px' : '120px',
              height: window.innerWidth <= 480 ? '80px' : window.innerWidth <= 768 ? '100px' : '120px',
              margin: window.innerWidth <= 480 ? '0 auto 24px auto' : '0 auto 32px auto',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'professionalSpin 3s ease-in-out infinite',
              boxShadow: '0 16px 40px rgba(102, 126, 234, 0.4), 0 8px 16px rgba(118, 75, 162, 0.3)',
              position: 'relative'
            }}>
              <div style={{
                width: window.innerWidth <= 480 ? '40px' : window.innerWidth <= 768 ? '50px' : '60px',
                height: window.innerWidth <= 480 ? '40px' : window.innerWidth <= 768 ? '50px' : '60px',
                background: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <span style={{
                  fontSize: window.innerWidth <= 480 ? '20px' : window.innerWidth <= 768 ? '24px' : '28px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}>🎯</span>
              </div>
              {/* Orbital rings */}
              <div style={{
                position: 'absolute',
                width: '140%',
                height: '140%',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                animation: 'orbitalSpin 4s linear infinite reverse'
              }}></div>
            </div>

            {/* Enhanced Main Message */}
            <h2 style={{
              fontSize: window.innerWidth <= 480 ? '20px' : window.innerWidth <= 768 ? '24px' : '32px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: window.innerWidth <= 480 ? '0 0 8px 0' : '0 0 12px 0',
              animation: 'elegantPulse 2.5s infinite',
              letterSpacing: window.innerWidth <= 480 ? '-0.25px' : '-0.5px'
            }}>Evaluating Your Quiz</h2>

            {/* Professional Sub Message */}
            <p style={{
              fontSize: window.innerWidth <= 480 ? '12px' : window.innerWidth <= 768 ? '14px' : '16px',
              color: '#64748b',
              margin: window.innerWidth <= 480 ? '0 0 24px 0' : '0 0 32px 0',
              lineHeight: '1.6',
              fontWeight: '500',
              padding: window.innerWidth <= 480 ? '0 8px' : '0'
            }}>Our advanced system is carefully reviewing your answers</p>

            {/* Enhanced Progress Indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: window.innerWidth <= 480 ? '4px' : '6px',
              marginBottom: window.innerWidth <= 480 ? '12px' : '16px'
            }}>
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="professional-dot"
                  style={{
                    width: window.innerWidth <= 480 ? '8px' : '10px',
                    height: window.innerWidth <= 480 ? '8px' : '10px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
                  }}
                />
              ))}
            </div>

            {/* Progress Text */}
            <div style={{
              fontSize: window.innerWidth <= 480 ? '10px' : window.innerWidth <= 768 ? '12px' : '14px',
              color: '#94a3b8',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: window.innerWidth <= 480 ? '0.5px' : '1px'
            }}>
              Processing...
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative p-2 sm:p-4 lg:p-6">
      {/* Header removed - using ProtectedRoute header only */}
      <div className="bg-white shadow-sm border-b border-gray-200 rounded-lg mb-3 sm:mb-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* Quiz Content Layout */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            {/* Quiz Title */}
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 text-center sm:text-left truncate">
              {quiz.name}
            </h1>

            {/* Timer - Responsive */}
            <div className="flex justify-center">
              <div
                className="flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl shadow-lg border-2 px-3 sm:px-4 py-2 sm:py-3"
                style={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  background: timeLeft <= 60
                    ? 'linear-gradient(to right, #ef4444, #dc2626)'
                    : 'linear-gradient(to right, #22c55e, #16a34a)',
                  borderColor: timeLeft <= 60 ? '#fca5a5' : '#86efac',
                  color: 'white',
                  boxShadow: timeLeft <= 60
                    ? '0 0 20px rgba(239, 68, 68, 0.6), 0 4px 20px rgba(0,0,0,0.3)'
                    : '0 0 15px rgba(34, 197, 94, 0.4), 0 4px 20px rgba(0,0,0,0.3)',
                  animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
                }}>
                <TbClock
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    animation: timeLeft <= 60 ? 'bounce 1s infinite' : 'none'
                  }}
                />

                <span
                  className="text-sm sm:text-base lg:text-lg font-mono font-black"
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                    animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
                  }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Progress */}
            <p className="text-sm sm:text-base text-gray-600 font-medium text-center sm:text-right">
              {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          {/* Responsive Progress Bar */}
          <div className="mb-3 sm:mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                Progress
              </span>
              <span className="text-xs sm:text-sm text-blue-600 font-bold">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden shadow-inner"
              style={{
                height: window.innerWidth <= 768 ? '8px' : '12px',
                backgroundColor: '#e5e7eb'
              }}
            >
              <div
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                  borderRadius: '9999px',
                  transition: 'width 0.5s ease-out',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.4)'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-200 transition-all duration-300 p-4 sm:p-6 lg:p-8">
          {/* Responsive Question */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 text-center mb-4 sm:mb-6 leading-tight">
              {typeof currentQ.name === 'string' ? currentQ.name : 'Question'}
            </h2>

            {currentQ.image && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <img
                  src={currentQ.image}
                  alt="Question diagram"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto block max-h-48 sm:max-h-64 lg:max-h-80"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    // Show fallback message
                    const fallback = document.createElement('div');
                    fallback.className = 'text-center py-8 text-gray-500';
                    fallback.innerHTML = '<p>Could not load diagram</p>';
                    e.target.parentNode.appendChild(fallback);
                  }}
                />
              </div>
            )}
          </div>

          {/* Answer Section - Different types based on question type */}
          <div
            className="space-y-4"
            style={{
              marginBottom: window.innerWidth <= 768 ? '16px' : '32px'
            }}
          >
            {renderAnswerSection()}
          </div>

          {/* Navigation */}
          <div
            className="flex items-center"
            style={{
              flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
              justifyContent: window.innerWidth <= 768 ? 'center' : 'space-between',
              gap: window.innerWidth <= 768 ? '12px' : '0'
            }}
          >
            <button
              onClick={goToPrevious}
              disabled={currentQuestion === 0}
              className={`flex items-center gap-2 rounded-lg font-semibold transition-colors ${
                currentQuestion === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={{
                padding: window.innerWidth <= 768 ? '10px 16px' : '12px 24px',
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                width: window.innerWidth <= 768 ? '100%' : 'auto',
                justifyContent: 'center'
              }}
            >
              <TbArrowLeft
                style={{
                  width: window.innerWidth <= 768 ? '16px' : '20px',
                  height: window.innerWidth <= 768 ? '16px' : '20px'
                }}
              />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting || !quiz || !questions || questions.length === 0}
                className={`flex items-center gap-2 rounded-lg font-semibold transition-colors ${
                  submitting || !quiz || !questions || questions.length === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                style={{
                  padding: window.innerWidth <= 768 ? '10px 16px' : '12px 32px',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                  width: window.innerWidth <= 768 ? '100%' : 'auto',
                  justifyContent: 'center'
                }}
              >
                {submitting ? (
                  <>
                    <div
                      className="animate-spin rounded-full border-2 border-white border-t-transparent"
                      style={{
                        width: window.innerWidth <= 768 ? '16px' : '20px',
                        height: window.innerWidth <= 768 ? '16px' : '20px'
                      }}
                    ></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <TbCheck
                      style={{
                        width: window.innerWidth <= 768 ? '16px' : '20px',
                        height: window.innerWidth <= 768 ? '16px' : '20px'
                      }}
                    />
                    Submit Quiz
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goToNext}
                className="flex items-center gap-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                style={{
                  padding: window.innerWidth <= 768 ? '10px 16px' : '12px 24px',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                  width: window.innerWidth <= 768 ? '100%' : 'auto',
                  justifyContent: 'center'
                }}
              >
                Next
                <TbArrowRight
                  style={{
                    width: window.innerWidth <= 768 ? '16px' : '20px',
                    height: window.innerWidth <= 768 ? '16px' : '20px'
                  }}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPlay;
