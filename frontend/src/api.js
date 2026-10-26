// src/api.js
import axios from "axios";


const isProd = import.meta.env.PROD;
const baseURL = import.meta.env.VITE_API_URL || (isProd ? "": "http://localhost:5000");
if(isProd && !baseURL.startsWith("https://")){
  throw new Error("Production API must use HTTPS");
}
const api = axios.create({
  baseURL: `${baseURL}/api`,  // Backend API base URL with /api prefix
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    window.dispatchEvent(new Event("app:request-start"));
    try {
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      const token = sessionStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error accessing localStorage in request interceptor:', error);
    }
    return config;
  },
  (error) => {
    window.dispatchEvent(new Event("app:request-end"));
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle authentication errors globally
api.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new Event("app:request-end"));
    return response;
  },
  (error) => {
    window.dispatchEvent(new Event("app:request-end"));
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your connection.',
        isNetworkError: true
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      try {
        sessionStorage.removeItem("token");
       sessionStorage.removeItem("user");
        console.log("Authentication failed - token cleared");
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

// ----------------------
// Club Fetch API
// ----------------------
export const fetchClubs = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/clubs?${params}`);
  return res.data;
};

// ----------------------
// Join Club API
// ----------------------
export const joinClub = async (clubId) => {
  const res = await api.post(`/clubs/${clubId}/join`);
  return res.data;
};

export default api;
