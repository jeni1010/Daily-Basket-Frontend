import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import FloatingProduce from "../../components/FloatingProduce";

const SigninPage = () => {
  const navigate = useNavigate();
  const { signin, googleLogin, error, setError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1094270392987-7j5v4s8vjv8vj5v8j5v8j5v8j5v8j5v8.apps.googleusercontent.com';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await signin(formData.email, formData.password);
      
      const token = response.access_token || response.token;
      if (token) {
        localStorage.setItem('authToken', token);
        
        const userRes = await fetch('https://dailybasket.cloud/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          let userRole = userData.user?.role || userData.role || userData.data?.role;
          
          const isAdmin = userRole === 'admin' || 
                         userRole === 'ADMIN' || 
                         userRole === 'super_admin' ||
                         userRole === 'Super Admin' ||
                         userRole === 'administrator';
          
          if (isAdmin) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Signin failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // const handleGoogleSuccess = async (credentialResponse) => {
  //   setGoogleLoading(true);
  //   setError(null);
  //   
  //   try {
  //     const result = await googleLogin(credentialResponse.credential);
  //     
  //     const token = result.token || result.access_token;
  //     if (token) {
  //       localStorage.setItem('authToken', token);
  //       
  //       const userRes = await fetch('https://dailybasket.cloud/auth/me', {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       });
  //       
  //       if (userRes.ok) {
  //         const userData = await userRes.json();
  //         let userRole = userData.user?.role || userData.role || userData.data?.role;
  //         
  //         const isAdmin = userRole === 'admin' || 
  //                        userRole === 'ADMIN' || 
  //                        userRole === 'super_admin';
  //         
  //         if (isAdmin) {
  //           navigate('/admin');
  //         } else {
  //           navigate('/');
  //         }
  //       } else {
  //         navigate('/');
  //       }
  //     } else {
  //       navigate('/');
  //     }
  //   } catch (err) {
  //     setError(err.userMessage || "Google login failed. Please try again.");
  //   } finally {
  //     setGoogleLoading(false);
  //   }
  // };

  // const handleGoogleError = () => {
  //   setError("Google login failed. Please check your Google Client ID configuration.");
  //   setGoogleLoading(false);
  // };

  return (
    // <GoogleOAuthProvider clientId={googleClientId}>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      <FloatingProduce />
      
      <div className="absolute top-0 -left-40 w-80 h-80 bg-[#2E7D32]/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -right-40 w-80 h-80 bg-[#E53935]/5 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-500 hover:text-[#2E7D32] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </motion.button>

          <div className="text-center mb-6">
            <BrandLogo size="lg" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Google Sign In Button - Commented Out */}
              {/* <div className="mb-6">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  text="signin_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="100%"
                />
                {googleLoading && (
                  <div className="mt-2 text-center text-sm text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-[#2E7D32] rounded-full animate-spin" />
                      Signing in...
                    </div>
                  </div>
                )}
              </div> */}

              {/* Divider - Commented Out */}
              {/* <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div> */}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="admin@dailybasket.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-[#2E7D32] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2E7D32] text-white rounded-xl font-semibold shadow-sm hover:bg-[#1B5E20] hover:shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-[#2E7D32] font-semibold hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    // </GoogleOAuthProvider>
  );
};

export default SigninPage;