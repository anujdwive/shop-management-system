import api from './api';

export const shopService = {
  getAll: () => api.get('/api/shops'),
  getById: (id) => api.get(`/api/shops/${id}`),
  create: (data) => api.post('/api/shops', data),
  update: (id, data) => api.put(`/api/shops/${id}`, data),
  delete: (id) => api.delete(`/api/shops/${id}`),
};