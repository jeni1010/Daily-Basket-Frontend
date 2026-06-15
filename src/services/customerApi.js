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
    console.error('Error fetching cart items:', error);
    return [];
  }
}

// Helper function to get product by ID (for variant checking)
async function getProductById(productId) {
  try {
    const response = await apiRequest(`/customer/products?search=${productId}`);
    let products = [];
    if (response && response.products && Array.isArray(response.products)) {
      products = response.products;
    } else if (Array.isArray(response)) {
      products = response;
    }
    return products.find(p => p._id === productId || p.id === productId);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
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
    const userStr = localStorage.getItem('user') || 
                    localStorage.getItem('userData') || 
                    sessionStorage.getItem('user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
    }
    
    if (!currentUser) {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedToken = JSON.parse(atob(base64));
          if (decodedToken) {
            currentUser = {
              id: decodedToken.id || decodedToken.userId || decodedToken.sub,
              name: decodedToken.name || decodedToken.username || decodedToken.full_name || decodedToken.fullName,
              email: decodedToken.email,
              phone: decodedToken.phone || decodedToken.mobile || decodedToken.phoneNumber
            };
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
        }
      }
    }
  } catch (e) {
    console.error('Error getting current user:', e);
  }
  
  return currentUser;
}

// Helper function to check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return !!token;
}

// Helper function to clear all auth data
function clearAuthData() {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

// Cache for product variant info
const productVariantCache = new Map();

// Cache for wishlist data
let wishlistCache = null;
let lastWishlistFetch = 0;
const WISHLIST_CACHE_DURATION = 5000;

// Prevention flags for duplicate API calls
let isCreatingOrder = false;
let isClearingCart = false;
let isCreatingRazorpayOrder = false;
let lastOrderIdProcessed = null;
let lastProcessTime = 0;

// Wishlist request deduplication
let pendingWishlistRequest = null;
let pendingAddRequest = null;
let pendingRemoveRequest = null;
let lastRemoveTime = 0;
const REMOVE_DEBOUNCE_TIME = 1000;

export const customerApi = {
  // ==================== AUTH METHODS ====================
  auth: {
    login: async (email, password) => {
      try {
        const response = await apiRequest('/auth/signin', {
          method: 'POST',
          body: { email, password },
        });
        
        console.log('Login response:', response);
        
        const token = response.token || response.accessToken || response.data?.token;
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('authToken', token);
          console.log('Token stored successfully');
        }
        
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        
        const user = response.user || response.data?.user || response.data;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return response;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    
    register: async (userData) => {
      try {
        const response = await apiRequest('/auth/signup', {
          method: 'POST',
          body: {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            passwordConfirm: userData.passwordConfirm || userData.password
          },
        });
        
        console.log('Register response:', response);
        
        const token = response.token || response.accessToken || response.data?.token;
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('authToken', token);
        }
        
        const user = response.user || response.data?.user || response.data;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    verifyOtp: async (email, otp) => {
      try {
        const response = await apiRequest('/auth/verify', {
          method: 'POST',
          body: { email, otp },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    forgotPassword: async (email) => {
      try {
        const response = await apiRequest('/auth/forgotPass', {
          method: 'POST',
          body: { email },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    resetPassword: async (email, otp, password, passwordConfirm) => {
      try {
        const response = await apiRequest('/auth/resetPass', {
          method: 'POST',
          body: { email, otp, password, passwordConfirm },
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    getMe: async () => {
      try {
        const response = await apiRequest('/auth/me', {
          method: 'GET',
        });
        if (response && response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    logout: () => {
      clearAuthData();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signin') {
        window.location.href = '/signin';
      }
    },
    
    isAuthenticated: () => {
      return isAuthenticated();
    },
    
    getCurrentUser: () => {
      return getCurrentUser();
    },
  },

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
      console.error('Error fetching products:', error);
      return [];
    }
  },
  
  getProductById: async (productId) => {
    try {
      if (productVariantCache.has(productId)) {
        return productVariantCache.get(productId);
      }
      
      const products = await customerApi.getProducts({ limit: 100 });
      const product = products.find(p => p._id === productId || p.id === productId);
      
      if (product) {
        productVariantCache.set(productId, product);
      }
      
      return product;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  },
  
  getProductBySlug: async (slug) => {
    try {
      const response = await apiRequest(`/customer/products/${slug}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching product by slug:', error);
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
      console.error('Error fetching categories:', error);
      return [];
    }
  },
  
  // ==================== COUPONS ====================
  getCustomerCoupons: async () => {
    try {
      const response = await apiRequest('/customer/coupons');
      return response;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return { coupons: [] };
    }
  },
  
  // ==================== CART OPERATIONS ====================
  cart: {
    add: async (productId, quantity = 1, variantSku = null) => {
      try {
        let finalVariantSku = variantSku || "";
        
        if (!finalVariantSku) {
          try {
            const product = await customerApi.getProductById(productId);
            if (product && product.has_variants === true && product.variants && product.variants.length > 0) {
              finalVariantSku = product.variants[0].sku;
              console.log('Using first variant SKU:', finalVariantSku);
            }
          } catch (err) {
            console.log('Could not fetch product, sending empty variant_sku');
          }
        }
        
        const response = await apiRequest('/customer/cart/add', {
          method: 'POST',
          body: { 
            product_id: productId, 
            quantity: quantity, 
            variant_sku: finalVariantSku 
          },
        });
        return response;
      } catch (error) {
        console.error('Error adding to cart:', error);
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
        console.error('Error fetching cart:', error);
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
        if (!productId) {
          throw new Error("Product ID is required");
        }
        const response = await apiRequest('/customer/cart/remove', {
          method: 'DELETE',
          body: { 
            product_id: productId, 
            variant_sku: variantSku || "" 
          },
        });
        return response;
      } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }
    },
    
    clear: async () => {
      if (isClearingCart) {
        console.log('Cart clear already in progress, skipping...');
        return;
      }
      
      try {
        isClearingCart = true;
        const response = await apiRequest('/customer/cart/clear', {
          method: 'DELETE',
        });
        return response;
      } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
      } finally {
        setTimeout(() => {
          isClearingCart = false;
        }, 500);
      }
    },
  },
  
  // ==================== WISHLIST OPERATIONS ====================
  wishlist: {
    add: async (productId) => {
      if (!productId) {
        throw new Error("Product ID is required");
      }
      
      const requestKey = `add:${productId}`;
      
      if (pendingAddRequest && pendingAddRequest.key === requestKey) {
        console.log(`Using pending add request for product: ${productId}`);
        return pendingAddRequest.promise;
      }
      
      console.log('Adding to wishlist:', productId);
      
      const promise = (async () => {
        try {
          const response = await apiRequest('/customer/wishlist/add', {
            method: 'POST',
            body: { product_id: productId },
          });
          wishlistCache = null;
          return response;
        } catch (error) {
          console.error('Error adding to wishlist:', error);
          throw error;
        } finally {
          if (pendingAddRequest && pendingAddRequest.key === requestKey) {
            pendingAddRequest = null;
          }
        }
      })();
      
      pendingAddRequest = { key: requestKey, promise };
      return promise;
    },
    
    get: async (forceRefresh = false) => {
      if (pendingWishlistRequest && !forceRefresh) {
        console.log('Using pending wishlist request');
        return pendingWishlistRequest;
      }
      
      const now = Date.now();
      if (!forceRefresh && wishlistCache && (now - lastWishlistFetch) < WISHLIST_CACHE_DURATION) {
        console.log('Using cached wishlist data');
        return wishlistCache;
      }
      
      const promise = (async () => {
        try {
          const response = await apiRequest('/customer/wishlist');
          console.log('Wishlist get response:', response);
          
          let wishlistData = [];
          if (response && response.products && Array.isArray(response.products)) {
            wishlistData = response.products;
          } else if (response && response.data && Array.isArray(response.data)) {
            wishlistData = response.data;
          } else if (Array.isArray(response)) {
            wishlistData = response;
          }
          
          wishlistCache = wishlistData;
          lastWishlistFetch = now;
          
          return wishlistData;
        } catch (error) {
          console.error('Error fetching wishlist:', error);
          return wishlistCache || [];
        } finally {
          pendingWishlistRequest = null;
        }
      })();
      
      pendingWishlistRequest = promise;
      return promise;
    },
    
    remove: async (productId) => {
      if (!productId) {
        throw new Error("Product ID is required");
      }
      
      const now = Date.now();
      if ((now - lastRemoveTime) < REMOVE_DEBOUNCE_TIME) {
        console.log(`Debouncing duplicate remove request for product: ${productId}`);
        return { success: true, debounced: true };
      }
      
      const requestKey = `remove:${productId}`;
      
      if (pendingRemoveRequest && pendingRemoveRequest.key === requestKey) {
        console.log(`Using pending remove request for product: ${productId}`);
        return pendingRemoveRequest.promise;
      }
      
      console.log('Removing from wishlist:', productId);
      lastRemoveTime = now;
      
      const promise = (async () => {
        try {
          const response = await apiRequest('/customer/wishlist/remove', {
            method: 'DELETE',
            body: { product_id: productId },
          });
          wishlistCache = null;
          return response;
        } catch (error) {
          console.error('Error removing from wishlist:', error);
          if (error.status === 404) {
            console.log('Product was not in wishlist');
            return { success: true, alreadyRemoved: true };
          }
          throw error;
        } finally {
          if (pendingRemoveRequest && pendingRemoveRequest.key === requestKey) {
            pendingRemoveRequest = null;
          }
        }
      })();
      
      pendingRemoveRequest = { key: requestKey, promise };
      return promise;
    },
    
    clear: async () => {
      try {
        const response = await apiRequest('/customer/wishlist/clear', {
          method: 'DELETE',
        });
        wishlistCache = null;
        return response;
      } catch (error) {
        console.error('Error clearing wishlist:', error);
        throw error;
      }
    },
    
    isInWishlist: async (productId) => {
      const wishlist = await customerApi.wishlist.get();
      return wishlist.some(item => (item._id === productId || item.id === productId));
    },
    
    refreshCache: () => {
      wishlistCache = null;
      lastWishlistFetch = 0;
      pendingWishlistRequest = null;
      pendingAddRequest = null;
      pendingRemoveRequest = null;
    },
  },
  
  // ==================== ORDERS ====================
  orders: {
    create: async (addressId, paymentMethod = 'cod', notes = '', couponCode = null) => {
      if (isCreatingOrder) {
        console.log('Order creation already in progress, skipping...');
        return;
      }
      
      try {
        isCreatingOrder = true;
        
        const cartItems = await getCartItemsFromAPI();
        
        if (!cartItems || cartItems.length === 0) {
          throw new Error('Cannot create order: Cart is empty');
        }
        
        const currentUser = getCurrentUser();
        
        let addressDetails = null;
        let couponDetails = null;
        
        // ✅ Get coupon details if coupon code is provided
        if (couponCode) {
          try {
            const couponsResponse = await customerApi.getCustomerCoupons();
            let coupons = [];
            if (couponsResponse && couponsResponse.coupons) {
              coupons = couponsResponse.coupons;
            } else if (Array.isArray(couponsResponse)) {
              coupons = couponsResponse;
            }
            couponDetails = coupons.find(c => c.code === couponCode);
            console.log('✅ Found coupon details:', couponDetails);
          } catch (err) {
            console.error('Error fetching coupon:', err);
          }
        }
        
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
          console.error('Error fetching address details:', addrError);
        }
        
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
        
        // ✅ Calculate discount if coupon applied
        let discountAmount = 0;
        if (couponCode && couponDetails) {
          if (couponDetails.coupon_type === 'percentage') {
            discountAmount = (subtotal * couponDetails.discount_value) / 100;
            if (couponDetails.maximum_discount_amount) {
              discountAmount = Math.min(discountAmount, couponDetails.maximum_discount_amount);
            }
          } else if (couponDetails.coupon_type === 'fixed') {
            discountAmount = Math.min(couponDetails.discount_value, subtotal);
          }
          discountAmount = Math.round(discountAmount);
          console.log(`✅ Coupon discount applied: ₹${discountAmount}`);
        }
        
        const discountedSubtotal = subtotal - discountAmount;
        const shippingCharge = discountedSubtotal >= 200 ? 0 : 40;
        const taxAmount = Math.round(discountedSubtotal * 0.05);
        const grandTotal = discountedSubtotal + shippingCharge + taxAmount;
        
        const customerName = currentUser?.name || 
                           currentUser?.full_name || 
                           currentUser?.username ||
                           addressDetails?.full_name || 
                           addressDetails?.name || 
                           "Guest";
        
        const customerEmail = currentUser?.email || addressDetails?.email || "";
        const customerPhone = addressDetails?.phone || addressDetails?.mobile || currentUser?.phone || currentUser?.mobile || "";
        
        const orderData = {
          items: orderItems,
          address_id: addressId,
          payment_method: paymentMethod,
          notes: notes || "",
          subtotal: subtotal,
          discount_amount: discountAmount,
          shipping_charge: shippingCharge,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          summary: {
            subtotal: subtotal,
            discount: discountAmount,
            discounted_subtotal: discountedSubtotal,
            shipping: shippingCharge,
            tax: taxAmount,
            total: grandTotal,
            amount: grandTotal
          },
          order_status: "placed",
          payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        };
        
        if (addressDetails) {
          const validatedAddress = validateAndFixAddress(addressDetails);
          orderData.shipping_address = validatedAddress;
        }
        
        if (couponCode) {
          orderData.coupon_code = couponCode;
          orderData.coupon_discount = discountAmount;
        }
        
        const response = await apiRequest('/customer/create-order', {
          method: 'POST',
          body: orderData,
        });
        
        let orderId = null;
        if (response && response.data) {
          orderId = response.data._id || response.data.id || response.data.order_id;
          // ✅ Store the discounted amount in the response
          response.data.discounted_amount = grandTotal;
          response.data.original_amount = subtotal;
          response.data.discount_applied = discountAmount;
        } else if (response) {
          orderId = response._id || response.id || response.order_id;
          response.discounted_amount = grandTotal;
          response.original_amount = subtotal;
          response.discount_applied = discountAmount;
        }
        
        return response.data || response;
      } catch (error) {
        console.error('Order creation error:', error);
        throw error;
      } finally {
        setTimeout(() => {
          isCreatingOrder = false;
        }, 500);
      }
    },
    
    createRazorpayOrder: async (amount, currency = "INR", orderId = null) => {
      try {
        if (!isAuthenticated()) {
          console.error('Not authenticated - cannot create Razorpay order');
          const error = new Error('Please login to continue');
          error.requiresLogin = true;
          throw error;
        }
        
        if (!orderId) {
          console.error('No order_id provided for Razorpay order');
          throw new Error('Order ID is required for payment creation');
        }
        
        // ✅ First, get the order details to get the discounted amount
        let orderDetails = null;
        try {
          orderDetails = await customerApi.orders.getDetails(orderId);
          console.log('✅ Fetched order details for Razorpay:', orderDetails);
        } catch (err) {
          console.error('Error fetching order details:', err);
        }
        
        // ✅ Use the discounted amount from the order if available
        let discountedAmount = amount;
        if (orderDetails) {
          discountedAmount = orderDetails.summary?.amount || 
                             orderDetails.grand_total || 
                             orderDetails.discounted_amount ||
                             amount;
          console.log(`✅ Order has discounted amount: ₹${discountedAmount} (original passed: ₹${amount})`);
        }
        
        const now = Date.now();
        if (lastOrderIdProcessed === orderId && (now - lastProcessTime) < 2000) {
          console.log(`Duplicate Razorpay order request detected for orderId: ${orderId}, skipping...`);
          return {
            key_id: null,
            order_id: null,
            amount: discountedAmount,
            currency: currency,
            duplicate: true
          };
        }
        
        if (isCreatingRazorpayOrder) {
          console.log('Razorpay order creation already in progress, waiting...');
          let waited = 0;
          while (isCreatingRazorpayOrder && waited < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waited++;
          }
          if (isCreatingRazorpayOrder) {
            console.log('Timeout waiting for existing Razorpay order creation');
            return {
              key_id: null,
              order_id: null,
              amount: discountedAmount,
              currency: currency,
              duplicate: true
            };
          }
        }
        
        isCreatingRazorpayOrder = true;
        lastOrderIdProcessed = orderId;
        lastProcessTime = now;
        
        console.log('Creating Razorpay payment for order_id:', orderId);
        console.log('✅ Amount to be paid (discounted):', discountedAmount);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
          // ✅ Send the discounted amount to the backend
          const response = await apiRequest(`/payments/create-order/${orderId}`, {
            method: 'POST',
            body: { amount: discountedAmount }
          });
          
          clearTimeout(timeoutId);
          console.log('Razorpay order response:', response);
          
          const responseData = response.data || response;
          
          return {
            key_id: responseData.key_id || responseData.razorpay_key_id,
            order_id: responseData.order_id || responseData.razorpay_order_id,
            amount: responseData.amount || discountedAmount,
            currency: responseData.currency || currency,
            ...response
          };
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            console.error('Request timeout');
            throw new Error('Request timed out. Please try again.');
          }
          throw error;
        } finally {
          isCreatingRazorpayOrder = false;
        }
      } catch (error) {
        console.error('Error creating Razorpay order:', error);
        isCreatingRazorpayOrder = false;
        
        if (error.message === 'Session expired. Please login again.' || error.status === 401) {
          clearAuthData();
          const loginError = new Error('Your session has expired. Please login again.');
          loginError.requiresLogin = true;
          throw loginError;
        }
        throw error;
      }
    },
    
    verifyPayment: async (paymentData) => {
      try {
        const response = await apiRequest('/customer/verify-payment', {
          method: 'POST',
          body: paymentData,
        });
        console.log('Payment verification response:', response);
        return response;
      } catch (error) {
        console.error('Error verifying payment:', error);
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
        console.error('Error fetching orders:', error);
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
        console.error('Error fetching addresses:', error);
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
      if (!addressId) throw new Error("Address ID is required");
      try {
        const response = await apiRequest(`/customer/customer/addresses/${addressId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    update: async (addressId, addressData) => {
      if (!addressId) throw new Error("Address ID is required");
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
      if (!addressId) throw new Error("Address ID is required");
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
      if (!addressId) throw new Error("Address ID is required");
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
  
  // ==================== PROFILE ====================
  updateProfile: async (userData) => {
    try {
      const response = await apiRequest('/customer/profile', {
        method: 'PUT',
        body: userData,
      });
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
  
  // ==================== RAZORPAY HELPER ====================
  loadRazorpayScript: () => {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
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
  
  getWishlist: async (forceRefresh = false) => {
    return customerApi.wishlist.get(forceRefresh);
  },
  
  removeFromWishlist: async (productId) => {
    return customerApi.wishlist.remove(productId);
  },
  
  clearWishlist: async () => {
    return customerApi.wishlist.clear();
  },
  
  isInWishlist: async (productId) => {
    return customerApi.wishlist.isInWishlist(productId);
  },
  
  refreshWishlistCache: () => {
    customerApi.wishlist.refreshCache();
  },
  
  createOrder: async (addressId, paymentMethod = 'cod', notes = '', couponCode = null) => {
    return customerApi.orders.create(addressId, paymentMethod, notes, couponCode);
  },
  
  createRazorpayOrder: async (amount, currency = "INR", orderId = null) => {
    return customerApi.orders.createRazorpayOrder(amount, currency, orderId);
  },
  
  verifyRazorpayPayment: async (paymentData) => {
    return customerApi.orders.verifyPayment(paymentData);
  },
  
  isLoggedIn: () => {
    return isAuthenticated();
  },
  
  logout: () => {
    return customerApi.auth.logout();
  }
};

export default customerApi;