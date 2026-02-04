import axios from 'axios';

// Base URL for API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH SERVICES
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData)
};

// PRODUCT SERVICES
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.patch(`/products/${id}`, productData),
  updateStock: (id, stockData) => api.patch(`/products/${id}/stock`, stockData),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, reviewData) => api.post(`/products/${id}/reviews`, reviewData)
};

// ORDER SERVICES
export const orderService = {
  create: (orderData) => api.post('/orders', orderData),
  getMyOrders: () => api.get('/orders/me'),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, statusData) => api.patch(`/orders/${id}/status`, statusData),
  cancel: (id) => api.delete(`/orders/${id}`)
};

// ANALYTICS SERVICES
export const analyticsService = {
  getRevenue: (params) => api.get('/stats/revenue', { params }),
  getTopRated: (params) => api.get('/stats/top-rated', { params }),
  getBestSellers: (params) => api.get('/stats/best-sellers', { params }),
  getSalesTrends: (params) => api.get('/stats/sales-trends', { params }),
  getInventory: () => api.get('/stats/inventory'),
  getCustomers: () => api.get('/stats/customers')
};

export default api;
