import api from './api';

export const dashboardService = {
  getShopOverview: (shopId, period = 'today') =>
    api.get(`/api/dashboard/shop/${shopId}?period=${period}`),
  getShopsComparison: (period = 'month') =>
    api.get(`/api/dashboard/shops-comparison?period=${period}`),
  getQuickStats: (shopId) => api.get(`/api/dashboard/quick-stats/${shopId}`),
  getSalesTrend: (shopId, period = '30days', groupBy = 'day') =>
    api.get(`/api/reports/sales/trend/${shopId}?period=${period}&groupBy=${groupBy}`),
  getProductPerformance: (shopId, period = '30days') =>
    api.get(`/api/reports/sales/product-performance/${shopId}?period=${period}`),
  getStockOverview: (shopId) => api.get(`/api/stock-reports/overview/${shopId}`),
  getProfitLoss: (shopId, period = 'month') =>
    api.get(`/api/financial-reports/profit-loss/${shopId}?period=${period}`),
  getEmployeePerformance: (shopId, period = 'month') =>
    api.get(`/api/employee-reports/performance/${shopId}?period=${period}`),
  getBestSellingProducts: (shopId, period = '30days', limit = 10) =>
    api.get(`/api/analytics/best-selling-products/${shopId}?period=${period}&limit=${limit}`),
  getShopProfitability: (shopId, period = 'month') =>
    api.get(`/api/analytics/shop-profitability/${shopId}?period=${period}`),
};