// src/services/ordersApi.js
import apiRequest from './api';

// Helper function to enhance order with customer data from shipping_address
function enhanceOrderWithCustomerData(order) {
  if (!order) return order;
  
  // If order already has customer_name and it's not 'Guest', return as is
  if (order.customer_name && order.customer_name !== 'Guest') {
    return order;
  }
  
  // Try to extract customer name from shipping_address
  if (order.shipping_address) {
    if (order.shipping_address.full_name && !order.customer_name) {
      order.customer_name = order.shipping_address.full_name;
    }
    if (order.shipping_address.phone && !order.customer_phone) {
      order.customer_phone = order.shipping_address.phone;
    }
  }
  
  return order;
}

export const ordersApi = {
  // Get all orders with filters - GET /admin/orders
  getAll: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.order_status && filters.order_status !== 'all') {
        queryParams.append('order_status', filters.order_status);
      }
      if (filters.payment_status && filters.payment_status !== 'all') {
        queryParams.append('payment_status', filters.payment_status);
      }
      if (filters.payment_method && filters.payment_method !== 'all') {
        queryParams.append('payment_method', filters.payment_method);
      }
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      if (filters.page) {
        queryParams.append('page', filters.page);
      }
      if (filters.limit) {
        const limit = Math.min(filters.limit, 100);
        queryParams.append('limit', limit);
      }
      
      const url = `/admin/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(url);
      
      let orders = [];
      let total = 0;
      
      if (response && response.orders && Array.isArray(response.orders)) {
        orders = response.orders;
        total = response.total || orders.length;
      } else if (response && response.data && Array.isArray(response.data)) {
        orders = response.data;
        total = response.total || orders.length;
      } else if (Array.isArray(response)) {
        orders = response;
        total = orders.length;
      } else if (response && typeof response === 'object') {
        orders = [];
      }
      
      // Enhance orders with customer data from shipping_address
      const enhancedOrders = orders.map(enhanceOrderWithCustomerData);
      
      return enhancedOrders;
    } catch (error) {
      return [];
    }
  },
  
  // Get single order - GET /admin/orders/{order_id}
  getById: async (orderId) => {
    try {
      const response = await apiRequest(`/admin/orders/${orderId}`);
      return enhanceOrderWithCustomerData(response);
    } catch (error) {
      throw error;
    }
  },
  
  // Update order status
  updateStatus: async (orderId, status) => {
    try {
      let response;
      try {
        response = await apiRequest(`/admin/orders/${orderId}/status`, {
          method: 'PUT',
          body: { order_status: status },
        });
      } catch (err) {
        response = await apiRequest(`/admin/orders/${orderId}`, {
          method: 'PUT',
          body: { order_status: status },
        });
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Update payment status
  updatePaymentStatus: async (orderId, paymentStatus) => {
    try {
      const response = await apiRequest(`/admin/orders/${orderId}/payment`, {
        method: 'PUT',
        body: { payment_status: paymentStatus },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default ordersApi;