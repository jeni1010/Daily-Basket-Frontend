import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import SignupPage from './pages/auth/SignupPage';
import SigninPage from './pages/auth/SigninPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import HowItWorksPage from './pages/HowItWorksPage';

// Admin imports
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminCoupons } from './pages/admin/AdminCoupons';

// User imports
import { UserDashboard } from './pages/user/userDashboard';
import { ProductListingPage } from './pages/user/ProductListingPage';
import { ProductDetailPage } from './pages/user/ProductDetailPage';
import { CartPage } from './pages/user/CartPage';
import { CheckoutPage } from './pages/user/CheckoutPage';
import OrdersPage from './pages/user/OrdersPage';
import { OrderSuccessPage } from './pages/user/OrderSuccessPage';
import ProfilePage from './pages/user/ProfilePage';
import { WishlistPage } from './pages/user/WishlistPage';

// Protected Route wrapper for user routes
const UserProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3A7D44] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
};

// Admin Protected Route wrapper
const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3A7D44] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  // Check role from multiple possible locations
  const userRole = user?.role || 
                  user?.user?.role || 
                  user?.data?.role ||
                  user?.user?.user?.role;
  
  console.log('AdminProtectedRoute - User role:', userRole);
  console.log('User object:', user);
  
  const isAdmin = userRole === 'admin' || 
                  userRole === 'ADMIN' || 
                  userRole === 'super_admin' ||
                  userRole === 'Super Admin' ||
                  userRole === 'administrator' ||
                  userRole === 'Administrator';
  
  console.log('Is admin:', isAdmin);
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  // Wake up backend when app loads
  useEffect(() => {
    const wakeUpBackend = async () => {
      try {
        console.log('🌤️ Waking up backend...');
        await fetch('https://dailybasket.cloud/');
        console.log('✅ Backend is awake');
      } catch (error) {
        console.log('⏰ Backend is waking up...');
      }
    };
    
    wakeUpBackend();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signin" element={<SigninPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* User Product Routes (Public) */}
            <Route path="/products" element={<ProductListingPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            
            {/* How It Works Route */}
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            
            {/* User Dashboard Route */}
            <Route 
              path="/dashboard" 
              element={
                <UserProtectedRoute>
                  <UserDashboard />
                </UserProtectedRoute>
              } 
            />
            
            {/* Protected User Routes */}
            <Route path="/cart" element={
              <UserProtectedRoute>
                <CartPage />
              </UserProtectedRoute>
            } />
            <Route path="/checkout" element={
              <UserProtectedRoute>
                <CheckoutPage />
              </UserProtectedRoute>
            } />
            <Route path="/orders" element={
              <UserProtectedRoute>
                <OrdersPage />
              </UserProtectedRoute>
            } />
            <Route path="/orders/:orderId" element={
              <UserProtectedRoute>
                <OrderSuccessPage />
              </UserProtectedRoute>
            } />
            <Route path="/profile" element={
              <UserProtectedRoute>
                <ProfilePage />
              </UserProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <UserProtectedRoute>
                <WishlistPage />
              </UserProtectedRoute>
            } />
            
            {/* Admin Routes with Layout */}
            <Route 
              path="/admin" 
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="coupons" element={<AdminCoupons />} />
            </Route>
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;