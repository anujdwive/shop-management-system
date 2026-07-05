import api from './api';

export const meetingService = {
  create: (data) => api.post('/api/meetings', data),
  getAll: (params) => api.get('/api/meetings', { params }),
  getById: (id) => api.get(`/api/meetings/${id}`),
  update: (id, data) => api.put(`/api/meetings/${id}`, data),
  delete: (id) => api.delete(`/api/meetings/${id}`),
  getUpcoming: (shopId) => api.get(`/api/meetings/upcoming/${shopId}`),
  getToday: (shopId) => api.get(`/api/meetings/today/${shopId}`),
  confirm: (id) => api.post(`/api/meetings/${id}/confirm`),
  start: (id) => api.post(`/api/meetings/${id}/start`),
  complete: (id, data) => api.post(`/api/meetings/${id}/complete`, data),
  cancel: (id) => api.post(`/api/meetings/${id}/cancel`),
};

export const reminderService = {
  create: (data) => api.post('/api/reminders', data),
  getAll: (params) => api.get('/api/reminders', { params }),
  getById: (id) => api.get(`/api/reminders/${id}`),
  update: (id, data) => api.put(`/api/reminders/${id}`, data),
  delete: (id) => api.delete(`/api/reminders/${id}`),
  getPending: (shopId) => api.get(`/api/reminders/pending/${shopId}`),
  getOverdue: (shopId) => api.get(`/api/reminders/overdue/${shopId}`),
  complete: (id, data) => api.post(`/api/reminders/${id}/complete`, data),
  snooze: (id, data) => api.post(`/api/reminders/${id}/snooze`, data),
};