import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import FloatingProduce from "../../components/FloatingProduce";

const SigninPage = () => {
  const navigate = useNavigate();
  const { signin, error, setError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        
        let userRole = response.user?.role || response.role || response.data?.role;
        
        const isAdmin = userRole === 'admin' || 
                       userRole === 'ADMIN' || 
                       userRole === 'super_admin' ||
                       userRole === 'Super Admin' ||
                       userRole === 'administrator' ||
                       userRole === 'Administrator';
        
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('❌ Signin error:', err);
      setError(err.response?.data?.detail || "Signin failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google login function - COMMENTED OUT
  // const handleGoogleLogin = () => {
  //   console.log("========== GOOGLE LOGIN DEBUG ==========");
  //   console.log("1. Google login button clicked");
  //   
  //   // Check if Google client is available
  //   console.log("2. window.google available?", !!window.google);
  //   console.log("3. window.google.accounts available?", !!window.google?.accounts);
  //   console.log("4. window.google.accounts.oauth2 available?", !!window.google?.accounts?.oauth2);
  //   
  //   const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  //   console.log("5. Client ID from env:", clientId);
  //   console.log("6. Client ID valid?", clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID');
  //   
  //   if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
  //     console.error("❌ Invalid or missing Google Client ID!");
  //     setError("Google Sign-In is not configured. Please use email signin or contact support.");
  //     setGoogleLoading(false);
  //     return;
  //   }
  //   
  //   setGoogleLoading(true);
  //   setError(null);
  //   
  //   try {
  //     console.log("7. Initializing Google token client...");
  //     
  //     // Initialize Google Sign-In
  //     const client = window.google?.accounts?.oauth2?.initTokenClient({
  //       client_id: clientId,
  //       scope: 'email profile openid',
  //       callback: async (tokenResponse) => {
  //         console.log("8. Google token callback received");
  //         console.log("9. Token response:", tokenResponse);
  //         
  //         try {
  //           console.log("10. Sending token to backend...");
  //           
  //           // Send the token to your backend
  //           const response = await fetch('https://dailybasket.cloud/auth/auth/google', {
  //             method: 'POST',
  //             headers: {
  //               'Content-Type': 'application/json',
  //             },
  //             body: JSON.stringify({ 
  //               token: tokenResponse.access_token 
  //             }),
  //           });
  //           
  //           console.log("11. Backend response status:", response.status);
  //           const data = await response.json();
  //           console.log("12. Backend response data:", data);
  //           
  //           if (response.ok) {
  //             console.log("13. Backend authentication successful!");
  //             
  //             // Store token and redirect
  //             const authToken = data.access_token || data.token;
  //             if (authToken) {
  //               localStorage.setItem('authToken', authToken);
  //               console.log("14. Auth token stored");
  //               
  //               // Get user role from response
  //               let userRole = data.user?.role || data.role;
  //               console.log("15. User role from backend:", userRole);
  //               
  //               const isAdmin = userRole === 'admin' || userRole === 'ADMIN' || userRole === 'super_admin';
  //               console.log("16. Is admin?", isAdmin);
  //               
  //               if (isAdmin) {
  //                 console.log("17. Redirecting to /admin");
  //                 navigate('/admin');
  //               } else {
  //                 console.log("17. Redirecting to /");
  //                 navigate('/');
  //               }
  //             } else {
  //               console.log("14. No auth token in response, navigating to home");
  //               navigate('/');
  //             }
  //           } else {
  //             console.log("13. Backend authentication failed!");
  //             setError(data.message || data.detail || "Google login failed");
  //           }
  //         } catch (err) {
  //           console.error("❌ Error sending token to backend:", err);
  //           setError("Failed to authenticate with Google. Please try again.");
  //         } finally {
  //           setGoogleLoading(false);
  //         }
  //       },
  //     });
  //     
  //     console.log("11. Requesting access token...");
  //     client.requestAccessToken();
  //     
  //   } catch (err) {
  //     console.error('❌ Google login initialization error:', err);
  //     setError("Google login failed. Please try again.");
  //     setGoogleLoading(false);
  //   }
  //   
  //   console.log("=========================================");
  // };

  // Load Google OAuth script - COMMENTED OUT
  // useEffect(() => {
  //   console.log("========== LOADING GOOGLE SCRIPT ==========");
  //   const script = document.createElement('script');
  //   script.src = 'https://accounts.google.com/gsi/client';
  //   script.async = true;
  //   script.defer = true;
  //   script.onload = () => {
  //     console.log("✅ Google Identity Services loaded successfully");
  //     console.log("window.google available:", !!window.google);
  //   };
  //   script.onerror = () => {
  //     console.error("❌ Failed to load Google Identity Services");
  //   };
  //   document.body.appendChild(script);
  //   
  //   return () => {
  //     const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  //     if (existingScript) {
  //       console.log("Removing Google script on cleanup");
  //       existingScript.remove();
  //     }
  //   };
  // }, []);

  return (
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

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Login Button - COMMENTED OUT */}
              {/* <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {googleLoading ? "Connecting..." : "Continue with Google"}
              </button> */}

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
  );
};

export default SigninPage;