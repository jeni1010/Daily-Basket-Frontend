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

// Helper to calculate order total from items or summary
export function calculateOrderTotal(order) {
  // Check if order has grand_total directly
  if (order.grand_total) {
    return order.grand_total;
  }
  
  // Check if order has summary with grand_total
  if (order.summary && order.summary.grand_total) {
    return order.summary.grand_total;
  }
  
  // Calculate from items
  if (order.items && order.items.length > 0) {
    const subtotal = order.items.reduce((sum, item) => {
      const price = item.price || item.unit_price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    const shipping = order.shipping_charge || order.delivery_fee || 0;
    const tax = order.tax_amount || order.tax || 0;
    
    return subtotal + shipping + tax;
  }
  
  return 0;
}

// Helper to format order status display
export function getOrderStatusDisplay(status) {
  const statusMap = {
    placed: { label: 'Placed', color: 'bg-blue-100 text-blue-700' },
    confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
    packed: { label: 'Packed', color: 'bg-purple-100 text-purple-700' },
    shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-700' },
    delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' }
  };
  
  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
}

// Helper to format payment status display
export function getPaymentStatusDisplay(status) {
  const statusMap = {
    paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
    refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' }
  };
  
  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
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
        // ✅ FIXED: Enforce maximum limit of 100
        const limit = Math.min(filters.limit, 100);
        queryParams.append('limit', limit);
      } else {
        // Default limit of 20 if not specified
        queryParams.append('limit', 20);
      }
      
      const url = `/admin/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(url);
      
      let orders = [];
      let total = 0;
      let page = filters.page || 1;
      let limit = filters.limit ? Math.min(filters.limit, 100) : 20;
      let totalPages = 0;
      
      if (response && response.orders && Array.isArray(response.orders)) {
        orders = response.orders;
        total = response.total || orders.length;
        totalPages = response.pages || Math.ceil(total / limit);
      } else if (response && response.data && Array.isArray(response.data)) {
        orders = response.data;
        total = response.total || orders.length;
        totalPages = response.pages || Math.ceil(total / limit);
      } else if (Array.isArray(response)) {
        orders = response;
        total = orders.length;
        totalPages = Math.ceil(total / limit);
      }
      
      // Enhance orders with customer data from shipping_address
      const enhancedOrders = orders.map(enhanceOrderWithCustomerData);
      
      return {
        orders: enhancedOrders,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      };
    }
  },
  
  // Get single order - GET /admin/orders/{order_id}
  getById: async (orderId) => {
    try {
      const response = await apiRequest(`/admin/orders/${orderId}`);
      return enhanceOrderWithCustomerData(response);
    } catch (error) {
      console.error('Error fetching order by ID:', error);
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
        // Fallback to generic update endpoint
        response = await apiRequest(`/admin/orders/${orderId}`, {
          method: 'PUT',
          body: { order_status: status },
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error updating order status:', error);
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
      console.error('Error updating payment status:', error);
      throw error;
    }
  },
  
  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await apiRequest(`/admin/orders/${orderId}/cancel`, {
        method: 'PUT',
      });
      return response;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },
  
  // Get order statistics
  getStats: async () => {
    try {
      const response = await apiRequest('/admin/dashboard/stats');
      return response;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0
      };
    }
  },
  
  // ✅ FIXED: Get recent orders with max limit of 100
  getRecentOrders: async (limit = 10) => {
    try {
      // Ensure limit doesn't exceed 100
      const safeLimit = Math.min(limit, 100);
      const response = await apiRequest(`/admin/dashboard/recent-orders?limit=${safeLimit}`);
      let orders = [];
      
      if (response && response.orders && Array.isArray(response.orders)) {
        orders = response.orders;
      } else if (Array.isArray(response)) {
        orders = response;
      }
      
      return orders.map(enhanceOrderWithCustomerData);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }
  }
};

export default ordersApi;