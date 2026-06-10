import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, X, Tag, ToggleRight, ToggleLeft, Eye, 
  Percent, DollarSign, Truck, Gift, Sparkles, RefreshCw,
  Copy, Check, Calendar, Users, ShoppingBag, Search,
  Leaf, Apple, Carrot
} from "lucide-react";
import { adminApi } from "../../services/couponsApi";

// Updated color palette
const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  primaryBg: 'rgba(59, 130, 246, 0.1)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  bgMain: '#F8FAFC',
  cardBg: '#FFFFFF',
};

const getTypeIcon = (type) => {
  switch(type) {
    case "percentage": return <Percent className="w-5 h-5" />;
    case "fixed": return <DollarSign className="w-5 h-5" />;
    case "free_shipping": return <Truck className="w-5 h-5" />;
    case "buy_one_get_one": return <Gift className="w-5 h-5" />;
    default: return <Tag className="w-5 h-5" />;
  }
};

const getDiscountDisplay = (coupon) => {
  switch(coupon.coupon_type) {
    case "percentage": return `${coupon.discount_value}% OFF`;
    case "fixed": return `₹${coupon.discount_value} OFF`;
    case "free_shipping": return "FREE SHIPPING";
    case "buy_one_get_one": return "BOGO 50% OFF";
    default: return `${coupon.discount_value}% OFF`;
  }
};

const getTypeLabel = (type) => {
  switch(type) {
    case "percentage": return "% Discount";
    case "fixed": return "Flat Discount";
    case "free_shipping": return "Free Shipping";
    case "buy_one_get_one": return "BOGO";
    default: return type;
  }
};

const getStatusColor = (status, isExpired) => {
  if (status === 'active' && !isExpired) return "bg-[rgba(59,130,246,0.1)] text-[#3B82F6]";
  if (status === 'active' && isExpired) return "bg-red-100 text-red-600";
  return "bg-gray-100 text-gray-500";
};

const getStatusText = (status, isExpired) => {
  if (status === 'active' && !isExpired) return "Active";
  if (status === 'active' && isExpired) return "Expired";
  return "Inactive";
};

export function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalRedemptions: 0
  });
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    coupon_type: "percentage",
    discount_value: "",
    minimum_order_amount: "",
    maximum_discount_amount: "",
    discount_on: "total",
    applicable_categories: [],
    applicable_products: [],
    excluded_products: [],
    usage_limit_per_coupon: "",
    usage_limit_per_user: 1,
    start_date: "",
    end_date: "",
    is_first_purchase_only: false,
    is_new_user_only: false,
    status: "active",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const couponsData = await adminApi.getCoupons();
      
      const mappedCoupons = (couponsData || []).map(coupon => {
        let expiryDate = null;
        let isExpired = false;
        
        if (coupon.end_date) {
          try {
            expiryDate = new Date(coupon.end_date);
            isExpired = !isNaN(expiryDate) && expiryDate <= new Date();
          } catch (dateError) {
            isExpired = false;
          }
        }
        
        return {
          ...coupon,
          id: coupon.id || coupon._id,
          expiryDate: expiryDate,
          isExpired: isExpired,
        };
      });
      
      setCoupons(mappedCoupons);
      
      const now = new Date();
      const active = mappedCoupons.filter(c => {
        let isNotExpired = true;
        if (c.end_date) {
          const expiryDate = new Date(c.end_date);
          isNotExpired = !isNaN(expiryDate) && expiryDate > now;
        }
        return c.status === 'active' && isNotExpired;
      }).length;
      
      const expired = mappedCoupons.filter(c => {
        let isExpiredStatus = false;
        if (c.end_date) {
          const expiryDate = new Date(c.end_date);
          isExpiredStatus = !isNaN(expiryDate) && expiryDate <= now;
        }
        return (c.status === 'active' && isExpiredStatus) || c.status === 'inactive';
      }).length;
      
      const totalRedemptions = mappedCoupons.reduce((sum, c) => sum + (c.usage_count || 0), 0);
      
      setStats({
        total: mappedCoupons.length,
        active: active,
        expired: expired,
        totalRedemptions: totalRedemptions
      });
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    try {
      const startDate = form.start_date ? new Date(form.start_date) : new Date();
      const endDate = form.end_date ? new Date(form.end_date) : new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const newCoupon = {
        code: form.code.toUpperCase(),
        name: form.name || form.code.toUpperCase(),
        description: form.description,
        coupon_type: form.coupon_type,
        discount_value: parseFloat(form.discount_value),
        minimum_order_amount: parseFloat(form.minimum_order_amount) || 0,
        maximum_discount_amount: form.coupon_type === 'percentage' ? parseFloat(form.maximum_discount_amount) || parseFloat(form.discount_value) * 10 : parseFloat(form.discount_value),
        discount_on: form.discount_on,
        applicable_categories: form.applicable_categories || [],
        applicable_products: form.applicable_products || [],
        excluded_products: form.excluded_products || [],
        usage_limit_per_coupon: parseInt(form.usage_limit_per_coupon) || 0,
        usage_limit_per_user: parseInt(form.usage_limit_per_user) || 1,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_first_purchase_only: form.is_first_purchase_only,
        is_new_user_only: form.is_new_user_only,
        status: form.status,
      };
      
      await adminApi.createCoupon(newCoupon);
      alert("Coupon created successfully!");
      await fetchCoupons();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.message || "Failed to create coupon. Please check all fields.");
    }
  };

  const handleUpdateCoupon = async () => {
    try {
      const startDate = form.start_date ? new Date(form.start_date) : new Date();
      const endDate = form.end_date ? new Date(form.end_date) : new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const updatedCoupon = {
        name: form.name || form.code.toUpperCase(),
        description: form.description,
        coupon_type: form.coupon_type,
        discount_value: parseFloat(form.discount_value),
        minimum_order_amount: parseFloat(form.minimum_order_amount) || 0,
        maximum_discount_amount: form.coupon_type === 'percentage' ? parseFloat(form.maximum_discount_amount) || parseFloat(form.discount_value) * 10 : parseFloat(form.discount_value),
        discount_on: form.discount_on,
        applicable_categories: form.applicable_categories || [],
        applicable_products: form.applicable_products || [],
        excluded_products: form.excluded_products || [],
        usage_limit_per_coupon: parseInt(form.usage_limit_per_coupon) || 0,
        usage_limit_per_user: parseInt(form.usage_limit_per_user) || 1,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_first_purchase_only: form.is_first_purchase_only,
        is_new_user_only: form.is_new_user_only,
        status: form.status,
      };
      
      await adminApi.updateCoupon(editingCoupon.id, updatedCoupon);
      await fetchCoupons();
      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      alert("Coupon updated successfully!");
    } catch (error) {
      alert(error.message || "Failed to update coupon");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await adminApi.deleteCoupon(id);
        await fetchCoupons();
        alert("Coupon deleted successfully!");
      } catch (error) {
        alert("Failed to delete coupon");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminApi.toggleCouponStatus(id);
      await fetchCoupons();
      alert("Coupon status updated successfully!");
    } catch (error) {
      alert("Failed to update coupon status");
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name || coupon.code,
      description: coupon.description || "",
      coupon_type: coupon.coupon_type,
      discount_value: coupon.discount_value,
      minimum_order_amount: coupon.minimum_order_amount || 0,
      maximum_discount_amount: coupon.maximum_discount_amount || "",
      discount_on: coupon.discount_on || "total",
      applicable_categories: coupon.applicable_categories || [],
      applicable_products: coupon.applicable_products || [],
      excluded_products: coupon.excluded_products || [],
      usage_limit_per_coupon: coupon.usage_limit_per_coupon || "",
      usage_limit_per_user: coupon.usage_limit_per_user || 1,
      start_date: coupon.start_date ? coupon.start_date.split('T')[0] : "",
      end_date: coupon.end_date ? coupon.end_date.split('T')[0] : "",
      is_first_purchase_only: coupon.is_first_purchase_only || false,
      is_new_user_only: coupon.is_new_user_only || false,
      status: coupon.status,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      description: "",
      coupon_type: "percentage",
      discount_value: "",
      minimum_order_amount: "",
      maximum_discount_amount: "",
      discount_on: "total",
      applicable_categories: [],
      applicable_products: [],
      excluded_products: [],
      usage_limit_per_coupon: "",
      usage_limit_per_user: 1,
      start_date: "",
      end_date: "",
      is_first_purchase_only: false,
      is_new_user_only: false,
      status: "active",
    });
    setEditingCoupon(null);
  };

  const filteredCoupons = coupons.filter(coupon => {
    let isExpired = false;
    if (coupon.end_date) {
      const expiryDate = new Date(coupon.end_date);
      isExpired = !isNaN(expiryDate) && expiryDate <= new Date();
    }
    
    let matchesFilter = true;
    if (filter === "active") {
      matchesFilter = coupon.status === 'active' && !isExpired;
    } else if (filter === "expired") {
      matchesFilter = (coupon.status === 'active' && isExpired) || coupon.status === 'inactive';
    } else {
      matchesFilter = true;
    }
    
    const matchesSearch = searchTerm === "" || 
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Coupon Management</h1>
          <p className="text-sm text-[#64748B] mt-1">Create and manage promotional offers</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#2563EB] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Coupons" value={stats.total} icon={<Tag className="w-5 h-5" />} />
        <StatCard title="Active Coupons" value={stats.active} icon={<ToggleRight className="w-5 h-5" />} />
        <StatCard title="Expired Coupons" value={stats.expired} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Total Redemptions" value={stats.totalRedemptions} icon={<Users className="w-5 h-5" />} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search coupons by code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "expired"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f
                  ? "bg-[#3B82F6] text-white shadow-md"
                  : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#3B82F6] hover:text-[#3B82F6]"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoupons.map((coupon, idx) => {
          let isExpiredStatus = false;
          if (coupon.end_date) {
            const expiryDate = new Date(coupon.end_date);
            isExpiredStatus = !isNaN(expiryDate) && expiryDate <= new Date();
          }
          return (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-[#E2E8F0]">
                <div className={`px-5 pt-5 pb-3 border-b-2 border-dashed border-[#E2E8F0] ${(coupon.status !== 'active' || isExpiredStatus) ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono font-bold text-xl text-[#1E293B] tracking-wider">{coupon.code}</p>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="p-1.5 hover:bg-[#F8FAFC] rounded-lg transition-colors"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-3.5 h-3.5 text-[#3B82F6]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-[#64748B] line-clamp-1">{coupon.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(coupon.status, isExpiredStatus)}`}>
                        {getStatusText(coupon.status, isExpiredStatus)}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(coupon.id)}
                        className="text-[#94A3B8] hover:text-[#3B82F6] transition-colors"
                        title={coupon.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {coupon.status === 'active' && !isExpiredStatus ? 
                          <ToggleRight className="w-6 h-6 text-[#3B82F6]" /> : 
                          <ToggleLeft className="w-6 h-6 text-[#94A3B8]" />
                        }
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-[#1E293B]">
                      {getDiscountDisplay(coupon)}
                    </p>
                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#F8FAFC] rounded-full text-xs text-[#64748B]">
                      <Tag className="w-3 h-3" />
                      {getTypeLabel(coupon.coupon_type)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#F8FAFC] rounded-lg p-2 text-center">
                      <p className="text-xs text-[#94A3B8]">Min. Order</p>
                      <p className="font-semibold text-[#1E293B]">
                        {coupon.minimum_order_amount > 0 ? `₹${coupon.minimum_order_amount}` : "No minimum"}
                      </p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-lg p-2 text-center">
                      <p className="text-xs text-[#94A3B8]">Expires</p>
                      <p className="font-semibold text-[#1E293B] text-sm">
                        {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : "No expiry"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-[#64748B] mb-1">
                      <span>Usage</span>
                      <span>{coupon.usage_count || 0} / {coupon.usage_limit_per_coupon > 0 ? coupon.usage_limit_per_coupon : '∞'}</span>
                    </div>
                    <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((coupon.usage_count || 0) / (coupon.usage_limit_per_coupon || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => openEditModal(coupon)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-[#E2E8F0] text-[#64748B] rounded-lg text-sm font-medium hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-[#E2E8F0] text-[#EF4444] rounded-lg text-sm font-medium hover:border-[#EF4444] hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <div className="h-2 bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent"></div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-[#E2E8F0]">
          <Tag className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="font-semibold text-[#1E293B] mb-2">No coupons found</h3>
          <p className="text-[#64748B] text-sm mb-4">
            {searchTerm ? "Try a different search term" : "Create your first coupon to get started"}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-medium hover:bg-[#2563EB] transition-all"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                <h3 className="font-bold text-xl text-[#1E293B]">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h3>
                <button onClick={() => {
                  setShowModal(false);
                  resetForm();
                }} className="p-1.5 text-[#94A3B8] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                editingCoupon ? handleUpdateCoupon() : handleCreateCoupon();
              }} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., FRESH20"
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Coupon Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Fresh Vegetables Offer"
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Discount Type</label>
                    <select
                      value={form.coupon_type}
                      onChange={(e) => setForm({ ...form, coupon_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Flat (₹)</option>
                      <option value="free_shipping">Free Shipping</option>
                      <option value="buy_one_get_one">Buy One Get One</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Discount Value *</label>
                    <input
                      type="number"
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                      placeholder="e.g., 20"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                      required
                    />
                  </div>
                </div>

                {form.coupon_type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Maximum Discount Amount (₹)</label>
                    <input
                      type="number"
                      value={form.maximum_discount_amount}
                      onChange={(e) => setForm({ ...form, maximum_discount_amount: e.target.value })}
                      placeholder="e.g., 500"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                    />
                    <p className="text-xs text-[#94A3B8] mt-1">Optional: Maximum discount amount for percentage coupons</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Min. Order (₹)</label>
                    <input
                      type="number"
                      value={form.minimum_order_amount}
                      onChange={(e) => setForm({ ...form, minimum_order_amount: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Usage Limit (Total)</label>
                    <input
                      type="number"
                      value={form.usage_limit_per_coupon}
                      onChange={(e) => setForm({ ...form, usage_limit_per_coupon: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the offer"
                    rows="2"
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl cursor-pointer">
                    <span className="text-sm font-medium text-[#1E293B]">Status</span>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="px-3 py-1.5 bg-white rounded-lg text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl cursor-pointer">
                    <span className="text-sm font-medium text-[#1E293B]">First Purchase Only</span>
                    <input
                      type="checkbox"
                      checked={form.is_first_purchase_only}
                      onChange={(e) => setForm({ ...form, is_first_purchase_only: e.target.checked })}
                      className="w-5 h-5 accent-[#3B82F6]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl cursor-pointer">
                    <span className="text-sm font-medium text-[#1E293B]">New User Only</span>
                    <input
                      type="checkbox"
                      checked={form.is_new_user_only}
                      onChange={(e) => setForm({ ...form, is_new_user_only: e.target.checked })}
                      className="w-5 h-5 accent-[#3B82F6]"
                    />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-2.5 border border-[#E2E8F0] text-[#64748B] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-medium hover:bg-[#2563EB] transition-all"
                  >
                    {editingCoupon ? "Save Changes" : "Create Coupon"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-[#1E293B]">{value}</p>
          <p className="text-xs text-[#64748B] mt-0.5">{title}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[#3B82F6]">
          {icon}
        </div>
      </div>
    </div>
  );
}