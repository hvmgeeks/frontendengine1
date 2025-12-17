/**
 * Safe data extraction utilities for Quiz UI components
 * Prevents "Objects are not valid as a React child" errors
 */

/**
 * Safely extracts a string value from an object property
 * @param {any} value - The value to extract
 * @param {string} fallback - Fallback value if extraction fails
 * @returns {string} - Safe string value
 */
export const safeString = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return String(value);
  return fallback;
};

/**
 * Safely extracts a number value from an object property
 * @param {any} value - The value to extract
 * @param {number} fallback - Fallback value if extraction fails
 * @returns {number} - Safe number value
 */
export const safeNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : fallback;
  }
  return fallback;
};

/**
 * Safely extracts quiz properties for rendering
 * @param {Object} quiz - Quiz object
 * @returns {Object} - Safe quiz properties
 */
export const extractQuizData = (quiz) => {
  if (!quiz || typeof quiz !== 'object') {
    return {
      id: '',
      name: 'Unknown Quiz',
      duration: 30,
      totalQuestions: 0,
      totalXP: 100,
      subject: 'General',
      class: 'N/A',
      difficulty: 'medium',
      category: 'General',
      description: 'Test your knowledge with this quiz',
      passingMarks: 60,
      topic: '',
      questions: []
    };
  }

  return {
    id: safeString(quiz._id || quiz.id),
    name: safeString(quiz.name, 'Unknown Quiz'),
    duration: safeNumber(quiz.duration, 30),
    totalQuestions: Array.isArray(quiz.questions) ? quiz.questions.length : safeNumber(quiz.totalQuestions, 0),
    totalXP: safeNumber(quiz.xpPoints || quiz.totalXP || quiz.totalMarks, 100),
    subject: safeString(quiz.subject || quiz.category, 'General'),
    class: safeString(quiz.class, 'N/A'),
    level: safeString(quiz.level, 'primary').toLowerCase(),
    difficulty: safeString(quiz.difficulty || quiz.difficultyLevel, 'medium'),
    category: safeString(quiz.category, 'General'),
    description: safeString(quiz.description, 'Test your knowledge with this quiz'),
    passingMarks: safeNumber(quiz.passingMarks || quiz.passingPercentage, 60),
    topic: safeString(quiz.topic),
    questions: Array.isArray(quiz.questions) ? quiz.questions : []
  };
};

/**
 * Safely extracts question properties for rendering
 * @param {Object} question - Question object
 * @returns {Object} - Safe question properties
 */
export const extractQuestionData = (question) => {
  if (!question || typeof question !== 'object') {
    return {
      id: '',
      name: 'Question not available',
      type: 'mcq',
      options: {},
      correctAnswer: '',
      image: '',
      duration: 90,
      difficulty: 'medium'
    };
  }

  // Handle different question data structures
  const questionText = question.name || question.question || question.text || question.title || '';
  const questionType = question.type || question.answerType || question.questionType || 'mcq';
  const questionOptions = question.options || question.choices || question.answers || {};

  // Convert answerType to our standard types
  let normalizedType = 'mcq';
  const typeString = String(questionType).toLowerCase();

  if (typeString.includes('option') || typeString === 'mcq' || typeString.includes('multiple') || typeString.includes('choice')) {
    normalizedType = 'mcq';
  } else if (typeString.includes('fill') || typeString.includes('blank') || typeString === 'text' || typeString.includes('free')) {
    normalizedType = 'fill';
  } else if (typeString.includes('image') || typeString.includes('picture')) {
    normalizedType = 'image';
  }

  // If no options are provided but it's marked as MCQ, treat as fill-in
  if (normalizedType === 'mcq' && (!questionOptions || Object.keys(questionOptions).length === 0)) {
    normalizedType = 'fill';
  }

  const extractedData = {
    id: safeString(question._id || question.id),
    name: safeString(questionText, 'Question not available'),
    type: normalizedType,
    options: questionOptions && typeof questionOptions === 'object' ? questionOptions : {},
    correctAnswer: safeString(question.correctAnswer || question.correctOption || question.answer),
    image: safeString(question.image || question.imageUrl || question.img),
    duration: safeNumber(question.duration, 90),
    difficulty: safeString(question.difficultyLevel || question.difficulty, 'medium')
  };

  return extractedData;
};

/**
 * Safely extracts user result properties for rendering
 * @param {Object} userResult - User result object
 * @returns {Object} - Safe user result properties
 */
export const extractUserResultData = (userResult) => {
  if (!userResult || typeof userResult !== 'object') {
    return {
      score: 0,
      percentage: 0,
      verdict: 'Not Attempted',
      correctAnswers: 0,
      wrongAnswers: 0,
      totalQuestions: 0,
      timeSpent: 0,
      xpGained: 0,
      passed: false
    };
  }

  const percentage = safeNumber(userResult.percentage || userResult.score, 0);
  const passingMarks = safeNumber(userResult.passingMarks, 60);
  
  return {
    score: safeNumber(userResult.score || userResult.percentage, 0),
    percentage: percentage,
    verdict: safeString(userResult.verdict, percentage >= passingMarks ? 'Pass' : 'Fail'),
    correctAnswers: Array.isArray(userResult.correctAnswers) ? userResult.correctAnswers.length : safeNumber(userResult.correctAnswers, 0),
    wrongAnswers: Array.isArray(userResult.wrongAnswers) ? userResult.wrongAnswers.length : safeNumber(userResult.wrongAnswers, 0),
    totalQuestions: safeNumber(userResult.totalQuestions, 0),
    timeSpent: safeNumber(userResult.timeSpent, 0),
    xpGained: safeNumber(userResult.points || userResult.xpGained, 0),
    passed: percentage >= passingMarks
  };
};

/**
 * Gets quiz status for UI display
 * @param {Object} userResult - User result object
 * @param {number} passingMarks - Passing marks threshold
 * @returns {Object} - Status configuration
 */
export const getQuizStatus = (userResult, passingMarks = 60) => {
  if (!userResult) {
    return {
      status: 'not_attempted',
      statusColor: 'bg-blue-500',
      cardBg: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200 hover:border-blue-300',
      textColor: 'text-blue-900'
    };
  }

  const resultData = extractUserResultData(userResult);
  const passed = resultData.percentage >= passingMarks;

  if (passed) {
    return {
      status: 'passed',
      statusColor: 'bg-green-500',
      cardBg: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-200 hover:border-green-300',
      textColor: 'text-green-900'
    };
  } else {
    return {
      status: 'failed',
      statusColor: 'bg-red-500',
      cardBg: 'bg-red-50 hover:bg-red-100',
      borderColor: 'border-red-200 hover:border-red-300',
      textColor: 'text-red-900'
    };
  }
};

/**
 * Safely renders a value for JSX (prevents object rendering errors)
 * @param {any} value - Value to render
 * @param {string} fallback - Fallback if value is not renderable
 * @returns {string|number} - Safe renderable value
 */
export const safeRender = (value, fallback = '') => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return fallback;
};

/**
 * Formats time in minutes and seconds
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  const minutes = Math.floor(safeNumber(seconds, 0) / 60);
  const remainingSeconds = safeNumber(seconds, 0) % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Validates if a value is safe to render in JSX
 * @param {any} value - Value to check
 * @returns {boolean} - True if safe to render
 */
export const isSafeToRender = (value) => {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
};

/**
 * Safe conditional renderer - only renders if value is safe
 * @param {any} value - Value to render
 * @param {string} fallback - Fallback if value is not safe
 * @returns {string|number|null} - Safe value or null
 */
export const conditionalRender = (value, fallback = '') => {
  if (isSafeToRender(value)) {
    return value;
  }
  if (isSafeToRender(fallback)) {
    return fallback;
  }
  return null;
};

/**
 * Safely extracts array length
 * @param {any} arr - Array to check
 * @returns {number} - Safe array length
 */
export const safeArrayLength = (arr) => {
  return Array.isArray(arr) ? arr.length : 0;
};

/**
 * Safely extracts object keys count
 * @param {any} obj - Object to check
 * @returns {number} - Safe object keys count
 */
export const safeObjectKeysCount = (obj) => {
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? Object.keys(obj).length : 0;
};
