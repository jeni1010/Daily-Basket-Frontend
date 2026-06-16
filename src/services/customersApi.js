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
      
      // ✅ Fetch all orders
      let allOrders = [];
      try {
        const ordersResponse = await apiRequest('/admin/orders?limit=100');
        
        if (ordersResponse && ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
          allOrders = ordersResponse.orders;
        } else if (Array.isArray(ordersResponse)) {
          allOrders = ordersResponse;
        } else if (ordersResponse && ordersResponse.data && Array.isArray(ordersResponse.data)) {
          allOrders = ordersResponse.data;
        }
        console.log(`✅ Found ${allOrders.length} total orders`);
      } catch (orderError) {
        console.warn('⚠️ Could not fetch orders:', orderError.message);
      }
      
      // ✅ Calculate stats for each customer
      const customersWithStats = customers.map(customer => {
        const customerId = customer.id || customer._id;
        const customerEmail = customer.email;
        const customerName = customer.name;
        
        console.log(`👤 Processing customer: ${customerName} (ID: ${customerId})`);
        
        // ✅ Match orders by customer_id only (most reliable)
        const customerOrders = allOrders.filter(order => {
          let orderCustomerId = null;
          if (order.customer_id) orderCustomerId = order.customer_id;
          else if (order.customer?.id) orderCustomerId = order.customer.id;
          else if (order.customer?._id) orderCustomerId = order.customer._id;
          else if (order.user?.id) orderCustomerId = order.user.id;
          else if (order.user?._id) orderCustomerId = order.user._id;
          
          if (orderCustomerId && customerId) {
            return String(orderCustomerId) === String(customerId);
          }
          return false;
        });
        
        // ✅ Calculate total spent
        let total_spent = 0;
        customerOrders.forEach(order => {
          let amount = 0;
          if (order.grand_total) {
            amount = order.grand_total;
          } else if (order.total_amount) {
            amount = order.total_amount;
          } else if (order.amount) {
            amount = order.amount;
          } else if (order.summary?.total) {
            amount = order.summary.total;
          } else if (order.summary?.amount) {
            amount = order.summary.amount;
          } else if (order.items && Array.isArray(order.items)) {
            amount = order.items.reduce((sum, item) => {
              const price = item.price || item.selling_price || item.mrp || 0;
              const quantity = item.quantity || 1;
              return sum + (price * quantity);
            }, 0);
          }
          total_spent += amount;
        });
        
        const total_orders = customerOrders.length;
        
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
        
        console.log(`✅ ${customerName}: ${total_orders} orders, ₹${total_spent}`);
        
        return {
          ...customer,
          total_orders: total_orders,
          total_spent: Math.round(total_spent),
          average_order_value: total_orders > 0 ? Math.round(total_spent / total_orders) : 0,
          last_order_date: last_order_date,
          status: customer.status || (customer.is_active ? 'active' : 'inactive'),
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
      const customerData = response.data || response;
      
      let orders = [];
      try {
        const ordersResponse = await apiRequest('/admin/orders?limit=100');
        let allOrders = [];
        
        if (ordersResponse && ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
          allOrders = ordersResponse.orders;
        } else if (Array.isArray(ordersResponse)) {
          allOrders = ordersResponse;
        } else if (ordersResponse && ordersResponse.data && Array.isArray(ordersResponse.data)) {
          allOrders = ordersResponse.data;
        }
        
        // ✅ Match by customer_id only
        orders = allOrders.filter(order => {
          let orderCustomerId = null;
          if (order.customer_id) orderCustomerId = order.customer_id;
          else if (order.customer?.id) orderCustomerId = order.customer.id;
          else if (order.customer?._id) orderCustomerId = order.customer._id;
          else if (order.user?.id) orderCustomerId = order.user.id;
          else if (order.user?._id) orderCustomerId = order.user._id;
          
          if (orderCustomerId) {
            return String(orderCustomerId) === String(customerId);
          }
          return false;
        });
        
      } catch (orderError) {
        console.warn('Could not fetch customer orders:', orderError.message);
      }
      
      let total_spent = 0;
      orders.forEach(order => {
        let amount = 0;
        if (order.grand_total) amount = order.grand_total;
        else if (order.total_amount) amount = order.total_amount;
        else if (order.amount) amount = order.amount;
        else if (order.summary?.total) amount = order.summary.total;
        else if (order.summary?.amount) amount = order.summary.amount;
        else if (order.items && Array.isArray(order.items)) {
          amount = order.items.reduce((sum, item) => {
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
          }, 0);
        }
        total_spent += amount;
      });
      
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
  
  getCustomerOrders: async (customerId, page = 1, limit = 10) => {
    try {
      if (!customerId) {
        throw new Error("Customer ID is required");
      }
      
      const response = await apiRequest(`/admin/orders?page=${page}&limit=${limit}`);
      
      let allOrders = [];
      if (response && response.orders && Array.isArray(response.orders)) {
        allOrders = response.orders;
      } else if (Array.isArray(response)) {
        allOrders = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        allOrders = response.data;
      }
      
      // ✅ Match by customer_id only
      const customerOrders = allOrders.filter(order => {
        let orderCustomerId = null;
        if (order.customer_id) orderCustomerId = order.customer_id;
        else if (order.customer?.id) orderCustomerId = order.customer.id;
        else if (order.customer?._id) orderCustomerId = order.customer._id;
        else if (order.user?.id) orderCustomerId = order.user.id;
        else if (order.user?._id) orderCustomerId = order.user._id;
        
        if (orderCustomerId) {
          return String(orderCustomerId) === String(customerId);
        }
        return false;
      });
      
      return {
        orders: customerOrders,
        total: customerOrders.length,
        page: page,
        limit: limit,
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