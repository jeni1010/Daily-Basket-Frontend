import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, CreditCard, Check, Plus, Loader2,
  Truck, Zap, Calendar, Wallet, Building, Smartphone, 
  Package, ArrowLeft, CreditCard as CardIcon, Shield
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { customerApi } from "../../services/customerApi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
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

// Payment Methods - All online payments go through Razorpay
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
  const [addingAddress, setAddingAddress] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [addressType, setAddressType] = useState("home");
  const [addingAddressLoading, setAddingAddressLoading] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  const [newAddress, setNewAddress] = useState({
    full_name: "", phone: "", address_line1: "", address_line2: "",
    city: "", state: "", postal_code: "", landmark: "", is_default: false,
  });

  // Check if cart is empty and redirect
  useEffect(() => {
    if (cart.length === 0) {
      navigate("/products");
    }
  }, [cart.length, navigate]);

  useEffect(() => {
    fetchAddresses();
    loadRazorpayScript().then(() => setRazorpayLoaded(true)).catch(console.error);
    window.scrollTo(0, 0);
  }, []);

  const fetchAddresses = async () => {
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
      await fetchAddresses();
      setAddingAddress(false);
      setNewAddress({ full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", landmark: "", is_default: false });
      setAddressType("home");
    } catch (error) {
      alert(error.message || "Failed to add address. Please try again.");
    } finally {
      setAddingAddressLoading(false);
    }
  };

  const initiateRazorpayPayment = async (orderId, totalAmount, orderResponse) => {
    try {
      const amountInPaise = Math.round(totalAmount * 100);
      console.log(`Total Amount: ₹${totalAmount}, Amount in Paise: ${amountInPaise}`);
      
      const razorpayOrderResponse = await customerApi.orders.createRazorpayOrder(
        amountInPaise, 
        "INR", 
        orderId
      );
      
      console.log("Razorpay order response:", razorpayOrderResponse);
      
      const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
      
      const options = {
        key: razorpayOrderResponse.key_id || razorpayOrderResponse.razorpay_key_id,
        amount: razorpayOrderResponse.amount,
        currency: razorpayOrderResponse.currency,
        name: "Daily Basket",
        description: `Order #${orderId} - ${selectedMethod?.label}`,
        image: "/logo2.jpeg",
        order_id: razorpayOrderResponse.order_id || razorpayOrderResponse.razorpay_order_id,
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
          payment_method_type: selectedPayment
        },
        theme: { color: "#3E7C47" },
        modal: {
          ondismiss: () => {
            console.log("Payment modal closed");
            setPlacingOrder(false);
          }
        },
        handler: async (response) => {
          console.log("Payment success response:", response);
          
          const verificationResult = await customerApi.orders.verifyPayment({
            order_id: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          
          if (verificationResult && verificationResult.status === 'success') {
            await clearCart();
            // ✅ FIX: Navigate to orders page (which will show OrderSuccessPage)
            navigate(`/orders/${orderId}`, { 
              state: { 
                paymentMethod: "Razorpay",
                paymentId: response.razorpay_payment_id
              } 
            });
          } else {
            alert("Payment verification failed. Please contact support.");
            setPlacingOrder(false);
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error("Razorpay payment initiation error:", error);
      alert(error.message || "Failed to initiate payment. Please try again.");
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !selectedAddressObj) {
      alert("Please select a delivery address");
      setStep(1);
      return;
    }

    setPlacingOrder(true);
    
    try {
      const selectedMethod = paymentMethods.find(m => m.id === selectedPayment);
      const isCOD = selectedMethod?.type === "cod";
      
      const backendPaymentMethod = isCOD ? "cod" : "card";
      
      console.log("Creating order with payment method:", backendPaymentMethod);
      
      const orderResponse = await customerApi.orders.create(
        selectedAddressId,
        backendPaymentMethod,
        deliveryInstructions
      );
      
      console.log("Order creation response:", orderResponse);
      
      const orderId = orderResponse.data?._id || orderResponse._id || orderResponse.order_id || orderResponse.id;
      
      if (!orderId) {
        throw new Error("Failed to create order");
      }
      
      setPendingOrderId(orderId);
      
      const subtotal = cartTotal;
      const deliveryFee = selectedDelivery === "express" ? 40 : 0;
      const taxes = Math.round((subtotal + deliveryFee) * 0.05);
      const totalAmount = subtotal + deliveryFee + taxes;
      
      console.log(`Order Total Breakdown:
        Subtotal: ₹${subtotal}
        Delivery: ₹${deliveryFee}
        Taxes: ₹${taxes}
        Total: ₹${totalAmount}
      `);
      
      if (isCOD) {
        await clearCart();
        // ✅ FIX: Navigate to orders page (which will show OrderSuccessPage)
        navigate(`/orders/${orderId}`, { 
          state: { 
            paymentMethod: "COD",
            orderDetails: orderResponse
          } 
        });
      } else {
        await initiateRazorpayPayment(orderId, totalAmount, orderResponse);
      }
      
    } catch (error) {
      console.error("Order placement error:", error);
      alert(error.message || "Failed to place order. Please try again.");
      setPlacingOrder(false);
    }
  };

  const deliveryOption = deliveryOptions.find(d => d.id === selectedDelivery);
  const deliveryFee = deliveryOption?.price || 0;
  const taxes = Math.round((cartTotal + deliveryFee) * 0.05);
  const total = cartTotal + taxes + deliveryFee;

  const steps = [
    { id: 1, name: "Address", icon: <MapPin className="w-4 h-4" /> },
    { id: 2, name: "Delivery", icon: <Truck className="w-4 h-4" /> },
    { id: 3, name: "Payment", icon: <CreditCard className="w-4 h-4" /> },
  ];

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
                      step > s.id ? "bg-[#3E7C47] text-white shadow-md" : 
                      step === s.id ? "bg-[#3E7C47] text-white ring-4 ring-[#3E7C47]/20 shadow-md" : 
                      "bg-[#F5EBD9] text-gray-400"
                    }`}
                  >
                    {step > s.id ? <Check className="w-5 h-5" /> : s.icon}
                  </button>
                  <span className={`text-xs font-medium mt-2 ${step === s.id ? "text-[#3E7C47]" : "text-gray-400"}`}>
                    {s.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > s.id ? "bg-[#3E7C47]" : "bg-[#E8E1D5]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Checkout Form */}
          <div className="flex-1 space-y-6">
            {/* Step 1: Address Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden">
              <div className="p-5 border-b border-[#E8E1D5] bg-gray-50/50">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#3E7C47]" />
                  Delivery Address
                </h2>
              </div>
              <div className="p-5">
                {addresses.length > 0 ? (
                  <div className="space-y-3">
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
                    <button 
                      onClick={() => setAddingAddress(true)} 
                      className="flex items-center gap-2 text-sm text-[#3E7C47] hover:underline mt-2"
                    >
                      <Plus className="w-4 h-4" /> Add new address
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No saved addresses</p>
                    <button 
                      onClick={() => setAddingAddress(true)} 
                      className="mt-2 text-[#3E7C47] hover:underline"
                    >
                      Add an address
                    </button>
                  </div>
                )}

                {addingAddress && (
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
                  onClick={() => {
                    if (selectedAddressId && selectedAddressObj) {
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
            </div>

            {/* Step 2: Delivery Type */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden">
              <div className="p-5 border-b border-[#E8E1D5] bg-gray-50/50">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#3E7C47]" />
                  Delivery Type
                </h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {deliveryOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedDelivery === option.id
                          ? "border-[#3E7C47] bg-[#3E7C47]/5"
                          : "border-gray-200 hover:border-[#3E7C47]/50"
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

                <button
                  onClick={() => setStep(3)}
                  className="mt-6 w-full py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md"
                >
                  Continue to Payment
                </button>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] overflow-hidden">
              <div className="p-5 border-b border-[#E8E1D5] bg-gray-50/50">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#3E7C47]" />
                  Payment Method
                </h2>
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

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="mt-6 w-full py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
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
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E1D5] sticky top-24">
              <div className="p-5 border-b border-[#E8E1D5]">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#3E7C47]" />
                  Order Summary
                </h2>
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