import api from './api';

export const financeService = {
  getDealers: (shopId) => api.get(`/api/dealers?shopId=${shopId}`),
  createDealer: (data) => api.post('/api/dealers', data),
  updateDealer: (id, data) => api.put(`/api/dealers/${id}`, data),
  deleteDealer: (id) => api.delete(`/api/dealers/${id}`),
  getTransactions: (params) => api.get('/api/finance/transactions', { params }),
  createTransaction: (data) => api.post('/api/finance/transactions', data),
  getPendingPayments: (shopId) => api.get(`/api/finance/payments/pending?shopId=${shopId}`),
  getOverduePayments: (shopId) => api.get(`/api/finance/payments/overdue?shopId=${shopId}`),
  markPaid: (id) => api.put(`/api/finance/payments/${id}/mark-paid`),
  getSummary: (shopId) => api.get(`/api/finance/summary?shopId=${shopId}`),
};