import api from './api';

export const employeeService = {
  getByShop: (shopId) => api.get(`/api/employees?shopId=${shopId}`),
  getById: (id) => api.get(`/api/employees/${id}`),
  create: (data) => api.post('/api/employees', data),
  update: (id, data) => api.put(`/api/employees/${id}`, data),
  delete: (id) => api.delete(`/api/employees/${id}`),
  getPerformance: (id) => api.get(`/api/employees/${id}/performance`),
};

export const attendanceService = {
  checkIn: (data) => api.post('/api/attendance/check-in', data),
  checkOut: (data) => api.post('/api/attendance/check-out', data),
  getEmployeeHistory: (employeeId) => api.get(`/api/attendance/employee/${employeeId}`),
  getDailyReport: (shopId, date) => api.get(`/api/attendance/shop/${shopId}/${date}`),
};