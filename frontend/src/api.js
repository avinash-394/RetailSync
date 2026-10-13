/**
 * Centralized API Client for RetailSync
 */

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api')
      ? import.meta.env.VITE_API_URL
      : `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`)
  : '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);

    // Auto logout on 401 Unauthorized
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.reload();
      }
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products?${query}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  deleteAllProducts: () => request('/products/all', { method: 'DELETE' }),
  getCategories: () => request('/products/categories'),
  createCategory: (data) => request('/products/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory
  getInventoryOverview: () => request('/inventory/overview'),
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inventory/transactions?${query}`);
  },
  adjustStock: (data) => request('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  clearTransactions: () => request('/inventory/transactions/all', { method: 'DELETE' }),
  resetDemoData: () => request('/inventory/reset-demo', { method: 'POST' }),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  getSupplierById: (id) => request(`/suppliers/${id}`),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
  deleteAllSuppliers: () => request('/suppliers/all', { method: 'DELETE' }),

  // Purchases
  getPurchases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/purchases?${query}`);
  },
  getPurchaseById: (id) => request(`/purchases/${id}`),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  deleteAllPurchases: () => request('/purchases/all', { method: 'DELETE' }),

  // Sales
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales?${query}`);
  },
  getSaleById: (id) => request(`/sales/${id}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteAllSales: () => request('/sales/all', { method: 'DELETE' }),

  // Reports & Analytics
  getDashboardStats: () => request('/reports/dashboard'),
  getSalesReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/sales?${query}`);
  },
  getTopSelling: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/top-selling?${query}`);
  },

  // Optimization Engine
  getOptimizationAnalysis: (days = 30) => request(`/optimization/analysis?days=${days}`),
  getReorderAlerts: (days = 30) => request(`/optimization/reorders?days=${days}`),
  autoGeneratePO: (data) => request('/optimization/auto-po', { method: 'POST', body: JSON.stringify(data) })
};
