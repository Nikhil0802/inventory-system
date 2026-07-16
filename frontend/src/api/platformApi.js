import axios from 'axios';

// Deliberately separate from api.js — distinct axios instance, distinct
// localStorage keys, distinct refresh flow. A customer session and a
// platform-admin session must never collide in the same browser.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://20.235.170.248/api';

const platformApi = axios.create({
  baseURL: API_BASE_URL,
});

platformApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('platformAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

platformApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint = originalRequest.url?.includes('/platform-auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return platformApi(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('platformRefreshToken');
        if (!storedRefreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_BASE_URL}/platform-auth/refresh-token`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('platformAccessToken', accessToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return platformApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('platformAccessToken');
        localStorage.removeItem('platformRefreshToken');
        localStorage.removeItem('platformAdmin');
        window.location.href = '/platform/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const platformAuthAPI = {
  login: (data) => platformApi.post('/platform-auth/login', data),
  logout: () => platformApi.post('/platform-auth/logout'),
};

export const platformAPI = {
  getOrganizations: (params) => platformApi.get('/platform/organizations', { params }),
  getOrganization: (id) => platformApi.get(`/platform/organizations/${id}`),
  suspend: (id, reason) => platformApi.put(`/platform/organizations/${id}/suspend`, { reason }),
  unsuspend: (id) => platformApi.put(`/platform/organizations/${id}/unsuspend`),
  updatePlanTier: (id, planTier) => platformApi.put(`/platform/organizations/${id}/plan`, { planTier }),
  updateLicense: (id, data) => platformApi.put(`/platform/organizations/${id}/license`, data),
  // Testing-only account management — see platformController.js
  deleteOrganization: (id) => platformApi.delete(`/platform/organizations/${id}`),
  deleteMember: (orgId, userId) => platformApi.delete(`/platform/organizations/${orgId}/members/${userId}`),
  resetMemberPassword: (orgId, userId) => platformApi.put(`/platform/organizations/${orgId}/members/${userId}/reset-password`),
};

export default platformApi;
