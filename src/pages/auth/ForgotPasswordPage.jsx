import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import FloatingProduce from "../../components/FloatingProduce";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, error, setError } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [validationErrors, setValidationErrors] = useState({});

  const validateEmail = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Invalid email format';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateReset = () => {
    const errors = {};
    const otpCode = otpValues.join("");
    if (otpCode.length !== 6) errors.otp = 'OTP must be 6 digits';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match';
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

  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const pastedOtp = cleaned.slice(0, 6).split("");
      const filledOtp = [...pastedOtp, ...Array(6 - pastedOtp.length).fill("")];
      setOtpValues(filledOtp);
      const lastFilledIndex = Math.min(pastedOtp.length - 1, 5);
      const next = document.getElementById(`reset-otp-${lastFilledIndex}`);
      next?.focus();
      return;
    }
    const newOtp = [...otpValues];
    newOtp[index] = cleaned;
    setOtpValues(newOtp);
    if (cleaned && index < 5) {
      const next = document.getElementById(`reset-otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otpValues[index]) {
        const newOtp = [...otpValues];
        newOtp[index] = "";
        setOtpValues(newOtp);
      } else if (index > 0) {
        const prev = document.getElementById(`reset-otp-${index - 1}`);
        prev?.focus();
      }
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await forgotPassword(formData.email);
      setStep(2);
      setError(null);
    } catch (err) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateReset()) return;

    setLoading(true);
    try {
      const otpCode = otpValues.join("");
      await resetPassword(
        formData.email,
        otpCode,
        formData.password,
        formData.passwordConfirm
      );
      alert('Password reset successful! Please sign in with your new password.');
      navigate('/signin');
    } catch (err) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => navigate("/signin")}
            className="flex items-center gap-2 text-gray-500 hover:text-[#2E7D32] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Sign In</span>
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

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.form
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleSendOTP}
                    className="space-y-5"
                  >
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#2E7D32]/10 to-[#E53935]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="w-8 h-8 text-[#2E7D32]" />
                      </div>
                      <p className="text-gray-600 text-sm">
                        Enter your email address and we'll send you a verification code to reset your password.
                      </p>
                    </div>

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
                          className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/20 transition-all ${
                            validationErrors.email ? 'border-red-500' : 'border-gray-200'
                          }`}
                          required
                        />
                      </div>
                      {validationErrors.email && (
                        <span className="text-red-500 text-xs mt-1 block">{validationErrors.email}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[#2E7D32] text-white rounded-xl font-semibold shadow-sm hover:bg-[#1B5E20] hover:shadow-md transition-all disabled:opacity-50"
                    >
                      {loading ? "Sending OTP..." : "Send Reset OTP"}
                    </button>
                  </motion.form>
                )}

                {step === 2 && (
                  <motion.form
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleResetPassword}
                    className="space-y-5"
                  >
                    <div className="text-center mb-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-8 h-8 text-[#2E7D32]" />
                      </div>
                      <p className="text-gray-600 text-sm">
                        Enter the OTP sent to <span className="font-medium text-[#2E7D32]">{formData.email}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-3 text-center">
                        Verification Code
                      </label>
                      <div className="flex gap-2 justify-center">
                        {otpValues.map((val, i) => (
                          <input
                            key={i}
                            id={`reset-otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={val}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className={`w-12 h-12 text-center bg-gray-50 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-[#2E7D32] border transition-all ${
                              validationErrors.otp ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {validationErrors.otp && (
                        <span className="text-red-500 text-xs mt-2 block text-center">{validationErrors.otp}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="New password (min 8 characters)"
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
                      <label className="block text-gray-700 text-sm font-medium mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="passwordConfirm"
                          placeholder="Confirm new password"
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
                      {loading ? "Resetting Password..." : "Reset Password"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;