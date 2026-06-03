import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import FloatingProduce from "../../components/FloatingProduce";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, googleLogin, error, setError } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1094270392987-7j5v4s8vjv8vj5v8j5v8j5v8j5v8j5v8.apps.googleusercontent.com';

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
  //       try {
  //         const userRes = await fetch('https://dailybasket.cloud/auth/me', {
  //           headers: {
  //             'Authorization': `Bearer ${token}`,
  //             'Content-Type': 'application/json'
  //           }
  //         });
  //         
  //         if (userRes.ok) {
  //           const userData = await userRes.json();
  //           const userRole = userData.user?.role || userData.role || userData.data?.role;
  //           const isAdmin = userRole === 'admin' || userRole === 'ADMIN' || userRole === 'super_admin';
  //           
  //           if (isAdmin) {
  //             navigate('/admin');
  //           } else {
  //             navigate('/');
  //           }
  //         } else {
  //           navigate('/');
  //         }
  //       } catch (err) {
  //         navigate('/');
  //       }
  //     } else {
  //       navigate('/');
  //     }
  //   } catch (err) {
  //     setError(err.userMessage || "Google signup failed. Please try again.");
  //   } finally {
  //     setGoogleLoading(false);
  //   }
  // };

  // const handleGoogleError = () => {
  //   setError("Google signup failed. Please check your Google Client ID configuration.");
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

              {/* Google Sign Up Button - Commented Out */}
              {/* <div className="mb-6">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  text="signup_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="100%"
                />
                {googleLoading && (
                  <div className="mt-2 text-center text-sm text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-[#2E7D32] rounded-full animate-spin" />
                      Signing up...
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
    // </GoogleOAuthProvider>
  );
};

export default SignupPage;