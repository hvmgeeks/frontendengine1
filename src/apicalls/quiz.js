import axiosInstance from "./index";

// Get all quizzes (using exams endpoint)
export const getAllQuizzes = async () => {
  try {
    const response = await axiosInstance.post("/api/exams/get-all-exams");
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Get quiz by ID (using exam endpoint)
export const getQuizById = async (quizId) => {
  try {
    const response = await axiosInstance.post("/api/exams/get-exam-by-id", {
      examId: quizId
    });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Submit quiz result (using reports endpoint)
export const submitQuizResult = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/reports/add-report", payload);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Get user results (using reports endpoint)
export const getUserResults = async () => {
  try {
    const response = await axiosInstance.post("/api/reports/get-all-reports");
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Get specific quiz result for a user
export const getQuizResult = async (examId) => {
  try {
    const response = await axiosInstance.post("/api/reports/get-all-reports");
    if (response.data.success) {
      // Find the latest result for this specific exam
      const reports = response.data.data || [];
      const quizResult = reports
        .filter(report => {
          // Handle different possible exam ID structures
          const reportExamId = report.exam?._id || report.exam?.id || report.examId || report.exam;
          return reportExamId === examId;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      if (quizResult) {
        return {
          success: true,
          data: {
            ...quizResult.result,
            correctAnswers: quizResult.result?.correctAnswers || [],
            wrongAnswers: quizResult.result?.wrongAnswers || [],
            verdict: quizResult.result?.verdict,
            percentage: quizResult.result?.percentage || quizResult.result?.score,
            points: quizResult.result?.points || quizResult.result?.xpGained,
            timeSpent: quizResult.result?.timeSpent,
            totalTimeAllowed: quizResult.result?.totalTimeAllowed,
            xpData: quizResult.result?.xpData
          }
        };
      } else {
        return {
          success: false,
          message: "No result found for this quiz"
        };
      }
    }
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Get quiz analytics
export const getQuizAnalytics = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/enhanced-quiz/analytics/${userId}`);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Get leaderboard
export const getLeaderboard = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams(options).toString();
    const response = await axiosInstance.get(`/api/enhanced-quiz/xp-leaderboard?${queryParams}`);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Enhanced quiz scoring
export const calculateEnhancedScore = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/enhanced-quiz/calculate-enhanced-score", payload);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};
