import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import FloatingProduce from "../../components/FloatingProduce";

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    const locationEmail = location.state?.email;
    
    if (locationEmail) {
      setEmail(locationEmail);
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      navigate('/signup');
    }
  }, [location, navigate]);

  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      const pastedOtp = cleaned.slice(0, 6).split("");
      const filledOtp = [...pastedOtp, ...Array(6 - pastedOtp.length).fill("")];
      setOtpValues(filledOtp);
      const lastFilledIndex = Math.min(pastedOtp.length - 1, 5);
      const next = document.getElementById(`otp-${lastFilledIndex}`);
      next?.focus();
      return;
    }
    const newOtp = [...otpValues];
    newOtp[index] = cleaned;
    setOtpValues(newOtp);
    if (cleaned && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
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
        const prev = document.getElementById(`otp-${index - 1}`);
        prev?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const pastedOtp = paste.split("");
    const filledOtp = [...pastedOtp, ...Array(6 - pastedOtp.length).fill("")];
    setOtpValues(filledOtp);
    const lastFilledIndex = Math.min(pastedOtp.length - 1, 5);
    const next = document.getElementById(`otp-${lastFilledIndex}`);
    next?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otpValues.join("");
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(email, otpCode);
      localStorage.removeItem('pendingVerificationEmail');
      navigate('/dashboard');
    } catch (err) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    alert('Resend functionality - would trigger another OTP email');
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
            onClick={() => navigate("/signup")}
            className="flex items-center gap-2 text-gray-500 hover:text-[#2E7D32] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Sign Up</span>
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

              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#2E7D32]/10 to-[#E53935]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-10 h-10 text-[#2E7D32]" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                  <p className="text-gray-600">
                    We've sent a verification code to
                  </p>
                  <p className="font-medium text-[#2E7D32] mt-1">{email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-3 text-center">
                      Enter 6-digit verification code
                    </label>
                    <div className="flex gap-2 justify-center">
                      {otpValues.map((val, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={val}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={handleOtpPaste}
                          className="w-12 h-12 text-center bg-gray-50 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-[#2E7D32] border border-gray-200 focus:border-[#2E7D32] transition-all"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#2E7D32] text-white rounded-xl font-semibold shadow-sm hover:bg-[#1B5E20] hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>

                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
                  <button
                    onClick={handleResendCode}
                    className="text-[#2E7D32] font-semibold hover:underline text-sm"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;