import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Heart, ShoppingCart, Zap, Star, Plus, Minus, 
  Truck, RotateCcw, Check, Info, Package, 
  Droplet, Leaf, Clock, ChevronRight,
  Mail, Phone, MapPin, AlertCircle, Shield, ThumbsUp
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
      
      const allProducts = await customerApi.getProducts({ limit: 100 });
      console.log("📦 Total products fetched:", allProducts.length);
      
      const foundProduct = allProducts.find(p => p.slug === slug);
      
      if (!foundProduct) {
        console.error("❌ Product not found with slug:", slug);
        throw new Error("Product not found");
      }
      
      console.log("✅ Found Product:", foundProduct);
      console.log("📊 Stock quantity:", foundProduct.stock_quantity);
      console.log("📊 Status:", foundProduct.status);
      
      const stockQty = foundProduct.stock_quantity || 0;
      const productStatus = foundProduct.status;
      const isInStock = stockQty > 0 && productStatus !== 'out_of_stock' && productStatus !== 'inactive';
      
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
      };
      
      setProduct(normalizedProduct);
      setSelectedImage(0);
      setQuantity(1);
      
      if (normalizedProduct.category_id) {
        try {
          const related = await customerApi.getProducts({ 
            category_id: normalizedProduct.category_id, 
            limit: 8,
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
    if (!stockAvailable) return;
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <Link to="/" className="hover:text-[#3E7C47]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-[#3E7C47]">Products</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600">{product.name}</span>
        </div>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column - Image Gallery */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#F5EBD9] overflow-hidden">
              <div className="relative aspect-square bg-gradient-to-br from-[#F5EBD9]/10 to-[#FFFDF9] flex items-center justify-center p-6">
                {productImages.length > 0 ? (
                  <img
                    src={productImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain"
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
                  <span className="absolute top-3 left-3 bg-[#B6463A] text-white text-xs font-bold px-2 py-1 rounded-md">
                    {discount}% OFF
                  </span>
                )}
              </div>
            </div>
            
            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                      selectedImage === idx ? "border-[#3E7C47]" : "border-[#F5EBD9] hover:border-[#3E7C47]/50"
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
            {/* Title & Brand */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.brand && (
                  <span className="text-xs text-[#3E7C47] bg-[#3E7C47]/10 px-2 py-0.5 rounded-full">{product.brand}</span>
                )}
                {product.is_featured && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Featured</span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  <Star className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
                  <span className="text-sm font-semibold text-gray-700">4.8</span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">128 ratings</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">45 reviews</span>
                {stockAvailable ? (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">In Stock</span>
                ) : (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#3E7C47]">₹{product.price}</span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className="text-sm text-gray-400 line-through">₹{product.compare_price}</span>
                  <span className="text-xs text-[#B6463A] bg-red-50 px-1.5 py-0.5 rounded-full">
                    Save ₹{product.compare_price - product.price}
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-[#3E7C47] pl-3">
              {product.short_description || (product.description ? product.description.substring(0, 100) + "..." : "Fresh and high-quality product sourced directly from local farms.")}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Quantity:</span>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  onClick={() => handleQuantityChange(quantity - 1)} 
                  disabled={quantity <= 1 || !stockAvailable} 
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 text-gray-600" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-gray-800">
                  {quantity}
                </span>
                <button 
                  onClick={() => handleQuantityChange(quantity + 1)} 
                  disabled={!stockAvailable}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
              <span className="text-xs text-gray-400">{maxStock} units available</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!stockAvailable}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-[#3E7C47] text-white hover:bg-[#2E5C37] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                {addedAnim ? "Added to Cart!" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!stockAvailable}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all border border-[#3E7C47] text-[#3E7C47] hover:bg-[#3E7C47] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                Buy Now
              </button>
              <button
                onClick={handleToggleWishlist}
                className="w-11 h-11 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#B6463A] hover:bg-red-50 transition-all"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-[#B6463A] text-[#B6463A]" : "text-gray-400"}`} />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Truck className="w-4 h-4 text-[#3E7C47]" />
                <div>
                  <p className="text-xs font-medium text-gray-700">Free Delivery</p>
                  <p className="text-xs text-gray-400">On ₹200+</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Clock className="w-4 h-4 text-[#B6463A]" />
                <div>
                  <p className="text-xs font-medium text-gray-700">30 Min Delivery</p>
                  <p className="text-xs text-gray-400">Express</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <RotateCcw className="w-4 h-4 text-[#3E7C47]" />
                <div>
                  <p className="text-xs font-medium text-gray-700">Easy Returns</p>
                  <p className="text-xs text-gray-400">7 Days</p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-gray-500">100% Secure</span>
              </div>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-gray-500">Quality Guaranteed</span>
              </div>
              <div className="w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-gray-500">Fresh Produce</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-10">
          <div className="border-b border-gray-200">
            <div className="flex gap-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                    activeTab === tab.id ? "text-[#3E7C47] border-b-2 border-[#3E7C47]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="py-6">
            {activeTab === "description" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description || "No description available for this product."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
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
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ingredients.map((ingredient, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Leaf className="w-4 h-4 text-[#3E7C47]" />
                    <span className="text-sm text-gray-700">{ingredient}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < 4 ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">4.8 out of 5</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Based on 128 ratings and 45 reviews</p>
                  </div>
                  <button className="px-4 py-1.5 bg-[#3E7C47] text-white rounded-full text-sm font-medium hover:bg-[#2E5C37] transition-colors">
                    Write a Review
                  </button>
                </div>
                
                <div className="space-y-4">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-[#3E7C47] rounded-full flex items-center justify-center text-white font-bold text-sm">{review.avatar}</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{review.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-[#F5A623] text-[#F5A623]" : "text-gray-300"}`} />
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

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">You May Also Like</h2>
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