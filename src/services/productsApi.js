// src/services/productsApi.js
import apiRequest from './api';

export const productsApi = {
  // Get all products with filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured);
      if (filters.search) params.append('search', filters.search);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);
      
      const response = await apiRequest(`/admin/products?${params.toString()}`);
      return response.products || [];
    } catch (error) {
      return [];
    }
  },
  
  // Get single product - FIXED: Added /admin/ prefix
  getById: async (id) => {
    try {
      const response = await apiRequest(`/admin/admin/products/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Get product by slug (for customer facing)
  getBySlug: async (slug) => {
    try {
      const response = await apiRequest(`/customer/products/${slug}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Create product
  create: async (data) => {
    try {
      const response = await apiRequest('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update product - FIXED: Added /admin/ prefix
  update: async (id, data) => {
    try {
      const response = await apiRequest(`/admin/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete product - FIXED: Added /admin/ prefix
  delete: async (id) => {
    try {
      const response = await apiRequest(`/admin/admin/products/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Update stock only
  updateStock: async (id, stockQuantity) => {
    try {
      const response = await apiRequest(`/admin/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock_quantity: stockQuantity }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Decrease stock (convenience method)
  decreaseStock: async (id, quantity) => {
    try {
      const product = await productsApi.getById(id);
      const currentStock = product.stock_quantity || 0;
      const newStock = Math.max(0, currentStock - quantity);
      return productsApi.updateStock(id, newStock);
    } catch (error) {
      throw error;
    }
  },
  
  // Increase stock (for returns/restocks)
  increaseStock: async (id, quantity) => {
    try {
      const product = await productsApi.getById(id);
      const currentStock = product.stock_quantity || 0;
      const newStock = currentStock + quantity;
      return productsApi.updateStock(id, newStock);
    } catch (error) {
      throw error;
    }
  },
  
  // Check if product is in stock
  checkStock: async (id, requestedQuantity = 1) => {
    try {
      const product = await productsApi.getById(id);
      const currentStock = product.stock_quantity || 0;
      return {
        inStock: currentStock >= requestedQuantity,
        availableQuantity: currentStock,
        requestedQuantity: requestedQuantity,
        productName: product.name
      };
    } catch (error) {
      return { inStock: false, availableQuantity: 0, requestedQuantity, error: error.message };
    }
  },
  
  // Bulk update stock
  bulkUpdateStock: async (updates) => {
    try {
      const response = await apiRequest('/admin/products/bulk/stock', {
        method: 'POST',
        body: JSON.stringify({ updates }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Bulk update status
  bulkUpdateStatus: async (updates) => {
    try {
      const response = await apiRequest('/admin/products/bulk/status', {
        method: 'POST',
        body: JSON.stringify({ updates }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Update variant stock
  updateVariantStock: async (productId, variantSku, stockQuantity) => {
    try {
      const response = await apiRequest(`/admin/products/${productId}/variants/${variantSku}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ variant_sku: variantSku, stock_quantity: stockQuantity }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Update variant price
  updateVariantPrice: async (productId, variantSku, price, comparePrice = null) => {
    try {
      const response = await apiRequest(`/admin/products/${productId}/variants/${variantSku}/price`, {
        method: 'PUT',
        body: JSON.stringify({ variant_sku: variantSku, price, compare_price: comparePrice }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Get low stock products (for admin alerts)
  getLowStockProducts: async (threshold = 10) => {
    try {
      const products = await productsApi.getAll();
      const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= threshold);
      return lowStockProducts;
    } catch (error) {
      return [];
    }
  },
  
  // Get out of stock products
  getOutOfStockProducts: async () => {
    try {
      const products = await productsApi.getAll();
      const outOfStockProducts = products.filter(p => (p.stock_quantity || 0) === 0);
      return outOfStockProducts;
    } catch (error) {
      return [];
    }
  }
};

export default productsApi;