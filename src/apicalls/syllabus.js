import axiosInstance from "./index";

// Upload syllabus PDF
export const uploadSyllabus = async (formData) => {
  try {
    const response = await axiosInstance.post("/api/syllabus/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000, // 5 minutes timeout for file upload
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get all syllabuses
export const getAllSyllabuses = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const response = await axiosInstance.get(`/api/syllabus?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get syllabus by ID
export const getSyllabusById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/syllabus/${id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Update syllabus
export const updateSyllabus = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/api/syllabus/${id}`, data);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Delete syllabus
export const deleteSyllabus = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/syllabus/${id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get available subjects for a level
export const getAvailableSubjects = async (level, className = null) => {
  try {
    const queryParams = className ? `?class=${className}` : '';
    const response = await axiosInstance.get(`/api/syllabus/subjects/${level}${queryParams}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get syllabus content for AI generation
export const getSyllabusForAI = async (level, className, subject) => {
  try {
    const response = await axiosInstance.get(`/api/syllabus/ai-content/${level}/${className}/${subject}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Approve syllabus
export const approveSyllabus = async (id, approvalData) => {
  try {
    const response = await axiosInstance.put(`/api/syllabus/${id}`, {
      ...approvalData,
      approvalDate: new Date(),
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get syllabus statistics
export const getSyllabusStats = async () => {
  try {
    const response = await axiosInstance.get("/api/syllabus/stats");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Reprocess syllabus (re-extract content)
export const reprocessSyllabus = async (id) => {
  try {
    const response = await axiosInstance.post(`/api/syllabus/${id}/reprocess`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Download syllabus file
export const downloadSyllabus = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/syllabus/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Search syllabuses
export const searchSyllabuses = async (searchTerm, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('search', searchTerm);
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const response = await axiosInstance.get(`/api/syllabus/search?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get syllabus versions
export const getSyllabusVersions = async (level, className, subject) => {
  try {
    const response = await axiosInstance.get(`/api/syllabus/versions/${level}/${className}/${subject}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Validate syllabus content
export const validateSyllabusContent = async (id) => {
  try {
    const response = await axiosInstance.post(`/api/syllabus/${id}/validate`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get syllabus usage analytics
export const getSyllabusUsageAnalytics = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/syllabus/${id}/analytics`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Bulk upload syllabuses
export const bulkUploadSyllabuses = async (files, metadata) => {
  try {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files`, file);
      formData.append(`metadata_${index}`, JSON.stringify(metadata[index]));
    });
    
    const response = await axiosInstance.post("/api/syllabus/bulk-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 600000, // 10 minutes timeout for bulk upload
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Export syllabus data
export const exportSyllabusData = async (format = 'json', filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const response = await axiosInstance.get(`/api/syllabus/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response;
  } catch (error) {
    return error.response;
  }
};

// Get syllabus processing status
export const getSyllabusProcessingStatus = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/syllabus/${id}/status`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Update syllabus tags
export const updateSyllabusTags = async (id, tags) => {
  try {
    const response = await axiosInstance.put(`/api/syllabus/${id}/tags`, { tags });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get popular syllabus topics
export const getPopularSyllabusTopics = async (level, subject = null) => {
  try {
    const queryParams = subject ? `?subject=${subject}` : '';
    const response = await axiosInstance.get(`/api/syllabus/popular-topics/${level}${queryParams}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get syllabuses for AI question generation selection
export const getSyllabusesForAI = async (level = null, subject = null, className = null) => {
  try {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (subject) queryParams.append('subject', subject);
    if (className) queryParams.append('class', className);
    queryParams.append('isActive', 'true');

    const response = await axiosInstance.get(`/api/syllabus?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
