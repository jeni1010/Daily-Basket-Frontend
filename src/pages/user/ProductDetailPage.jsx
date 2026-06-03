import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Heart, ShoppingCart, Zap, Star, Plus, Minus, 
  Truck, RotateCcw, Check, Info, Package, 
  Droplet, Leaf, Clock, ChevronRight,
  Mail, Phone, MapPin, AlertCircle
} from "lucide-react";
import { customerApi } from "../../services/customerApi";
import { useApp } from "../../context/AppContext";
import { ProductCard } from "../../components/ProductCard";
import BrandLogo from "../../components/BrandLogo";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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
      console.log("🔍 Fetching product with slug:", slug);
      
      const allProducts = await customerApi.getProducts({ limit: 100, in_stock: true });
      console.log("📦 Total products fetched:", allProducts.length);
      
      const foundProduct = allProducts.find(p => p.slug === slug);
      
      if (!foundProduct) {
        console.error("❌ Product not found with slug:", slug);
        throw new Error("Product not found");
      }
      
      console.log("✅ Found Product:", foundProduct);
      
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
        stock_quantity: foundProduct.stock_quantity || 0,
        category_id: foundProduct.category_id,
        category_name: foundProduct.category_name,
        slug: foundProduct.slug,
        is_featured: foundProduct.is_featured || false,
        is_trending: foundProduct.is_trending || false,
        status: foundProduct.status,
      };
      
      setProduct(normalizedProduct);
      setSelectedImage(0);
      setQuantity(1);
      
      if (normalizedProduct.category_id) {
        try {
          const related = await customerApi.getProducts({ 
            category_id: normalizedProduct.category_id, 
            limit: 8,
            in_stock: true
          });
          const filtered = related.filter(p => p._id !== normalizedProduct._id).slice(0, 8);
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

  // Check if product is in wishlist using product._id
  const isWishlisted = product && wishlist.includes(product._id);
  
  // Handle wishlist toggle with full product object
  const handleToggleWishlist = () => {
    if (product) {
      toggleWishlist(product); // Pass full product object, not just ID
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
  const stockAvailable = (product?.stock_quantity || 0) > 0;
  const maxStock = product?.stock_quantity || 99;

  const handleAddToCart = () => {
    if (!product) return;
    if (quantity > maxStock) {
      alert(`Only ${maxStock} items available`);
      return;
    }
    addToCart({
      id: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      originalPrice: product.compare_price,
      image: product.main_image,
      unit: product.unit,
      discount: discount,
    }, quantity);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 800);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => navigate("/checkout"), 500);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > maxStock) {
      alert(`Only ${maxStock} items available`);
      return;
    }
    setQuantity(newQuantity);
  };

  const tabs = [
    { id: "description", label: "Description", icon: <Info className="w-4 h-4" /> },
    { id: "nutrition", label: "Nutrition", icon: <Leaf className="w-4 h-4" /> },
    { id: "ingredients", label: "Ingredients", icon: <Package className="w-4 h-4" /> },
    { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> }
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

  const ingredients = [
    "100% Natural ingredients",
    "No artificial preservatives",
    "No added colors",
    "Sourced from certified organic farms",
    "GMO-free",
    "Gluten-free"
  ];

  const reviews = [
    { name: "Rahul Sharma", rating: 5, date: "2 days ago", comment: "Absolutely fresh and delicious! The quality is outstanding. Will definitely order again.", avatar: "R" },
    { name: "Priya Patel", rating: 5, date: "1 week ago", comment: "Best quality I've found online. The delivery was super fast and packaging was excellent.", avatar: "P" },
    { name: "Amit Kumar", rating: 4, date: "2 weeks ago", comment: "Great product, very fresh. Slightly expensive but worth the quality.", avatar: "A" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#B6463A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FFFDF9]">
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
    <div className="min-h-screen bg-[#FFFDF9]">
      <Navbar />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-[#B6463A] mb-6 text-sm transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Products
        </button>

        {/* Product Showcase Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#F5EBD9] overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Left Side - Image Gallery */}
            <div className="space-y-4">
              <div className="relative bg-gradient-to-br from-[#F5EBD9]/30 to-[#FFFDF9] rounded-2xl overflow-hidden group min-h-[400px] flex items-center justify-center">
                {productImages.length > 0 ? (
                  <img
                    src={productImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-auto max-h-[400px] object-contain p-8"
                    onError={(e) => { 
                      e.target.src = "https://placehold.co/500x500/3E7C47/white?text=Organic+Product";
                    }}
                  />
                ) : (
                  <div className="text-center p-8">
                    <Package className="w-20 h-20 text-gray-300 mx-auto" />
                    <p className="text-gray-400 mt-2">No image available</p>
                  </div>
                )}
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-[#B6463A] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
                    {discount}% OFF
                  </span>
                )}
                <span className="absolute top-4 right-4 bg-[#3E7C47]/10 text-[#3E7C47] text-xs font-medium px-3 py-1.5 rounded-full">
                  🌿 Organic
                </span>
              </div>
              
              {/* Thumbnail Gallery */}
              {productImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 justify-center">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? "border-[#3E7C47] shadow-md" : "border-[#F5EBD9] hover:border-[#3E7C47]/50"
                      }`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Product Info */}
            <div className="flex flex-col space-y-5">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link to="/products" className="hover:text-[#3E7C47]">Products</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#3E7C47]">{product.category_name || "Fresh Produce"}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-500 text-sm">{product.unit || "Fresh Produce"}</p>

              {/* Rating */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < 4 ? "fill-[#3E7C47] text-[#3E7C47]" : "text-gray-300"}`} />
                  ))}
                  <span className="text-sm font-semibold text-gray-800 ml-1">4.8</span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-sm text-gray-500">128 ratings</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-sm text-gray-500">45 reviews</span>
                {stockAvailable ? (
                  <span className="text-xs text-[#3E7C47] bg-green-50 px-2 py-0.5 rounded-full">✓ In Stock</span>
                ) : (
                  <span className="text-xs text-[#B6463A] bg-red-50 px-2 py-0.5 rounded-full">Out of Stock</span>
                )}
              </div>

              {/* Price Section */}
              <div className="bg-[#F5EBD9]/30 rounded-2xl p-5">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl font-bold text-[#3E7C47]">₹{product.price}</span>
                  {product.compare_price && product.compare_price > product.price && (
                    <>
                      <span className="text-lg text-gray-400 line-through">₹{product.compare_price}</span>
                      <span className="text-sm font-semibold text-[#B6463A] bg-white px-2 py-1 rounded-full shadow-sm">
                        Save ₹{product.compare_price - product.price}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Inclusive of all taxes • Free delivery on orders ₹200+</p>
              </div>

              {/* Description Short */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.short_description || (product.description ? product.description.substring(0, 150) + "..." : "Fresh and high-quality product sourced directly from local farms. Delivered fresh to your doorstep.")}
              </p>

              {/* Quantity Selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Quantity</label>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center border-2 border-[#F5EBD9] rounded-full overflow-hidden bg-white">
                    <button 
                      onClick={() => handleQuantityChange(quantity - 1)} 
                      disabled={quantity <= 1} 
                      className="px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="px-6 py-2 text-base font-semibold text-gray-800 min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button 
                      onClick={() => handleQuantityChange(quantity + 1)} 
                      className="px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">{maxStock} units available</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!stockAvailable}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold transition-all border-2 border-[#3E7C47] text-[#3E7C47] hover:bg-[#3E7C47] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addedAnim ? "Added!" : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!stockAvailable}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold transition-all bg-[#3E7C47] text-white hover:bg-[#2E5C37] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <Zap className="w-5 h-5" />
                  Buy Now
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className="w-12 h-12 rounded-full border-2 border-[#F5EBD9] flex items-center justify-center hover:border-[#B6463A] hover:bg-red-50 transition-all"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-[#B6463A] text-[#B6463A]" : "text-gray-400"}`} />
                </button>
              </div>

              {/* Delivery Info Cards */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: <Truck className="w-5 h-5 text-[#3E7C47]" />, label: "Free Delivery", sub: "On orders ₹200+" },
                  { icon: <Clock className="w-5 h-5 text-[#B6463A]" />, label: "30 Min Delivery", sub: "Express available" },
                  { icon: <RotateCcw className="w-5 h-5 text-[#3E7C47]" />, label: "Easy Returns", sub: "Within 7 days" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-3 bg-[#F5EBD9]/20 rounded-xl gap-1">
                    {item.icon}
                    <span className="text-xs font-medium text-gray-700">{item.label}</span>
                    <span className="text-xs text-gray-500">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#F5EBD9] overflow-hidden mb-12">
          <div className="flex overflow-x-auto border-b border-[#F5EBD9]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? "text-[#3E7C47] border-b-2 border-[#3E7C47] bg-[#F5EBD9]/20" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="p-6 md:p-8">
            {activeTab === "description" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">About this product</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description || "No description available for this product."}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F5EBD9]">
                  {["Fresh & Hygienically Packed", "No artificial preservatives", "Sourced from verified farms", "Delivered within hours of harvest"].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-[#3E7C47]/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#3E7C47]" />
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "nutrition" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutritional Information</h3>
                <div className="bg-[#F5EBD9]/20 rounded-xl p-4">
                  <div className="space-y-3">
                    {Object.entries(nutritionalInfo).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center pb-2 border-b border-[#F5EBD9] last:border-0">
                        <span className="text-sm text-gray-600">{key}</span>
                        <span className="text-sm font-semibold text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-4">* Nutritional values are approximate and may vary.</p>
              </div>
            )}

            {activeTab === "ingredients" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingredients</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ingredients.map((ingredient, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#F5EBD9]/20 rounded-xl">
                      <Leaf className="w-5 h-5 text-[#3E7C47]" />
                      <span className="text-sm text-gray-700">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Customer Reviews</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < 4 ? "fill-[#3E7C47] text-[#3E7C47]" : "text-gray-300"}`} />
                        ))}
                        <span className="text-sm font-semibold ml-1">4.8</span>
                      </div>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">128 ratings</span>
                    </div>
                  </div>
                  <button className="px-5 py-2 bg-[#3E7C47] text-white rounded-full text-sm font-medium hover:bg-[#2E5C37] transition-colors">
                    Write a Review
                  </button>
                </div>
                
                <div className="space-y-4">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="border-b border-[#F5EBD9] pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#3E7C47] rounded-full flex items-center justify-center text-white font-bold">{review.avatar}</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{review.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-[#3E7C47] text-[#3E7C47]" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
              <button onClick={() => navigate("/products")} className="text-sm text-[#3E7C47] hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
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
                  inStock: (p.stock_quantity || 0) > 0,
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