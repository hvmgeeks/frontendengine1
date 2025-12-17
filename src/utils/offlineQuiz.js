// Offline Quiz Utility
// Handles quiz downloads and offline quiz playback

const DB_NAME = 'BrainwaveQuizzes';
const DB_VERSION = 2; // Incremented to add quiz results store
const STORE_NAME = 'quizzes';
const RESULTS_STORE_NAME = 'quizResults';

// Global database instance
let quizDbInstance = null;

/**
 * Initialize and get quiz database instance
 */
const getQuizDatabase = async () => {
  if (quizDbInstance) {
    return quizDbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open quiz database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      quizDbInstance = request.result;
      console.log('✅ Quiz IndexedDB opened successfully');
      resolve(quizDbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('🔧 Upgrading Quiz IndexedDB schema...');

      // Create quizzes object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('subject', 'subject', { unique: false });
        objectStore.createIndex('class', 'class', { unique: false });
        objectStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        console.log('✅ Quiz object store created');
      }

      // Create quiz results object store for offline marking
      if (!db.objectStoreNames.contains(RESULTS_STORE_NAME)) {
        const resultsStore = db.createObjectStore(RESULTS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        resultsStore.createIndex('quizId', 'quizId', { unique: false });
        resultsStore.createIndex('userId', 'userId', { unique: false });
        resultsStore.createIndex('timestamp', 'timestamp', { unique: false });
        resultsStore.createIndex('synced', 'synced', { unique: false });
        console.log('✅ Quiz results object store created');
      }

      console.log('✅ Quiz IndexedDB schema upgraded');
    };
  });
};

/**
 * Download quiz for offline access
 */
export const downloadQuizForOffline = async (quizData, onProgress, onComplete, onError, userResult = null) => {
  try {
    const db = await getQuizDatabase();

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      throw new Error('Quiz object store not found');
    }

    // Simulate progress for UI feedback
    if (onProgress) onProgress(30);

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Store complete quiz details for offline use
    const offlineQuiz = {
      id: quizData._id || quizData.id,
      name: quizData.name,
      description: quizData.description,
      duration: quizData.duration,
      category: quizData.category,
      subject: quizData.subject || quizData.category,
      topic: quizData.topic,
      level: quizData.level,
      class: quizData.class,
      totalMarks: quizData.totalMarks,
      passingMarks: quizData.passingMarks,
      passingPercentage: quizData.passingPercentage || quizData.passingMarks,
      difficulty: quizData.difficulty || quizData.difficultyLevel || 'medium',
      difficultyLevel: quizData.difficultyLevel,
      questions: quizData.questions || [],
      totalQuestions: (quizData.questions || []).length,
      createdBy: quizData.createdBy,
      createdAt: quizData.createdAt,
      updatedAt: quizData.updatedAt,
      downloadedAt: new Date().toISOString(),
      size: JSON.stringify(quizData).length,
      // Store user result (pass/fail/not attempted) for offline display
      userResult: userResult || null,
      // Store all original data for complete offline functionality
      originalData: quizData
    };

    if (onProgress) onProgress(60);

    await new Promise((resolve, reject) => {
      const request = store.put(offlineQuiz);
      request.onsuccess = () => {
        console.log('✅ Quiz stored for offline:', quizData.name);
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Failed to store quiz:', request.error);
        reject(request.error);
      };
    });

    if (onProgress) onProgress(100);
    if (onComplete) onComplete();

    return true;
  } catch (error) {
    console.error('❌ Error downloading quiz:', error);
    if (onError) onError(error.message);
    throw error;
  }
};

/**
 * Get offline quiz by ID
 */
export const getOfflineQuiz = async (quizId) => {
  try {
    const db = await getQuizDatabase();

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      return null;
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(quizId);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        console.error('❌ Failed to get quiz:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('❌ Error getting offline quiz:', error);
    return null;
  }
};

/**
 * Check if quiz is downloaded
 */
export const isQuizDownloaded = async (quizId) => {
  try {
    const quiz = await getOfflineQuiz(quizId);
    return quiz !== null;
  } catch (error) {
    console.error('❌ Error checking quiz:', error);
    return false;
  }
};

/**
 * Delete offline quiz
 */
export const deleteOfflineQuiz = async (quizId) => {
  try {
    const db = await getQuizDatabase();

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      return false;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.delete(quizId);
      request.onsuccess = () => {
        console.log('✅ Quiz deleted from offline storage');
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Failed to delete quiz:', request.error);
        reject(request.error);
      };
    });

    return true;
  } catch (error) {
    console.error('❌ Error deleting quiz:', error);
    return false;
  }
};

/**
 * Get all downloaded quizzes
 */
export const getAllOfflineQuizzes = async () => {
  try {
    const db = await getQuizDatabase();

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      return [];
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        console.error('❌ Failed to get all quizzes:', request.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('❌ Error getting all quizzes:', error);
    return [];
  }
};

/**
 * Get storage info for quizzes
 */
export const getQuizStorageInfo = async () => {
  try {
    const quizzes = await getAllOfflineQuizzes();
    const totalSize = quizzes.reduce((sum, quiz) => sum + (quiz.size || 0), 0);

    return {
      totalQuizzes: quizzes.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      quizzes: quizzes.map(q => ({
        id: q.id,
        name: q.name,
        subject: q.subject,
        downloadedAt: q.downloadedAt,
        size: q.size
      }))
    };
  } catch (error) {
    console.error('❌ Error getting storage info:', error);
    return {
      totalQuizzes: 0,
      totalSize: 0,
      totalSizeMB: '0',
      quizzes: []
    };
  }
};

/**
 * Clear all offline quizzes
 */
export const clearAllOfflineQuizzes = async () => {
  try {
    const db = await getQuizDatabase();

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      return true;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        console.log('✅ All quizzes cleared');
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Failed to clear quizzes:', request.error);
        reject(request.error);
      };
    });

    return true;
  } catch (error) {
    console.error('❌ Error clearing quizzes:', error);
    return false;
  }
};

/**
 * Mark quiz offline (calculate results without server)
 */
export const markQuizOffline = async (quizId, questions, answers, userId, startTime) => {
  try {
    console.log('📝 Marking quiz offline...');
    console.log('📊 Questions:', questions.length);
    console.log('📊 Answers:', answers);

    const endTime = new Date();
    const timeTaken = Math.floor((endTime - startTime) / 1000);

    let correctAnswers = 0;
    const resultDetails = questions.map((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;
      let actualCorrectAnswer = '';

      // Determine the correct answer based on question type
      const questionType = question.type || question.answerType || 'mcq';

      console.log(`\n📝 Question ${index + 1}:`, {
        name: question.name,
        type: questionType,
        correctOption: question.correctOption,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer
      });

      if (questionType.toLowerCase() === 'mcq' ||
          questionType.toLowerCase() === 'multiple-choice' ||
          questionType.toLowerCase() === 'multiplechoice' ||
          questionType.toLowerCase() === 'options') {
        // For MCQ questions, handle both letter-based and text-based answers
        // The user answer is stored as the full option text (e.g., "Paris")
        // The correct answer might be stored as a letter (e.g., "B") or as text

        if (question.options && typeof question.options === 'object') {
          // If correctAnswer is a key (like "B"), get the actual text
          if (question.correctAnswer && question.options[question.correctAnswer]) {
            actualCorrectAnswer = question.options[question.correctAnswer];
            isCorrect = userAnswer === actualCorrectAnswer;
            console.log(`   MCQ (letter->text): correctAnswer="${question.correctAnswer}" -> "${actualCorrectAnswer}"`);
          }
          // If correctOption is available, use it
          else if (question.correctOption && question.options[question.correctOption]) {
            actualCorrectAnswer = question.options[question.correctOption];
            isCorrect = userAnswer === actualCorrectAnswer;
            console.log(`   MCQ (letter->text): correctOption="${question.correctOption}" -> "${actualCorrectAnswer}"`);
          }
          // If correctAnswer is already the full text
          else if (question.correctAnswer) {
            actualCorrectAnswer = question.correctAnswer;
            isCorrect = userAnswer === actualCorrectAnswer;
            console.log(`   MCQ (direct text): correctAnswer="${actualCorrectAnswer}"`);
          }
          // Fallback to correctOption as text
          else if (question.correctOption) {
            actualCorrectAnswer = question.correctOption;
            isCorrect = userAnswer === actualCorrectAnswer;
            console.log(`   MCQ (direct text): correctOption="${actualCorrectAnswer}"`);
          }
        } else {
          // Fallback for other option formats
          actualCorrectAnswer = question.correctOption || question.correctAnswer;
          isCorrect = String(userAnswer || '').trim() === String(actualCorrectAnswer || '').trim();
          console.log(`   MCQ (fallback): "${userAnswer}" === "${actualCorrectAnswer}"`);
        }

        console.log(`   MCQ Result: userAnswer="${userAnswer}" vs actualCorrectAnswer="${actualCorrectAnswer}" = ${isCorrect}`);
      } else if (questionType.toLowerCase() === 'fill' ||
                 questionType.toLowerCase() === 'fill-in-the-blank' ||
                 questionType.toLowerCase() === 'fillblank' ||
                 questionType.toLowerCase() === 'fill in the blank' ||
                 questionType.toLowerCase() === 'text' ||
                 questionType.toLowerCase() === 'free text') {
        actualCorrectAnswer = question.correctAnswer || question.answer;
        const userAnswerNormalized = String(userAnswer || '').trim().toLowerCase();
        const correctAnswerNormalized = String(actualCorrectAnswer || '').trim().toLowerCase();
        isCorrect = userAnswerNormalized === correctAnswerNormalized;

        console.log(`   Fill Comparison: "${userAnswerNormalized}" === "${correctAnswerNormalized}" = ${isCorrect}`);
      } else if (questionType.toLowerCase() === 'image' ||
                 questionType.toLowerCase() === 'diagram') {
        actualCorrectAnswer = question.correctOption || question.correctAnswer;

        const normalizedUserAnswer = String(userAnswer || '').trim();
        const normalizedCorrectAnswer = String(actualCorrectAnswer || '').trim();

        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

        console.log(`   Image Comparison: "${normalizedUserAnswer}" === "${normalizedCorrectAnswer}" = ${isCorrect}`);
      }

      if (isCorrect) {
        correctAnswers++;
      }

      // Return complete result details matching the format expected by QuizResult component
      return {
        questionId: question._id || question.id || `q_${index}`,
        questionText: question.name || question.question || `Question ${index + 1}`,
        questionName: question.name || question.question || `Question ${index + 1}`,
        question: question.name || question.question,
        questionType: questionType,
        userAnswer: userAnswer || '',
        correctAnswer: actualCorrectAnswer,
        isCorrect: isCorrect,
        // Include additional fields for proper display
        options: question.options || null,
        image: question.image || question.imageUrl || null,
        imageUrl: question.imageUrl || question.image || null,
        questionImage: question.image || question.imageUrl || null
      };
    });

    console.log(`\n✅ Marking complete: ${correctAnswers}/${questions.length} correct`);

    const percentage = Math.round((correctAnswers / questions.length) * 100);

    // Get quiz data to determine passing marks
    const quiz = await getOfflineQuiz(quizId);
    const passingPercentage = (quiz && (quiz.passingMarks || quiz.passingPercentage)) || 60;
    const verdict = percentage >= passingPercentage ? 'Pass' : 'Fail';

    const result = {
      quizId: quizId,
      userId: userId,
      correctAnswers,
      wrongAnswers: questions.length - correctAnswers,
      percentage,
      score: percentage,
      verdict: verdict,
      timeTaken,
      timeSpent: timeTaken,
      points: correctAnswers * 10,
      totalQuestions: questions.length,
      resultDetails: resultDetails,
      timestamp: new Date().toISOString(),
      synced: false, // Mark as not synced to server
      offlineMarked: true
    };

    // Save result to IndexedDB
    await saveOfflineQuizResult(result);

    console.log('✅ Quiz marked offline successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error marking quiz offline:', error);
    throw error;
  }
};

/**
 * Save quiz result to offline storage
 */
export const saveOfflineQuizResult = async (result) => {
  try {
    const db = await getQuizDatabase();

    if (!db.objectStoreNames.contains(RESULTS_STORE_NAME)) {
      console.warn('⚠️ Results store not available');
      return false;
    }

    const transaction = db.transaction([RESULTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(RESULTS_STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.add(result);
      request.onsuccess = () => {
        console.log('✅ Quiz result saved offline');
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Failed to save result:', request.error);
        reject(request.error);
      };
    });

    return true;
  } catch (error) {
    console.error('❌ Error saving offline result:', error);
    return false;
  }
};

/**
 * Get unsynced quiz results
 */
export const getUnsyncedQuizResults = async () => {
  try {
    const db = await getQuizDatabase();

    if (!db.objectStoreNames.contains(RESULTS_STORE_NAME)) {
      return [];
    }

    const transaction = db.transaction([RESULTS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(RESULTS_STORE_NAME);
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        console.error('❌ Failed to get unsynced results:', request.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('❌ Error getting unsynced results:', error);
    return [];
  }
};

/**
 * Mark quiz result as synced
 */
export const markResultAsSynced = async (resultId) => {
  try {
    const db = await getQuizDatabase();

    if (!db.objectStoreNames.contains(RESULTS_STORE_NAME)) {
      return false;
    }

    const transaction = db.transaction([RESULTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(RESULTS_STORE_NAME);

    const result = await new Promise((resolve, reject) => {
      const request = store.get(resultId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (result) {
      result.synced = true;
      result.syncedAt = new Date().toISOString();

      await new Promise((resolve, reject) => {
        const request = store.put(result);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('✅ Result marked as synced');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error marking result as synced:', error);
    return false;
  }
};

/**
 * Initialize quiz database on module load
 */
if (typeof window !== 'undefined') {
  setTimeout(() => {
    getQuizDatabase().catch(error => {
      console.error('Failed to initialize quiz database:', error);
    });
  }, 500);
}

