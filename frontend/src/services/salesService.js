import api from './api';

export const salesService = {
  create: (data) => api.post('/api/sales', data),
  getById: (id) => api.get(`/api/sales/${id}`),
  update: (id, data) => api.put(`/api/sales/${id}`, data),
  getByShop: (shopId, params) => api.get(`/api/sales/shop/${shopId}`, { params }),
  getDailyReport: (shopId, date) => api.get(`/api/sales/shop/${shopId}/daily/${date}`),
  getMonthlyReport: (shopId, year, month) =>
    api.get(`/api/sales/shop/${shopId}/monthly/${year}/${month}`),
};

export const expenseService = {
  create: (data) => api.post('/api/expenses', data),
  getAll: (params) => api.get('/api/expenses', { params }),
  getById: (id) => api.get(`/api/expenses/${id}`),
  update: (id, data) => api.put(`/api/expenses/${id}`, data),
  delete: (id) => api.delete(`/api/expenses/${id}`),
  approve: (id) => api.post(`/api/expenses/${id}/approve`),
  reject: (id, data) => api.post(`/api/expenses/${id}/reject`, data),
  getCategorySummary: (shopId) => api.get(`/api/expenses/shop/${shopId}/category-summary`),
};