import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Loader2,
  Truck, CreditCard, Leaf, Headphones, ChevronRight, AlertCircle
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { customerApi } from "../../services/customerApi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, loadCart } = useApp();
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  useEffect(() => {
    loadCart();
    window.scrollTo(0, 0);
  }, []);

  const subtotal = cartTotal;
  const discount = couponApplied ? couponDiscount : 0;
  const taxes = Math.round(subtotal * 0.05);
  const deliveryCharge = subtotal >= 200 ? 0 : 40;
  const total = subtotal - discount + taxes + deliveryCharge;

  const handleApplyCoupon = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (couponCode.toUpperCase() === "FRESH20") {
        setCouponDiscount(Math.round(subtotal * 0.2));
        setCouponApplied(true);
        alert("🎉 Coupon applied! You saved 20%!");
      } else if (couponCode.toUpperCase() === "SAVE50") {
        setCouponDiscount(50);
        setCouponApplied(true);
        alert("🎉 Coupon applied! You saved ₹50!");
      } else {
        alert("Invalid coupon code. Try FRESH20 or SAVE50");
      }
    } catch (error) {
      alert("Failed to apply coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode("");
  };

  const handleUpdateQuantity = async (itemId, newQuantity, variantSku = null) => {
    if (newQuantity < 1) {
      if (window.confirm("Remove this item from cart?")) {
        setUpdatingItemId(itemId);
        try {
          await removeFromCart(itemId, variantSku);
        } finally {
          setUpdatingItemId(null);
        }
      }
      return;
    }
    
    setUpdatingItemId(itemId);
    try {
      await updateQuantity(itemId, newQuantity, variantSku);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your entire cart? This action cannot be undone.")) {
      await clearCart();
    }
  };

  const features = [
    { icon: <Truck className="w-6 h-6" />, title: "Free Delivery", desc: "On orders above ₹200", color: "text-[#3E7C47]" },
    { icon: <CreditCard className="w-6 h-6" />, title: "Secure Payment", desc: "100% secure transactions", color: "text-[#B6463A]" },
    { icon: <Leaf className="w-6 h-6" />, title: "Fresh Products", desc: "Quality guaranteed", color: "text-[#3E7C47]" },
    { icon: <Headphones className="w-6 h-6" />, title: "24/7 Support", desc: "Always here to help", color: "text-[#B6463A]" },
  ];

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFDF9]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-32 h-32 bg-[#F5EBD9] rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-16 h-16 text-[#B6463A]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <button
              onClick={() => navigate("/products")}
              className="px-8 py-3 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md"
            >
              Start Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      <Navbar />
      
      {/* Hero/Breadcrumb Section */}
      <div className="relative bg-[#F5EBD9]/30 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-[#3E7C47] blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-[#B6463A] blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">Shopping Cart</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-[#3E7C47] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/products" className="hover:text-[#3E7C47] transition-colors">Products</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#3E7C47] font-medium">Cart</span>
          </div>
        </div>
      </div>

      {/* Main Cart Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Cart Items */}
          <div className="flex-1">
            {/* Cart Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-[#F5EBD9]/30 rounded-xl mb-4 text-sm font-medium text-gray-600">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {/* Cart Items */}
            <AnimatePresence>
              {cart.map((item, idx) => (
                <motion.div
                  key={`${item.id}-${item.variantSku || 'default'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-[#E8E1D5] hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div 
                      className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer bg-[#F5EBD9]/30 mx-auto sm:mx-0"
                      onClick={() => navigate(`/product/${item.slug || item.id}`)}
                    >
                      <img 
                        src={item.image || "https://placehold.co/100x100/3E7C47/white?text=Product"} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "https://placehold.co/100x100/3E7C47/white?text=Product"; }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <h3 
                            className="font-semibold text-gray-800 text-base cursor-pointer hover:text-[#3E7C47] transition-colors"
                            onClick={() => navigate(`/product/${item.slug || item.id}`)}
                          >
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">{item.unit || "Piece"}</p>
                          {item.discount > 0 && (
                            <span className="inline-block mt-1 text-xs text-[#B6463A] bg-red-50 px-2 py-0.5 rounded-full">
                              {item.discount}% OFF
                            </span>
                          )}
                        </div>
                        <div className="text-right sm:hidden">
                          <p className="text-lg font-bold text-[#3E7C47]">₹{item.price * item.quantity}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                        <div className="hidden sm:block">
                          <p className="text-sm text-gray-500">Unit Price</p>
                          <p className="font-semibold text-gray-800">₹{item.price}</p>
                          {item.originalPrice && (
                            <p className="text-xs text-gray-400 line-through">₹{item.originalPrice}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-sm text-gray-500 hidden sm:block">Qty:</p>
                          <div className="flex items-center bg-[#F5EBD9]/30 rounded-full overflow-hidden">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.variantSku)}
                              disabled={updatingItemId === item.id}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#F5EBD9] transition-colors disabled:opacity-50"
                            >
                              {updatingItemId === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Minus className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <span className="w-10 text-center text-sm font-semibold text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.variantSku)}
                              disabled={updatingItemId === item.id}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#F5EBD9] transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 hidden sm:block">Subtotal</p>
                            <p className="text-lg font-bold text-[#3E7C47]">₹{item.price * item.quantity}</p>
                          </div>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 0, item.variantSku)}
                            disabled={updatingItemId === item.id}
                            className="p-2 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Cart Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-[#E8E1D5]">
              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-2 text-gray-500 hover:text-[#3E7C47] transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Continue Shopping
              </button>
              
              <button
                onClick={handleClearCart}
                className="flex items-center gap-2 px-5 py-2.5 text-red-500 hover:text-red-600 transition-colors text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cart
              </button>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:w-96 flex-shrink-0">
            {/* Coupon Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E1D5] mb-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#3E7C47]" /> Apply Coupon
              </h3>
              {couponApplied ? (
                <div className="flex items-center justify-between bg-[#3E7C47]/10 border border-[#3E7C47]/20 rounded-xl px-3 py-2">
                  <span className="text-sm text-[#3E7C47] font-medium">
                    ✅ "{couponCode.toUpperCase()}" applied!
                  </span>
                  <button onClick={handleRemoveCoupon} className="text-[#B6463A] text-xs hover:text-red-700">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#F5EBD9]/30 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#3E7C47] border border-[#E8E1D5]"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={loading}
                    className="px-5 py-2 bg-[#3E7C47] text-white rounded-full text-sm font-medium hover:bg-[#2E5C37] transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">Try: FRESH20 (20% off) or SAVE50 (₹50 off)</p>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8E1D5]">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-[#3E7C47]">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryCharge === 0 ? "text-[#3E7C47]" : ""}>
                    {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxes (GST)</span>
                  <span>₹{taxes.toLocaleString()}</span>
                </div>
                
                {deliveryCharge > 0 && subtotal < 200 && (
                  <div className="bg-[#F5EBD9] rounded-xl p-2 text-center">
                    <p className="text-xs text-[#B6463A]">
                      Add ₹{200 - subtotal} more for free delivery
                    </p>
                  </div>
                )}
                
                <div className="border-t border-[#E8E1D5] pt-3 mt-2">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-xl text-[#3E7C47]">₹{total.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
                </div>
              </div>

              {discount > 0 && (
                <div className="mt-3 bg-[#3E7C47]/10 rounded-xl p-3 text-center">
                  <p className="text-sm text-[#3E7C47] font-medium">
                    🎉 You're saving ₹{discount} on this order!
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-all shadow-md hover:shadow-lg"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#F5EBD9]/20 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-4 text-center hover:shadow-md transition-all border border-[#E8E1D5]"
              >
                <div className={`w-12 h-12 mx-auto bg-[#F5EBD9] rounded-full flex items-center justify-center mb-3 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-gray-800 text-sm">{feature.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-r from-[#3E7C47]/10 to-[#B6463A]/10 rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Fresh Updates, Delivered</h3>
            <p className="text-gray-500 mb-6">Get exclusive offers, new product alerts, and delivery updates</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 bg-white rounded-full border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-[#3E7C47]"
              />
              <button className="px-6 py-3 bg-[#3E7C47] text-white rounded-full font-medium hover:bg-[#2E5C37] transition-colors">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}