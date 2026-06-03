// src/services/customersApi.js
import apiRequest from './api';

export const customersApi = {
  getAll: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.verified !== undefined && filters.verified !== 'all') queryParams.append('verified', filters.verified);
      if (filters.role && filters.role !== 'all') queryParams.append('role', filters.role);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
      if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);
      
      const url = `/admin/customers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(url);
      
      let customers = [];
      if (response && response.customers) {
        customers = response.customers;
      } else if (response && response.data) {
        customers = response.data;
      } else if (Array.isArray(response)) {
        customers = response;
      }
      
      // Fetch orders
      let orders = [];
      try {
        const ordersResponse = await apiRequest('/admin/orders?limit=100');
        
        if (ordersResponse && ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
          orders = ordersResponse.orders;
        } else if (Array.isArray(ordersResponse)) {
          orders = ordersResponse;
        } else if (ordersResponse && ordersResponse.data && Array.isArray(ordersResponse.data)) {
          orders = ordersResponse.data;
        } else {
          for (const key in ordersResponse) {
            if (Array.isArray(ordersResponse[key]) && ordersResponse[key].length > 0) {
              if (ordersResponse[key][0].order_number || ordersResponse[key][0].customer_name) {
                orders = ordersResponse[key];
                break;
              }
            }
          }
        }
      } catch (orderError) {
        // Silent fail
      }
      
      // Calculate stats for each customer
      const customersWithStats = customers.map(customer => {
        const customerId = customer._id || customer.id;
        const customerEmail = customer.email;
        
        // Find orders for this customer
        const customerOrders = orders.filter(order => {
          if (order.customer_id && order.customer_id === customerId) return true;
          if (order.customer_email && customerEmail && order.customer_email === customerEmail) return true;
          if (order.user && order.user.email && order.user.email === customerEmail) return true;
          if (order.customer && order.customer.email && order.customer.email === customerEmail) return true;
          return false;
        });
        
        // Calculate total spent - calculate from items array
        const total_spent = customerOrders.reduce((sum, order) => {
          let amount = 0;
          
          // Method 1: Calculate from items array
          if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            amount = order.items.reduce((itemSum, item) => {
              const price = item.price || item.selling_price || item.mrp || 0;
              const quantity = item.quantity || 1;
              const itemTotal = price * quantity;
              return itemSum + itemTotal;
            }, 0);
          }
          
          // Method 2: Check if there's a summary object with total
          if (amount === 0 && order.summary && order.summary.total) {
            amount = order.summary.total;
          }
          
          // Method 3: Check if there's a subtotal in summary
          if (amount === 0 && order.summary && order.summary.subtotal) {
            amount = order.summary.subtotal;
          }
          
          // Method 4: Check for grand_total in summary
          if (amount === 0 && order.summary && order.summary.grand_total) {
            amount = order.summary.grand_total;
          }
          
          return sum + amount;
        }, 0);
        
        const total_orders = customerOrders.length;
        
        let last_order_date = null;
        if (customerOrders.length > 0) {
          const dates = customerOrders.map(o => o.created_at || o.order_date || o.createdAt).filter(d => d);
          if (dates.length) {
            const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));
            last_order_date = sortedDates[0];
          }
        }
        
        return {
          ...customer,
          total_orders: total_orders,
          total_spent: total_spent,
          last_order_date: last_order_date
        };
      });
      
      return customersWithStats;
      
    } catch (error) {
      throw error;
    }
  },
  
  getById: async (customerId) => {
    try {
      const response = await apiRequest(`/admin/customers/${customerId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  updateStatus: async (customerId, status) => {
    try {
      const response = await apiRequest(`/admin/customers/${customerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: status }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default customersApi;