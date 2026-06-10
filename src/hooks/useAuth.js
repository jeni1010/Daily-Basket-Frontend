// hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { customerApi } from '../services/customerApi';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await customerApi.auth.login(email, password);
      if (response.token || response.accessToken) {
        checkAuth();
        return { success: true, data: response };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await customerApi.auth.register(userData);
      if (response.token || response.accessToken) {
        checkAuth();
        return { success: true, data: response };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    customerApi.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshSession = async () => {
    try {
      const success = await customerApi.auth.refreshToken();
      if (success) {
        checkAuth();
      }
      return success;
    } catch (error) {
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshSession,
    checkAuth,
  };
};