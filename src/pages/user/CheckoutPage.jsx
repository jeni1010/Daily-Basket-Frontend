import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, CreditCard, Check, Plus, Loader2, Tag,
  Truck, Zap, Calendar, Wallet, Building, Smartphone, 
  Package, ArrowLeft, CreditCard as CardIcon, Shield, ChevronRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { customerApi } from "../../services/customerApi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
};

// Delivery Options
const deliveryOptions = [
  { id: "standard", label: "Standard Delivery", time: "2-3 days", price: 0, icon: <Truck className="w-5 h-5" />, description: "Free delivery on orders above ₹200" },
  { id: "express", label: "Express Delivery", time: "30-60 mins", price: 40, icon: <Zap className="w-5 h-5" />, description: "Lightning fast delivery" },
  { id: "scheduled", label: "Scheduled Delivery", time: "Pick a time slot", price: 0, icon: <Calendar className="w-5 h-5" />, description: "Choose your preferred time" },
];

// Payment Methods
const paymentMethods = [
  { id: "card", label: "Credit / Debit Card", icon: <CardIcon className="w-5 h-5" />, popular: true, type: "online" },
  { id: "upi", label: "UPI (Google Pay, PhonePe, etc.)", icon: <Smartphone className="w-5 h-5" />, popular: true, type: "online" },
  { id: "netbanking", label: "Net Banking", icon: <Building className="w-5 h-5" />, popular: false, type: "online" },
  { id: "wallet", label: "Mobile Wallet", icon: <Wallet className="w-5 h-5" />, popular: false, type: "online" },
  { id: "cod", label: "Cash on Delivery", icon: <Package className="w-5 h-5" />, popular: true, type: "cod" },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useApp();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedAddressObj, setSelectedAddressObj] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState("express");
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [addressType, setAddressType] = useState("home");
  const [addingAddressLoading, setAddingAddressLoading] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);

  // ✅ NEW: Coupon state from CartPage
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");

  // ✅ Prevention refs
  const hasInitialized = useRef(false);
  const isProcessingOrder = useRef(false);
  const addressesFetched = useRef(false);
  const isInitiatingPayment = useRef(false);
  const paymentInitiated = useRef(false);
  const lastClickTime = useRef(0);

  const [newAddress, setNewAddress] = useState({
    full_name: "", phone: "", address_line1: "", address_line2: "",
    city: "", state: "", postal_code: "", landmark: "", is_default: false,
  });

  // Check if cart is empty and redirect
  useEffect(() => {
    if (cart.length === 0 && !placingOrder) {
      navigate("/products");
    }
  }, [cart.length, navigate, placingOrder]);

  // ✅ NEW: Read coupon data from sessionStorage/localStorage
  useEffect(() => {
    const loadCouponData = () => {
      // Try to get from sessionStorage
      const orderSummary = sessionStorage.getItem('orderSummary');
      const appliedCouponData = sessionStorage.getItem('appliedCoupon');
      const checkoutData = localStorage.getItem('checkout_order_data');
      
      if (orderSummary) {
        try {
          const data = JSON.parse(orderSummary);
          console.log('📦 Loaded orderSummary in checkout:', data);
          
          if (data.couponApplied && data.couponCode) {
            setCouponCode(data.couponCode);
            setCouponDiscount(data.couponDiscount || 0);
            setAppliedCoupon({
              code: data.couponCode,
              discount: data.couponDiscount,
              discount_type: data.coupon_type || 'percentage'
            });
            console.log('✅ Coupon applied in checkout:', data.couponCode, 'Discount:', data.couponDiscount);
          }
        } catch (e) {
          console.error('Error parsing orderSummary:', e);
        }
      }
      
      if (!appliedCoupon && appliedCouponData) {
        try {
          const coupon = JSON.parse(appliedCouponData);
          setCouponCode(coupon.code);
          setCouponDiscount(coupon.discount || 0);
          setAppliedCoupon(coupon);
          console.log('✅ Coupon from appliedCoupon:', coupon);
        } catch (e) {
          console.error('Error parsing appliedCoupon:', e);
        }
      }
      
      if (!appliedCoupon && checkoutData) {
        try {
          const data = JSON.parse(checkoutData);
          if (data.couponApplied && data.couponCode) {
            setCouponCode(data.couponCode);
            setCouponDiscount(data.couponDiscount || 0);
            setAppliedCoupon({
              code: data.couponCode,
              discount: data.couponDiscount
            });
          }
        } catch (e) {
          console.error('Error parsing checkout_data:', e);
        }
      }
    };
    
    loadCouponData();
  }, []);

  // ✅ Prevent duplicate initialization
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const init = async () => {
      await fetchAddresses();
      await loadRazorpayScript().then(() => setRazorpayLoaded(true)).catch(console.error);
      window.scrollTo(0, 0);
    };
    
    init();
  }, []);

  // ✅ Updated fetchAddresses with proper duplicate prevention
  const fetchAddresses = async () => {
    if (addressesFetched.current) {
      console.log("Addresses already fetched, skipping duplicate call");
      return;
    }
    
    addressesFetched.current = true;
    
    try {
      setLoading(true);
      const response = await customerApi.addresses.getAll();
      let addressesData = [];
      if (response && response.data && Array.isArray(response.data)) addressesData = response.data;
      else if (response && Array.isArray(response)) addressesData = response;
      else if (response && response.addresses && Array.isArray(response.addresses)) addressesData = response.addresses;
      
      setAddresses(addressesData);
      
      const defaultAddr = addressesData.find(a => a.is_default === true);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
        setSelectedAddressObj(defaultAddr);
      } else if (addressesData.length > 0) {
        setSelectedAddressId(addressesData[0]._id);
        setSelectedAddressObj(addressesData[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (addressId, addressObj) => {
    setSelectedAddressId(addressId);
    setSelectedAddressObj(addressObj);
  };

  const handleAddAddress = async () => {
    if (!newAddress.full_name.trim()) { alert("Please enter full name"); return; }
    if (!newAddress.phone.trim()) { alert("Please enter phone number"); return; }
    if (!newAddress.address_line1.trim()) { alert("Please enter address line 1"); return; }
    if (!newAddress.city.trim()) { alert("Please enter city"); return; }
    if (!newAddress.postal_code.trim()) { alert("Please enter postal code"); return; }

    setAddingAddressLoading(true);
    try {
      const addressData = {
        full_name: newAddress.full_name.trim(),
        phone: newAddress.phone.trim(),
        address_line1: newAddress.address_line1.trim(),
        address_line2: newAddress.address_line2?.trim() || "",
        landmark: newAddress.landmark?.trim() || "",
        city: newAddress.city.trim(),
        state: newAddress.state?.trim() || "",
        country: "India",
        postal_code: newAddress.postal_code.trim(),
        address_type: addressType,
        is_default: newAddress.is_default
      };
      
      await customerApi.addresses.add(addressData);
      alert("Address added successfully!");
      
      addressesFetched.current = false;
      await fetchAddresses();
      
      setAddingAddress(false);
      setNewAddress({ 
        full_name: "", phone: "", address_line1: "", address_line2: "", 
        city: "", state: "", postal_code: "", landmark: "", is_default: false 
      });
      setAddressType("home");
    } catch (error) {
      alert(error.message || "Failed to add address. Please try again.");
    } finally {
      setAddingAddressLoading(false);
    }
  };

  // ✅ FIXED: Open Razorpay checkout with discounted amount
  const openRazorpayCheckout = (orderData, orderId, totalAmount) => {
    return new Promise((resolve, reject) => {
      const razorpayOrderId = orderData.razorpay_order_id;
      const razorpayKeyId = orderData.razorpay_key_id;
      const amountInPaise = orderData.amount || (totalAmount * 100);
      
      if (!razorpayOrderId || !razorpayKeyId) {
        reject(new Error("Razorpay order details not found"));
        return;
      }
      
      const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
      
      const options = {
        key: razorpayKeyId,
        amount: amountInPaise,
        currency: "INR",
        name: "Daily Basket",
        description: `Order #${orderId} - ${selectedMethod?.label}`,
        image: "/logo2.jpeg",
        order_id: razorpayOrderId,
        prefill: {
          name: selectedAddressObj?.full_name || "",
          email: selectedAddressObj?.email || "",
          contact: selectedAddressObj?.phone || "",
        },
        notes: {
          order_id: orderId,
          address: selectedAddressObj?.address_line1 || "",
          city: selectedAddressObj?.city || "",
          delivery_type: selectedDelivery,
          payment_method_type: selectedPayment,
          coupon_code: couponCode,
          coupon_discount: couponDiscount
        },
        theme: { color: "#3E7C47" },
        modal: {
          ondismiss: () => {
            console.log("Payment modal closed by user");
            reject(new Error("Payment cancelled"));
          }
        },
        handler: async (response) => {
          console.log("Payment success response:", response);
          
          try {
            const verificationResult = await customerApi.orders.verifyPayment({
              order_id: orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (verificationResult && verificationResult.status === 'success') {
              console.log("Payment verified successfully!");
              resolve(response);
            } else {
              reject(new Error("Payment verification failed"));
            }
          } catch (verifyError) {
            console.error("Verification error:", verifyError);
            reject(new Error("Payment verification failed"));
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function(response) {
        console.error('Razorpay payment failed:', response);
        reject(new Error(response.error?.description || 'Payment failed'));
      });
      
      razorpay.open();
    });
  };

  // ✅ FIXED: Calculate totals with coupon discount
  const deliveryFee = selectedDelivery === "express" ? 40 : 0;
  const subtotalAfterDiscount = Math.max(0, cartTotal - couponDiscount);
  const taxes = Math.round((subtotalAfterDiscount + deliveryFee) * 0.05);
  const total = subtotalAfterDiscount + taxes + deliveryFee;

  // ✅ FIXED: Handle place order with coupon code
  const handlePlaceOrder = async () => {
    const now = Date.now();
    if (now - lastClickTime.current < 1000) {
      console.log("Debounced duplicate click");
      return;
    }
    lastClickTime.current = now;
    
    if (isProcessingOrder.current) {
      console.log("Order already being processed, skipping duplicate...");
      return;
    }
    
    if (!selectedAddressId || !selectedAddressObj) {
      alert("Please select a delivery address");
      setCurrentStep(1);
      return;
    }

    isProcessingOrder.current = true;
    setPlacingOrder(true);
    
    try {
      const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
      const isCOD = selectedMethod?.type === "cod";
      const backendPaymentMethod = isCOD ? "cod" : "card";
      
      console.log("Creating order with:", {
        addressId: selectedAddressId,
        paymentMethod: backendPaymentMethod,
        couponCode: couponCode || null,
        couponDiscount: couponDiscount
      });
      
      // ✅ PASS THE COUPON CODE TO BACKEND
      const orderResponse = await customerApi.orders.create(
        selectedAddressId,
        backendPaymentMethod,
        deliveryInstructions,
        couponCode || null  // ← Pass coupon code here
      );
      
      console.log("Order creation response:", orderResponse);
      
      const orderData = orderResponse.data || orderResponse;
      const orderId = orderData.order_id || orderData._id || orderResponse._id;
      
      if (!orderId) {
        console.error("Could not extract order ID from response:", orderResponse);
        throw new Error("Failed to create order");
      }
      
      setPendingOrderId(orderId);
      
      // ✅ Use discounted total for payment
      const totalAmount = total;
      
      console.log(`Order created with ID: ${orderId}, Discounted Total: ₹${totalAmount}`);
      
      if (isCOD) {
        await clearCart();
        // Clear coupon data from storage
        sessionStorage.removeItem('orderSummary');
        sessionStorage.removeItem('appliedCoupon');
        localStorage.removeItem('checkout_order_data');
        isProcessingOrder.current = false;
        setPlacingOrder(false);
        console.log("Navigating to order success for COD...");
        window.location.href = `/order-success/${orderId}?method=COD&discount=${couponDiscount}`;
      } else {
        console.log("Opening Razorpay checkout...");
        await openRazorpayCheckout(orderData, orderId, totalAmount);
        
        console.log("Payment successful! Clearing cart and redirecting...");
        await clearCart();
        
        // Clear coupon data from storage
        sessionStorage.removeItem('orderSummary');
        sessionStorage.removeItem('appliedCoupon');
        localStorage.removeItem('checkout_order_data');
        
        isProcessingOrder.current = false;
        setPlacingOrder(false);
        paymentInitiated.current = true;
        
        console.log(`Redirecting to /order-success/${orderId}`);
        window.location.href = `/order-success/${orderId}?method=Razorpay&discount=${couponDiscount}`;
      }
      
    } catch (error) {
      console.error("Order placement error:", error);
      alert(error.message || "Failed to place order. Please try again.");
      setPlacingOrder(false);
      isProcessingOrder.current = false;
      isInitiatingPayment.current = false;
    }
  };

  const steps = [
    { id: 1, name: "Address", icon: <MapPin className="w-4 h-5" /> },
    { id: 2, name: "Delivery", icon: <Truck className="w-5 h-5" /> },
    { id: 3, name: "Payment", icon: <CreditCard className="w-5 h-5" /> },
  ];

  const goToNextStep = () => {
    if (currentStep === 1 && (!selectedAddressId || !selectedAddressObj)) {
      alert("Please select a delivery address");
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (cart.length === 0 && !placingOrder) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      <Navbar />
      
      <div className="bg-[#F5EBD9]/30 border-b border-[#E8E1D5]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-[#3E7C47] mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Checkout</h1>
          {appliedCoupon && (
            <div className="mt-2 inline-flex items-center gap-2 bg-[#3E7C47]/10 px-3 py-1 rounded-full">
              <Tag className="w-3 h-3 text-[#3E7C47]" />
              <span className="text-xs text-[#3E7C47] font-medium">
                Coupon {appliedCoupon.code} applied! Saved ₹{couponDiscount}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => setCurrentStep(s.id)} 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep > s.id ? "bg-[#3E7C47] text-white shadow-md" : 
                      currentStep === s.id ? "bg-[#3E7C47] text-white ring-4 ring-[#3E7C47]/20 shadow-md" : 
                      "bg-[#F5EBD9] text-gray-400"
                    }`}
                  >
                    {currentStep > s.id ? <Check className="w-5 h-5" /> : s.icon}
                  </button>
                  <span className={`text-xs font-medium mt-2 ${currentStep === s.id ? "text-[#3E7C47]" : "text-gray-400"}`}>
                    {s.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full ${currentStep > s.id ? "bg-[#3E7C47]" : "bg-[#E8E1D5]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Checkout Form */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Step 1: Address Details */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden"
                >
                  <div className="p-5 border-b border-[#E8E1D5] bg-[#3E7C47]/5">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#3E7C47]" />
                      Delivery Address
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Select where you want your order delivered</p>
                  </div>
                  <div className="p-5">
                    {loading ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3E7C47] mx-auto" />
                        <p className="text-gray-500 mt-2">Loading addresses...</p>
                      </div>
                    ) : addresses.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {addresses.map((addr) => {
                          const addressId = addr._id || addr.id;
                          return (
                            <label
                              key={addressId}
                              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedAddressId === addressId
                                  ? "border-[#3E7C47] bg-[#3E7C47]/5"
                                  : "border-[#E8E1D5] hover:border-[#3E7C47]/50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="address"
                                checked={selectedAddressId === addressId}
                                onChange={() => handleAddressSelect(addressId, addr)}
                                className="mt-1 accent-[#3E7C47] w-4 h-4"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-gray-800">{addr.full_name}</span>
                                  {addr.is_default && (
                                    <span className="text-xs bg-[#3E7C47] text-white px-2 py-0.5 rounded-full">Default</span>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {addr.address_type === "home" && "🏠 Home"}
                                    {addr.address_type === "work" && "💼 Work"}
                                    {addr.address_type === "other" && "📍 Other"}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{addr.address_line1}</p>
                                <p className="text-xs text-gray-400">{addr.city}, {addr.state} - {addr.postal_code}</p>
                                <p className="text-xs text-gray-400 mt-1">📞 {addr.phone}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No saved addresses</p>
                        <p className="text-xs text-gray-400 mt-1">Add a new address to continue</p>
                      </div>
                    )}

                    {!addingAddress ? (
                      <button 
                        onClick={() => setAddingAddress(true)} 
                        className="flex items-center gap-2 text-sm text-[#3E7C47] hover:underline mt-4"
                      >
                        <Plus className="w-4 h-4" /> Add new address
                      </button>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-[#E8E1D5] space-y-4">
                        <h3 className="font-medium text-gray-700">New Address</h3>
                        <div className="flex gap-2">
                          {["home", "work", "other"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAddressType(type)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                addressType === type ? "bg-[#3E7C47] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {type === "home" && "🏠 Home"}
                              {type === "work" && "💼 Work"}
                              {type === "other" && "📍 Other"}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            placeholder="Full Name *"
                            value={newAddress.full_name}
                            onChange={(e) => setNewAddress({...newAddress, full_name: e.target.value})}
                            className="col-span-2 px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                          <input
                            placeholder="Phone Number *"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                            className="px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                          <input
                            placeholder="Pin Code *"
                            value={newAddress.postal_code}
                            onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                            className="px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                          <input
                            placeholder="Address Line 1 *"
                            value={newAddress.address_line1}
                            onChange={(e) => setNewAddress({...newAddress, address_line1: e.target.value})}
                            className="col-span-2 px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                          <input
                            placeholder="Address Line 2"
                            value={newAddress.address_line2}
                            onChange={(e) => setNewAddress({...newAddress, address_line2: e.target.value})}
                            className="col-span-2 px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                          <input
                            placeholder="Landmark"
                            value={newAddress.landmark}
                            onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                            className="col-span-2 px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                          <input
                            placeholder="City *"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            className="px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                          <input
                            placeholder="State"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                            className="px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newAddress.is_default}
                            onChange={(e) => setNewAddress({...newAddress, is_default: e.target.checked})}
                            className="accent-[#3E7C47] w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">Set as default address</span>
                        </label>
                        <div className="flex gap-3">
                          <button
                            onClick={handleAddAddress}
                            disabled={addingAddressLoading}
                            className="flex-1 py-3 bg-[#3E7C47] text-white rounded-full text-sm font-medium hover:bg-[#2E5C37] transition-colors disabled:opacity-50"
                          >
                            {addingAddressLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Address"}
                          </button>
                          <button
                            onClick={() => setAddingAddress(false)}
                            className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-full text-sm hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={goToNextStep}
                      disabled={!selectedAddressId || !selectedAddressObj}
                      className="mt-6 w-full py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue to Delivery <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Delivery Type */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden"
                >
                  <div className="p-5 border-b border-[#E8E1D5] bg-[#3E7C47]/5">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#3E7C47]" />
                      Delivery Type
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Choose how you want to receive your order</p>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {deliveryOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                            selectedDelivery === option.id
                              ? "border-[#3E7C47] bg-[#3E7C47]/5 shadow-md"
                              : "border-[#E8E1D5] hover:border-[#3E7C47]/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery"
                            checked={selectedDelivery === option.id}
                            onChange={() => setSelectedDelivery(option.id)}
                            className="absolute top-4 right-4 accent-[#3E7C47]"
                          />
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                              selectedDelivery === option.id ? "bg-[#3E7C47] text-white" : "bg-gray-100 text-gray-500"
                            }`}>
                              {option.icon}
                            </div>
                            <h3 className="font-semibold text-gray-800">{option.label}</h3>
                            <p className="text-xs text-gray-500 mt-1">{option.time}</p>
                            <p className="text-sm font-bold text-[#3E7C47] mt-2">
                              {option.price === 0 ? "Free" : `+₹${option.price}`}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {selectedDelivery === "scheduled" && (
                      <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Select Time Slot</label>
                          <div className="grid grid-cols-2 gap-2">
                            {["10am - 1pm", "1pm - 4pm", "4pm - 7pm", "7pm - 10pm"].map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`px-3 py-2 rounded-full text-sm transition-all ${
                                  selectedTimeSlot === slot ? "bg-[#3E7C47] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Delivery Instructions (Optional)</label>
                      <textarea
                        placeholder="Gate code, building number, etc."
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3E7C47] resize-none"
                      />
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 py-3.5 border border-[#E8E1D5] text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={goToNextStep}
                        className="flex-1 py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        Continue to Payment <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden"
                >
                  <div className="p-5 border-b border-[#E8E1D5] bg-[#3E7C47]/5">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#3E7C47]" />
                      Payment Method
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Select your preferred payment method</p>
                  </div>
                  <div className="p-5">
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPayment === method.id
                              ? "border-[#3E7C47] bg-[#3E7C47]/5"
                              : "border-gray-200 hover:border-[#3E7C47]/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            checked={selectedPayment === method.id}
                            onChange={() => setSelectedPayment(method.id)}
                            className="accent-[#3E7C47] w-4 h-4"
                          />
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedPayment === method.id ? "bg-[#3E7C47] text-white" : "bg-gray-100 text-gray-500"
                          }`}>
                            {method.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{method.label}</span>
                              {method.popular && (
                                <span className="text-xs bg-[#3E7C47]/10 text-[#3E7C47] px-2 py-0.5 rounded-full">Popular</span>
                              )}
                            </div>
                            {method.type === "cod" ? (
                              <p className="text-xs text-gray-400 mt-1">Pay when you receive your order</p>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">Secure payment via Razorpay</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 py-3.5 border border-[#E8E1D5] text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!placingOrder && !isProcessingOrder.current) {
                            handlePlaceOrder();
                          }
                        }}
                        disabled={placingOrder}
                        className="flex-1 py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {placingOrder ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Place Order • ₹${total}`
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] sticky top-24">
              <div className="p-5 border-b border-[#E8E1D5]">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#3E7C47]" />
                  Order Summary
                </h2>
                {appliedCoupon && (
                  <p className="text-xs text-[#3E7C47] mt-1">Coupon {appliedCoupon.code} applied</p>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <img src={item.image || "/api/placeholder/64/64"} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800">{item.name}</h4>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-[#3E7C47]">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{cartTotal}</span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-[#3E7C47]">
                      <span>Coupon Discount ({couponCode})</span>
                      <span>-₹{couponDiscount}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes (GST)</span>
                    <span className="font-medium">₹{taxes}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-[#3E7C47]">₹{total}</span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="bg-[#3E7C47]/10 rounded-xl p-2 text-center">
                      <p className="text-xs text-[#3E7C47] font-medium">
                        🎉 You saved ₹{couponDiscount} with coupon!
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-[#3E7C47] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">Secure checkout • Your payment information is encrypted and secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}