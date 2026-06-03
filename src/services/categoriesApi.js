// src/services/categoriesApi.js
import apiRequest from './api';

export const categoriesApi = {
  // Get all categories
  getAll: async (statusFilter = null, includeSubcategories = true) => {
    let url = '/admin/categories?';
    if (statusFilter) url += `status_filter=${statusFilter}&`;
    if (includeSubcategories) url += `include_subcategories=true`;
    const response = await apiRequest(url);
    return response.categories || [];
  },
  
  // Get single category
  getById: async (id) => {
    const response = await apiRequest(`/admin/categories/${id}`);
    return response;
  },
  
  // Create category
  create: async (data) => {
    const response = await apiRequest('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },
  
  // Update category
  update: async (id, data) => {
    const response = await apiRequest(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },
  
  // Delete category
  delete: async (id) => {
    const response = await apiRequest(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
};

export default categoriesApi;