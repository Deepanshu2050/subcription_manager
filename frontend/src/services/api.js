import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect if it's a login attempt that failed
        if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Expense API
export const expenseAPI = {
    getAll: (params) => api.get('/expenses', { params }),
    getOne: (id) => api.get(`/expenses/${id}`),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
    getSummary: (period) => api.get(`/expenses/summary/${period}`),
    exportCSV: (params) => api.get('/expenses/export/csv', {
        params,
        responseType: 'blob',
    }),
};

// Subscription API
export const subscriptionAPI = {
    getAll: (params) => api.get('/subscriptions', { params }),
    getOne: (id) => api.get(`/subscriptions/${id}`),
    create: (data) => api.post('/subscriptions', data),
    update: (id, data) => api.put(`/subscriptions/${id}`, data),
    delete: (id) => api.delete(`/subscriptions/${id}`),
    getUpcoming: (days) => api.get(`/subscriptions/upcoming/${days}`),
    getCostAnalysis: () => api.get('/subscriptions/analysis/cost'),
    renew: (id) => api.post(`/subscriptions/${id}/renew`),
};

// Budget API
export const budgetAPI = {
    getAll: (params) => api.get('/budgets', { params }),
    getOne: (id) => api.get(`/budgets/${id}`),
    create: (data) => api.post('/budgets', data),
    update: (id, data) => api.put(`/budgets/${id}`, data),
    delete: (id) => api.delete(`/budgets/${id}`),
    getCurrentStatus: () => api.get('/budgets/current/status'),
    checkAlerts: () => api.get('/budgets/check-alerts'),
};

export default api;
