import api from "./api";

export const stockService = {
  getAll: (params = {}) => api.get("/api/stock", { params }),

  adjust: (data) => api.post("/api/stock/adjust", data),

  transfer: (data) => api.post("/api/stock/transfer", data),

  getLowStockAlerts: (shopId) =>
    api.get("/api/stock/alerts/low-stock", {
      params: { shopId },
    }),

  getHistory: (params) => api.get("/api/transactions", { params }),
};
