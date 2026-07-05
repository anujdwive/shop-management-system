import api from './api';

export const stockService = {
  getByShop: (shopId) => api.get(`/api/stock/shop/${shopId}`),
  adjust: (data) => api.post('/api/stock/adjust', data),
  transfer: (data) => api.post('/api/stock/transfer', data),
  getLowStockAlerts: (shopId) => api.get(`/api/stock/alerts/low-stock?shopId=${shopId}`),
  getHistory: (params) => api.get('/api/transactions', { params }),
};