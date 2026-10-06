import api from "./api";

export const productService = {
  getAll: (params) => api.get("/api/products", { params }),
  getAllOptions: () => api.get("/api/products/options"),
  getById: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post("/api/products", data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
};
