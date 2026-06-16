import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Heart, ShoppingCart, Zap, Star, Plus, Minus, 
  Truck, RotateCcw, Check, Info, Package, 
  Droplet, Leaf, Clock, ChevronRight,
  Mail, Phone, MapPin, AlertCircle, Shield, ThumbsUp,
  Share2, Award, Sparkles, BadgeCheck, Store, 
  Timer, RefreshCw, Wallet, Gift, Users, Eye,
  TrendingUp, Crown, Flame, Droplets, Sun, Moon,
  Tag, Building, Truck as TruckIcon, RefreshCcw, ShieldCheck,
  Utensils, Scale, Layers, Box, CreditCard, ShoppingBag,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from "lucide-react";
import { customerApi } from "../../services/customerApi";
import { useApp } from "../../context/AppContext";
import { ProductCard } from "../../components/ProductCard";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Skeleton Loader
const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-[#F8F6F2]">
    <Navbar />
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-2xl aspect-square"></div>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-14 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedAnim, setAddedAnim] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [bundleItems, setBundleItems] = useState({});
  const [bundleLoading, setBundleLoading] = useState(false);
  const imageRef = useRef(null);

  // Sticky bar visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 400;
      setShowStickyBar(scrollY > threshold);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const allProducts = await customerApi.getProducts({ limit: 100 });
      const foundProduct = allProducts.find(p => p.slug === slug);
      
      if (!foundProduct) {
        throw new Error("Product not found");
      }
      
      const stockQty = foundProduct.stock_quantity || 0;
      const productStatus = foundProduct.status;
      const isInStock = stockQty > 0 && productStatus !== 'out_of_stock' && productStatus !== 'inactive';
      
      // Check for variants
      let variants = [];
      let hasVariants = false;
      if (foundProduct.variants && foundProduct.variants.length > 0) {
        variants = foundProduct.variants;
        hasVariants = true;
        setSelectedVariant(variants[0]);
      }
      
      const normalizedProduct = {
        _id: foundProduct._id || foundProduct.id,
        name: foundProduct.name || foundProduct.title || "Product",
        price: foundProduct.price || 0,
        compare_price: foundProduct.compare_price || null,
        description: foundProduct.description || "",
        short_description: foundProduct.short_description || "",
        main_image: foundProduct.main_image || foundProduct.image || "",
        gallery_images: foundProduct.gallery_images || [],
        unit: foundProduct.unit || "piece",
        stock_quantity: stockQty,
        category_id: foundProduct.category_id,
        category_name: foundProduct.category_name,
        slug: foundProduct.slug,
        is_featured: foundProduct.is_featured || false,
        is_trending: foundProduct.is_trending || false,
        status: productStatus,
        inStock: isInStock,
        brand: foundProduct.brand || "Daily Basket",
        weight: foundProduct.weight || "500g",
        shelf_life: foundProduct.shelf_life || "7 days",
        storage: foundProduct.storage || "Store in a cool, dry place",
        origin: foundProduct.origin || "India",
        product_type: foundProduct.product_type || "Fresh Produce",
        flavor: foundProduct.flavor || "",
        fragrance: foundProduct.fragrance || "",
        model_name: foundProduct.model_name || "",
        packaging_type: foundProduct.packaging_type || "Standard",
        seller: foundProduct.seller || "Daily Basket Private Limited",
        seller_address: foundProduct.seller_address || "123, Green Valley Road, Bangalore - 560001",
        license_number: foundProduct.license_number || "FSSAI-1234567890",
        manufacturer: foundProduct.manufacturer || "Daily Basket Foods Pvt. Ltd.",
        variants: variants,
        has_variants: hasVariants,
        net_quantity: foundProduct.net_quantity || "1 Pack (500g)",
        ingredients: foundProduct.ingredients || [
          "100% Natural ingredients",
          "No artificial preservatives",
          "No added colors",
          "Sourced from certified organic farms"
        ]
      };
      
      setProduct(normalizedProduct);
      setSelectedImage(0);
      setQuantity(1);
      
      // Initialize bundle items
      const bundleItemsObj = {};
      const bundleProducts = allProducts
        .filter(p => p._id !== normalizedProduct._id)
        .slice(0, 4)
        .map(p => {
          bundleItemsObj[p._id] = false;
          return {
            _id: p._id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            compare_price: p.compare_price,
            main_image: p.main_image,
            unit: p.unit,
            inStock: (p.stock_quantity || 0) > 0 && p.status !== 'out_of_stock',
            discount: p.compare_price ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100) : 0,
          };
        });
      setBundleItems(bundleItemsObj);
      setFrequentlyBought(bundleProducts);
      
      // Set recently viewed
      const viewed = JSON.parse(sessionStorage.getItem('recentlyViewed') || '[]');
      const updatedViewed = [normalizedProduct._id, ...viewed.filter(id => id !== normalizedProduct._id)].slice(0, 6);
      sessionStorage.setItem('recentlyViewed', JSON.stringify(updatedViewed));
      
      if (normalizedProduct.category_id) {
        try {
          const related = await customerApi.getProducts({ 
            category_id: normalizedProduct.category_id, 
            limit: 12,
          });
          const filtered = related.filter(p => p._id !== normalizedProduct._id).slice(0, 12);
          setRelatedProducts(filtered);
        } catch (err) {
          console.error("Error fetching related products:", err);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching product:", err);
      setError(err.message || "Product not found");
    } finally {
      setLoading(false);
    }
  };

  const isWishlisted = product && wishlist.includes(product._id);
  
  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product);
    }
  };
  
  const productImages = [];
  if (product?.main_image && product.main_image !== "") productImages.push(product.main_image);
  if (product?.gallery_images && product.gallery_images.length > 0) {
    productImages.push(...product.gallery_images);
  }

  const discount = product?.compare_price && product?.price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) 
    : 0;
  
  const stockAvailable = product?.inStock === true;
  const maxStock = product?.stock_quantity || 0;
  const savings = product?.compare_price && product?.compare_price > product?.price 
    ? product.compare_price - product.price 
    : 0;

  const handleAddToCart = () => {
    if (!product) return;
    if (!stockAvailable) {
      alert("This product is currently out of stock");
      return;
    }
    if (quantity > maxStock) {
      alert(`Only ${maxStock} items available`);
      return;
    }
    
    const finalPrice = selectedVariant?.price || product.price;
    const finalVariantSku = selectedVariant?.sku || "";
    const variantName = selectedVariant?.attributes?.[0]?.value || "";
    
    addToCart({
      id: product._id,
      slug: product.slug,
      name: variantName ? `${product.name} - ${variantName}` : product.name,
      price: finalPrice,
      originalPrice: selectedVariant?.compare_price || product.compare_price,
      image: product.main_image,
      unit: selectedVariant?.unit || product.unit,
      discount: selectedVariant?.compare_price ? Math.round(((selectedVariant.compare_price - finalPrice) / selectedVariant.compare_price) * 100) : discount,
      variant_sku: finalVariantSku,
    }, quantity);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => navigate("/checkout"), 600);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    if (!stockAvailable) return;
    if (newQuantity > maxStock) {
      alert(`Only ${maxStock} items available`);
      return;
    }
    setQuantity(newQuantity);
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleBundleToggle = (productId) => {
    setBundleItems(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // ✅ FIXED: Handle Bundle Add to Cart
  const handleAddBundleToCart = async () => {
    if (!product) return;
    
    // Get selected bundle items
    const selectedItems = frequentlyBought.filter(item => bundleItems[item._id]);
    
    if (selectedItems.length === 0) {
      alert("Please select at least one item to add to bundle");
      return;
    }
    
    setBundleLoading(true);
    
    try {
      // Add main product first
      const mainPrice = selectedVariant?.price || product.price;
      const mainVariantSku = selectedVariant?.sku || "";
      const mainVariantName = selectedVariant?.attributes?.[0]?.value || "";
      
      await addToCart({
        id: product._id,
        slug: product.slug,
        name: mainVariantName ? `${product.name} - ${mainVariantName}` : product.name,
        price: mainPrice,
        originalPrice: selectedVariant?.compare_price || product.compare_price,
        image: product.main_image,
        unit: selectedVariant?.unit || product.unit,
        discount: selectedVariant?.compare_price ? Math.round(((selectedVariant.compare_price - mainPrice) / selectedVariant.compare_price) * 100) : discount,
        variant_sku: mainVariantSku,
      }, quantity);
      
      // Add selected bundle items
      for (const item of selectedItems) {
        await addToCart({
          id: item._id,
          slug: item.slug,
          name: item.name,
          price: item.price,
          originalPrice: item.compare_price,
          image: item.main_image,
          unit: item.unit,
          discount: item.discount || 0,
          variant_sku: "",
        }, 1);
      }
      
      // Success feedback
      alert(`✅ Bundle added to cart! (${selectedItems.length + 1} items)`);
      
      // Reset bundle selections
      const resetBundle = {};
      frequentlyBought.forEach(item => {
        resetBundle[item._id] = false;
      });
      setBundleItems(resetBundle);
      
    } catch (error) {
      console.error("Error adding bundle to cart:", error);
      alert("Failed to add bundle to cart. Please try again.");
    } finally {
      setBundleLoading(false);
    }
  };

  const tabs = [
    { id: "description", label: "Description", icon: <Info className="w-4 h-4" /> },
    { id: "ingredients", label: "Ingredients", icon: <Package className="w-4 h-4" /> },
    { id: "nutrition", label: "Nutrition", icon: <Leaf className="w-4 h-4" /> },
    { id: "storage", label: "Storage", icon: <Droplet className="w-4 h-4" /> },
    { id: "additional", label: "Additional Info", icon: <Layers className="w-4 h-4" /> }
  ];

  const nutritionalInfo = {
    "Energy": "120 kcal",
    "Protein": "2g",
    "Carbohydrates": "25g",
    "Sugar": "18g",
    "Fat": "0.5g",
    "Fiber": "3g",
    "Sodium": "10mg"
  };

  const reviews = [
    { name: "Rahul Sharma", rating: 5, date: "2 days ago", comment: "Absolutely fresh and delicious! The quality is outstanding. Will definitely order again.", avatar: "R", verified: true, helpful: 24 },
    { name: "Priya Patel", rating: 5, date: "1 week ago", comment: "Best quality I've found online. The delivery was super fast and packaging was excellent.", avatar: "P", verified: true, helpful: 18 },
    { name: "Amit Kumar", rating: 4, date: "2 weeks ago", comment: "Great product, very fresh. Slightly expensive but worth the quality.", avatar: "A", verified: false, helpful: 12 }
  ];

  const deliveryBenefits = [
    { icon: <Timer className="w-5 h-5" />, title: "Delivery in 30 mins", color: "text-[#3E7C47]" },
    { icon: <Truck className="w-5 h-5" />, title: "Free Delivery Above ₹200", color: "text-[#3E7C47]" },
    { icon: <RefreshCcw className="w-5 h-5" />, title: "Easy Returns", color: "text-[#F5A623]" },
    { icon: <Shield className="w-5 h-5" />, title: "Secure Payments", color: "text-[#3E7C47]" },
    { icon: <Leaf className="w-5 h-5" />, title: "Freshness Guaranteed", color: "text-[#3E7C47]" },
  ];

  const productHighlights = [];
  if (product?.brand) productHighlights.push({ icon: <Store className="w-5 h-5" />, label: "Brand", value: product.brand });
  if (product?.weight) productHighlights.push({ icon: <Scale className="w-5 h-5" />, label: "Weight", value: product.weight });
  if (product?.flavor) productHighlights.push({ icon: <Utensils className="w-5 h-5" />, label: "Flavor", value: product.flavor });
  if (product?.fragrance) productHighlights.push({ icon: <Droplets className="w-5 h-5" />, label: "Fragrance", value: product.fragrance });
  if (product?.model_name) productHighlights.push({ icon: <Box className="w-5 h-5" />, label: "Model", value: product.model_name });
  if (product?.origin) productHighlights.push({ icon: <MapPin className="w-5 h-5" />, label: "Origin", value: product.origin });
  if (product?.shelf_life) productHighlights.push({ icon: <Clock className="w-5 h-5" />, label: "Shelf Life", value: product.shelf_life });
  if (product?.packaging_type) productHighlights.push({ icon: <Package className="w-5 h-5" />, label: "Packaging", value: product.packaging_type });

  // Get variant display values
  const getVariantDisplay = (variant) => {
    if (variant.attributes && variant.attributes.length > 0) {
      return variant.attributes[0].value;
    }
    if (variant.sku) {
      const parts = variant.sku.split('-');
      const lastPart = parts[parts.length - 1];
      if (lastPart && !isNaN(lastPart)) {
        return `${lastPart}${product?.unit || ''}`;
      }
      return lastPart || variant.sku;
    }
    return variant.sku || "Variant";
  };

  const totalReviews = 128;
  const averageRating = 4.8;

  // Calculate bundle total
  const bundleTotal = frequentlyBought.reduce((sum, item) => {
    if (bundleItems[item._id]) {
      return sum + item.price;
    }
    return sum;
  }, product?.price || 0);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F8F6F2]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-16 h-16 text-[#B6463A] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{error || "Product not found"}</h2>
            <p className="text-gray-500 text-sm mb-6">The product "{slug}" doesn't exist or has been removed.</p>
            <button onClick={() => navigate("/products")} className="px-6 py-3 bg-[#3E7C47] text-white rounded-full font-medium hover:bg-[#2E5C37] transition-all">
              Browse All Products
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
      
      {/* Sticky Mobile CTA */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 lg:hidden shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
              <div>
                <span className="text-lg font-bold text-[#3E7C47]">
                  ₹{selectedVariant?.price || product.price}
                </span>
                {product.compare_price && product.compare_price > (selectedVariant?.price || product.price) && (
                  <span className="text-xs text-gray-400 line-through ml-2">₹{product.compare_price}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)} 
                    disabled={quantity <= 1 || !stockAvailable} 
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-800">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)} 
                    disabled={!stockAvailable}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!stockAvailable}
                  className="px-5 py-2.5 bg-[#3E7C47] text-white rounded-full font-semibold text-sm hover:bg-[#2E5C37] transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-lg"
                >
                  {addedAnim ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  {addedAnim ? "Added!" : `Add • ₹${(selectedVariant?.price || product.price) * quantity}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-[#3E7C47] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <Link to="/products" className="hover:text-[#3E7C47] transition-colors">Products</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          {product.category_name && (
            <>
              <Link to={`/products?category=${product.category_id}`} className="hover:text-[#3E7C47] transition-colors">
                {product.category_name}
              </Link>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
            </>
          )}
          <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          
          {/* Left Column - Image */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group">
              <div className="relative aspect-square bg-[#F8F6F2] flex items-center justify-center p-6">
                {productImages.length > 0 ? (
                  <img
                    ref={imageRef}
                    src={productImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { 
                      e.target.src = "https://placehold.co/500x500/3E7C47/white?text=Product";
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto" />
                    <p className="text-gray-400 text-sm mt-2">No image available</p>
                  </div>
                )}
                
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-[#B6463A] to-[#E53935] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {discount}% OFF
                  </div>
                )}
                
                <button
                  onClick={handleToggleWishlist}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 border border-gray-100 z-10"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-[#B6463A] text-[#B6463A]" : "text-gray-500"}`} />
                </button>
              </div>
            </div>
            
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                      selectedImage === idx ? "border-[#3E7C47] shadow-md" : "border-gray-200 hover:border-[#3E7C47]/50"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-[#3E7C47] uppercase tracking-wider">{product.brand || "Daily Basket"}</p>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                <span className="text-sm font-bold text-gray-800">{averageRating}</span>
                <span className="text-xs text-gray-400">({totalReviews} Reviews)</span>
              </div>
              <span className="text-xs text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">2.5k+ bought this month</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {stockAvailable ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  In Stock
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Out of Stock
                </span>
              )}
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1">
                <Timer className="w-3 h-3" />
                Delivery in 30 mins
              </span>
            </div>

            <div className="bg-[#F5EBD9]/20 rounded-2xl p-4 border border-[#F5EBD9]/40">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-bold text-[#3E7C47]">
                  ₹{selectedVariant?.price || product.price}
                </span>
                {product.compare_price && product.compare_price > (selectedVariant?.price || product.price) && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{product.compare_price}
                    </span>
                    <span className="text-xs font-semibold text-[#B6463A] bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Save ₹{savings}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Variants Section */}
            {product.has_variants && product.variants && product.variants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, idx) => {
                    const isSelected = selectedVariant?.sku === variant.sku;
                    const variantDisplay = getVariantDisplay(variant);
                    const variantPrice = variant.price || product.price;
                    const variantDiscount = variant.compare_price 
                      ? Math.round(((variant.compare_price - variantPrice) / variant.compare_price) * 100) 
                      : 0;
                    const variantStock = variant.stock_quantity || 0;
                    const isOutOfStock = variantStock <= 0;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => !isOutOfStock && handleVariantSelect(variant)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-[#3E7C47] text-white shadow-md"
                            : isOutOfStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-100 text-gray-700 hover:bg-[#3E7C47]/10 border border-gray-200"
                        }`}
                      >
                        {variantDisplay}
                        {variantDiscount > 0 && !isOutOfStock && (
                          <span className="ml-1 text-[10px] text-[#B6463A]">{variantDiscount}% OFF</span>
                        )}
                        {isOutOfStock && <span className="ml-1 text-[10px]">(Out)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!product.has_variants && product.net_quantity && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Scale className="w-4 h-4 text-gray-400" />
                <span>Net Qty: {product.net_quantity}</span>
              </div>
            )}

            {/* Purchase Section */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
                    <button 
                      onClick={() => handleQuantityChange(quantity - 1)} 
                      disabled={quantity <= 1 || !stockAvailable} 
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-10 text-center text-base font-semibold text-gray-800">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => handleQuantityChange(quantity + 1)} 
                      disabled={!stockAvailable}
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">{maxStock} Units Available</span>
                </div>
              </div>
              
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!stockAvailable}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all shadow-lg ${
                    addedAnim 
                      ? 'bg-green-600 text-white' 
                      : 'bg-[#3E7C47] text-white hover:bg-[#2E5C37]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {addedAnim ? (
                    <>
                      <Check className="w-5 h-5" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart • ₹{(selectedVariant?.price || product.price) * quantity}
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!stockAvailable}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all border-2 border-[#3E7C47] text-[#3E7C47] hover:bg-[#3E7C47] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5" />
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Benefits */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
          {deliveryBenefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 mx-auto bg-[#F5EBD9]/50 rounded-full flex items-center justify-center mb-1.5 ${benefit.color}`}>
                {benefit.icon}
              </div>
              <p className="text-xs font-medium text-gray-800 leading-tight">{benefit.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Product Highlights */}
        {productHighlights.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#3E7C47]" />
              Product Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {productHighlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                  <div className="text-[#3E7C47]">{item.icon}</div>
                  <div>
                    <p className="text-[10px] text-gray-400">{item.label}</p>
                    <p className="text-xs font-medium text-gray-800 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Information - Tabs */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 px-5 pt-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id 
                      ? "text-[#3E7C47] border-b-2 border-[#3E7C47]" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-5">
            <AnimatePresence mode="wait">
              {activeTab === "description" && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description || "No description available for this product."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {["Fresh & Hygienically Packed", "No artificial preservatives", "Sourced from verified farms", "Delivered within hours of harvest"].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-5 h-5 rounded-full bg-[#3E7C47]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-[#3E7C47]" />
                        </div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "ingredients" && (
                <motion.div
                  key="ingredients"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.ingredients && product.ingredients.length > 0 ? (
                      product.ingredients.map((ingredient, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Leaf className="w-4 h-4 text-[#3E7C47] flex-shrink-0" />
                          <span className="text-sm text-gray-700">{ingredient}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No ingredients listed</p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "nutrition" && (
                <motion.div
                  key="nutrition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-gray-50 rounded-xl p-4 max-w-md">
                    <div className="space-y-2">
                      {Object.entries(nutritionalInfo).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center pb-2 border-b border-gray-200 last:border-0">
                          <span className="text-sm text-gray-600">{key}</span>
                          <span className="text-sm font-semibold text-gray-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">* Nutritional values are approximate and may vary.</p>
                </motion.div>
              )}

              {activeTab === "storage" && (
                <motion.div
                  key="storage"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <Droplet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Storage Instructions</p>
                      <p className="text-sm text-gray-600">{product.storage || "Store in a cool, dry place away from direct sunlight."}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Shelf Life</p>
                      <p className="text-sm text-gray-600">{product.shelf_life || "7 days from delivery"}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "additional" && (
                <motion.div
                  key="additional"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400">Seller</p>
                      <p className="text-sm font-medium text-gray-800">{product.seller || "Daily Basket Private Limited"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400">Manufacturer</p>
                      <p className="text-sm font-medium text-gray-800">{product.manufacturer || "Daily Basket Foods Pvt. Ltd."}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400">Country of Origin</p>
                      <p className="text-sm font-medium text-gray-800">{product.origin || "India"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400">License Number</p>
                      <p className="text-sm font-medium text-gray-800">{product.license_number || "FSSAI-1234567890"}</p>
                    </div>
                  </div>
                  {product.seller_address && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400">Seller Address</p>
                      <p className="text-sm font-medium text-gray-800">{product.seller_address}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Customer Reviews - No Write Review Button */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-[#F5A623] text-[#F5A623]" />
                  <span className="text-lg font-bold text-gray-800">{averageRating}</span>
                  <span className="text-sm text-gray-400">({totalReviews} reviews)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <BadgeCheck className="w-4 h-4 text-[#3E7C47]" />
                <span className="text-xs text-gray-500">94% of customers recommend this product</span>
              </div>
            </div>
            {/* Removed Write a Review button */}
          </div>
          
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3E7C47] to-[#2E5C37] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {review.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{review.name}</p>
                      {review.verified && (
                        <BadgeCheck className="w-4 h-4 text-[#3E7C47]" />
                      )}
                      {review.verified && (
                        <span className="text-[10px] text-[#3E7C47] bg-[#3E7C47]/10 px-2 py-0.5 rounded-full">Verified Purchase</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5">{review.comment}</p>
                    <button className="mt-1.5 text-xs text-gray-400 hover:text-[#3E7C47] transition-colors flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      Helpful ({review.helpful})
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Frequently Bought Together - With Working Bundle Button */}
        {frequentlyBought.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#F5A623]" />
              Frequently Bought Together
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center border-2 border-[#3E7C47]/20">
                <div className="w-full aspect-square bg-white rounded-lg overflow-hidden mb-2">
                  <img src={product.main_image || "https://placehold.co/200x200/3E7C47/white?text=Product"} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-medium text-[#3E7C47] line-clamp-1">{product.name}</p>
                <p className="text-sm font-bold text-[#3E7C47]">₹{product.price}</p>
                <span className="text-[10px] text-green-600">✓ This item</span>
              </div>
              {frequentlyBought.map((item) => (
                <div key={item._id} className="bg-gray-50 rounded-xl p-3 text-center hover:shadow-md transition-all cursor-pointer relative" onClick={() => navigate(`/product/${item.slug}`)}>
                  <div className="w-full aspect-square bg-white rounded-lg overflow-hidden mb-2">
                    <img src={item.main_image || "https://placehold.co/200x200/3E7C47/white?text=Product"} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.name}</p>
                  <p className="text-sm font-bold text-[#3E7C47]">₹{item.price}</p>
                  {item.discount > 0 && (
                    <span className="text-[10px] text-[#B6463A] font-medium">{item.discount}% OFF</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBundleToggle(item._id);
                    }}
                    className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      bundleItems[item._id] 
                        ? 'bg-[#3E7C47] border-[#3E7C47] text-white' 
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {bundleItems[item._id] && <Check className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-sm text-gray-600">Bundle Total:</span>
                <span className="text-lg font-bold text-[#3E7C47] ml-2">₹{bundleTotal}</span>
              </div>
              <button
                onClick={handleAddBundleToCart}
                disabled={bundleLoading}
                className="px-6 py-2.5 bg-[#3E7C47] text-white rounded-full font-semibold text-sm hover:bg-[#2E5C37] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {bundleLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )}
                {bundleLoading ? "Adding..." : "Add Bundle to Cart"}
              </button>
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#3E7C47]" />
                You May Also Like
              </h2>
              <Link to="/products" className="text-sm text-[#3E7C47] hover:underline font-medium">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 8).map((p) => (
                <ProductCard key={p._id} product={{
                  id: p._id,
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  originalPrice: p.compare_price,
                  rating: 4.5,
                  reviewCount: 0,
                  image: p.main_image,
                  unit: p.unit,
                  stock_quantity: p.stock_quantity,
                  status: p.status,
                  inStock: (p.stock_quantity || 0) > 0 && p.status !== 'out_of_stock',
                  discount: p.compare_price ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100) : 0,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}