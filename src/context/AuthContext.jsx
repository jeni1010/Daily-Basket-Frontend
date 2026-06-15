// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

// Helper function to extract user from token
const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (decoded) {
    return {
      id: decoded.id || decoded.userId || decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.full_name || decoded.username,
      role: decoded.role || decoded.user_role,
      phone: decoded.phone || decoded.mobile,
    };
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const userData = await authService.getMe();
        const userInfo = userData.user || userData;
        
        console.log('Auth check - User role:', userInfo?.role);
        
        setUser(userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
      } catch (err) {
        console.error('Auth check failed:', err);
        
        // If CORS error or network error, try to decode token
        if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || err.message?.includes('CORS')) {
          console.log('Network/CORS error detected, falling back to token decoding');
          const userFromToken = getUserFromToken(token);
          
          if (userFromToken) {
            console.log('User extracted from token:', userFromToken);
            setUser(userFromToken);
            localStorage.setItem('user', JSON.stringify(userFromToken));
          } else {
            // Token is invalid or expired
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        } else {
          // Other errors - clear auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Unexpected auth check error:', err);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setError(null);
    try {
      const response = await authService.signup(userData);
      return response;
    } catch (err) {
      console.error('Signup error in context:', err);
      
      let errorMessage = 'Signup failed';
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map(e => {
            const field = e.loc[e.loc.length - 1];
            return `${field}: ${e.msg}`;
          }).join(', ');
        } else {
          errorMessage = detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  const verifyOTP = async (email, otp) => {
    setError(null);
    try {
      const response = await authService.verifyOTP(email, otp);
      
      if (response.token || response.access_token) {
        const token = response.token || response.access_token;
        localStorage.setItem('authToken', token);
        await checkAuth();
      }
      return response;
    } catch (err) {
      console.error('OTP verification error:', err);
      
      let errorMessage = 'OTP verification failed';
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  const signin = async (email, password) => {
    setError(null);
    try {
      const response = await authService.signin(email, password);
      
      const token = response.access_token || response.token;
      if (token) {
        localStorage.setItem('authToken', token);
        
        try {
          const userData = await authService.getMe();
          const userInfo = userData.user || userData;
          
          console.log('Signin - User data:', userInfo);
          console.log('Signin - User role:', userInfo?.role);
          
          setUser(userInfo);
          localStorage.setItem('user', JSON.stringify(userInfo));
          response.user = userInfo;
          response.role = userInfo?.role;
        } catch (userErr) {
          console.error('Failed to fetch user data, falling back to token decode:', userErr);
          
          // Fallback to token decoding
          const userFromToken = getUserFromToken(token);
          if (userFromToken) {
            setUser(userFromToken);
            localStorage.setItem('user', JSON.stringify(userFromToken));
            response.user = userFromToken;
            response.role = userFromToken?.role;
          } else if (response.user) {
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
            response.role = response.user?.role;
          }
        }
      }
      return response;
    } catch (err) {
      console.error('Signin error:', err);
      
      let errorMessage = 'Signin failed';
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (err) {
      console.error('Forgot password error:', err);
      
      let errorMessage = 'Forgot password request failed';
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  const resetPassword = async (email, otp, password, passwordConfirm) => {
    setError(null);
    try {
      const response = await authService.resetPassword(email, otp, password, passwordConfirm);
      return response;
    } catch (err) {
      console.error('Reset password error:', err);
      
      let errorMessage = 'Password reset failed';
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  const updatePassword = async (email, oldPassword, newPassword, passwordConfirm) => {
    setError(null);
    try {
      const response = await authService.updatePassword(email, oldPassword, newPassword, passwordConfirm);
      return response;
    } catch (err) {
      console.error('Update password error:', err);
      
      let errorMessage = 'Password update failed';
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  const googleLogin = async (token) => {
    setError(null);
    try {
      const response = await authService.googleLogin(token);
      
      const authToken = response.token || response.access_token;
      if (authToken) {
        localStorage.setItem('authToken', authToken);
        
        try {
          const userData = await authService.getMe();
          const userInfo = userData.user || userData;
          
          console.log('Google login - User role:', userInfo?.role);
          
          setUser(userInfo);
          localStorage.setItem('user', JSON.stringify(userInfo));
        } catch (userErr) {
          console.error('Failed to fetch user data after Google login, falling back to token decode:', userErr);
          
          // Fallback to token decoding
          const userFromToken = getUserFromToken(authToken);
          if (userFromToken) {
            setUser(userFromToken);
            localStorage.setItem('user', JSON.stringify(userFromToken));
          } else if (response.user) {
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        }
      }
      return response;
    } catch (err) {
      console.error('Google login error:', err);
      
      let errorMessage = 'Google login failed';
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Helper method to refresh user data
  const refreshUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      return;
    }
    
    try {
      const userData = await authService.getMe();
      const userInfo = userData.user || userData;
      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // Fallback to token decoding
      const userFromToken = getUserFromToken(token);
      if (userFromToken) {
        setUser(userFromToken);
        localStorage.setItem('user', JSON.stringify(userFromToken));
      }
    }
  };

  const value = {
    user,
    loading,
    error,
    signup,
    verifyOTP,
    signin,
    forgotPassword,
    resetPassword,
    updatePassword,
    googleLogin,
    logout,
    refreshUser,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};