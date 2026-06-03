// src/services/customerApi.js
import apiRequest from './api';

// Helper function to get cart items
async function getCartItemsFromAPI() {
  try {
    const cartResponse = await apiRequest('/customer/cart');
    let items = [];
    
    if (cartResponse && cartResponse.items && Array.isArray(cartResponse.items)) {
      items = cartResponse.items;
    } else if (cartResponse && cartResponse.data && cartResponse.data.items && Array.isArray(cartResponse.data.items)) {
      items = cartResponse.data.items;
    } else if (cartResponse && cartResponse.cart && cartResponse.cart.items && Array.isArray(cartResponse.cart.items)) {
      items = cartResponse.cart.items;
    }
    
    return items;
  } catch (error) {
    return [];
  }
}

// Helper function to ensure address fields meet minimum length requirements
function validateAndFixAddress(address) {
  let addressLine1 = address.address_line1 || address.address || "Address Line";
  while (addressLine1.length < 5) {
    addressLine1 = addressLine1 + " ";
  }
  
  let city = address.city || "Chennai";
  while (city.length < 2) {
    city = city + " ";
  }
  
  let state = address.state || "Tamil Nadu";
  while (state.length < 2) {
    state = state + " ";
  }
  
  let postalCode = address.postal_code || address.pincode || "600001";
  while (postalCode.length < 3) {
    postalCode = postalCode + "0";
  }
  
  let phone = (address.phone || address.mobile || "9999999999").replace(/[^0-9+]/g, '');
  while (phone.length < 10) {
    phone = phone + "0";
  }
  
  return {
    full_name: (address.full_name || address.name || "Customer").substring(0, 100),
    phone: phone.substring(0, 15),
    address_line1: addressLine1.substring(0, 255),
    address_line2: (address.address_line2 || ""),
    city: city.substring(0, 100),
    state: state.substring(0, 100),
    postal_code: postalCode.substring(0, 20),
    country: (address.country || "India").substring(0, 100),
    landmark: (address.landmark || "")
  };
}

// Helper function to get current user from multiple sources
function getCurrentUser() {
  let currentUser = null;
  
  try {
    // Try 'user' first
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
    }
    
    // If not found, try 'userData'
    if (!currentUser) {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        currentUser = JSON.parse(userDataStr);
      }
    }
    
    // If still not found, try to decode token
    if (!currentUser) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedToken = JSON.parse(atob(base64));
          if (decodedToken) {
            currentUser = {
              id: decodedToken.id || decodedToken.userId,
              name: decodedToken.name || decodedToken.username || decodedToken.full_name,
              email: decodedToken.email,
              phone: decodedToken.phone || decodedToken.mobile
            };
          }
        } catch (decodeError) {
          // Silent fail
        }
      }
    }
  } catch (e) {
    // Silent fail
  }
  
  return currentUser;
}

// Create the customerApi object with all methods
export const customerApi = {
  // ==================== PRODUCTS ====================
  getProducts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.category_id) queryParams.append('category_id', params.category_id);
    if (params.subcategory_id) queryParams.append('subcategory_id', params.subcategory_id);
    if (params.featured !== undefined) queryParams.append('featured', params.featured);
    if (params.trending !== undefined) queryParams.append('trending', params.trending);
    if (params.search) queryParams.append('search', params.search);
    if (params.min_price) queryParams.append('min_price', params.min_price);
    if (params.max_price) queryParams.append('max_price', params.max_price);
    if (params.in_stock !== undefined) queryParams.append('in_stock', params.in_stock);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    
    try {
      const response = await apiRequest(`/customer/products?${queryParams.toString()}`);
      
      if (response.products && Array.isArray(response.products)) return response.products;
      if (response.data && Array.isArray(response.data)) return response.data;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      return [];
    }
  },
  
  getProductBySlug: async (slug) => {
    try {
      const response = await apiRequest(`/customer/products/${slug}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // ==================== CATEGORIES ====================
  getCategories: async (includeSubcategories = true) => {
    try {
      const response = await apiRequest(`/customer/categories?include_subcategories=${includeSubcategories}`);
      if (response.categories) return response.categories;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      return [];
    }
  },
  
  // ==================== CART OPERATIONS ====================
  cart: {
    add: async (productId, quantity = 1, variantSku = null) => {
      try {
        const response = await apiRequest('/customer/cart/add', {
          method: 'POST',
          body: { 
            product_id: productId, 
            quantity, 
            variant_sku: variantSku || "" 
          },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    get: async () => {
      try {
        const response = await apiRequest('/customer/cart');
        
        let items = [];
        if (response && response.items && Array.isArray(response.items)) {
          items = response.items;
        } else if (response && response.data && response.data.items && Array.isArray(response.data.items)) {
          items = response.data.items;
        } else if (response && response.cart && response.cart.items && Array.isArray(response.cart.items)) {
          items = response.cart.items;
        }
        
        return { items: items, ...response };
      } catch (error) {
        return { items: [] };
      }
    },
    
    update: async (productId, quantity, variantSku = null) => {
      try {
        const response = await apiRequest('/customer/cart/update', {
          method: 'PUT',
          body: { 
            product_id: productId, 
            quantity, 
            variant_sku: variantSku || "" 
          },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    remove: async (productId, variantSku = null) => {
      try {
        const response = await apiRequest('/customer/cart/remove', {
          method: 'DELETE',
          body: { 
            product_id: productId, 
            variant_sku: variantSku || "" 
          },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    clear: async () => {
      try {
        const response = await apiRequest('/customer/cart/clear', {
          method: 'DELETE',
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
  },
  
  // ==================== WISHLIST OPERATIONS ====================
  wishlist: {
    add: async (productId) => {
      try {
        const response = await apiRequest('/customer/wishlist/add', {
          method: 'POST',
          body: { product_id: productId },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    get: async () => {
      try {
        const response = await apiRequest('/customer/wishlist');
        
        let wishlistData = [];
        if (response && response.products && Array.isArray(response.products)) {
          wishlistData = response.products;
        } else if (response && response.data && Array.isArray(response.data)) {
          wishlistData = response.data;
        } else if (Array.isArray(response)) {
          wishlistData = response;
        }
        
        return wishlistData;
      } catch (error) {
        return [];
      }
    },
    
    remove: async (productId) => {
      try {
        const response = await apiRequest('/customer/wishlist/remove', {
          method: 'DELETE',
          body: { product_id: productId },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    clear: async () => {
      try {
        const response = await apiRequest('/customer/wishlist/clear', {
          method: 'DELETE',
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
  },
  
  // ==================== ORDERS ====================
  orders: {
    create: async (addressId, paymentMethod = 'cod', notes = '', couponCode = null) => {
      try {
        const cartItems = await getCartItemsFromAPI();
        
        if (!cartItems || cartItems.length === 0) {
          throw new Error('Cannot create order: Cart is empty');
        }
        
        // Get current user info from multiple sources
        const currentUser = getCurrentUser();
        
        // Get address details
        let addressDetails = null;
        try {
          const addressesResponse = await customerApi.addresses.getAll();
          let addresses = [];
          if (addressesResponse && addressesResponse.addresses) {
            addresses = addressesResponse.addresses;
          } else if (addressesResponse && addressesResponse.data) {
            addresses = addressesResponse.data;
          } else if (Array.isArray(addressesResponse)) {
            addresses = addressesResponse;
          }
          
          addressDetails = addresses.find(addr => (addr._id || addr.id) === addressId);
        } catch (addrError) {
          // Silent fail
        }
        
        // Calculate totals from cart items
        let subtotal = 0;
        const orderItems = cartItems.map(item => {
          const price = item.price || item.product_price || 0;
          const quantity = item.quantity || 1;
          const itemTotal = price * quantity;
          subtotal += itemTotal;
          
          return {
            product_id: item.product_id || item.id,
            variant_sku: item.variant_sku || "",
            quantity: quantity,
            price: price,
            product_name: item.name || item.product_name,
            subtotal: itemTotal
          };
        });
        
        // Calculate fees
        const shippingCharge = subtotal >= 200 ? 0 : 40;
        const taxAmount = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + shippingCharge + taxAmount;
        
        // Get customer info with proper fallbacks
        const customerName = currentUser?.name || 
                           currentUser?.full_name || 
                           currentUser?.username ||
                           addressDetails?.full_name || 
                           addressDetails?.name || 
                           "Guest";
        
        const customerEmail = currentUser?.email || 
                            addressDetails?.email || 
                            "";
        
        const customerPhone = addressDetails?.phone || 
                            addressDetails?.mobile || 
                            currentUser?.phone || 
                            currentUser?.mobile || 
                            "";
        
        // Prepare order data with ALL fields including customer info
        const orderData = {
          items: orderItems,
          address_id: addressId,
          payment_method: paymentMethod,
          notes: notes || "",
          subtotal: subtotal,
          shipping_charge: shippingCharge,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          order_status: "placed",
          payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
          // Add customer information
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        };
        
        // Add shipping address if available
        if (addressDetails) {
          const validatedAddress = validateAndFixAddress(addressDetails);
          orderData.shipping_address = validatedAddress;
        }
        
        if (couponCode) {
          orderData.coupon_code = couponCode;
        }
        
        const response = await apiRequest('/customer/create', {
          method: 'POST',
          body: orderData,
        });
        
        // Clear cart after successful order
        if (response && (response.status === 'success' || response.data || response.order_id)) {
          try {
            await customerApi.cart.clear();
          } catch (clearError) {
            // Silent fail
          }
        }
        
        return response.data || response;
      } catch (error) {
        throw error;
      }
    },
    
    getMyOrders: async (page = 1, limit = 10, statusFilter = null) => {
      try {
        let url = `/customer/orders?page=${page}&limit=${limit}`;
        if (statusFilter) url += `&status_filter=${statusFilter}`;
        const response = await apiRequest(url);
        
        if (response.orders) return response.orders;
        if (response.data && response.data.orders) return response.data.orders;
        if (Array.isArray(response)) return response;
        return [];
      } catch (error) {
        return [];
      }
    },
    
    getDetails: async (orderId) => {
      try {
        const response = await apiRequest(`/customer/orders/${orderId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    cancel: async (orderId) => {
      try {
        const response = await apiRequest(`/customer/orders/${orderId}/cancel`, {
          method: 'PUT',
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    getInvoice: async (orderId) => {
      try {
        const response = await apiRequest(`/customer/orders/invoice/${orderId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
  },
  
  // ==================== ADDRESSES ====================
  addresses: {
    getAll: async () => {
      try {
        const response = await apiRequest('/customer/customer/addresses');
        
        let addresses = [];
        if (response && response.addresses && Array.isArray(response.addresses)) {
          addresses = response.addresses;
        } else if (response && response.data && Array.isArray(response.data)) {
          addresses = response.data;
        } else if (Array.isArray(response)) {
          addresses = response;
        }
        
        return { addresses: addresses, ...response };
      } catch (error) {
        return { addresses: [] };
      }
    },
    
    add: async (addressData) => {
      try {
        const response = await apiRequest('/customer/customer/addresses', {
          method: 'POST',
          body: addressData,
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    getById: async (addressId) => {
      if (!addressId) {
        throw new Error("Address ID is required");
      }
      try {
        const response = await apiRequest(`/customer/customer/addresses/${addressId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    update: async (addressId, addressData) => {
      if (!addressId) {
        throw new Error("Address ID is required");
      }
      try {
        const response = await apiRequest(`/customer/customer/addresses/${addressId}`, {
          method: 'PUT',
          body: addressData,
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    delete: async (addressId) => {
      if (!addressId) {
        throw new Error("Address ID is required");
      }
      try {
        const response = await apiRequest(`/customer/customer/addresses/${addressId}`, {
          method: 'DELETE',
        });
        return response;
      } catch (error) {
        throw new Error("Failed to delete address. Please try again.");
      }
    },
    
    setDefault: async (addressId) => {
      if (!addressId) {
        throw new Error("Address ID is required");
      }
      try {
        const response = await apiRequest(`/customer/customer/addresses/${addressId}/default`, {
          method: 'PUT',
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
  },
  
  // ==================== AUTH / PROFILE ====================
  getMe: async () => {
    try {
      const response = await apiRequest('/auth/me');
      // Store user data after fetching
      if (response && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  updateProfile: async (userData) => {
    try {
      const response = await apiRequest('/auth/me', {
        method: 'PUT',
        body: userData,
      });
      // Update stored user data
      if (response && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response;
    } catch (error) {
      throw new Error("Profile update failed. Please contact support.");
    }
  },
  
  updatePassword: async (passwordData) => {
    try {
      const response = await apiRequest('/auth/updatePass', {
        method: 'POST',
        body: {
          email: passwordData.email,
          oldPassword: passwordData.oldPassword,
          password: passwordData.password,
          passwordConfirm: passwordData.passwordConfirm
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // ==================== HELPER METHODS ====================
  getOrders: async (page = 1, limit = 10, statusFilter = null) => {
    return customerApi.orders.getMyOrders(page, limit, statusFilter);
  },
  
  getAddresses: async () => {
    const response = await customerApi.addresses.getAll();
    return response.addresses || response.data || [];
  },
  
  addAddress: async (addressData) => {
    return customerApi.addresses.add(addressData);
  },
  
  updateAddress: async (addressId, addressData) => {
    return customerApi.addresses.update(addressId, addressData);
  },
  
  deleteAddress: async (addressId) => {
    return customerApi.addresses.delete(addressId);
  },
  
  setDefaultAddress: async (addressId) => {
    return customerApi.addresses.setDefault(addressId);
  },
  
  addToCart: async (productId, variantSku = null, quantity = 1) => {
    return customerApi.cart.add(productId, quantity, variantSku);
  },
  
  getCart: async () => {
    return customerApi.cart.get();
  },
  
  updateCartItem: async (productId, quantity, variantSku = null) => {
    return customerApi.cart.update(productId, quantity, variantSku);
  },
  
  removeFromCart: async (productId, variantSku = null) => {
    return customerApi.cart.remove(productId, variantSku);
  },
  
  clearCart: async () => {
    return customerApi.cart.clear();
  },
  
  addToWishlist: async (productId) => {
    return customerApi.wishlist.add(productId);
  },
  
  getWishlist: async () => {
    return customerApi.wishlist.get();
  },
  
  removeFromWishlist: async (productId) => {
    return customerApi.wishlist.remove(productId);
  },
  
  clearWishlist: async () => {
    return customerApi.wishlist.clear();
  },
  
  createOrder: async (addressId, paymentMethod = 'cod', notes = '', couponCode = null) => {
    return customerApi.orders.create(addressId, paymentMethod, notes, couponCode);
  }
};

export default customerApi;