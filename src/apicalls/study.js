const { default: axiosInstance } = require(".");

// get study materials
export const getStudyMaterial = async (filters) => {
    try {
        const response = await axiosInstance.post("/api/study/get-study-content" , filters);
        return response;
    } catch (error) {
        return error.response;
    }
}

// get available classes for user's level
export const getAvailableClasses = async () => {
    try {
        const response = await axiosInstance.post("/api/study/get-available-classes");
        return response;
    } catch (error) {
        return error.response;
    }
}

// get all videos for admin management
export const getAllVideos = async () => {
    try {
        const response = await axiosInstance.get("/api/study/videos-subtitle-status");
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: "Failed to fetch videos" };
    }
}

// Add study material functions

// Add video (supports both JSON data and FormData)
export const addVideo = async (videoData, onUploadProgress = null) => {
    try {
        const isFormData = videoData instanceof FormData;
        const config = isFormData ? {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 600000, // 10 minutes timeout for large files
            onUploadProgress: onUploadProgress ? (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                // Pass additional information for better progress tracking
                onUploadProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
            } : undefined,
        } : {
            timeout: 60000, // 1 minute for YouTube videos
        };

        const response = await axiosInstance.post("/api/study/add-video", videoData, config);
        return response;
    } catch (error) {
        return error.response;
    }
}

// Add note
export const addNote = async (formData) => {
    try {
        const response = await axiosInstance.post("/api/study/add-note", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        return error.response;
    }
}

// Add past paper
export const addPastPaper = async (formData) => {
    try {
        const response = await axiosInstance.post("/api/study/add-past-paper", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        return error.response;
    }
}

// Add book
export const addBook = async (formData) => {
    try {
        const response = await axiosInstance.post("/api/study/add-book", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        return error.response;
    }
}

// Update study material functions

// Update video
export const updateVideo = async (id, videoData) => {
    try {
        let config = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // If videoData is FormData (contains file uploads), change content type
        if (videoData instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }

        const response = await axiosInstance.put(`/api/study/update-video/${id}`, videoData, config);
        return response;
    } catch (error) {
        return error.response;
    }
}

// Update note
export const updateNote = async (id, formData) => {
    try {
        const response = await axiosInstance.put(`/api/study/update-note/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        return error.response;
    }
}

// Update past paper
export const updatePastPaper = async (id, formData) => {
    try {
        const response = await axiosInstance.put(`/api/study/update-past-paper/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        return error.response;
    }
}

// Update book
export const updateBook = async (id, formData) => {
    try {
        const response = await axiosInstance.put(`/api/study/update-book/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        return error.response;
    }
}

// Delete study material functions

// Delete video
export const deleteVideo = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/study/delete-video/${id}`);
        return response;
    } catch (error) {
        return error.response;
    }
}

// Delete note
export const deleteNote = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/study/delete-note/${id}`);
        return response;
    } catch (error) {
        return error.response;
    }
}

// Delete past paper
export const deletePastPaper = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/study/delete-past-paper/${id}`);
        return response;
    } catch (error) {
        return error.response;
    }
}

// Delete book
export const deleteBook = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/study/delete-book/${id}`);
        return response;
    } catch (error) {
        return error.response;
    }
}

// Get all study materials for admin management
export const getAllStudyMaterials = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.materialType) params.append('materialType', filters.materialType);
        if (filters.level) params.append('level', filters.level);
        if (filters.className) params.append('className', filters.className);
        if (filters.subject) params.append('subject', filters.subject);

        const response = await axiosInstance.get(`/api/study/admin/all-materials?${params.toString()}`);
        return response;
    } catch (error) {
        return error.response;
    }
}
