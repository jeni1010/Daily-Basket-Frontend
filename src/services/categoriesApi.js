// src/services/categoriesApi.js
import apiRequest from './api';

export const categoriesApi = {
  // Get all categories (Admin only - with filters)
  getAll: async (statusFilter = null, includeSubcategories = true) => {
    try {
      let url = '/admin/categories?';
      if (statusFilter) url += `status_filter=${statusFilter}&`;
      if (includeSubcategories) url += `include_subcategories=true`;
      const response = await apiRequest(url);
      return response.categories || [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },
  
  // Get categories for customers (public endpoint)
  getCustomerCategories: async (includeSubcategories = true) => {
    try {
      const response = await apiRequest(`/customer/categories?include_subcategories=${includeSubcategories}`);
      return response.categories || response || [];
    } catch (error) {
      console.error("Error fetching customer categories:", error);
      return [];
    }
  },
  
  // Get single category
  getById: async (id) => {
    try {
      const response = await apiRequest(`/admin/categories/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw error;
    }
  },
  
  // Create category
  create: async (data) => {
    try {
      const response = await apiRequest('/admin/categories', {
        method: 'POST',
        body: data,
      });
      return response.data || response;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },
  
  // Update category
  update: async (id, data) => {
    try {
      const response = await apiRequest(`/admin/categories/${id}`, {
        method: 'PUT',
        body: data,
      });
      return response.data || response;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },
  
  // Delete category
  delete: async (id) => {
    try {
      const response = await apiRequest(`/admin/categories/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
  
  // Toggle category status (activate/deactivate)
  toggleStatus: async (id) => {
    try {
      const category = await categoriesApi.getById(id);
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      return categoriesApi.update(id, { ...category, status: newStatus });
    } catch (error) {
      console.error("Error toggling category status:", error);
      throw error;
    }
  }
};

export default categoriesApi;