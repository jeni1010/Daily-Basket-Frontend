// src/services/api.js
const API_BASE_URL = 'https://dailybasket.cloud';

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('authToken') || 
         localStorage.getItem('token') || 
         localStorage.getItem('accessToken');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
  }
}

function clearAuthData() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

// Updated with correct endpoints from API docs
function isPublicEndpoint(endpoint) {
  const publicEndpoints = [
    // Auth endpoints
    '/auth/signin',
    '/auth/signup', 
    '/auth/verify',
    '/auth/forgotPass',
    '/auth/resetPass',
    '/auth/auth/google',
    
    // Customer public endpoints
    '/customer/products',
    '/customer/categories',
    
    // Health and root
    '/',
    '/health'
  ];
  
  return publicEndpoints.some(function(pubEndpoint) {
    return endpoint === pubEndpoint || endpoint.startsWith(pubEndpoint + '?');
  });
}

// Check if endpoint requires auth
function requiresAuth(endpoint) {
  const noAuthEndpoints = [
    '/auth/signin',
    '/auth/signup',
    '/auth/verify', 
    '/auth/forgotPass',
    '/auth/resetPass',
    '/customer/products',
    '/customer/categories',
    '/',
    '/health'
  ];
  
  return !noAuthEndpoints.some(function(noAuthEndpoint) {
    return endpoint === noAuthEndpoint || endpoint.startsWith(noAuthEndpoint + '?');
  });
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const isPublic = isPublicEndpoint(endpoint);
  const needsAuth = requiresAuth(endpoint);
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Add authorization header if token exists and endpoint needs auth
  if (token && needsAuth) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }
  
  const config = {
    method: options.method || 'GET',
    headers: headers,
    credentials: 'include',
  };
  
  // Handle request body
  if (options.body) {
    if (typeof options.body === 'string') {
      config.body = options.body;
    } else {
      config.body = JSON.stringify(options.body);
    }
  }
  
  let url = API_BASE_URL + endpoint;
  if (options.params) {
    const queryParams = new URLSearchParams(options.params).toString();
    url += `?${queryParams}`;
  }
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn(`401 Unauthorized for ${endpoint}`);
      clearAuthData();
      
      // Don't redirect for auth endpoints
      if (!endpoint.includes('/auth/')) {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/signin')) {
          window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
      
      const error = new Error('Session expired. Please login again.');
      error.status = 401;
      throw error;
    }
    
    // Handle 403 Forbidden
    if (response.status === 403) {
      const error = new Error('Access forbidden. You do not have permission.');
      error.status = 403;
      throw error;
    }
    
    // Handle 404
    if (response.status === 404) {
      const error = new Error(`Resource not found: ${endpoint}`);
      error.status = 404;
      throw error;
    }
    
    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { message: text };
        }
      } else {
        data = { message: text };
      }
    }
    
    if (!response.ok) {
      let errorMessage = data.message || data.detail || `Request failed with status ${response.status}`;
      if (data.detail && Array.isArray(data.detail)) {
        errorMessage = data.detail.map(err => err.msg).join(', ');
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network error. Please check your connection.');
      networkError.isNetworkError = true;
      throw networkError;
    }
    
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const apiHelpers = {
  getToken,
  setToken,
  clearAuthData,
  isAuthenticated: () => !!getToken(),
};

export default apiRequest;