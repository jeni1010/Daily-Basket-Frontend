// src/services/couponsApi.js
import apiRequest from './api';

export const couponsApi = {
  // Get all coupons - GET /admin/coupons
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.coupon_type) queryParams.append('coupon_type', params.coupon_type);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      
      const url = `/admin/coupons${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(url);
      
      // Extract coupons array from response (response is the data object directly)
      if (response.coupons) return response.coupons;
      if (response.data) return response.data;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      throw error;
    }
  },
  
  // Get single coupon - GET /admin/coupon/{coupon_id}
  getById: async (couponId) => {
    try {
      const response = await apiRequest(`/admin/coupon/${couponId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Create coupon - POST /admin/create_coupon
  create: async (data) => {
    try {
      const response = await apiRequest('/admin/create_coupon', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Update coupon - PUT /admin/coupon/{coupon_id}
  update: async (couponId, data) => {
    try {
      const response = await apiRequest(`/admin/coupon/${couponId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete coupon - DELETE /admin/coupon/{coupon_id}
  delete: async (couponId) => {
    try {
      const response = await apiRequest(`/admin/coupon/${couponId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Toggle coupon status - POST /admin/coupon/{coupon_id}/toggle-status
  toggleStatus: async (couponId) => {
    try {
      const response = await apiRequest(`/admin/coupon/${couponId}/toggle-status`, {
        method: 'POST',
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export const adminApi = {
  getCoupons: couponsApi.getAll,
  getCouponById: couponsApi.getById,
  createCoupon: couponsApi.create,
  updateCoupon: couponsApi.update,
  deleteCoupon: couponsApi.delete,
  toggleCouponStatus: couponsApi.toggleStatus,
};

export default couponsApi;