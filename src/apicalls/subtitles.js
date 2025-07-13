const { default: axiosInstance } = require(".");

// Generate subtitles for a video
export const generateSubtitles = async (videoId, language = 'en') => {
  try {
    const response = await axiosInstance.post(`/api/study/generate-subtitles/${videoId}`, {
      language
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Upload custom subtitle file
export const uploadSubtitle = async (videoId, formData) => {
  try {
    const response = await axiosInstance.post(`/api/study/upload-subtitle/${videoId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get video with subtitle information
export const getVideoWithSubtitles = async (videoId) => {
  try {
    const response = await axiosInstance.get(`/api/study/video/${videoId}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Delete subtitle
export const deleteSubtitle = async (videoId, language) => {
  try {
    const response = await axiosInstance.delete(`/api/study/subtitle/${videoId}/${language}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get all videos with subtitle status
export const getVideosWithSubtitleStatus = async () => {
  try {
    const response = await axiosInstance.get('/api/study/videos-subtitle-status');
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
