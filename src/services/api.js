// src/services/api.js
const API_BASE_URL = 'https://dailybasket.cloud';

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('authToken');
}

// Check if endpoint is public (no auth required)
function isPublicEndpoint(endpoint) {
  const publicEndpoints = [
    '/customer/products',
    '/customer/categories',
    '/auth/signin',
    '/auth/signup',
    '/auth/verify',
    '/auth/forgotPass',
    '/auth/resetPass',
    '/',
    '/health'
  ];
  
  return publicEndpoints.some(function(pubEndpoint) {
    return endpoint === pubEndpoint || endpoint.startsWith(pubEndpoint + '?');
  });
}

// Helper function for API calls
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const isPublic = isPublicEndpoint(endpoint);
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token && !isPublic) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  
  const config = {
    method: options.method || 'GET',
    headers: headers,
  };
  
  // Handle request body - FIXED: Don't double stringify
  if (options.body) {
    // If body is already a string, use it directly
    if (typeof options.body === 'string') {
      config.body = options.body;
    } else {
      config.body = JSON.stringify(options.body);
    }
  }
  
  try {
    const response = await fetch(API_BASE_URL + endpoint, config);
    
    // Handle unauthorized
    if (response.status === 401) {
      throw new Error('Not authenticated. Please login again.');
    }
    
    // Handle 403 Forbidden
    if (response.status === 403) {
      throw new Error('Access forbidden. You do not have permission to access this resource.');
    }
    
    // Handle 404
    if (response.status === 404) {
      throw new Error('Resource not found: ' + endpoint);
    }
    
    // Handle 405 Method Not Allowed
    if (response.status === 405) {
      throw new Error(`Method ${config.method} not allowed for ${endpoint}`);
    }
    
    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error('Server returned ' + response.status + ': ' + text.substring(0, 100));
    }
    
    // Log detailed error for non-ok responses
    if (!response.ok) {
      // Extract meaningful error message
      let errorMessage = 'Request failed';
      
      if (data.detail) {
        if (Array.isArray(data.detail)) {
          const errors = data.detail.map(function(err) {
            const field = err.loc ? err.loc.join('.') : 'unknown';
            return field + ': ' + err.msg;
          });
          errorMessage = errors.join(', ');
        } else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else {
          errorMessage = JSON.stringify(data.detail);
        }
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      }
      
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

export default apiRequest;