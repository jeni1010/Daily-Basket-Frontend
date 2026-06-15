import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Plus, Minus, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { customerApi } from "../services/customerApi";

export function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart, removeFromCart, updateQuantity, wishlist, toggleWishlist } = useApp();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [productVariants, setProductVariants] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  
  // Refs for preventing duplicate calls
  const isTogglingRef = useRef(false);
  const lastToggleTimeRef = useRef(0);
  const pendingProductRef = useRef(null);
  const TOGGLE_COOLDOWN = 1000; // Increased to 1 second
  
  const { cart } = useApp();
  
  const cartItem = cart.find(item => (item.id === product.id || item.id === product._id));
  const currentCartQuantity = cartItem?.quantity || 0;
  const cartVariantSku = cartItem?.variant_sku || "";
  const showQuantityControls = currentCartQuantity > 0;
  
  const productId = product.id || product._id;

  const getDefaultVariantSku = () => {
    if (productVariants.length > 0) {
      return productVariants[0].sku;
    }
    return "";
  };

  const isInStock = () => {
    const stockQty = product.stock_quantity !== undefined ? product.stock_quantity : 
                     (product.inStock !== undefined ? (product.inStock ? 1 : 0) : 1);
    const status = product.status;
    const inStockFlag = product.inStock;
    
    if (inStockFlag === false) return false;
    if (status === 'out_of_stock') return false;
    if (status === 'inactive') return false;
    if (stockQty <= 0) return false;
    
    return true;
  };
  
  const productInStock = isInStock();

  useEffect(() => {
    setIsWishlisted(wishlist && wishlist.includes(productId));
  }, [wishlist, productId]);

  const fetchProductDetails = async () => {
    if (!product.slug) return null;
    
    setIsLoadingVariants(true);
    try {
      const productDetails = await customerApi.getProductBySlug(product.slug);
      if (productDetails && productDetails.variants && productDetails.variants.length > 0) {
        console.log('✅ Product has variants:', productDetails.variants.length);
        setProductVariants(productDetails.variants);
        setSelectedVariant(productDetails.variants[0]);
        return productDetails;
      }
      return null;
    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleAddWithVariant = async () => {
    if (!selectedVariant) {
      alert("Please select a variant");
      return;
    }
    
    if (!user) {
      alert("Please login to add items to cart");
      navigate("/signin");
      return;
    }
    
    setIsAdding(true);
    try {
      await addToCart({
        id: productId,
        _id: productId,
        slug: product.slug,
        name: product.name,
        price: selectedVariant.price || product.price,
        originalPrice: selectedVariant.compare_price || product.originalPrice,
        image: product.image || product.main_image,
        unit: product.unit,
        discount: product.discount || 0,
        variant_sku: selectedVariant.sku,
      }, modalQuantity);
      
      setShowVariantModal(false);
      setModalQuantity(1);
      setProductVariants([]);
      setSelectedVariant(null);
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.message?.includes("401")) {
        alert("Session expired. Please login again.");
        navigate("/signin");
      } else {
        alert("Failed to add to cart. Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (isAdding || !productInStock) return;
    
    if (!user) {
      alert("Please login to add items to cart");
      navigate("/signin");
      return;
    }
    
    setIsAdding(true);
    try {
      const productDetails = await fetchProductDetails();
      
      if (productDetails && productDetails.variants && productDetails.variants.length > 0) {
        setShowVariantModal(true);
        setIsAdding(false);
        return;
      }
      
      await addToCart({
        id: productId,
        _id: productId,
        slug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image || product.main_image,
        unit: product.unit,
        discount: product.discount || 0,
        variant_sku: "",
      }, 1);
      
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.message?.includes("401")) {
        alert("Session expired. Please login again.");
        navigate("/signin");
      } else {
        alert("Failed to add to cart. Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = async (e) => {
    e.stopPropagation();
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const newQuantity = currentCartQuantity + 1;
      const skuToUse = cartVariantSku || getDefaultVariantSku();
      await updateQuantity(productId, newQuantity, skuToUse);
    } catch (error) {
      console.error("Error increasing quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async (e) => {
    e.stopPropagation();
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      if (currentCartQuantity > 1) {
        const newQuantity = currentCartQuantity - 1;
        const skuToUse = cartVariantSku || getDefaultVariantSku();
        await updateQuantity(productId, newQuantity, skuToUse);
      } else {
        const skuToUse = cartVariantSku || getDefaultVariantSku();
        await removeFromCart(productId, skuToUse);
      }
    } catch (error) {
      console.error("Error decreasing quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ FIXED: Stronger duplicate prevention for wishlist toggles
  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Check if button is disabled via attribute
    if (e.currentTarget.getAttribute('data-processing') === 'true') {
      console.log('❌ Duplicate click ignored - button processing');
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      alert("Please login to add items to wishlist");
      navigate("/signin");
      return;
    }
    
    // Check cooldown
    const now = Date.now();
    if (now - lastToggleTimeRef.current < TOGGLE_COOLDOWN) {
      console.log('❌ Too soon after last toggle, ignoring');
      return;
    }
    
    // Check if this specific product is being toggled
    if (isTogglingRef.current) {
      console.log('❌ Already toggling another product, ignoring');
      return;
    }
    
    if (pendingProductRef.current === productId) {
      console.log(`❌ Product ${productId} already being toggled, ignoring`);
      return;
    }
    
    // Set all prevention flags
    e.currentTarget.setAttribute('data-processing', 'true');
    isTogglingRef.current = true;
    lastToggleTimeRef.current = now;
    pendingProductRef.current = productId;
    
    const wasWishlisted = isWishlisted;
    
    // Optimistic UI update
    setIsWishlisted(!wasWishlisted);
    
    const productObj = {
      _id: productId,
      id: productId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image || product.main_image,
      main_image: product.image || product.main_image,
      unit: product.unit,
      slug: product.slug,
      compare_price: product.originalPrice
    };
    
    try {
      // ✅ ONLY call toggleWishlist - it handles the API call internally
      await toggleWishlist(productObj);
      console.log('✅ Wishlist toggled successfully');
    } catch (error) {
      // Revert on error
      setIsWishlisted(wasWishlisted);
      console.error("Error toggling wishlist:", error);
      
      if (error.status !== 404) {
        if (error.message?.includes("401")) {
          alert("Session expired. Please login again.");
          navigate("/signin");
        } else {
          alert("Failed to update wishlist. Please try again.");
        }
      }
    } finally {
      // Clear flags after delay
      setTimeout(() => {
        isTogglingRef.current = false;
        pendingProductRef.current = null;
        if (e.currentTarget) {
          e.currentTarget.removeAttribute('data-processing');
        }
      }, TOGGLE_COOLDOWN);
    }
  };

  const getStockStatus = () => {
    const stockQty = product.stock_quantity || 0;
    if (!productInStock) return { text: "Out of Stock", isOutOfStock: true };
    if (stockQty < 10 && stockQty > 0) return { text: "Only few left", isOutOfStock: false };
    return null;
  };

  const stockStatus = getStockStatus();
  const discount = product.discount || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);
  const imageUrl = !imgError && (product.image || product.main_image) ? (product.image || product.main_image) : "https://placehold.co/400x400/ffffff/3E7C47?text=Product";
  const isToggling = isTogglingRef.current;

  return (
    <>
      <div
        onClick={() => navigate(`/product/${product.slug || productId}`)}
        className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      >
        {/* Image container */}
        <div className="relative h-36 bg-white overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
          
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-[#B6463A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
              {discount}% OFF
            </span>
          )}
          
          <button
            onClick={handleToggleWishlist}
            disabled={isToggling}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-all duration-200 z-10 disabled:opacity-50"
          >
            {isToggling ? (
              <div className="w-3 h-3 border-2 border-[#B6463A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? "fill-[#B6463A] text-[#B6463A]" : "text-gray-400"}`} />
            )}
          </button>
          
          {!productInStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <span className="bg-white text-[#B6463A] px-2 py-1 rounded-md text-xs font-semibold shadow-md">
                Out of Stock
              </span>
            </div>
          )}
          
          {productInStock && stockStatus?.text === "Only few left" && (
            <div className="absolute bottom-2 left-2 right-2">
              <span className="inline-block bg-orange-500 text-white text-[9px] font-medium px-2 py-0.5 rounded-full">
                {stockStatus.text}
              </span>
            </div>
          )}
        </div>

        <div className="p-2.5">
          <h3 className="font-medium text-gray-800 text-xs line-clamp-2 mb-1 group-hover:text-[#3E7C47] transition-colors leading-tight">
            {product.name}
          </h3>
          
          <p className="text-[10px] text-gray-400 mb-1">{product.unit || "Piece"}</p>
          
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-[#F5A623] text-[#F5A623]" />
              <span className="text-[10px] font-medium text-gray-700">{product.rating || 4.5}</span>
            </div>
            <span className="text-[9px] text-gray-400">({product.reviewCount || 0})</span>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-sm font-bold text-[#3E7C47]">₹{product.price}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice}</span>
              )}
            </div>
            
            {!productInStock ? (
              <span className="text-[10px] text-gray-400">Out of stock</span>
            ) : showQuantityControls ? (
              <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-1.5 py-0.5">
                <button
                  onClick={handleDecrement}
                  disabled={isUpdating}
                  className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? (
                    <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                </button>
                <span className="text-xs font-medium text-gray-700 min-w-[16px] text-center">
                  {currentCartQuantity}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={isUpdating}
                  className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAdding || isLoadingVariants}
                className="px-3 py-1 bg-[#3E7C47] text-white rounded-md text-[10px] font-medium hover:bg-[#2E5C37] transition-all duration-200 disabled:opacity-50"
              >
                {isAdding || isLoadingVariants ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "ADD"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && productVariants.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select {product.name}</h3>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setProductVariants([]);
                  setSelectedVariant(null);
                }}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex justify-center mb-4 bg-white rounded-lg p-2">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-32 h-32 object-contain"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Size
                </label>
                <div className="flex gap-2 flex-wrap">
                  {productVariants.map((variant, idx) => {
                    const attribute = variant.attributes?.[0];
                    const value = attribute?.value || variant.sku?.split('-').pop();
                    const isSelected = selectedVariant?.sku === variant.sku;
                    const variantStock = variant.stock_quantity || 0;
                    const isOutOfStock = variantStock <= 0;
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !isOutOfStock && setSelectedVariant(variant)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-[#3E7C47] text-white ring-2 ring-[#3E7C47]/20"
                            : isOutOfStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-100 text-gray-700 hover:bg-[#3E7C47]/10 border border-gray-200"
                        }`}
                      >
                        {value}
                        {isOutOfStock && <span className="ml-1 text-[10px]">(Out)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-semibold w-12 text-center">
                    {modalQuantity}
                  </span>
                  <button
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-5 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-xl font-bold text-[#3E7C47]">
                    ₹{selectedVariant?.price || product.price}
                  </span>
                </div>
                {selectedVariant?.compare_price && selectedVariant.compare_price > (selectedVariant?.price || product.price) && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">MRP:</span>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{selectedVariant.compare_price}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowVariantModal(false);
                    setProductVariants([]);
                    setSelectedVariant(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWithVariant}
                  disabled={!selectedVariant || (selectedVariant.stock_quantity || 0) <= 0 || isAdding}
                  className="flex-1 py-2.5 bg-[#3E7C47] text-white rounded-xl text-sm font-medium hover:bg-[#2E5C37] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    `Add to Cart • ₹${selectedVariant?.price || product.price}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}