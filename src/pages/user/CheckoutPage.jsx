import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Clock, CreditCard, Check, Plus, ChevronRight, Loader2,
  Truck, Zap, Calendar, Wallet, Building, Smartphone, Lock, Shield,
  Home, Briefcase, Heart, Star, Users, Package, Tag, Search, Bell,
  User, ShoppingBag, ArrowLeft, Eye, CreditCard as CardIcon, Leaf, Sparkles
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { customerApi } from "../../services/customerApi";
import BrandLogo from "../../components/BrandLogo";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Delivery Options
const deliveryOptions = [
  { 
    id: "standard", 
    label: "Standard Delivery", 
    time: "2-3 days", 
    price: 0, 
    icon: <Truck className="w-5 h-5" />,
    available: true,
    description: "Free delivery on orders above ₹200"
  },
  { 
    id: "express", 
    label: "Express Delivery", 
    time: "30-60 mins", 
    price: 40, 
    icon: <Zap className="w-5 h-5" />,
    available: true,
    description: "Lightning fast delivery"
  },
  { 
    id: "scheduled", 
    label: "Scheduled Delivery", 
    time: "Pick a time slot", 
    price: 0, 
    icon: <Calendar className="w-5 h-5" />,
    available: true,
    description: "Choose your preferred time"
  },
];

// Payment Methods
const paymentMethods = [
  { id: "card", label: "Credit / Debit Card", icon: <CardIcon className="w-5 h-5" />, popular: true },
  { id: "upi", label: "UPI", icon: <Smartphone className="w-5 h-5" />, popular: true },
  { id: "wallet", label: "Mobile Wallet", icon: <Wallet className="w-5 h-5" />, popular: false },
  { id: "netbanking", label: "Net Banking", icon: <Building className="w-5 h-5" />, popular: false },
  { id: "cod", label: "Cash on Delivery", icon: <Package className="w-5 h-5" />, popular: true },
];

// UPI Apps
const upiApps = [
  { id: "gpay", name: "Google Pay", icon: "📱" },
  { id: "phonepe", name: "PhonePe", icon: "📱" },
  { id: "paytm", name: "Paytm", icon: "💙" },
  { id: "amazon", name: "Amazon Pay", icon: "🟠" },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useApp();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState("express");
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [addingAddress, setAddingAddress] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [addressType, setAddressType] = useState("home");
  const [addingAddressLoading, setAddingAddressLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    landmark: "",
    is_default: false,
  });

  useEffect(() => {
    fetchAddresses();
    window.scrollTo(0, 0);
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await customerApi.addresses.getAll();
      
      let addressesData = [];
      if (response && response.data && Array.isArray(response.data)) {
        addressesData = response.data;
      } else if (response && Array.isArray(response)) {
        addressesData = response;
      } else if (response && response.addresses && Array.isArray(response.addresses)) {
        addressesData = response.addresses;
      }
      
      setAddresses(addressesData);
      
      const defaultAddr = addressesData.find(a => a.is_default === true);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr._id);
      } else if (addressesData.length > 0) {
        setSelectedAddress(addressesData[0]._id);
      }
    } catch (error) {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.full_name.trim()) {
      alert("Please enter full name");
      return;
    }
    if (!newAddress.phone.trim()) {
      alert("Please enter phone number");
      return;
    }
    if (!newAddress.address_line1.trim()) {
      alert("Please enter address line 1");
      return;
    }
    if (!newAddress.city.trim()) {
      alert("Please enter city");
      return;
    }
    if (!newAddress.postal_code.trim()) {
      alert("Please enter postal code");
      return;
    }

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
      
      const result = await customerApi.addresses.add(addressData);
      
      alert("Address added successfully!");
      await fetchAddresses();
      
      setAddingAddress(false);
      setNewAddress({
        full_name: "", phone: "", address_line1: "", address_line2: "",
        city: "", state: "", postal_code: "", landmark: "", is_default: false,
      });
      setAddressType("home");
      
    } catch (error) {
      alert(error.message || "Failed to add address. Please try again.");
    } finally {
      setAddingAddressLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert("Please select a delivery address");
      setStep(1);
      return;
    }
    
    setPlacingOrder(true);
    try {
      const result = await customerApi.orders.create(selectedAddress, selectedPayment);
      
      let orderId = null;
      if (result.data && result.data._id) {
        orderId = result.data._id;
      } else if (result._id) {
        orderId = result._id;
      } else if (result.order_id) {
        orderId = result.order_id;
      } else if (result.orderId) {
        orderId = result.orderId;
      } else {
        alert("Order placed but couldn't get order ID. Please check your orders page.");
        navigate("/orders");
        return;
      }
      
      try {
        await customerApi.cart.clear();
        clearCart();
      } catch (clearError) {
        // Silent fail
      }
      
      navigate(`/orders/${orderId}`);
      
    } catch (error) {
      alert(error.message || "Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const deliveryOption = deliveryOptions.find(d => d.id === selectedDelivery);
  const deliveryFee = deliveryOption?.price || 0;
  const taxes = Math.round(cartTotal * 0.05);
  const discount = 0;
  const total = cartTotal - discount + taxes + deliveryFee;

  const steps = [
    { id: 1, name: "Address", icon: <MapPin className="w-4 h-4" /> },
    { id: 2, name: "Delivery", icon: <Truck className="w-4 h-4" /> },
    { id: 3, name: "Payment", icon: <CreditCard className="w-4 h-4" /> },
  ];

  if (cart.length === 0) {
    navigate("/products");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      <Navbar />
      
      {/* Checkout Header */}
      <div className="bg-[#F5EBD9]/30 border-b border-[#E8E1D5]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-[#3E7C47] mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Checkout</h1>
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
                    onClick={() => setStep(s.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      step > s.id
                        ? "bg-[#3E7C47] text-white shadow-md"
                        : step === s.id
                        ? "bg-[#3E7C47] text-white ring-4 ring-[#3E7C47]/20 shadow-md"
                        : "bg-[#F5EBD9] text-gray-400"
                    }`}
                  >
                    {step > s.id ? <Check className="w-5 h-5" /> : s.icon}
                  </button>
                  <span className={`text-xs font-medium mt-2 ${step === s.id ? "text-[#3E7C47]" : "text-gray-400"}`}>
                    {s.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full ${
                    step > s.id ? "bg-[#3E7C47]" : "bg-[#E8E1D5]"
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Checkout Form */}
          <div className="flex-1 space-y-6">
            {/* Step 1: Address Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: step === 1 ? 1 : 0.7, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setStep(1)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? "bg-[#3E7C47] text-white" : "bg-[#F5EBD9] text-gray-400"}`}>
                    {step > 1 ? <Check className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">Delivery Address</h2>
                    {selectedAddress && step > 1 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {addresses.find(a => a._id === selectedAddress)?.address_line1}
                      </p>
                    )}
                  </div>
                </div>
                {step !== 1 && (
                  <button className="text-sm text-[#3E7C47] hover:underline">Edit</button>
                )}
              </div>

              {step === 1 && (
                <div className="px-5 pb-6 border-t border-[#E8E1D5] pt-5">
                  {addresses && addresses.length > 0 ? (
                    <div className="space-y-3 mb-5">
                      <h3 className="text-sm font-medium text-gray-700">Saved Addresses</h3>
                      {addresses.map((addr) => {
                        const addressId = addr._id || addr.id;
                        return (
                          <label
                            key={addressId}
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedAddress === addressId
                                ? "border-[#3E7C47] bg-[#3E7C47]/5 shadow-sm"
                                : "border-[#E8E1D5] hover:border-[#3E7C47]/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              value={addressId}
                              checked={selectedAddress === addressId}
                              onChange={(e) => setSelectedAddress(e.target.value)}
                              className="mt-1 accent-[#3E7C47] w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-800">{addr.full_name}</span>
                                {addr.is_default && (
                                  <span className="text-xs bg-[#3E7C47] text-white px-2 py-0.5 rounded-full">Default</span>
                                )}
                                <div className="flex gap-1">
                                  {addr.address_type === "home" && <span className="text-xs text-gray-400">🏠 Home</span>}
                                  {addr.address_type === "work" && <span className="text-xs text-gray-400">💼 Work</span>}
                                  {addr.address_type === "other" && <span className="text-xs text-gray-400">📍 Other</span>}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{addr.address_line1} {addr.address_line2}</p>
                              <p className="text-xs text-gray-400">{addr.city}, {addr.state} - {addr.postal_code}</p>
                              <p className="text-xs text-gray-400 mt-1">📞 {addr.phone}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 mb-4 bg-[#F5EBD9]/30 rounded-xl">
                      <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No saved addresses</p>
                      <p className="text-xs text-gray-400">Add a new address below</p>
                    </div>
                  )}

                  {!addingAddress ? (
                    <button
                      onClick={() => setAddingAddress(true)}
                      className="flex items-center gap-2 text-sm text-[#3E7C47] hover:underline"
                    >
                      <Plus className="w-4 h-4" /> Add new address
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 mt-4 pt-4 border-t border-[#E8E1D5]"
                    >
                      <h3 className="text-sm font-medium text-gray-700">New Address</h3>
                      
                      <div className="flex gap-2">
                        {["home", "work", "other"].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setAddressType(type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              addressType === type
                                ? "bg-[#3E7C47] text-white shadow-sm"
                                : "bg-[#F5EBD9] text-gray-600 hover:bg-[#E8E1D5]"
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
                          className="col-span-2 px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="Phone Number *"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                          className="px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="Pin Code *"
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})}
                          className="px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="Address Line 1 *"
                          value={newAddress.address_line1}
                          onChange={(e) => setNewAddress({...newAddress, address_line1: e.target.value})}
                          className="col-span-2 px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="Address Line 2"
                          value={newAddress.address_line2}
                          onChange={(e) => setNewAddress({...newAddress, address_line2: e.target.value})}
                          className="col-span-2 px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="Landmark"
                          value={newAddress.landmark}
                          onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                          className="col-span-2 px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="City *"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          className="px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="State"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                          className="px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
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
                          className="flex-1 py-3 border border-[#E8E1D5] text-gray-600 rounded-full text-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <button
                    onClick={() => {
                      if (selectedAddress && selectedAddress !== null && selectedAddress !== "") {
                        setStep(2);
                      } else {
                        alert("Please select a delivery address");
                      }
                    }}
                    className="mt-6 w-full py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md"
                  >
                    Continue to Delivery
                  </button>
                </div>
              )}
            </motion.div>

            {/* Step 2: Delivery Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: step === 2 ? 1 : 0.7, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setStep(2)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? "bg-[#3E7C47] text-white" : "bg-[#F5EBD9] text-gray-400"}`}>
                    {step > 2 ? <Check className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">Delivery Type</h2>
                    {selectedDelivery && step > 2 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {deliveryOptions.find(d => d.id === selectedDelivery)?.label}
                      </p>
                    )}
                  </div>
                </div>
                {step !== 2 && (
                  <button className="text-sm text-[#3E7C47] hover:underline">Edit</button>
                )}
              </div>

              {step === 2 && (
                <div className="px-5 pb-6 border-t border-[#E8E1D5] pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                            selectedDelivery === option.id ? "bg-[#3E7C47] text-white" : "bg-[#F5EBD9] text-gray-500"
                          }`}>
                            {option.icon}
                          </div>
                          <h3 className="font-semibold text-gray-800">{option.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{option.time}</p>
                          <p className="text-sm font-bold text-[#3E7C47] mt-2">
                            {option.price === 0 ? "Free" : `+₹${option.price}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedDelivery === "scheduled" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 mt-4 pt-4 border-t border-[#E8E1D5]"
                    >
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
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
                                selectedTimeSlot === slot
                                  ? "bg-[#3E7C47] text-white"
                                  : "bg-[#F5EBD9] text-gray-600 hover:bg-[#E8E1D5]"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Delivery Instructions</label>
                        <textarea
                          placeholder="Gate code, building number, etc."
                          value={deliveryInstructions}
                          onChange={(e) => setDeliveryInstructions(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47] resize-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  <button
                    onClick={() => setStep(3)}
                    className="mt-6 w-full py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md"
                  >
                    Continue to Payment
                  </button>
                </div>
              )}
            </motion.div>

            {/* Step 3: Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: step === 3 ? 1 : 0.7, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setStep(3)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? "bg-[#3E7C47] text-white" : "bg-[#F5EBD9] text-gray-400"}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">Payment Method</h2>
                    {selectedPayment && step > 3 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {paymentMethods.find(p => p.id === selectedPayment)?.label}
                      </p>
                    )}
                  </div>
                </div>
                {step !== 3 && (
                  <button className="text-sm text-[#3E7C47] hover:underline">Edit</button>
                )}
              </div>

              {step === 3 && (
                <div className="px-5 pb-6 border-t border-[#E8E1D5] pt-5">
                  <div className="space-y-3 mb-6">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedPayment === method.id
                            ? "border-[#3E7C47] bg-[#3E7C47]/5"
                            : "border-[#E8E1D5] hover:border-[#3E7C47]/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={selectedPayment === method.id}
                          onChange={() => setSelectedPayment(method.id)}
                          className="accent-[#3E7C47]"
                        />
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedPayment === method.id ? "bg-[#3E7C47] text-white" : "bg-[#F5EBD9] text-gray-500"
                        }`}>
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{method.label}</span>
                            {method.popular && (
                              <span className="text-xs bg-[#F5EBD9] text-[#3E7C47] px-2 py-0.5 rounded-full">Popular</span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedPayment === "card" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 mt-4 pt-4 border-t border-[#E8E1D5]"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          placeholder="Card Number"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                          className="col-span-2 px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="Cardholder Name"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                          className="col-span-2 px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                          className="px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                        <input
                          placeholder="CVV"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          className="px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                        />
                      </div>
                    </motion.div>
                  )}

                  {selectedPayment === "upi" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4 mt-4 pt-4 border-t border-[#E8E1D5]"
                    >
                      <div className="flex gap-3 flex-wrap">
                        {upiApps.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setSelectedUpiApp(app.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                              selectedUpiApp === app.id
                                ? "bg-[#3E7C47] text-white"
                                : "bg-[#F5EBD9] text-gray-600 hover:bg-[#E8E1D5]"
                            }`}
                          >
                            <span>{app.icon}</span> {app.name}
                          </button>
                        ))}
                      </div>
                      <input
                        placeholder="UPI ID (e.g., username@okhdfcbank)"
                        className="w-full px-4 py-3 bg-[#F5EBD9]/30 rounded-xl text-sm border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
                      />
                    </motion.div>
                  )}

                  <div className="flex items-center gap-2 mt-6 p-3 bg-[#F5EBD9]/30 rounded-xl">
                    <Lock className="w-4 h-4 text-[#3E7C47]" />
                    <p className="text-xs text-gray-500">Your payment information is secured with 256-bit SSL encryption</p>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="mt-6 w-full py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md disabled:opacity-50"
                  >
                    {placingOrder ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Place Order • ₹${total.toLocaleString()}`}
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] p-5">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-[#E8E1D5] last:border-0">
                      <img 
                        src={item.image || "https://placehold.co/50x50/3E7C47/white?text=Product"} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => { e.target.src = "https://placehold.co/50x50/3E7C47/white?text=Product"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-3 border-t border-[#E8E1D5]">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? "text-[#3E7C47]" : ""}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Taxes (GST)</span>
                    <span>₹{taxes.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#E8E1D5] pt-3 mt-2">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Total Amount</span>
                      <span className="text-xl text-[#3E7C47]">₹{total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
                  </div>
                </div>

                <div className="flex justify-between gap-2 mt-4 pt-3 border-t border-[#E8E1D5]">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-[#F5EBD9] rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#3E7C47]" />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Secure</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-[#F5EBD9] rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-[#B6463A]" />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Fast</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-[#F5EBD9] rounded-full flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-[#3E7C47]" />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Fresh</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 bg-[#F5EBD9] rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#B6463A]" />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">Support</span>
                  </div>
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