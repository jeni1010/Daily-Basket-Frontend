import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Star, Truck, Clock, Shield, Leaf, Package, ShoppingCart,
  ChevronRight, Plus, Minus, Laptop, Sprout, Heart, TrendingUp,
  Send, CreditCard
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { customerApi } from "../services/customerApi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LandingPage() {
  const navigate = useNavigate();
  const { cart, wishlist, addToCart, toggleWishlist } = useApp();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [freshArrivals, setFreshArrivals] = useState([]);
  const [organicPicks, setOrganicPicks] = useState([]);
  const [dealsOfDay, setDealsOfDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    setLoading(true);
    try {
      const categoriesData = await customerApi.getCategories(true);
      const activeCategories = categoriesData.filter(cat => cat.status === "active").slice(0, 8);
      setCategories(activeCategories);
      
      const products = await customerApi.getProducts({ limit: 100, in_stock: true });
      setAllProducts(products);
      
      const featured = products.filter(p => p.is_featured === true).slice(0, 6);
      setFeaturedProducts(featured.length > 0 ? featured : products.slice(0, 6));
      
      const trending = products.filter(p => p.is_trending === true).slice(0, 6);
      setTrendingProducts(trending.length > 0 ? trending : products.slice(6, 12));
      
      const fresh = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
      setFreshArrivals(fresh);
      
      const organic = products.filter(p => p.tags?.includes('organic')).slice(0, 6);
      setOrganicPicks(organic.length > 0 ? organic : products.slice(12, 18));
      
      const deals = products.filter(p => p.compare_price && p.compare_price > p.price).slice(0, 6);
      setDealsOfDay(deals.length > 0 ? deals : products.slice(18, 24));
      
    } catch (error) {
      console.error("Error fetching homepage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 0) return;
    setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
  };

  const getQuantity = (productId) => {
    return quantities[productId] || 0;
  };

  const handleAddToCartClick = (product, e) => {
    e.stopPropagation();
    const currentQty = getQuantity(product._id);
    const newQty = currentQty + 1;
    updateQuantity(product._id, newQty);
    addToCart({
      id: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      originalPrice: product.compare_price,
      image: product.main_image,
      unit: product.unit,
      discount: product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0,
    }, 1);
  };

  const handleIncrement = (product, e) => {
    e.stopPropagation();
    const currentQty = getQuantity(product._id);
    const newQty = currentQty + 1;
    updateQuantity(product._id, newQty);
    addToCart({
      id: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      originalPrice: product.compare_price,
      image: product.main_image,
      unit: product.unit,
      discount: product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0,
    }, 1);
  };

  const handleDecrement = (product, e) => {
    e.stopPropagation();
    const currentQty = getQuantity(product._id);
    if (currentQty > 0) {
      const newQty = currentQty - 1;
      updateQuantity(product._id, newQty);
    }
  };

  const ProductCard = ({ product }) => {
    const isWishlisted = wishlist.includes(product._id);
    const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
    const quantity = getQuantity(product._id);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
        whileHover={{ y: -8 }}
        className="group bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
        onClick={() => navigate(`/product/${product.slug}`)}
      >
        <div className="relative overflow-hidden aspect-square">
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            {product.main_image ? (
              <img 
                src={product.main_image} 
                alt={product.name} 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                onError={(e) => { e.target.src = "https://placehold.co/200x200/3E7C47/white?text=Product"; }}
              />
            ) : (
              <Package className="w-12 h-12 text-gray-300" />
            )}
          </div>
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-md z-10">
              {discount}% OFF
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-all duration-200 z-10"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </button>
        </div>
        
        <div className="p-3">
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-1 group-hover:text-green-600 transition-colors">{product.name}</h3>
          <p className="text-xs text-gray-400">{product.unit || "Fresh Produce"}</p>
          
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
              ))}
            </div>
            <span className="text-xs text-gray-500">(4.5)</span>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-base font-bold text-green-600">₹{product.price}</span>
              {product.compare_price && (
                <span className="text-xs text-gray-400 line-through ml-1">₹{product.compare_price}</span>
              )}
            </div>
            
            {quantity > 0 ? (
              <div className="flex items-center gap-2 bg-green-600 rounded-lg p-1">
                <button
                  onClick={(e) => handleDecrement(product, e)}
                  className="w-6 h-6 bg-white rounded-md flex items-center justify-center hover:bg-gray-100 transition-all"
                >
                  <Minus className="w-3 h-3 text-green-600" />
                </button>
                <span className="text-white text-sm font-semibold w-5 text-center">{quantity}</span>
                <button
                  onClick={(e) => handleIncrement(product, e)}
                  className="w-6 h-6 bg-white rounded-md flex items-center justify-center hover:bg-gray-100 transition-all"
                >
                  <Plus className="w-3 h-3 text-green-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => handleAddToCartClick(product, e)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-all duration-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const CategoryCard = ({ category, index }) => {
    const categoryImage = category.image_url || `https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop`;
    
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        viewport={{ once: true }}
        onClick={() => navigate(`/products?category=${category._id}`)}
        className="group flex flex-col items-center gap-3"
      >
        <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-green-50 shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          <img 
            src={categoryImage} 
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-full" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">{category.name}</span>
      </motion.button>
    );
  };

  const SectionHeader = ({ title, subtitle, link }) => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800" style={{ letterSpacing: '-0.02em' }}>{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {link && (
        <button onClick={() => navigate(link)} className="text-green-600 text-sm font-medium hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const HowItWorks = () => (
    <div className="mb-16 py-12 bg-white rounded-2xl shadow-sm">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ letterSpacing: '-0.02em' }}>How It Works</h2>
        <p className="text-gray-500">Simple steps to get your groceries delivered</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Laptop className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Open the website</h3>
          <p className="text-gray-500 text-sm">Visit Daily Basket and browse over 7000+ products across groceries, fresh fruits & veggies, meat, and more.</p>
        </div>
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <ShoppingCart className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Place an order</h3>
          <p className="text-gray-500 text-sm">Add your favourite items to the cart & avail the best offers.</p>
        </div>
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Truck className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Get free delivery</h3>
          <p className="text-gray-500 text-sm">Experience lighting-fast speed & get all your items delivered in minutes.</p>
        </div>
      </div>
    </div>
  );

  const ThinBanner = ({ title, subtitle, discount, ctaText, imageUrl, icon }) => (
    <div 
      className="relative overflow-hidden rounded-2xl mb-8 shadow-md group cursor-pointer transition-all duration-500 hover:shadow-xl w-full"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '140px'
      }}
      onClick={() => navigate("/products")}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <div className="relative z-10 px-8 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {icon && <div className="text-white/90 bg-white/10 backdrop-blur-sm p-2 rounded-full">{icon}</div>}
          <div>
            <h3 className="text-white font-bold text-lg md:text-xl tracking-tight">{title}</h3>
            {subtitle && <p className="text-white/80 text-sm md:text-base">{subtitle}</p>}
          </div>
          {discount && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-3 py-1 shadow-lg">
              <span className="text-white text-sm font-bold">{discount}</span>
            </div>
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); navigate("/products"); }}
          className="px-6 py-2 bg-white text-green-700 rounded-full text-sm font-semibold hover:bg-gray-100 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {ctaText} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // FIXED: Updated banner images with working URLs
  const bannerImages = {
    banner1: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=400&fit=crop",
    banner2: "https://images.unsplash.com/photo-1610348725532-8438b8e8a5e8?w=1200&h=400&fit=crop"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4FBF3]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-10 h-10 border-3 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3"></div>
              <Leaf className="w-5 h-5 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-gray-500 text-sm mt-3">Loading fresh groceries...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4FBF3]">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-[1400px] mx-auto">
        
        <ThinBanner 
          title={user ? `${greeting}, ${user?.name?.split(" ")[0]}!` : "Fresh Groceries Delivered"}
          subtitle="Free delivery above ₹200 • 30 mins express"
          ctaText="Shop Now"
          imageUrl={bannerImages.banner1}
          icon={<Sprout className="w-5 h-5 text-white" />}
        />

        {/* Categories Section */}
        <div id="categories" className="mb-12">
          <SectionHeader title="Shop by Categories" link="/products" />
          <div className="flex justify-between flex-wrap gap-6">
            {categories.slice(0, 8).map((cat, idx) => (
              <CategoryCard key={cat._id} category={cat} index={idx} />
            ))}
          </div>
        </div>

        {/* Trending Products */}
        <div id="deals" className="mb-12">
          <SectionHeader title="Trending Now" subtitle="Most popular items this week" link="/products?trending=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trendingProducts.slice(0, 6).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>

        <ThinBanner 
          title="100% Organic Products"
          subtitle="Certified chemical-free vegetables & fruits"
          discount="20% OFF"
          ctaText="Shop Organic"
          imageUrl={bannerImages.banner2}
          icon={<Leaf className="w-5 h-5 text-white" />}
        />

        {/* Fresh Fruits Collection */}
        <div id="fresh" className="mb-12">
          <SectionHeader title="Fresh Fruits Collection" link="/products?category=fruits" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {freshArrivals.slice(0, 6).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>

        {/* Organic Picks */}
        <div id="organic" className="mb-12">
          <SectionHeader title="Organic Picks" subtitle="100% certified organic" link="/products?organic=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {organicPicks.slice(0, 6).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>

        {/* Best Sellers */}
        <div id="bestsellers" className="mb-12">
          <SectionHeader title="Best Sellers" subtitle="Customer favorites" link="/products?trending=true" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {dealsOfDay.slice(0, 6).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>

        <HowItWorks />

        <div className="mb-12">
          <SectionHeader title="Recommended For You" subtitle="Based on your preferences" link="/products" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {featuredProducts.slice(0, 6).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}