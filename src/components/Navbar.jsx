import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X, MapPin, ChevronDown, LogOut, Package, Navigation, FolderTree } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { customerApi } from "../services/customerApi";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, wishlist } = useApp();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ products: [], categories: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("Home Delivery");
  const [locationLoading, setLocationLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceTimeout = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (user) {
      detectUserLocation();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Search function with API calls for both products and categories
  const handleSearchAPI = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults({ products: [], categories: [] });
      setShowSearchDropdown(false);
      return;
    }

    setSearching(true);
    try {
      // Search products
      const products = await customerApi.getProducts({ 
        search: keyword.trim(),
        limit: 8,
        in_stock: true
      });
      
      // Search categories
      const allCategories = await customerApi.getCategories(true);
      const filteredCategories = allCategories.filter(cat => 
        cat.name.toLowerCase().includes(keyword.trim().toLowerCase())
      ).slice(0, 5);
      
      setSearchResults({
        products: products || [],
        categories: filteredCategories || []
      });
      setShowSearchDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({ products: [], categories: [] });
    } finally {
      setSearching(false);
    }
  };

  // Debounced search input handler
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      handleSearchAPI(value);
    }, 300);
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults({ products: [], categories: [] });
    setShowSearchDropdown(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleProductClick = (slug) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    navigate(`/product/${slug}`);
  };

  const handleCategoryClick = (categoryId, categoryName) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    navigate(`/products?category=${categoryId}`);
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

  const totalResults = searchResults.products.length + searchResults.categories.length;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105 duration-300 flex items-center" onClick={() => navigate("/")}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-28 w-auto object-contain brightness-105 contrast-105 drop-shadow-xl" 
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
              />
            </div>

            {/* Location */}
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

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4 relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for products or categories..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => searchQuery.trim() && totalResults > 0 && setShowSearchDropdown(true)}
                  className="w-full pl-9 pr-10 py-2 bg-gray-50/80 backdrop-blur-sm rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
                
                {/* Clear Button (X) */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
                
                {searching && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </form>

              {/* Search Results Dropdown - No prices, just images and names */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                  {totalResults > 0 ? (
                    <div>
                      <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b border-gray-200 sticky top-0">
                        Found {totalResults} result(s)
                      </div>
                      
                      {/* Categories Section */}
                      {searchResults.categories.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 bg-gray-50/50 text-xs font-semibold text-gray-500 border-b border-gray-100">
                            CATEGORIES
                          </div>
                          {searchResults.categories.map((category) => (
                            <div
                              key={category._id}
                              onClick={() => handleCategoryClick(category._id, category.name)}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                            >
                              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {category.image_url ? (
                                  <img 
                                    src={category.image_url} 
                                    alt={category.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FolderTree className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">{category.name}</p>
                                <p className="text-xs text-gray-500">Category</p>
                              </div>
                              <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Products Section - No price displayed */}
                      {searchResults.products.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 bg-gray-50/50 text-xs font-semibold text-gray-500 border-b border-gray-100">
                            PRODUCTS
                          </div>
                          {searchResults.products.map((product) => (
                            <div
                              key={product._id}
                              onClick={() => handleProductClick(product.slug)}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                            >
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {product.main_image ? (
                                  <img 
                                    src={product.main_image} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.unit || "Fresh Produce"}</p>
                              </div>
                              {/* REMOVED: Price section - no longer showing price in search dropdown */}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="p-2 border-t border-gray-100 sticky bottom-0 bg-white">
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium py-1"
                        >
                          View all results for "{searchQuery}" →
                        </button>
                      </div>
                    </div>
                  ) : searchQuery.trim() && !searching ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No products or categories found for "{searchQuery}"</p>
                      <p className="text-xs mt-1">Try searching with different keywords</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Right side icons */}
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

          {/* Bottom Navigation Links */}
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 overflow-y-auto">
          <div className="p-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products or categories..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  className="w-full pl-9 pr-10 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
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