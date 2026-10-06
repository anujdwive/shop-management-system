import api from "./api";

export const shopService = {
  getAll: ({ search, limit, page }) =>
    api.get("/api/shops", {
      params: {
        search,
        limit,
        page,
      },
    }),
  getAllShopOptions: () => api.get("/api/shops/options"),
  getById: (id) => api.get(`/api/shops/${id}`),
  create: (data) => api.post("/api/shops", data),
  update: (id, data) => api.put(`/api/shops/${id}`, data),
  delete: (id) => api.delete(`/api/shops/${id}`),
};
