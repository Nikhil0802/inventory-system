import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://20.235.170.248/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: try to refresh the access token once, then retry the original request.
// If refresh also fails, clear storage and redirect to login.
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  forceChangePassword: (data) => api.post('/auth/force-change-password', data),
  acceptInvite: (data) => api.post('/auth/accept-invite', data),
};

export const teamAPI = {
  getTeam: () => api.get('/team'),
  invite: (data) => api.post('/team/invite', data),
  changeRole: (userId, role) => api.put(`/team/${userId}/role`, { role }),
  removeMember: (userId) => api.delete(`/team/${userId}`),
  cancelInvite: (inviteId) => api.delete(`/team/invites/${inviteId}`),
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
  getTrend: (months) => api.get('/expenses/trend', { params: { months } }),
  // Recurring
  getPendingRecurring: () => api.get('/expenses/recurring/pending'),
  confirmRecurring: (data) => api.post('/expenses/recurring/confirm', data),
};

export default api;
