import axios from 'axios';

/**
 * Central Axios instance for all API calls.
 *
 * - baseURL: '' so that service paths like '/api/auth/login' are used verbatim
 *   and Vite's proxy (/api → http://localhost:5000) handles routing in dev.
 *   In production set VITE_API_BASE_URL to the full server origin if needed.
 * - withCredentials: true → sends httpOnly cookie on every request
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — unwrap the data envelope for convenience
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error messages for the UI
    const message =
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
