import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

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

export default api;
