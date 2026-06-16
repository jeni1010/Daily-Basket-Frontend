import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  SlidersHorizontal, ChevronDown, Loader2, X, ShoppingBag, Truck, Clock, Star, Heart,
  Filter, ChevronRight, Check, Minus, Plus, Sparkles
} from "lucide-react";
import { ProductCard } from "../../components/ProductCard";
import { customerApi } from "../../services/customerApi";
import { useApp } from "../../context/AppContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export function ProductListingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toggleWishlist, wishlist } = useApp();
  
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  const trendingParam = searchParams.get("trending");
  const bestsellerParam = searchParams.get("bestseller");
  const organicParam = searchParams.get("organic");
  const dealsParam = searchParams.get("deals");
  const newParam = searchParams.get("new");
  
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filterType, setFilterType] = useState("all");

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (trendingParam === "true") {
      setFilterType("trending");
      setSelectedCategory("all");
    } else if (bestsellerParam === "true") {
      setFilterType("bestseller");
      setSelectedCategory("all");
    } else if (organicParam === "true") {
      setFilterType("organic");
      setSelectedCategory("all");
    } else if (dealsParam === "true") {
      setFilterType("deals");
      setSelectedCategory("all");
    } else if (newParam === "true") {
      setFilterType("new");
      setSelectedCategory("all");
    } else if (categoryParam) {
      setFilterType("category");
      setSelectedCategory(categoryParam);
    } else if (searchParam) {
      setFilterType("search");
    } else {
      setFilterType("all");
    }
  }, [trendingParam, bestsellerParam, organicParam, dealsParam, newParam, categoryParam, searchParam]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await customerApi.getCategories(true);
      setCategories(data);
    } catch (err) {
      // Silent error handling
    }
  }, []);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let allProductsList = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore) {
        const params = {
          page: page,
          limit: limit,
          in_stock: true,
        };
        
        const data = await customerApi.getProducts(params);
        const productsList = Array.isArray(data) ? data : (data.products || []);
        
        if (productsList.length === 0) {
          hasMore = false;
        } else {
          allProductsList = [...allProductsList, ...productsList];
          if (productsList.length < limit) {
            hasMore = false;
          } else {
            page++;
          }
        }
      }
      
      setAllProducts(allProductsList);
      
    } catch (err) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback((productsList) => {
    let filtered = [...productsList];
    
    switch(filterType) {
      case "trending":
        filtered = [...filtered]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 20);
        break;
        
      case "bestseller":
        filtered = [...filtered]
          .filter(p => p.is_featured === true || (p.rating || 0) >= 4.5)
          .slice(0, 20);
        break;
        
      case "organic":
        filtered = filtered.filter(p => 
          p.tags?.includes('organic') || 
          p.is_organic === true ||
          p.name?.toLowerCase().includes('organic')
        );
        break;
        
      case "deals":
        filtered = filtered.filter(p => 
          p.compare_price && p.compare_price > p.price
        );
        break;
        
      case "new":
        filtered = [...filtered]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 20);
        break;
        
      case "category":
        if (selectedCategory !== "all") {
          filtered = filtered.filter(p => 
            p.category_id === selectedCategory || 
            p.category_name?.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        break;
        
      case "search":
        if (searchParam) {
          filtered = filtered.filter(p => 
            p.name?.toLowerCase().includes(searchParam.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchParam.toLowerCase())
          );
        }
        break;
        
      default:
        if (selectedCategory !== "all") {
          filtered = filtered.filter(p => 
            p.category_id === selectedCategory || 
            p.category_name?.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
    }
    
    if (priceRange[1] < 1000) {
      filtered = filtered.filter(p => p.price <= priceRange[1]);
    }
    if (priceRange[0] > 0) {
      filtered = filtered.filter(p => p.price >= priceRange[0]);
    }
    
    if (inStockOnly) {
      filtered = filtered.filter(p => (p.stock_quantity || 0) > 0);
    }
    
    if (featuredOnly) {
      filtered = filtered.filter(p => p.is_featured === true);
    }
    
    if (trendingOnly) {
      filtered = filtered.filter(p => p.is_trending === true);
    }
    
    const sortMap = {
      newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      price_low: (a, b) => (a.price || 0) - (b.price || 0),
      price_high: (a, b) => (b.price || 0) - (a.price || 0),
      name_asc: (a, b) => (a.name || "").localeCompare(b.name || ""),
      name_desc: (a, b) => (b.name || "").localeCompare(a.name || ""),
    };
    
    if (sortMap[sortBy]) {
      filtered.sort(sortMap[sortBy]);
    }
    
    setProducts(filtered);
    setTotalProducts(filtered.length);
  }, [filterType, selectedCategory, priceRange, inStockOnly, featuredOnly, trendingOnly, sortBy, searchParam]);

  useEffect(() => {
    fetchCategories();
    fetchAllProducts();
  }, [fetchCategories, fetchAllProducts]);

  useEffect(() => {
    if (allProducts.length > 0) {
      applyFilters(allProducts);
    }
  }, [selectedCategory, priceRange, inStockOnly, featuredOnly, trendingOnly, sortBy, filterType, searchParam, allProducts, applyFilters]);

  const getPageTitle = () => {
    if (searchParam) return `Results for "${searchParam}"`;
    if (filterType === "trending") return "Trending Now";
    if (filterType === "bestseller") return "Best Sellers";
    if (filterType === "organic") return "Organic Products";
    if (filterType === "deals") return "Today's Deals";
    if (filterType === "new") return "Fresh Arrivals";
    if (selectedCategory !== "all") {
      const category = categories.find(c => c._id === selectedCategory);
      return category?.name || "Products";
    }
    return "All Products";
  };

  const getPageSubtitle = () => {
    if (filterType === "trending") return "Most popular items right now";
    if (filterType === "bestseller") return "Customer favorites";
    if (filterType === "organic") return "100% certified organic products";
    if (filterType === "deals") return "Limited time offers";
    if (filterType === "new") return "Newest products added";
    return `${totalProducts} fresh products available`;
  };

  const activeCategories = categories.filter(cat => cat.level === 0 || cat.level === 1);

  const isProductInWishlist = (productId) => {
    return wishlist.includes(productId);
  };

  // Filter count for badge
  const activeFilterCount = () => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (priceRange[1] < 1000) count++;
    if (inStockOnly) count++;
    if (featuredOnly) count++;
    if (trendingOnly) count++;
    return count;
  };

  // ✅ Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 1000]);
    setInStockOnly(false);
    setFeaturedOnly(false);
    setTrendingOnly(false);
    setFilterType("all");
    navigate("/products");
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5EFE6]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#3E7C47] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading fresh products...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5EFE6]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-500 mb-4 text-5xl">⚠️</div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#3E7C47] text-white rounded-lg hover:bg-[#2E5C37] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <Navbar />
      
      {/* Category Banner - Modern Grocery Style */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setFilterType("all");
                navigate("/products");
              }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === "all" && filterType === "all"
                  ? "bg-[#3E7C47] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Products
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => {
                  setSelectedCategory(cat._id);
                  setFilterType("category");
                  navigate(`/products?category=${cat._id}`);
                }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat._id
                    ? "bg-[#3E7C47] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Title and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-sm text-gray-500 mt-1">{getPageSubtitle()}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#3E7C47] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Filter Button with Badge */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#3E7C47] hover:text-[#3E7C47] transition-all relative"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B6463A] text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Professional Grocery Style */}
          {showFilters && (
            <aside className={`${isMobile ? 'w-full' : 'lg:w-72'} flex-shrink-0`}>
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24 shadow-sm">
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#3E7C47]" />
                    Filters
                  </h3>
                  <button 
                    onClick={clearAllFilters}
                    className="text-xs text-[#3E7C47] hover:underline font-medium"
                  >
                    Clear All
                  </button>
                </div>

                {/* Categories */}
                {activeCategories.length > 0 && filterType === "all" && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                    <div className="space-y-1 max-h-52 overflow-y-auto">
                      <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="category"
                          value="all"
                          checked={selectedCategory === "all"}
                          onChange={() => setSelectedCategory("all")}
                          className="accent-[#3E7C47] w-4 h-4"
                        />
                        <span className="text-sm text-gray-600 flex-1">All Categories</span>
                        <span className="text-xs text-gray-400">{totalProducts}</span>
                      </label>
                      {activeCategories.map((cat) => (
                        <label key={cat._id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="category"
                            value={cat._id}
                            checked={selectedCategory === cat._id}
                            onChange={() => setSelectedCategory(cat._id)}
                            className="accent-[#3E7C47] w-4 h-4"
                          />
                          <span className="text-sm text-gray-600 flex-1">{cat.name}</span>
                          <span className="text-xs text-gray-400">
                            {allProducts.filter(p => p.category_id === cat._id).length}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    step={50}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-[#3E7C47] h-1.5 rounded-lg appearance-none bg-gray-200"
                  />
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[
                      { label: "Under ₹200", value: 200 },
                      { label: "Under ₹500", value: 500 },
                      { label: "All", value: 1000 }
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => setPriceRange([0, value])}
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          priceRange[1] === value 
                            ? 'bg-[#3E7C47] text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filters - Premium Checkbox Style */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Product Status</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="accent-[#3E7C47] w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-600 flex-1">In Stock Only</span>
                      {inStockOnly && <Check className="w-3.5 h-3.5 text-[#3E7C47]" />}
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={featuredOnly}
                        onChange={(e) => setFeaturedOnly(e.target.checked)}
                        className="accent-[#3E7C47] w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-600 flex-1">Featured Products</span>
                      {featuredOnly && <Check className="w-3.5 h-3.5 text-[#3E7C47]" />}
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={trendingOnly}
                        onChange={(e) => setTrendingOnly(e.target.checked)}
                        className="accent-[#3E7C47] w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-600 flex-1">Trending Products</span>
                      {trendingOnly && <Check className="w-3.5 h-3.5 text-[#3E7C47]" />}
                    </label>
                  </div>
                </div>

                {/* Active Filters Summary */}
                {activeFilterCount() > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Active Filters:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCategory !== "all" && (
                        <span className="inline-flex items-center gap-1 bg-[#3E7C47]/10 text-[#3E7C47] text-xs px-2 py-0.5 rounded-full">
                          {categories.find(c => c._id === selectedCategory)?.name || selectedCategory}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                        </span>
                      )}
                      {priceRange[1] < 1000 && (
                        <span className="inline-flex items-center gap-1 bg-[#3E7C47]/10 text-[#3E7C47] text-xs px-2 py-0.5 rounded-full">
                          ₹{priceRange[0]} - ₹{priceRange[1]}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange([0, 1000])} />
                        </span>
                      )}
                      {inStockOnly && (
                        <span className="inline-flex items-center gap-1 bg-[#3E7C47]/10 text-[#3E7C47] text-xs px-2 py-0.5 rounded-full">
                          In Stock
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setInStockOnly(false)} />
                        </span>
                      )}
                      {featuredOnly && (
                        <span className="inline-flex items-center gap-1 bg-[#3E7C47]/10 text-[#3E7C47] text-xs px-2 py-0.5 rounded-full">
                          Featured
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setFeaturedOnly(false)} />
                        </span>
                      )}
                      {trendingOnly && (
                        <span className="inline-flex items-center gap-1 bg-[#3E7C47]/10 text-[#3E7C47] text-xs px-2 py-0.5 rounded-full">
                          Trending
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setTrendingOnly(false)} />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Products Grid Area - 5 columns */}
          <div className="flex-1">
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-700">{products.length}</span> products
              </p>
              {(searchParam || filterType !== "all" || inStockOnly || featuredOnly || trendingOnly || priceRange[1] < 1000) && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-[#3E7C47] hover:underline font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or search criteria</p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-[#3E7C47] text-white rounded-lg text-sm hover:bg-[#2E5C37] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              // ✅ 5 columns grid
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard 
                    key={product._id} 
                    product={{
                      id: product._id,
                      slug: product.slug,
                      name: product.name,
                      price: product.price,
                      originalPrice: product.compare_price,
                      rating: product.rating || 4.5,
                      reviewCount: product.reviewCount || 0,
                      image: product.main_image,
                      isTodaysDeal: product.is_featured,
                      isTrending: filterType === "trending",
                      category: product.category_id,
                      unit: product.unit,
                      inStock: (product.stock_quantity || 0) > 0,
                      discount: product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0,
                      isWishlisted: isProductInWishlist(product._id),
                    }} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5 text-[#3E7C47]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Free Delivery</p>
              <p className="text-xs text-gray-500">On orders above ₹200</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">30 Min Delivery</p>
              <p className="text-xs text-gray-500">Express delivery available</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Fresh Guarantee</p>
              <p className="text-xs text-gray-500">100% quality assurance</p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}