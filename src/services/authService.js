import axios from 'axios';

// Use environment variable or hardcode for now
const API_BASE_URL = 'https://dailybasket.cloud';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120000, // Increased to 120 seconds for Render free tier cold starts
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.userMessage = 'Request timeout. Server might be waking up. Please try again in 30 seconds.';
    } else if (!error.response) {
      error.userMessage = 'Cannot connect to server. Please check if backend is running.';
    } else if (error.response.status === 500) {
      error.userMessage = 'Server error. Please try again later.';
    } else if (error.response.status === 422) {
      error.userMessage = 'Validation error. Please check your input.';
    } else if (error.response.status === 401) {
      error.userMessage = 'Invalid credentials.';
    } else if (error.response.status === 403) {
      error.userMessage = 'Access forbidden. Please check your credentials.';
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  // Signup user
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify', { email, otp });
    return response.data;
  },

  // Signin user
  signin: async (email, password) => {
    const response = await api.post('/auth/signin', { email, password });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgotPass', { email });
    return response.data;
  },

  // Reset password with OTP
  resetPassword: async (email, otp, password, passwordConfirm) => {
    const response = await api.post('/auth/resetPass', {
      email,
      otp,
      password,
      passwordConfirm,
    });
    return response.data;
  },

  // Update password (authenticated)
  updatePassword: async (email, oldPassword, password, passwordConfirm) => {
    const response = await api.post('/auth/updatePass', {
      email,
      oldPassword,
      password,
      passwordConfirm,
    });
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Google login
  googleLogin: async (token) => {
    const response = await api.post('/auth/auth/google', { token });
    return response.data;
  },
};

// Named exports for convenience
export const signup = authService.signup;
export const verifyOTP = authService.verifyOTP;
export const signin = authService.signin;
export const forgotPassword = authService.forgotPassword;
export const resetPassword = authService.resetPassword;
export const updatePassword = authService.updatePassword;
export const getMe = authService.getMe;
export const googleLogin = authService.googleLogin;