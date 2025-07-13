const { default: axiosInstance } = require(".");

// add report
export const addReport = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/reports/add-report", payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// get all reports
export const getAllReports = async (filters) => {
    try {
        const response = await axiosInstance.post("/api/reports/get-all-reports", filters);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// get all reports by user
export const getAllReportsByUser = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/reports/get-all-reports-by-user", payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// get all reports for ranking (legacy)
export const getAllReportsForRanking = async (filters) => {
    try {
        const response = await axiosInstance.get("/api/reports/get-all-reports-for-ranking");
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// Enhanced XP-based ranking endpoints
export const getEnhancedLeaderboard = async (level = 'all', limit = 1000) => {
    try {
        const response = await axiosInstance.get(`/api/quiz/enhanced-leaderboard?level=${level}&limit=${limit}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const getXPLeaderboard = async (options = {}) => {
    try {
        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.classFilter) params.append('classFilter', options.classFilter);
        if (options.levelFilter) params.append('levelFilter', options.levelFilter);
        if (options.seasonFilter) params.append('seasonFilter', options.seasonFilter);
        if (options.includeInactive) params.append('includeInactive', options.includeInactive);

        const response = await axiosInstance.get(`/api/quiz/xp-leaderboard?${params.toString()}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const getUserRanking = async (userId, context = 5) => {
    try {
        const response = await axiosInstance.get(`/api/quiz/user-ranking/${userId}?context=${context}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const getClassRankings = async (className, limit = 50) => {
    try {
        const response = await axiosInstance.get(`/api/quiz/class-rankings/${className}?limit=${limit}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// XP Dashboard endpoints
export const getXPDashboard = async () => {
    try {
        const response = await axiosInstance.get("/api/xp-dashboard/dashboard");
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const getClassLeaderboard = async () => {
    try {
        const response = await axiosInstance.get("/api/xp-dashboard/class-leaderboard");
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}
