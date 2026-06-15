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
      if (filters.limit) {
        // ✅ Enforce maximum limit of 100
        const limit = Math.min(filters.limit, 100);
        queryParams.append('limit', limit);
      }
      if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
      if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);
      
      const url = `/admin/customers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(url);
      
      let customers = [];
      let pagination = {};
      
      if (response && response.customers) {
        customers = response.customers;
        pagination = {
          total: response.total || customers.length,
          page: response.page || filters.page || 1,
          limit: response.limit || filters.limit || 20,
          totalPages: response.totalPages || Math.ceil((response.total || customers.length) / (filters.limit || 20))
        };
      } else if (response && response.data) {
        customers = response.data;
        pagination = {
          total: response.total || customers.length,
          page: response.page || filters.page || 1,
          limit: response.limit || filters.limit || 20,
          totalPages: response.totalPages || Math.ceil((response.total || customers.length) / (filters.limit || 20))
        };
      } else if (Array.isArray(response)) {
        customers = response;
        pagination = {
          total: customers.length,
          page: filters.page || 1,
          limit: filters.limit || 20,
          totalPages: Math.ceil(customers.length / (filters.limit || 20))
        };
      }
      
      // ✅ FIXED: Fetch orders with max limit of 100 (not 1000)
      let orders = [];
      try {
        const ordersResponse = await apiRequest('/admin/orders?limit=100');
        
        if (ordersResponse && ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
          orders = ordersResponse.orders;
        } else if (Array.isArray(ordersResponse)) {
          orders = ordersResponse;
        } else if (ordersResponse && ordersResponse.data && Array.isArray(ordersResponse.data)) {
          orders = ordersResponse.data;
        } else if (ordersResponse && ordersResponse.items && Array.isArray(ordersResponse.items)) {
          orders = ordersResponse.items;
        } else {
          // Deep search for orders array
          for (const key in ordersResponse) {
            if (Array.isArray(ordersResponse[key]) && ordersResponse[key].length > 0) {
              if (ordersResponse[key][0].order_number || ordersResponse[key][0].customer_name || ordersResponse[key][0].items) {
                orders = ordersResponse[key];
                break;
              }
            }
          }
        }
      } catch (orderError) {
        console.warn('Could not fetch orders for customer stats:', orderError.message);
        // Continue without orders data
      }
      
      // Calculate stats for each customer
      const customersWithStats = customers.map(customer => {
        const customerId = customer._id || customer.id;
        const customerEmail = customer.email;
        const customerPhone = customer.phone || customer.mobile;
        
        // Find orders for this customer
        const customerOrders = orders.filter(order => {
          // Check by customer_id
          if (order.customer_id && order.customer_id === customerId) return true;
          // Check by customer._id
          if (order.customer && order.customer._id === customerId) return true;
          // Check by customer.id
          if (order.customer && order.customer.id === customerId) return true;
          // Check by email
          if (customerEmail && order.customer_email === customerEmail) return true;
          if (customerEmail && order.email === customerEmail) return true;
          if (customerEmail && order.customer && order.customer.email === customerEmail) return true;
          // Check by phone
          if (customerPhone && order.customer_phone === customerPhone) return true;
          if (customerPhone && order.phone === customerPhone) return true;
          if (customerPhone && order.customer && order.customer.phone === customerPhone) return true;
          return false;
        });
        
        // Calculate total spent
        let total_spent = 0;
        customerOrders.forEach(order => {
          let amount = 0;
          
          // Method 1: Calculate from items array
          if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            amount = order.items.reduce((itemSum, item) => {
              const price = item.price || item.selling_price || item.mrp || item.unit_price || 0;
              const quantity = item.quantity || 1;
              const itemTotal = price * quantity;
              return itemSum + itemTotal;
            }, 0);
          }
          
          // Method 2: Check summary.total
          if (amount === 0 && order.summary && order.summary.total) {
            amount = order.summary.total;
          }
          
          // Method 3: Check summary.amount
          if (amount === 0 && order.summary && order.summary.amount) {
            amount = order.summary.amount;
          }
          
          // Method 4: Check summary.subtotal
          if (amount === 0 && order.summary && order.summary.subtotal) {
            amount = order.summary.subtotal;
          }
          
          // Method 5: Check grand_total
          if (amount === 0 && order.grand_total) {
            amount = order.grand_total;
          }
          
          // Method 6: Check total_amount
          if (amount === 0 && order.total_amount) {
            amount = order.total_amount;
          }
          
          // Method 7: Check amount field
          if (amount === 0 && order.amount) {
            amount = order.amount;
          }
          
          total_spent += amount;
        });
        
        const total_orders = customerOrders.length;
        
        // Get last order date
        let last_order_date = null;
        if (customerOrders.length > 0) {
          const dates = customerOrders
            .map(o => o.created_at || o.order_date || o.createdAt || o.updated_at)
            .filter(d => d);
          if (dates.length) {
            const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));
            last_order_date = sortedDates[0];
          }
        }
        
        // Calculate average order value
        const average_order_value = total_orders > 0 ? total_spent / total_orders : 0;
        
        return {
          ...customer,
          total_orders: total_orders,
          total_spent: Math.round(total_spent),
          average_order_value: Math.round(average_order_value),
          last_order_date: last_order_date,
          // Add status if not present
          status: customer.status || (customer.is_active ? 'active' : 'inactive'),
          // Add verification status
          is_verified: customer.is_verified || customer.verified || false,
        };
      });
      
      return {
        customers: customersWithStats,
        pagination: pagination,
        total: customersWithStats.length
      };
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },
  
  getById: async (customerId) => {
    try {
      if (!customerId) {
        throw new Error("Customer ID is required");
      }
      
      const response = await apiRequest(`/admin/customers/${customerId}`);
      
      // Fetch customer's orders for detailed view
      let orders = [];
      try {
        const ordersResponse = await apiRequest(`/admin/orders?customer_id=${customerId}&limit=100`);
        
        if (ordersResponse && ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
          orders = ordersResponse.orders;
        } else if (Array.isArray(ordersResponse)) {
          orders = ordersResponse;
        } else if (ordersResponse && ordersResponse.data && Array.isArray(ordersResponse.data)) {
          orders = ordersResponse.data;
        }
      } catch (orderError) {
        console.warn('Could not fetch customer orders:', orderError.message);
      }
      
      // Calculate stats
      let total_spent = 0;
      orders.forEach(order => {
        let amount = 0;
        if (order.items && Array.isArray(order.items)) {
          amount = order.items.reduce((sum, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
          }, 0);
        }
        if (amount === 0 && order.summary?.total) amount = order.summary.total;
        if (amount === 0 && order.grand_total) amount = order.grand_total;
        total_spent += amount;
      });
      
      const customerData = response.data || response;
      
      return {
        ...customerData,
        orders: orders,
        total_orders: orders.length,
        total_spent: Math.round(total_spent),
        average_order_value: orders.length > 0 ? Math.round(total_spent / orders.length) : 0,
      };
    } catch (error) {
      console.error('Error fetching customer details:', error);
      throw error;
    }
  },
  
  updateStatus: async (customerId, status) => {
    try {
      if (!customerId) {
        throw new Error("Customer ID is required");
      }
      
      if (!status || !['active', 'inactive', 'blocked', 'suspended'].includes(status)) {
        throw new Error("Invalid status. Must be: active, inactive, blocked, or suspended");
      }
      
      const response = await apiRequest(`/admin/customers/${customerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: status }),
      });
      
      return response.data || response;
    } catch (error) {
      console.error('Error updating customer status:', error);
      throw error;
    }
  },
  
  // Additional helper methods
  getCustomerOrders: async (customerId, page = 1, limit = 10) => {
    try {
      if (!customerId) {
        throw new Error("Customer ID is required");
      }
      
      const response = await apiRequest(`/admin/orders?customer_id=${customerId}&page=${page}&limit=${limit}`);
      
      let orders = [];
      if (response && response.orders && Array.isArray(response.orders)) {
        orders = response.orders;
      } else if (Array.isArray(response)) {
        orders = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        orders = response.data;
      }
      
      return {
        orders: orders,
        total: response.total || orders.length,
        page: response.page || page,
        limit: response.limit || limit,
      };
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return { orders: [], total: 0, page: page, limit: limit };
    }
  },
  
  searchCustomers: async (searchTerm, limit = 10) => {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }
      
      const safeLimit = Math.min(limit, 100);
      const response = await apiRequest(`/admin/customers?search=${encodeURIComponent(searchTerm)}&limit=${safeLimit}`);
      
      let customers = [];
      if (response && response.customers && Array.isArray(response.customers)) {
        customers = response.customers;
      } else if (response && response.data && Array.isArray(response.data)) {
        customers = response.data;
      } else if (Array.isArray(response)) {
        customers = response;
      }
      
      return customers;
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  },
};

export default customersApi;