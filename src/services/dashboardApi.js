// src/services/dashboardApi.js
import apiRequest from './api';

export const dashboardApi = {
  // Get dashboard stats
  getStats: async () => {
    try {
      const response = await apiRequest('/admin/dashboard/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Get recent orders using dashboard specific endpoint with fallback
  getRecentOrders: async (limit = 10) => {
    try {
      // Try using dashboard specific endpoint first
      try {
        const response = await apiRequest(`/admin/dashboard/recent-orders?limit=${limit}`);
        
        if (response && response.orders) {
          return response.orders;
        }
        if (Array.isArray(response)) {
          return response;
        }
      } catch (dashboardError) {
        // Silent fail - fallback to admin orders
      }
      
      // Fallback to admin orders endpoint
      const response = await apiRequest(`/admin/orders?limit=${limit}&sort_by=created_at&sort_order=desc`);
      
      let orders = [];
      if (response && response.orders) {
        orders = response.orders;
      } else if (Array.isArray(response)) {
        orders = response;
      } else if (response && response.data) {
        orders = response.data;
      }
      
      return orders;
    } catch (error) {
      return [];
    }
  },
  
  // Get all orders with pagination (max 100 per page)
  getAllOrders: async () => {
    try {
      let allOrders = [];
      let currentPage = 1;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore) {
        const response = await apiRequest(`/admin/orders?limit=${limit}&page=${currentPage}`);
        
        let orders = [];
        let total = 0;
        
        if (response && response.orders) {
          orders = response.orders;
          total = response.total || 0;
        } else if (Array.isArray(response)) {
          orders = response;
          total = orders.length;
        } else if (response && response.data) {
          orders = response.data;
          total = response.total || 0;
        }
        
        allOrders = [...allOrders, ...orders];
        
        if (orders.length < limit || allOrders.length >= total) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }
      
      return allOrders;
    } catch (error) {
      return [];
    }
  },
  
  // Get all categories
  getCategories: async () => {
    try {
      const response = await apiRequest('/admin/categories?include_subcategories=true');
      
      let categories = [];
      if (response && response.categories) {
        categories = response.categories;
      } else if (Array.isArray(response)) {
        categories = response;
      }
      
      return categories;
    } catch (error) {
      return [];
    }
  },
  
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await apiRequest('/customer/products?limit=100');
      
      let products = [];
      if (response && response.products) {
        products = response.products;
      } else if (Array.isArray(response)) {
        products = response;
      }
      
      return products;
    } catch (error) {
      return [];
    }
  },
  
  // Get category sales from orders with category mapping
  getCategorySales: async () => {
    try {
      const orders = await dashboardApi.getAllOrders();
      const [categories, products] = await Promise.all([
        dashboardApi.getCategories(),
        dashboardApi.getAllProducts()
      ]);
      
      const productCategoryMap = new Map();
      if (products && products.length > 0) {
        products.forEach(product => {
          const productId = product._id || product.id;
          let categoryName = 'Uncategorized';
          
          if (product.category_name) {
            categoryName = product.category_name;
          } else if (product.category && product.category.name) {
            categoryName = product.category.name;
          } else if (product.category_id && categories) {
            const foundCategory = categories.find(cat => cat._id === product.category_id || cat.id === product.category_id);
            if (foundCategory) {
              categoryName = foundCategory.name;
            }
          }
          
          productCategoryMap.set(productId, categoryName);
        });
      }
      
      const categoryMap = new Map();
      
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const productId = item.product_id || item._id;
            let category = 'Uncategorized';
            
            if (productId && productCategoryMap.has(productId)) {
              category = productCategoryMap.get(productId);
            } else if (item.category_name) {
              category = item.category_name;
            } else if (item.category) {
              category = item.category;
            }
            
            const amount = item.subtotal || (item.price * item.quantity) || 0;
            categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
          });
        }
      });
      
      const categorySales = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value);
      
      const total = categorySales.reduce((sum, cat) => sum + cat.value, 0);
      const result = categorySales.map(cat => ({
        ...cat,
        percentage: total > 0 ? Math.round((cat.value / total) * 100) : 0
      }));
      
      return result;
      
    } catch (error) {
      return [];
    }
  },
  
  // Get revenue data from orders
  getRevenueData: async () => {
    try {
      const orders = await dashboardApi.getAllOrders();
      
      const monthlyData = new Map();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = months[date.getMonth()];
        last6Months.push(monthName);
        monthlyData.set(monthName, 0);
      }
      
      orders.forEach(order => {
        if (order.created_at) {
          const date = new Date(order.created_at);
          const monthName = months[date.getMonth()];
          const amount = order.grand_total || order.total_amount || 0;
          
          if (monthlyData.has(monthName)) {
            monthlyData.set(monthName, monthlyData.get(monthName) + amount);
          }
        }
      });
      
      const revenueData = last6Months.map(month => ({
        month: month,
        revenue: monthlyData.get(month) || 0
      }));
      
      return revenueData;
    } catch (error) {
      return [];
    }
  },
  
  // Get top selling products with images
  getTopProducts: async () => {
    try {
      const [orders, products] = await Promise.all([
        dashboardApi.getAllOrders(),
        dashboardApi.getAllProducts()
      ]);
      
      const productInfoMap = new Map();
      if (products && products.length > 0) {
        products.forEach(product => {
          const productId = product._id || product.id;
          const imageUrl = product.images?.[0] || product.image_url || product.image || null;
          productInfoMap.set(productId, {
            name: product.name,
            image: imageUrl,
            price: product.price,
            originalPrice: product.original_price
          });
        });
      }
      
      const productMap = new Map();
      
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const productId = item.product_id || item._id;
            const productName = item.product_name || item.name || 'Unknown';
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            
            if (productMap.has(productId)) {
              const existing = productMap.get(productId);
              existing.sales += quantity;
            } else {
              const productInfo = productInfoMap.get(productId) || {};
              productMap.set(productId, {
                id: productId,
                name: productName,
                sales: quantity,
                image: productInfo.image,
                price: price || productInfo.price,
                originalPrice: productInfo.originalPrice
              });
            }
          });
        }
      });
      
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
      
      return topProducts;
    } catch (error) {
      return [];
    }
  }
};

export default dashboardApi;