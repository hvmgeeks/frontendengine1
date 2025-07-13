import axiosInstance from "./index";

// Public API calls (no authentication required)

// Get all skills with filtering
export const getAllSkills = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/skills", { params });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get skill by ID
export const getSkillById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/skills/${id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get skills by level
export const getSkillsByLevel = async (level, limit = 20) => {
  try {
    const response = await axiosInstance.get(`/api/skills/level/${level}`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get featured skills
export const getFeaturedSkills = async (limit = 10) => {
  try {
    const response = await axiosInstance.get("/api/skills/featured/list", {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Search skills
export const searchSkills = async (query, filters = {}) => {
  try {
    const response = await axiosInstance.post("/api/skills/search", {
      query,
      filters
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Authenticated API calls

// Mark skill as completed
export const markSkillCompleted = async (id) => {
  try {
    const response = await axiosInstance.post(`/api/skills/${id}/complete`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Admin API calls

// Create new skill
export const createSkill = async (skillData) => {
  try {
    const response = await axiosInstance.post("/api/skills/admin/create", skillData);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Update skill
export const updateSkill = async (id, skillData) => {
  try {
    const response = await axiosInstance.put(`/api/skills/admin/${id}`, skillData);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Delete skill
export const deleteSkill = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/skills/admin/${id}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get all skills for admin (includes inactive)
export const getAllSkillsAdmin = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/api/skills/admin/all", { params });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
