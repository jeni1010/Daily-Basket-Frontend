import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Loader2,
  Truck, CreditCard, Leaf, Headphones, ChevronRight, AlertCircle,
  Gift, Percent, DollarSign, Ticket, X, Sparkles
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
  const [appliedCouponData, setAppliedCouponData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  
  // Coupon modal states
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponError, setCouponError] = useState(null);

  useEffect(() => {
    loadCart();
    fetchAvailableCoupons();
    window.scrollTo(0, 0);
  }, []);

  // Debug: Log cart items to check variant_sku
  useEffect(() => {
    console.log('🛒 Cart items:', cart.map(item => ({
      id: item.id,
      name: item.name,
      variant_sku: item.variant_sku || item.variantSku,
      quantity: item.quantity
    })));
  }, [cart]);

  const fetchAvailableCoupons = async () => {
    try {
      setLoadingCoupons(true);
      setCouponError(null);
      
      console.log('🔍 Fetching coupons from API...');
      
      const response = await customerApi.getCustomerCoupons();
      
      console.log('📦 Raw API Response:', response);
      
      let coupons = [];
      
      if (response && response.coupons && Array.isArray(response.coupons)) {
        coupons = response.coupons;
      } else if (response && response.data && Array.isArray(response.data)) {
        coupons = response.data;
      } else if (Array.isArray(response)) {
        coupons = response;
      }
      
      console.log('📊 Extracted coupons:', coupons);
      console.log('📊 Number of coupons:', coupons.length);
      
      const now = new Date();
      
      const activeCoupons = coupons.filter(coupon => {
        const isActive = coupon.status === 'active' || coupon.is_active === true || !coupon.status;
        const isNotExpired = coupon.end_date ? new Date(coupon.end_date) > now : true;
        const minOrderMet = !coupon.minimum_order_amount || cartTotal >= coupon.minimum_order_amount;
        return isActive && isNotExpired && minOrderMet;
      });
      
      console.log('✅ Active coupons after filtering:', activeCoupons);
      
      activeCoupons.sort((a, b) => {
        const getValue = (coupon) => {
          if (coupon.coupon_type === 'percentage') return coupon.discount_value;
          if (coupon.coupon_type === 'fixed') return coupon.discount_value;
          return 0;
        };
        return getValue(b) - getValue(a);
      });
      
      setAvailableCoupons(activeCoupons);
    } catch (error) {
      console.error('❌ Error fetching coupons:', error);
      setCouponError('Failed to load coupons. Please try again later.');
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const calculateDiscount = (coupon, subtotal) => {
    if (coupon.coupon_type === 'percentage') {
      let discount = (subtotal * coupon.discount_value) / 100;
      if (coupon.maximum_discount_amount) {
        discount = Math.min(discount, coupon.maximum_discount_amount);
      }
      return Math.round(discount);
    } else if (coupon.coupon_type === 'fixed') {
      return Math.min(coupon.discount_value, subtotal);
    } else if (coupon.coupon_type === 'free_shipping') {
      return 40;
    }
    return 0;
  };

  const getDiscountDisplay = (coupon) => {
    switch(coupon.coupon_type) {
      case "percentage": return `${coupon.discount_value}% OFF`;
      case "fixed": return `₹${coupon.discount_value} OFF`;
      case "free_shipping": return "FREE SHIPPING";
      default: return `${coupon.discount_value}% OFF`;
    }
  };

  const getCouponTypeIcon = (type) => {
    switch(type) {
      case "percentage": return <Percent className="w-4 h-4" />;
      case "fixed": return <DollarSign className="w-4 h-4" />;
      case "free_shipping": return <Truck className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const applyCoupon = (coupon) => {
    const discount = calculateDiscount(coupon, cartTotal);
    setAppliedCouponData(coupon);
    setCouponCode(coupon.code);
    setCouponDiscount(discount);
    setCouponApplied(true);
    setShowCouponModal(false);
    const message = `✅ Coupon "${coupon.code}" applied! You saved ₹${discount}`;
    alert(message);
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode("");
    setAppliedCouponData(null);
  };

  const handleUpdateQuantity = async (itemId, newQuantity, variantSku = null) => {
    const cartItem = cart.find(item => item.id === itemId);
    const finalVariantSku = variantSku || cartItem?.variant_sku || cartItem?.variantSku || "";
    
    console.log('Updating quantity:', { itemId, newQuantity, finalVariantSku });
    
    if (newQuantity < 1) {
      if (window.confirm("Remove this item from cart?")) {
        setUpdatingItemId(itemId);
        try {
          await removeFromCart(itemId, finalVariantSku);
        } catch (error) {
          console.error('Error removing item:', error);
          alert('Failed to remove item. Please try again.');
        } finally {
          setUpdatingItemId(null);
        }
      }
      return;
    }
    
    setUpdatingItemId(itemId);
    try {
      await updateQuantity(itemId, newQuantity, finalVariantSku);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your entire cart? This action cannot be undone.")) {
      await clearCart();
    }
  };

  const getVariantDisplay = (item) => {
    const variantSku = item.variant_sku || item.variantSku;
    if (variantSku) {
      const parts = variantSku.split('-');
      const size = parts[parts.length - 2];
      if (size && ['B', 'M', 'S', 'L', 'XL', 'XXL'].includes(size)) {
        return `Size: ${size}`;
      }
      return `Variant: ${variantSku}`;
    }
    return null;
  };

  const subtotal = cartTotal;
  const discount = couponApplied ? couponDiscount : 0;
  const taxes = Math.round((subtotal - discount) * 0.05); // ✅ FIXED: Tax on discounted amount
  const deliveryCharge = (subtotal - discount) >= 200 ? 0 : 40; // ✅ FIXED: Free shipping based on discounted amount
  const total = (subtotal - discount) + taxes + deliveryCharge; // ✅ FIXED: Proper discounted total

  // ✅ NEW: Function to handle checkout with coupon data
  const handleProceedToCheckout = () => {
    // Store coupon information in sessionStorage to pass to checkout
    if (couponApplied && appliedCouponData) {
      const couponData = {
        code: appliedCouponData.code,
        discount: couponDiscount,
        discount_type: appliedCouponData.coupon_type,
        discount_value: appliedCouponData.discount_value,
        applied: true
      };
      sessionStorage.setItem('appliedCoupon', JSON.stringify(couponData));
    } else {
      sessionStorage.removeItem('appliedCoupon');
    }
    
    // Store the discounted total for checkout
    const orderSummary = {
      subtotal: subtotal,
      discount: discount,
      discountedSubtotal: subtotal - discount,
      taxes: taxes,
      deliveryCharge: deliveryCharge,
      total: total,
      couponApplied: couponApplied,
      couponCode: couponCode,
      couponDiscount: couponDiscount
    };
    sessionStorage.setItem('orderSummary', JSON.stringify(orderSummary));
    
    // Navigate to checkout
    navigate("/checkout");
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
              {cart.map((item, idx) => {
                const variantDisplay = getVariantDisplay(item);
                return (
                  <motion.div
                    key={`${item.id}-${item.variant_sku || item.variantSku || 'default'}`}
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
                            {variantDisplay && (
                              <p className="text-xs text-[#3E7C47] mt-0.5 font-medium">
                                {variantDisplay}
                              </p>
                            )}
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
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.variant_sku || item.variantSku)}
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
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.variant_sku || item.variantSku)}
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
                              onClick={() => handleUpdateQuantity(item.id, 0, item.variant_sku || item.variantSku)}
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
                );
              })}
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
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#3E7C47]" />
                    <span className="text-sm text-[#3E7C47] font-medium">
                      {couponCode} applied! Saved ₹{couponDiscount}
                    </span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-red-500 text-xs hover:text-red-700">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    fetchAvailableCoupons();
                    setShowCouponModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-[#3E7C47] hover:text-[#3E7C47] transition-all"
                >
                  <Gift className="w-4 h-4" />
                  Choose a Coupon
                </button>
              )}
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
                
                {deliveryCharge > 0 && (subtotal - discount) < 200 && (
                  <div className="bg-[#F5EBD9] rounded-xl p-2 text-center">
                    <p className="text-xs text-[#B6463A]">
                      Add ₹{200 - (subtotal - discount)} more for free delivery
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
                onClick={handleProceedToCheckout}
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

      {/* Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#3E7C47]" />
                  Available Coupons
                </h3>
                <button
                  onClick={() => setShowCouponModal(false)}
                  className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 max-h-96 overflow-y-auto">
                {loadingCoupons ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3E7C47] mx-auto" />
                    <p className="text-gray-500 mt-2">Loading coupons...</p>
                  </div>
                ) : couponError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-500">{couponError}</p>
                    <button
                      onClick={fetchAvailableCoupons}
                      className="mt-3 text-sm text-[#3E7C47] hover:underline"
                    >
                      Try Again
                    </button>
                  </div>
                ) : availableCoupons.length > 0 ? (
                  <div className="space-y-3">
                    {availableCoupons.map((coupon) => {
                      const discountAmount = calculateDiscount(coupon, cartTotal);
                      const isExpiringSoon = coupon.end_date && new Date(coupon.end_date) - new Date() < 3 * 24 * 60 * 60 * 1000;
                      
                      return (
                        <div
                          key={coupon.id || coupon._id}
                          className="p-4 border border-gray-200 rounded-xl hover:border-[#3E7C47] transition-all cursor-pointer group"
                          onClick={() => applyCoupon(coupon)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[#3E7C47]/10 rounded-full flex items-center justify-center text-[#3E7C47]">
                                {getCouponTypeIcon(coupon.coupon_type)}
                              </div>
                              <div>
                                <span className="font-mono font-bold text-[#3E7C47] text-sm">{coupon.code}</span>
                                {coupon.coupon_type === 'percentage' && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    {coupon.discount_value}% OFF
                                  </span>
                                )}
                                {coupon.coupon_type === 'fixed' && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    ₹{coupon.discount_value} OFF
                                  </span>
                                )}
                                {coupon.coupon_type === 'free_shipping' && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Free Shipping
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-[#3E7C47] group-hover:scale-110 transition-transform">
                              Save ₹{discountAmount}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{coupon.description || coupon.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            {coupon.minimum_order_amount > 0 && (
                              <span>Min. order: ₹{coupon.minimum_order_amount}</span>
                            )}
                            {coupon.is_first_purchase_only && (
                              <span className="text-amber-600">First purchase only</span>
                            )}
                            {coupon.end_date && (
                              <span className={isExpiringSoon ? "text-orange-500" : ""}>
                                Expires: {new Date(coupon.end_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No coupons available</p>
                    <p className="text-xs text-gray-400 mt-1">Check back later for offers!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}