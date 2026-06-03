// src/pages/UserDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Package, Heart, MapPin, User, ShoppingBag, 
  LogOut, ChevronRight, Star, Clock, Truck, 
  Home, ShoppingCart, Settings, Search, Bell,
  Menu, X, LayoutDashboard
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { customerApi } from "../../services/customerApi";
import { useApp } from "../../context/AppContext";
import BrandLogo from "../../components/BrandLogo";

export function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cart, wishlist, cartTotal } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
    cartCount: 0,
  });

  // FIXED: Removed duplicate Profile/Settings - now unique paths
  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", path: "/dashboard" },
    { icon: <ShoppingBag className="w-5 h-5" />, label: "My Orders", path: "/orders" },
    { icon: <Heart className="w-5 h-5" />, label: "Wishlist", path: "/wishlist" },
    { icon: <MapPin className="w-5 h-5" />, label: "Addresses", path: "/profile?tab=addresses" },
    { icon: <User className="w-5 h-5" />, label: "Profile Settings", path: "/profile?tab=settings" },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let orders = [];
      try {
        orders = await customerApi.orders.getMyOrders(1, 5);
      } catch (orderError) {
        console.log("No orders found or user not authenticated");
        orders = [];
      }
      setRecentOrders(orders);
      
      setStats({
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, o) => sum + (o.grand_total || 0), 0),
        wishlistCount: wishlist.length,
        cartCount: cart.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
    }
  };

  const quickActions = [
    { icon: <ShoppingBag className="w-5 h-5 text-[#8B2C2C]" />, label: "My Orders", desc: "Track and view your orders", path: "/orders", color: "bg-red-50" },
    { icon: <Heart className="w-5 h-5 text-pink-500" />, label: "Wishlist", desc: `${stats.wishlistCount} items saved`, path: "/wishlist", color: "bg-pink-50" },
    { icon: <MapPin className="w-5 h-5 text-blue-500" />, label: "Addresses", desc: "Manage delivery addresses", path: "/profile?tab=addresses", color: "bg-blue-50" },
    { icon: <User className="w-5 h-5 text-purple-500" />, label: "Profile", desc: "Edit your profile", path: "/profile?tab=settings", color: "bg-purple-50" },
  ];

  const statusColors = {
    placed: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    packed: "bg-purple-100 text-purple-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8B2C2C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-72 h-screen bg-white border-r border-gray-100 transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-6 border-b border-gray-100">
            <BrandLogo size="sm" showTagline={false} />
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/profile" && location.pathname === "/profile");
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[#8B2C2C]/10 to-transparent text-[#8B2C2C] border-l-2 border-[#8B2C2C]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#8B2C2C]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-72">
        {/* Navbar */}
        <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]/20 focus:border-[#8B2C2C]"
                  />
                </div>
              </form>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <MapPin className="w-4 h-4 text-[#8B2C2C]" />
                  <span className="text-sm text-gray-600">Home Delivery</span>
                </div>

                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {stats.cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#8B2C2C] text-white text-xs rounded-full flex items-center justify-center">
                      {stats.cartCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#8B2C2C] to-[#6B1E1E] rounded-xl flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-800">{user?.name || "Customer"}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[#8B2C2C] to-[#6B1E1E] rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                  <span className="text-3xl font-bold">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Welcome back, {user?.name || "Customer"}!</h1>
                  <p className="text-white/80 text-sm mt-1">Ready to shop for fresh groceries?</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/products")}
                className="px-5 py-2.5 bg-white/20 rounded-xl text-sm font-medium hover:bg-white/30 transition-all backdrop-blur"
              >
                Start Shopping →
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.totalOrders}</span>
              </div>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-2xl font-bold text-gray-900">₹{stats.totalSpent.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.wishlistCount}</span>
              </div>
              <p className="text-sm text-gray-600">Wishlist Items</p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-2xl font-bold text-gray-900">4.8</span>
              </div>
              <p className="text-sm text-gray-600">Customer Rating</p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickActions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`${item.color} rounded-2xl p-5 text-left hover:shadow-md transition-all group`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm">
                    {item.icon}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-gray-800 text-base">{item.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </button>
            ))}
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">Recent Orders</h2>
                <p className="text-xs text-gray-500 mt-0.5">Your latest purchases</p>
              </div>
              <button 
                onClick={() => navigate("/orders")}
                className="text-sm text-[#8B2C2C] hover:underline"
              >
                View All
              </button>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
                <button
                  onClick={() => navigate("/products")}
                  className="mt-3 text-sm text-[#8B2C2C] hover:underline"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <div key={order._id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="font-semibold text-gray-800">{order.order_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="font-bold text-[#8B2C2C]">₹{order.grand_total}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.order_status]}`}>
                            {order.order_status}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:border-[#8B2C2C] hover:text-[#8B2C2C] transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Truck className="w-8 h-8 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Free Delivery</h3>
              </div>
              <p className="text-sm text-gray-600">On orders above ₹200</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-8 h-8 text-green-500" />
                <h3 className="font-semibold text-gray-800">30 Min Delivery</h3>
              </div>
              <p className="text-sm text-gray-600">Express delivery available</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-8 h-8 text-purple-500" />
                <h3 className="font-semibold text-gray-800">Quality Guaranteed</h3>
              </div>
              <p className="text-sm text-gray-600">100% fresh products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}