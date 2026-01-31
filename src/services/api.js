import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
};

export const applicationsAPI = {
  getAll: () => api.get('/applications'),
  create: (data) => api.post('/applications', data),
  updateStatus: (id, status, reviewComment) =>
    api.put(`/applications/${id}/status`, { status, reviewComment }),
};

export const newsAPI = {
  getAll: () => api.get('/news'),
  create: (data) => api.post('/news', data),
  delete: (id) => api.delete(`/news/${id}`),
};

export const messagesAPI = {
  getConversation: (id) => api.get(`/messages/${id}`),
  send: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations/all'),
};

export const statisticsAPI = {
  getDashboard: () => api.get('/statistics/dashboard'),
  getUserStats: (id) => api.get(`/statistics/user/${id}`),
};

export default api;
