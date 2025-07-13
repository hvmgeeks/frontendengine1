import axiosInstance from "./index";

// Generate questions using AI
export const generateQuestions = async (payload) => {
  try {
    console.log("🔗 Making API call to generate questions...");
    const response = await axiosInstance.post("/api/ai-questions/generate-questions", payload, {
      timeout: 600000, // 10 minutes timeout specifically for AI generation
    });
    console.log("✅ API call successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API call failed:", error);

    if (error.response) {
      console.error("📊 Error response:", error.response.data);
      return error.response.data;
    } else if (error.request) {
      console.error("📡 Network error:", error.request);
      return { success: false, message: "Network error - please check your connection" };
    } else {
      console.error("⚠️ Request setup error:", error.message);
      return { success: false, message: error.message };
    }
  }
};

// Get generation history
export const getGenerationHistory = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/ai-questions/generation-history", { params });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get specific generation details
export const getGenerationDetails = async (generationId) => {
  try {
    const response = await axiosInstance.get(`/api/ai-questions/generation/${generationId}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Approve generated questions
export const approveQuestions = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/ai-questions/approve-questions", payload);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Preview generated questions
export const previewQuestions = async (generationId) => {
  try {
    const response = await axiosInstance.get(`/api/ai-questions/preview/${generationId}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Delete a specific generated question
export const deleteGeneratedQuestion = async (generationId, questionIndex) => {
  try {
    const response = await axiosInstance.delete(`/api/ai-questions/delete-question/${generationId}/${questionIndex}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Delete entire generation
export const deleteGeneration = async (generationId) => {
  try {
    const response = await axiosInstance.delete(`/api/ai-questions/delete-generation/${generationId}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get available subjects for a level (now uses syllabus-based subjects)
export const getSubjectsForLevel = async (level, className = null) => {
  try {
    console.log(`🔍 Fetching subjects for level: ${level}, class: ${className}`);

    // First try to get subjects from uploaded syllabuses
    const queryParams = className ? `?class=${className}` : '';
    console.log(`📚 Trying syllabus endpoint: /api/syllabus/subjects/${level}${queryParams}`);

    const syllabusResponse = await axiosInstance.get(`/api/syllabus/subjects/${level}${queryParams}`);
    console.log('📚 Syllabus response:', syllabusResponse.data);

    if (syllabusResponse.data.success && syllabusResponse.data.data.length > 0) {
      console.log(`✅ Using syllabus-based subjects for ${level}:`, syllabusResponse.data.data);
      return syllabusResponse.data;
    }

    // Fallback to hardcoded subjects if no syllabuses found
    console.log(`📖 No syllabus subjects found, falling back to hardcoded subjects for ${level}`);
    const fallbackResponse = await axiosInstance.get(`/api/ai-questions/subjects/${level}`);
    console.log('📖 Fallback response:', fallbackResponse.data);
    return fallbackResponse.data;
  } catch (error) {
    console.error('❌ Error fetching subjects:', error);
    console.error('Error details:', error.response?.data);

    // Try fallback on error
    try {
      console.log(`🔄 Trying fallback due to error...`);
      const fallbackResponse = await axiosInstance.get(`/api/ai-questions/subjects/${level}`);
      console.log('🔄 Fallback response:', fallbackResponse.data);
      return fallbackResponse.data;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      return { success: false, message: 'Failed to fetch subjects', data: [] };
    }
  }
};

// Get Tanzania syllabus topics for level, class, and subject
export const getSyllabusTopics = async (level, className, subject) => {
  try {
    // First try to get topics from uploaded syllabuses
    const syllabusResponse = await axiosInstance.get(`/api/syllabus/ai-content/${level}/${className}/${subject}`);

    if (syllabusResponse.data.success) {
      console.log(`📚 Using syllabus-based topics for ${level} Class ${className} ${subject}`);
      // Convert syllabus format to expected format
      const topics = Object.keys(syllabusResponse.data.data.topics || {}).map(topicName => ({
        topicName,
        subtopics: syllabusResponse.data.data.topics[topicName].subtopics || [],
        difficulty: syllabusResponse.data.data.topics[topicName].difficulty || 'medium'
      }));

      return {
        success: true,
        data: {
          level,
          class: className,
          subject,
          topics
        }
      };
    }

    // Fallback to hardcoded topics if no syllabus found
    console.log(`📖 Falling back to hardcoded topics for ${level} Class ${className} ${subject}`);
    const fallbackResponse = await axiosInstance.get(`/api/ai-questions/syllabus-topics/${level}/${className}/${subject}`);
    return fallbackResponse.data;
  } catch (error) {
    console.error('Error fetching syllabus topics:', error);
    return error.response?.data || { success: false, message: 'Failed to fetch topics' };
  }
};

// Generate exam name
export const generateExamName = async (level, className, subjects) => {
  try {
    const response = await axiosInstance.post("/api/ai-questions/generate-exam-name", {
      level,
      className,
      subjects
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
