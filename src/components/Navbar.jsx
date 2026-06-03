import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X, MapPin, ChevronDown, LogOut, Package, Navigation } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, wishlist } = useApp();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("Home Delivery");
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (user) {
      detectUserLocation();
    }
  }, [user]);

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setDeliveryLocation("Location not supported");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          if (data.city) {
            setDeliveryLocation(data.city);
          } else if (data.locality) {
            setDeliveryLocation(data.locality);
          } else if (data.principalSubdivision) {
            setDeliveryLocation(data.principalSubdivision);
          } else {
            setDeliveryLocation("Home Delivery");
          }
        } catch (error) {
          setDeliveryLocation("Home Delivery");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setDeliveryLocation("Home Delivery");
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const refreshLocation = () => {
    detectUserLocation();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/products") {
      return location.pathname === "/products";
    }
    if (path === "/products?trending=true") {
      return location.pathname === "/products" && location.search.includes("trending=true");
    }
    if (path === "/products?bestseller=true") {
      return location.pathname === "/products" && location.search.includes("bestseller=true");
    }
    if (path === "/how-it-works") {
      return location.pathname === "/how-it-works";
    }
    return location.pathname === path;
  };

  const navLinks = [
    { name: "Home", path: "/", action: () => navigate("/") },
    { name: "Products", path: "/products", action: () => navigate("/products") },
    { name: "Trending", path: "/products?trending=true", action: () => navigate("/products?trending=true") },
    { name: "Best Sellers", path: "/products?bestseller=true", action: () => navigate("/products?bestseller=true") },
    { name: "How It Works", path: "/how-it-works", action: () => navigate("/how-it-works") },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28">
            <div className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105 duration-300 flex items-center" onClick={() => navigate("/")}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-28 w-auto object-contain brightness-105 contrast-105 drop-shadow-xl" 
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
              />
            </div>

            {user && (
              <div 
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 backdrop-blur-sm rounded-full cursor-pointer hover:bg-gray-100 transition-all border border-gray-200 group"
                onClick={refreshLocation}
              >
                <MapPin className="w-4 h-4 text-orange-500" />
                {locationLoading ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-700 font-medium">Detecting...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-gray-700 font-medium">{deliveryLocation}</span>
                    <Navigation className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            )}

            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search for fresh fruits, vegetables & more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50/80 backdrop-blur-sm rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all group-hover:border-green-300"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-all opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2">
              {user && (
                <button onClick={() => navigate("/wishlist")} className="relative p-2 text-gray-600 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </button>
              )}
              
              {user && (
                <button onClick={() => navigate("/cart")} className="relative p-2 text-gray-600 hover:text-green-600 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-white text-[9px] rounded-full flex items-center justify-center">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1 p-1.5 pl-2 bg-gray-50/80 backdrop-blur-sm rounded-full hover:bg-gray-100 transition-all border border-gray-200"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-20">
                      <div className="px-3 py-2 border-b border-gray-100 bg-green-50">
                        <p className="text-sm font-semibold text-gray-800">{user?.name || "Customer"}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <button onClick={() => { navigate("/profile"); setUserDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4" /> My Profile
                      </button>
                      <button onClick={() => { navigate("/orders"); setUserDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Package className="w-4 h-4" /> My Orders
                      </button>
                      <button onClick={() => { navigate("/wishlist"); setUserDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Heart className="w-4 h-4" /> Wishlist
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate("/signin")} className="px-3 py-1.5 text-green-700 text-sm font-medium hover:bg-green-50 rounded-lg transition-all">Sign In</button>
                  <button onClick={() => navigate("/signup")} className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-all shadow-sm">Sign Up</button>
                </div>
              )}
              
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-gray-600">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {user && (
            <div className="hidden lg:flex items-center justify-center gap-8 py-3 border-t border-gray-100">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={link.action}
                  className={`text-sm font-medium transition-colors relative group whitespace-nowrap ${
                    isActive(link.path) 
                      ? "text-green-600" 
                      : "text-gray-600 hover:text-green-600"
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-3 left-0 w-0 h-0.5 bg-green-600 transition-all duration-300 group-hover:w-full ${
                    isActive(link.path) ? "w-full" : ""
                  }`}></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 overflow-y-auto">
          <div className="p-4 space-y-3">
            <form onSubmit={handleSearch} className="mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200"
                />
              </div>
            </form>
            
            <div className="py-2">
              <p className="text-xs font-semibold text-gray-400 mb-2">MAIN MENU</p>
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => { link.action(); setMobileMenuOpen(false); }}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      isActive(link.path) 
                        ? "bg-green-50 text-green-600 font-medium" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-3">
              {!user && (
                <div className="flex gap-2">
                  <button onClick={() => { navigate("/signin"); setMobileMenuOpen(false); }} className="flex-1 py-2 border border-green-600 text-green-700 rounded-lg text-sm font-medium">Sign In</button>
                  <button onClick={() => { navigate("/signup"); setMobileMenuOpen(false); }} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Sign Up</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}