import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bug 7 fix: if any request gets a 401 (expired/invalid token), clear storage and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const itemAPI = {
  getAll: () => api.get('/items'),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  getByBarcode: (barcode) => api.get(`/items/barcode/search?barcode=${barcode}`),
};

export const transactionAPI = {
  create: (data) => api.post('/transactions', data),
  getAll: () => api.get('/transactions'),
  getByItem: (itemId) => api.get(`/transactions/item/${itemId}`),
};

export const profitAPI = {
  getToday: () => api.get('/profit/today'),
  getMonth: (year, month) => api.get(`/profit/month/${year}/${month}`),
  getItems: () => api.get('/profit/items'),
  getComparison: (period) => api.get(`/profit/comparison/${period}`),
};

export const expenseAPI = {
  // Categories
  getCategories: () => api.get('/expenses/categories'),
  createCategory: (data) => api.post('/expenses/categories', data),
  updateCategory: (id, data) => api.put(`/expenses/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/expenses/categories/${id}`),
  // Expenses
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  // Analytics
  getMonthlySummary: (year, month) => api.get(`/expenses/summary/${year}/${month}`),
  getNetProfit: (year, month) => api.get(`/expenses/netprofit/${year}/${month}`),
};

export default api;
