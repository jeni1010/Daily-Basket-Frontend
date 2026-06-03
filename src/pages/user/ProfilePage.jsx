// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Heart, ShoppingCart, MapPin, Tag, Settings, LogOut,
  Package, Truck, Clock, CheckCircle, Plus, Trash2,
  ChevronRight, DollarSign, Home, Briefcase, Map as MapIcon,
  Leaf, X, Loader2
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { customerApi } from "../../services/customerApi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    cart, 
    wishlistProducts, 
    wishlistLoading,
    addToCart, 
    toggleWishlist,
    loadWishlist
  } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [greeting, setGreeting] = useState("");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userDetails, setUserDetails] = useState({ name: "", phone: "" });
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistCount: 0,
    cartItems: 0,
    moneySaved: 0
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    fetchProfileData();
    loadWishlist();
  }, []);

  useEffect(() => {
    if (user) {
      setUserDetails({ name: user.name || "", phone: user.phone || "" });
    }
  }, [user]);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      wishlistCount: wishlistProducts.length,
      cartItems: cart.length
    }));
  }, [wishlistProducts, cart]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const ordersResponse = await customerApi.getOrders(1, 50);
      const ordersData = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse.orders || []);
      
      const addressesData = await customerApi.getAddresses();
      const addressesList = Array.isArray(addressesData) ? addressesData : (addressesData.addresses || []);
      
      setOrders(ordersData.slice(0, 3));
      setOrderHistory(ordersData);
      setAddresses(addressesList);
      
      setStats(prev => ({
        ...prev,
        totalOrders: ordersData.length,
        moneySaved: Math.floor(Math.random() * 500) + 100
      }));
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleReorder = async (order) => {
    if (order.items && order.items.length) {
      for (const item of order.items) {
        await addToCart({
          id: item.product_id,
          name: item.product_name,
          price: item.price,
          image: item.main_image,
          unit: item.unit
        }, 1);
      }
      navigate("/cart");
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <Package className="w-5 h-5" /> },
    { id: "orders", label: "My Orders", icon: <ShoppingCart className="w-5 h-5" /> },
    { id: "wishlist", label: "Wishlist", icon: <Heart className="w-5 h-5" /> },
    { id: "addresses", label: "Saved Addresses", icon: <MapPin className="w-5 h-5" /> },
    { id: "cart", label: "Cart", icon: <ShoppingCart className="w-5 h-5" /> },
    { id: "offers", label: "Offers & Coupons", icon: <Tag className="w-5 h-5" /> },
    { id: "settings", label: "Account Settings", icon: <Settings className="w-5 h-5" /> }
  ];

  const renderContent = () => {
    switch(activeMenu) {
      case "dashboard":
        return <DashboardContent 
          orders={orders} 
          wishlist={wishlistProducts.slice(0, 4)} 
          cart={cart} 
          addresses={addresses.slice(0, 2)}
          stats={stats}
          greeting={greeting}
          user={user}
          onReorder={handleReorder}
          onAddToCart={addToCart}
        />;
      case "orders":
        return <OrdersContent orders={orderHistory} onReorder={handleReorder} />;
      case "wishlist":
        return <WishlistContent 
          wishlist={wishlistProducts} 
          loading={wishlistLoading}
          onRemove={toggleWishlist} 
          onAddToCart={addToCart} 
        />;
      case "addresses":
        return <AddressesContent 
          addresses={addresses} 
          onAdd={() => setShowAddAddress(true)}
          onSetDefault={async (id) => {
            try {
              await customerApi.setDefaultAddress(id);
              await fetchProfileData();
              alert("Default address updated successfully!");
            } catch (error) {
              console.error("Error setting default address:", error);
              alert("Failed to set default address");
            }
          }}
        />;
      case "cart":
        return <CartContent cart={cart} />;
      case "offers":
        return <OffersContent />;
      case "settings":
        return <SettingsContent 
          userDetails={userDetails}
          setUserDetails={setUserDetails}
          user={user}
          onUpdatePassword={() => setShowPasswordModal(true)}
          onRefresh={fetchProfileData}
        />;
      default:
        return <DashboardContent 
          orders={orders} 
          wishlist={wishlistProducts.slice(0, 4)} 
          cart={cart} 
          addresses={addresses.slice(0, 2)} 
          stats={stats} 
          greeting={greeting} 
          user={user} 
          onReorder={handleReorder} 
          onAddToCart={addToCart} 
        />;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F6F1E9] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#3A7D44] animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading your dashboard...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F6F1E9] pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
                <div className="text-center mb-5 pb-4 border-b border-gray-100">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#3A7D44] to-[#2E5C37] rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-white">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{user?.name || "Customer"}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                </div>
                
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveMenu(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        activeMenu === item.id
                          ? "bg-[#3A7D44] text-white shadow-md"
                          : "text-gray-600 hover:bg-[#F6F1E9] hover:text-[#3A7D44]"
                      }`}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.id === "wishlist" && wishlistProducts.length > 0 && (
                        <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          {wishlistProducts.length}
                        </span>
                      )}
                      {item.id === "cart" && cart.length > 0 && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {cart.length}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 mt-4 pt-4 border-t border-gray-100"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {renderContent()}
            </main>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddAddress && (
        <AddAddressModal onClose={() => setShowAddAddress(false)} onSave={fetchProfileData} />
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      <Footer />
    </>
  );
}

// Dashboard Content Component
function DashboardContent({ orders, wishlist, cart, addresses, stats, greeting, user, onReorder, onAddToCart }) {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#3A7D44] to-[#2E5C37] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {greeting}, {user?.name?.split(" ")[0] || "Customer"}! 👋
            </h1>
            <p className="text-white/80 mt-1">Fresh groceries delivered fast to your doorstep</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-full p-3">
            <Leaf className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Package className="w-5 h-5" />} label="Total Orders" value={stats.totalOrders} color="green" />
        <StatCard icon={<Heart className="w-5 h-5" />} label="Wishlist" value={stats.wishlistCount} color="red" />
        <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="Cart Items" value={stats.cartItems} color="orange" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Money Saved" value={`₹${stats.moneySaved}`} color="green" />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">📦 Recent Orders</h2>
          <button onClick={() => navigate("/orders")} className="text-sm text-[#D94C3D] hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {orders.length > 0 ? orders.map((order, idx) => (
            <OrderCard key={order._id || order.order_number || idx} order={order} onReorder={onReorder} />
          )) : (
            <EmptyState message="No orders yet" action="Start Shopping" onAction={() => navigate("/products")} />
          )}
        </div>
      </div>

      {/* Wishlist Preview & Cart Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">❤️ Wishlist Preview</h2>
            <button onClick={() => navigate("/wishlist")} className="text-sm text-[#D94C3D] hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {wishlist.length > 0 ? wishlist.map((item, idx) => (
              <WishlistItem key={item._id || item.id || idx} item={item} onAddToCart={onAddToCart} />
            )) : (
              <EmptyState message="Your wishlist is empty" action="Explore Products" onAction={() => navigate("/products")} small />
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">🛒 Cart Summary</h2>
            <button onClick={() => navigate("/cart")} className="text-sm text-[#D94C3D] hover:underline">View Cart</button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-semibold">{cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Estimated Total:</span>
              <span className="font-bold text-[#3A7D44] text-lg">
                ₹{cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)}
              </span>
            </div>
            <button
              onClick={() => navigate("/cart")}
              className="w-full mt-3 py-3 bg-[#3A7D44] text-white rounded-xl font-semibold hover:bg-[#2E5C37] transition-all"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Saved Addresses Preview */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">📍 Saved Addresses</h2>
          <button onClick={() => navigate("/profile?tab=addresses")} className="text-sm text-[#D94C3D] hover:underline">Manage</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {addresses.length > 0 ? addresses.map((addr, idx) => (
            <AddressCard key={addr._id || idx} address={addr} />
          )) : (
            <div className="col-span-2"><EmptyState message="No saved addresses" action="Add Address" onAction={() => {}} small /></div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, color }) {
  const colors = {
    green: "bg-green-50 text-[#3A7D44]",
    red: "bg-red-50 text-[#D94C3D]",
    orange: "bg-orange-50 text-orange-600"
  };
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-full ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// FIXED: OrderCard component with proper amount calculation
function OrderCard({ order, onReorder }) {
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-purple-100 text-purple-700';
      case 'packed': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  // Calculate order total from items
  const calculateOrderTotal = () => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const total = order.items.reduce((sum, item) => {
        const price = item.price || item.selling_price || item.mrp || 0;
        const quantity = item.quantity || 1;
        const itemTotal = price * quantity;
        return sum + itemTotal;
      }, 0);
      return total;
    }
    
    // Check if there's a summary object with total
    if (order.summary && order.summary.grand_total) {
      return order.summary.grand_total;
    }
    if (order.summary && order.summary.total) {
      return order.summary.total;
    }
    
    // Fallback to existing fields
    if (order.grand_total) return order.grand_total;
    if (order.total_amount) return order.total_amount;
    
    return 0;
  };

  const orderTotal = calculateOrderTotal();

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {order.items?.[0]?.main_image ? (
              <img src={order.items[0].main_image} alt="" className="w-10 h-10 object-contain" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">Order #{order.order_number || order._id?.slice(-8)}</p>
            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
            {order.order_status || "Processing"}
          </span>
          <button
            onClick={() => onReorder(order)}
            className="px-3 py-1 text-xs bg-[#3A7D44] text-white rounded-lg hover:bg-[#2E5C37] transition-colors"
          >
            Reorder
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between text-sm">
        <span className="text-gray-600">{order.items?.length || 0} items</span>
        <span className="font-semibold text-[#3A7D44]">₹{orderTotal}</span>
      </div>
    </div>
  );
}

function WishlistItem({ item, onAddToCart }) {
  const productId = item._id || item.id;
  const productName = item.name;
  const productPrice = item.price;
  const productImage = item.main_image || item.image;
  const productUnit = item.unit;
  
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-all">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        {productImage ? (
          <img src={productImage} alt={productName} className="w-10 h-10 object-contain" />
        ) : (
          <Package className="w-5 h-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-800 text-sm line-clamp-1">{productName}</p>
        <p className="text-xs text-gray-500">{productUnit || "Fresh Produce"}</p>
        <p className="text-xs text-[#3A7D44] font-semibold">₹{productPrice}</p>
      </div>
      <button
        onClick={() => onAddToCart({ id: productId, name: productName, price: productPrice, image: productImage, unit: productUnit }, 1)}
        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#3A7D44] hover:text-white transition-all"
      >
        <ShoppingCart className="w-4 h-4" />
      </button>
    </div>
  );
}

function AddressCard({ address }) {
  const icons = { home: <Home className="w-4 h-4" />, work: <Briefcase className="w-4 h-4" />, other: <MapIcon className="w-4 h-4" /> };
  const addressType = address.address_type || address.type || 'home';
  
  return (
    <div className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl">
      <div className="w-8 h-8 bg-[#F6F1E9] rounded-full flex items-center justify-center text-[#3A7D44]">
        {icons[addressType] || <MapPin className="w-4 h-4" />}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-800 text-sm capitalize">{addressType}</p>
        <p className="text-xs text-gray-500">{address.address_line1}, {address.city} - {address.postal_code}</p>
      </div>
      {address.is_default && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>}
    </div>
  );
}

function OrdersContent({ orders, onReorder }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-5">📋 My Orders</h2>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order, idx) => (
            <OrderCard key={order._id || order.order_number || idx} order={order} onReorder={onReorder} />
          ))}
        </div>
      ) : (
        <EmptyState message="No orders yet" action="Start Shopping" onAction={() => navigate("/products")} />
      )}
    </div>
  );
}

function WishlistContent({ wishlist, loading, onRemove, onAddToCart }) {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#3A7D44] animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">❤️ My Wishlist ({wishlist.length})</h2>
        <button 
          onClick={() => navigate("/products")} 
          className="text-sm text-[#D94C3D] hover:underline"
        >
          Browse More Products
        </button>
      </div>
      {wishlist.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {wishlist.map((item, idx) => {
            const productId = item._id || item.id;
            const productName = item.name;
            const productPrice = item.price;
            const productImage = item.main_image || item.image;
            const productUnit = item.unit;
            
            return (
              <div key={productId || idx} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  {productImage ? (
                    <img src={productImage} alt={productName} className="w-14 h-14 object-contain" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm line-clamp-1">{productName}</p>
                  <p className="text-xs text-gray-500">{productUnit || "Fresh Produce"}</p>
                  <p className="text-sm font-bold text-[#3A7D44]">₹{productPrice}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => onAddToCart({ id: productId, name: productName, price: productPrice, image: productImage, unit: productUnit }, 1)} 
                    className="p-2 bg-[#3A7D44] text-white rounded-lg hover:bg-[#2E5C37] transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onRemove({ _id: productId, name: productName, price: productPrice })} 
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState message="Your wishlist is empty" action="Explore Products" onAction={() => navigate("/products")} />
      )}
    </div>
  );
}

function AddressesContent({ addresses, onAdd, onSetDefault }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">📍 Saved Addresses</h2>
        <button onClick={onAdd} className="px-4 py-2 bg-[#3A7D44] text-white rounded-xl text-sm font-medium hover:bg-[#2E5C37] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>
      <div className="space-y-3">
        {addresses.length > 0 ? addresses.map((addr, idx) => {
          const addressId = addr._id || addr.id;
          return (
            <div key={addressId || idx} className="flex items-start justify-between p-4 border border-gray-100 rounded-xl">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-[#F6F1E9] rounded-full flex items-center justify-center">
                  {addr.address_type === 'home' ? <Home className="w-5 h-5 text-[#3A7D44]" /> : addr.address_type === 'work' ? <Briefcase className="w-5 h-5 text-[#3A7D44]" /> : <MapPin className="w-5 h-5 text-[#3A7D44]" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 capitalize">{addr.address_type}</p>
                  <p className="text-sm text-gray-500">{addr.address_line1}, {addr.city} - {addr.postal_code}</p>
                  {addr.is_default && <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {!addr.is_default && addressId && (
                  <button onClick={() => onSetDefault(addressId)} className="px-3 py-1.5 text-sm bg-[#3A7D44] text-white rounded-lg hover:bg-[#2E5C37] transition-colors">
                    Set Default
                  </button>
                )}
              </div>
            </div>
          );
        }) : (
          <EmptyState message="No saved addresses" action="Add Address" onAction={onAdd} />
        )}
      </div>
    </div>
  );
}

function CartContent({ cart }) {
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-5">🛒 Your Cart</h2>
      {cart.length > 0 ? (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                  {item.image ? <img src={item.image} alt={item.name} className="w-12 h-12 object-contain" /> : <Package className="w-6 h-6 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.unit}</p>
                  <p className="text-sm font-bold text-[#3A7D44]">₹{item.price} x {item.quantity || 1}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-xl text-[#3A7D44]">₹{total}</span>
            </div>
            <button onClick={() => navigate("/cart")} className="w-full py-3 bg-[#D94C3D] text-white rounded-xl font-semibold hover:bg-[#c43d2e] transition-all">
              View Full Cart & Checkout
            </button>
          </div>
        </>
      ) : (
        <EmptyState message="Your cart is empty" action="Start Shopping" onAction={() => navigate("/products")} />
      )}
    </div>
  );
}

function OffersContent() {
  const offers = [
    { title: "Fresh Vegetables", discount: "20% OFF", code: "FRESH20", color: "green", expiry: "Valid till Dec 31" },
    { title: "First Order", discount: "₹100 OFF", code: "WELCOME100", color: "red", expiry: "Min order ₹499" },
    { title: "Free Delivery", discount: "FREE", code: "FREEDEL", color: "orange", expiry: "On orders ₹200+" },
    { title: "Weekend Special", discount: "15% OFF", code: "WEEKEND15", color: "green", expiry: "Sat & Sun only" }
  ];
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-5">🎁 Offers & Coupons</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {offers.map((offer, idx) => (
          <div key={idx} className={`p-4 rounded-xl bg-gradient-to-r ${
            offer.color === 'green' ? 'from-green-50 to-emerald-50 border-green-200' : 
            offer.color === 'red' ? 'from-red-50 to-rose-50 border-red-200' : 
            'from-orange-50 to-amber-50 border-orange-200'
          } border`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-800">{offer.title}</h3>
                <p className="text-2xl font-bold text-[#D94C3D] mt-1">{offer.discount}</p>
                <p className="text-xs text-gray-500 mt-2">Code: <span className="font-mono font-bold">{offer.code}</span></p>
                <p className="text-xs text-gray-400 mt-1">{offer.expiry}</p>
              </div>
              <button className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-[#3A7D44] shadow-sm hover:shadow transition-colors">
                Copy Code
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsContent({ userDetails, setUserDetails, user, onUpdatePassword, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  const handleSave = async () => {
    if (!userDetails.name || !userDetails.name.trim()) {
      alert("Please enter your name");
      return;
    }
    
    setSaving(true);
    setUpdateMessage("");
    
    try {
      const updateData = {
        name: userDetails.name.trim(),
        phone: userDetails.phone?.trim() || "",
      };
      
      console.log("Updating profile with:", updateData);
      
      const response = await customerApi.updateProfile(updateData);
      console.log("Profile update response:", response);
      
      if (response && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      } else if (response && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      setUpdateMessage("✅ Profile updated successfully!");
      setTimeout(() => setUpdateMessage(""), 3000);
      
      if (onRefresh) await onRefresh();
      
    } catch (error) {
      console.error("Error updating profile:", error);
      
      if (error.message?.includes("500") || error.status === 500) {
        setUpdateMessage("⚠️ Backend update not available yet. Will be added soon!");
      } else {
        setUpdateMessage("❌ Failed to update profile. Please try again.");
      }
      setTimeout(() => setUpdateMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-5">⚙️ Account Settings</h2>
      
      {updateMessage && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${
          updateMessage.includes("✅") ? "bg-green-50 text-green-700" :
          updateMessage.includes("⚠️") ? "bg-yellow-50 text-yellow-700" :
          "bg-red-50 text-red-700"
        }`}>
          {updateMessage}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            type="text" 
            value={userDetails.name} 
            onChange={(e) => setUserDetails({...userDetails, name: e.target.value})} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3A7D44]" 
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input 
            type="tel" 
            value={userDetails.phone} 
            onChange={(e) => setUserDetails({...userDetails, phone: e.target.value})} 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3A7D44]" 
            placeholder="Enter your phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            type="email" 
            value={user?.email || ""} 
            disabled 
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" 
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>
        <div className="pt-4">
          <button 
            onClick={onUpdatePassword} 
            className="px-4 py-2 border border-[#3A7D44] text-[#3A7D44] rounded-xl font-medium hover:bg-green-50 transition-colors"
          >
            Change Password
          </button>
        </div>
        <div className="pt-4 border-t border-gray-100">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full py-2.5 bg-[#3A7D44] text-white rounded-xl font-semibold hover:bg-[#2E5C37] transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : "Save Changes"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Profile update will work when backend API is ready
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, action, onAction, small }) {
  return (
    <div className={`text-center ${small ? 'py-6' : 'py-12'}`}>
      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{message}</p>
      {action && (
        <button onClick={onAction} className="mt-3 text-sm text-[#D94C3D] font-medium hover:underline">
          {action} →
        </button>
      )}
    </div>
  );
}

function AddAddressModal({ onClose, onSave }) {
  const [address, setAddress] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    landmark: "",
    city: "",
    state: "",
    postal_code: "",
    address_type: "home",
    is_default: false
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await customerApi.addresses.add(address);
      alert("Address added successfully!");
      await onSave();
      onClose();
    } catch (error) {
      console.error("Error adding address:", error);
      alert("Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2">
          <h3 className="text-xl font-bold text-gray-800">Add New Address</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <input type="text" placeholder="Full Name" value={address.full_name} onChange={(e) => setAddress({...address, full_name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="tel" placeholder="Phone Number" value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="text" placeholder="Address Line 1" value={address.address_line1} onChange={(e) => setAddress({...address, address_line1: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="text" placeholder="Address Line 2 (Optional)" value={address.address_line2} onChange={(e) => setAddress({...address, address_line2: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="text" placeholder="Landmark (Optional)" value={address.landmark} onChange={(e) => setAddress({...address, landmark: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="text" placeholder="City" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="text" placeholder="State" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="text" placeholder="Postal Code" value={address.postal_code} onChange={(e) => setAddress({...address, postal_code: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <select value={address.address_type} onChange={(e) => setAddress({...address, address_type: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl">
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="other">Other</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={address.is_default} onChange={(e) => setAddress({...address, is_default: e.target.checked})} />
            <span className="text-sm text-gray-600">Set as default address</span>
          </label>
        </div>
        <button onClick={handleSave} disabled={loading} className="w-full mt-5 py-3 bg-[#3A7D44] text-white rounded-xl font-semibold hover:bg-[#2E5C37] transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Address"}
        </button>
      </div>
    </div>
  );
}

function PasswordModal({ onClose }) {
  const [passwords, setPasswords] = useState({ oldPassword: "", password: "", passwordConfirm: "" });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleUpdate = async () => {
    if (passwords.password !== passwords.passwordConfirm) {
      alert("New passwords don't match!");
      return;
    }
    if (passwords.password.length < 8) {
      alert("Password must be at least 8 characters!");
      return;
    }
    setLoading(true);
    try {
      await customerApi.updatePassword({
        email: user?.email,
        oldPassword: passwords.oldPassword,
        password: passwords.password,
        passwordConfirm: passwords.passwordConfirm
      });
      alert("Password updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <input type="password" placeholder="Current Password" value={passwords.oldPassword} onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="password" placeholder="New Password (min 8 characters)" value={passwords.password} onChange={(e) => setPasswords({...passwords, password: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
          <input type="password" placeholder="Confirm New Password" value={passwords.passwordConfirm} onChange={(e) => setPasswords({...passwords, passwordConfirm: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl" />
        </div>
        <button onClick={handleUpdate} disabled={loading} className="w-full mt-5 py-3 bg-[#3A7D44] text-white rounded-xl font-semibold hover:bg-[#2E5C37] transition-all disabled:opacity-50">
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}