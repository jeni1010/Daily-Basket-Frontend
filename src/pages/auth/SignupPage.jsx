import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import FloatingProduce from "../../components/FloatingProduce";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, error, setError } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.email) errors.email = "Email is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = "Invalid email format";
    }
    if (!formData.password) errors.password = "Password is required";
    if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = "Passwords do not match";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("Backend is waking up (takes 30-60 seconds). Please wait...");
    
    try {
      const response = await signup(formData);
      setError(null);
      localStorage.setItem("pendingVerificationEmail", formData.email);
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError("Request timeout. The backend is waking up. Please try again in 30 seconds.");
      } else if (err.userMessage) {
        setError(err.userMessage);
      } else if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          setError(detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', '));
        } else {
          setError(detail);
        }
      } else {
        setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google signup function - COMMENTED OUT
  // const handleGoogleSignup = () => {
  //   setGoogleLoading(true);
  //   setError(null);
  //   
  //   try {
  //     // Initialize Google Sign-In
  //     const client = window.google?.accounts?.oauth2?.initTokenClient({
  //       client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
  //       scope: 'email profile openid',
  //       callback: async (tokenResponse) => {
  //         try {
  //           console.log("Google token received:", tokenResponse);
  //           
  //           // Send the token to your backend for signup
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
  //           const data = await response.json();
  //           console.log("Backend response:", data);
  //           
  //           if (response.ok) {
  //             // Store token and redirect
  //             const authToken = data.access_token || data.token;
  //             if (authToken) {
  //               localStorage.setItem('authToken', authToken);
  //               
  //               // Get user role from response
  //               let userRole = data.user?.role || data.role;
  //               const isAdmin = userRole === 'admin' || userRole === 'ADMIN' || userRole === 'super_admin';
  //               
  //               if (isAdmin) {
  //                 navigate('/admin');
  //               } else {
  //                 navigate('/');
  //               }
  //             } else {
  //               navigate('/');
  //             }
  //           } else {
  //             // If user doesn't exist, backend might return a specific message
  //             if (data.message?.includes("User doesn't exist") || data.detail?.includes("User doesn't exist")) {
  //               setError("No account found with this Google account. Please sign up with email first.");
  //             } else {
  //               setError(data.message || data.detail || "Google signup failed. Please try again.");
  //             }
  //           }
  //         } catch (err) {
  //           console.error('Error sending token to backend:', err);
  //           setError("Failed to authenticate with Google. Please try again.");
  //         } finally {
  //           setGoogleLoading(false);
  //         }
  //       },
  //     });
  //     
  //     client.requestAccessToken();
  //     
  //   } catch (err) {
  //     console.error('❌ Google signup initialization error:', err);
  //     setError("Google signup failed. Please try again.");
  //     setGoogleLoading(false);
  //   }
  // };

  // Load Google OAuth script - COMMENTED OUT
  // useEffect(() => {
  //   const script = document.createElement('script');
  //   script.src = 'https://accounts.google.com/gsi/client';
  //   script.async = true;
  //   script.defer = true;
  //   script.onload = () => {
  //     console.log("Google Identity Services loaded");
  //   };
  //   document.body.appendChild(script);
  //   
  //   return () => {
  //     const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  //     if (existingScript) {
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

              {/* Google Sign Up Button - COMMENTED OUT */}
              {/* <button
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50 mb-4"
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
                {googleLoading ? "Connecting..." : "Sign up with Google"}
              </button> */}

              {/* Divider - COMMENTED OUT since Google button is hidden */}
              {/* <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
                </div>
              </div> */}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {validationErrors.name && (
                    <span className="text-red-500 text-xs mt-1 block">{validationErrors.name}</span>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="hello@dailybasket.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {validationErrors.email && (
                    <span className="text-red-500 text-xs mt-1 block">{validationErrors.email}</span>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create password (min 8 characters)"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all ${
                        validationErrors.password ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className="text-red-500 text-xs mt-1 block">{validationErrors.password}</span>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="passwordConfirm"
                      placeholder="Confirm password"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all ${
                        validationErrors.passwordConfirm ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {validationErrors.passwordConfirm && (
                    <span className="text-red-500 text-xs mt-1 block">{validationErrors.passwordConfirm}</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#E53935] text-white rounded-xl font-semibold shadow-sm hover:bg-[#C62828] hover:shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <Link to="/signin" className="text-[#2E7D32] font-semibold hover:underline">
                    Sign In
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

export default SignupPage;