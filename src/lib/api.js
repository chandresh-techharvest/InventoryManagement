import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true // Send cookies with requests
});

// No need for request interceptor - cookies are sent automatically

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 errors are handled by ProtectedRoute
        return Promise.reject(error);
    }
);

export default api;
