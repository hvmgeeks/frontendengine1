const { default: axiosInstance } = require(".");

export const getAnnouncements = async () => {
  try {
    const { data } = await axiosInstance.get("/api/announcements");
    return data;
  } catch (err) {
    return err.response?.data || { success: false, error: err.message };
  }
};

export const addAnnouncement = async (payload) => {
  try {
    const { data } = await axiosInstance.post("/api/announcements", payload);
    return data;
  } catch (err) {
    return err.response?.data || { success: false, error: err.message };
  }
};

export const updateAnnouncement = async (id, payload) => {
  try {
    const { data } = await axiosInstance.put(`/api/announcements/${id}`, payload);
    return data;
  } catch (err) {
    return err.response?.data || { success: false, error: err.message };
  }
};

export const deleteAnnouncement = async (id) => {
  try {
    const { data } = await axiosInstance.delete(`/api/announcements/${id}`);
    return data;
  } catch (err) {
    return err.response?.data || { success: false, error: err.message };
  }
};
