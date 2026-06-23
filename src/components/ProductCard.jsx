import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Plus, Minus, X, ShoppingCart, Package, ChevronDown } from "lucide-react";
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
  const [quantity, setQuantity] = useState(1);
  const [addSuccess, setAddSuccess] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantQuantities, setVariantQuantities] = useState({});
  const [variantFetchDone, setVariantFetchDone] = useState(false);
  
  const isTogglingRef = useRef(false);
  const lastToggleTimeRef = useRef(0);
  const pendingProductRef = useRef(null);
  const TOGGLE_COOLDOWN = 1000;
  const isAddingRef = useRef(false);
  
  const { cart } = useApp();
  
  const getVariantCartQuantity = (variantSku) => {
    if (!variantSku) return 0;
    const cartItem = cart.find(item => item.variant_sku === variantSku);
    return cartItem?.quantity || 0;
  };

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

  useEffect(() => {
    setQuantity(1);
    setAddSuccess(false);
  }, [productId]);

  // ✅ Fetch variants when product changes
  useEffect(() => {
    const fetchVariants = async () => {
      if (!product.slug) {
        setHasVariants(false);
        setVariantFetchDone(true);
        return;
      }
      
      try {
        console.log(`🔍 Fetching variants for: ${product.name} (${product.slug})`);
        const productDetails = await customerApi.getProductBySlug(product.slug);
        console.log('📦 Product details response:', productDetails);
        
        if (productDetails && productDetails.variants && productDetails.variants.length > 0) {
          console.log(`✅ Found ${productDetails.variants.length} variants for ${product.name}`);
          setHasVariants(true);
          setProductVariants(productDetails.variants);
          setSelectedVariant(productDetails.variants[0]);
          
          const initialQuantities = {};
          productDetails.variants.forEach(v => {
            if (v.sku) {
              initialQuantities[v.sku] = 1;
            }
          });
          setVariantQuantities(initialQuantities);
        } else {
          console.log(`❌ No variants found for ${product.name}`);
          setHasVariants(false);
          setProductVariants([]);
        }
      } catch (error) {
        console.error('Error fetching variants:', error);
        setHasVariants(false);
        setProductVariants([]);
      } finally {
        setVariantFetchDone(true);
      }
    };
    
    fetchVariants();
  }, [product.slug, product.name]);

  const fetchProductDetails = async () => {
    if (!product.slug) return null;
    
    setIsLoadingVariants(true);
    try {
      const productDetails = await customerApi.getProductBySlug(product.slug);
      if (productDetails && productDetails.variants && productDetails.variants.length > 0) {
        setProductVariants(productDetails.variants);
        setSelectedVariant(productDetails.variants[0]);
        setHasVariants(true);
        return productDetails;
      }
      setHasVariants(false);
      return null;
    } catch (error) {
      return null;
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // ✅ FIXED: handleAddWithVariant with correct price handling
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
    
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    setIsAdding(true);
    
    try {
      // ✅ Get correct prices from selected variant
      const variantPrice = selectedVariant.price || product.price;
      const variantComparePrice = selectedVariant.compare_price || product.originalPrice;
      
      const variantDisplay = getVariantDisplay(selectedVariant);
      const productName = variantDisplay ? `${product.name} - ${variantDisplay}` : product.name;
      
      await addToCart({
        id: productId,
        _id: productId,
        slug: product.slug,
        name: productName,
        price: variantPrice, // ✅ Use variant price
        originalPrice: variantComparePrice, // ✅ Use variant compare price
        image: product.image || product.main_image,
        unit: selectedVariant.attributes?.[0]?.value || product.unit,
        discount: product.discount || 0,
        variant_sku: selectedVariant.sku,
        variant_name: variantDisplay, // ✅ Add variant name for reference
      }, modalQuantity);
      
      setShowVariantModal(false);
      setModalQuantity(1);
      setSelectedVariant(null);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
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
      setTimeout(() => {
        isAddingRef.current = false;
      }, 500);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    if (!productInStock) return;
    setQuantity(newQuantity);
  };

  const handleVariantQuantityChange = (variantSku, newQuantity) => {
    if (newQuantity < 1) return;
    setVariantQuantities(prev => ({
      ...prev,
      [variantSku]: newQuantity
    }));
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (isAddingRef.current || isAdding || !productInStock) return;
    
    if (!user) {
      alert("Please login to add items to cart");
      navigate("/signin");
      return;
    }
    
    isAddingRef.current = true;
    setIsAdding(true);
    
    try {
      if (hasVariants) {
        // ✅ Open variant modal instead of showing stack
        setShowVariantModal(true);
        setIsAdding(false);
        isAddingRef.current = false;
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
      }, quantity);
      
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
      
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.message?.includes("401")) {
        alert("Session expired. Please login again.");
        navigate("/signin");
      } else {
        if (error.message && !error.message.includes("success")) {
          alert(error.message || "Failed to add to cart. Please try again.");
        }
      }
    } finally {
      setIsAdding(false);
      setTimeout(() => {
        isAddingRef.current = false;
      }, 500);
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

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (e.currentTarget.getAttribute('data-processing') === 'true') {
      return;
    }
    
    if (!user) {
      alert("Please login to add items to wishlist");
      navigate("/signin");
      return;
    }
    
    const now = Date.now();
    if (now - lastToggleTimeRef.current < TOGGLE_COOLDOWN) return;
    if (isTogglingRef.current) return;
    if (pendingProductRef.current === productId) return;
    
    e.currentTarget.setAttribute('data-processing', 'true');
    isTogglingRef.current = true;
    lastToggleTimeRef.current = now;
    pendingProductRef.current = productId;
    
    const wasWishlisted = isWishlisted;
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
      await toggleWishlist(productObj);
    } catch (error) {
      setIsWishlisted(wasWishlisted);
      if (error.status !== 404 && error.message?.includes("401")) {
        alert("Session expired. Please login again.");
        navigate("/signin");
      }
    } finally {
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
  const imageUrl = !imgError && (product.image || product.main_image) ? (product.image || product.main_image) : "https://placehold.co/400x400/3E7C47/white?text=Product";
  const isToggling = isTogglingRef.current;

  const getDisplayPrice = () => {
    if (hasVariants && productVariants.length > 0) {
      const prices = productVariants.map(v => v.price || product.price);
      const minPrice = Math.min(...prices);
      return `₹${minPrice}`;
    }
    return `₹${product.price}`;
  };

  const getVariantDisplay = (variant) => {
    if (variant.attributes && variant.attributes.length > 0) {
      return variant.attributes[0].value;
    }
    if (variant.sku) {
      const parts = variant.sku.split('-');
      const lastPart = parts[parts.length - 1];
      if (lastPart && !isNaN(lastPart)) {
        return `${lastPart}${product.unit || ''}`;
      }
      return lastPart || variant.sku;
    }
    return variant.sku || "Variant";
  };

  // ✅ Only show SELECT button if product has variants
  const showSelectButton = hasVariants && productVariants.length > 0 && variantFetchDone;

  return (
    <>
      <div
        onClick={() => navigate(`/product/${product.slug || productId}`)}
        className="group bg-[#FDF8F0] rounded-xl border border-[#E8E1D5] overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
      >
        {/* Image container */}
        <div className="relative bg-[#F5EBD9] overflow-hidden aspect-square">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

        {/* Content */}
        <div className="p-2 flex-1 flex flex-col">
          {/* Product Name */}
          <h3 className="font-medium text-gray-800 text-xs line-clamp-2 mb-0.5 group-hover:text-[#3E7C47] transition-colors leading-tight">
            {product.name}
          </h3>
          
          {/* Unit */}
          <p className="text-[9px] text-gray-400 mb-0.5">{product.unit || "Piece"}</p>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-[#F5A623] text-[#F5A623]" />
              <span className="text-[9px] font-medium text-gray-700">{product.rating || 4.5}</span>
            </div>
            <span className="text-[8px] text-gray-400">({product.reviewCount || 0})</span>
          </div>
          
          {/* Price and Actions */}
          <div className="flex items-center justify-between mt-auto pt-0.5">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#3E7C47]">{getDisplayPrice()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[8px] text-gray-400 line-through">₹{product.originalPrice}</span>
              )}
            </div>
            
            {!productInStock ? (
              <span className="text-[9px] text-gray-400">Out of stock</span>
            ) : showSelectButton ? (
              // ✅ SELECT button for variants
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVariantModal(true);
                }}
                className="px-3 py-1 bg-[#3E7C47] text-white rounded-md text-[10px] font-medium hover:bg-[#2E5C37] transition-all duration-200 flex items-center gap-1"
              >
                <Package className="w-3 h-3" />
                SELECT
              </button>
            ) : (
              // ✅ Regular ADD button for non-variant products
              <div className="flex items-center gap-0.5">
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (quantity > 1) handleQuantityChange(quantity - 1);
                    }}
                    className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-center text-[9px] font-medium text-gray-700">
                    {quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(quantity + 1);
                    }}
                    className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isLoadingVariants}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-0.5 ${
                    addSuccess 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-[#3E7C47] text-white hover:bg-[#2E5C37]'
                  }`}
                >
                  {isAdding || isLoadingVariants ? (
                    <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : addSuccess ? (
                    <>✓</>
                  ) : (
                    <><ShoppingCart className="w-2.5 h-2.5" /> ADD</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Variant Selection Modal - FIXED with proper price display */}
      {showVariantModal && productVariants.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowVariantModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select {product.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Choose your preferred variant</p>
              </div>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setModalQuantity(1);
                  setSelectedVariant(productVariants[0] || null);
                }}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Product Preview */}
              <div className="flex items-center gap-4 mb-5 bg-gray-50 rounded-xl p-3">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">{product.name}</h4>
                  <p className="text-xs text-gray-500">Select a variant below</p>
                </div>
              </div>

              {/* Variant Selection - ✅ FIXED: Show price on each variant */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Size
                </label>
                <div className="flex gap-2 flex-wrap">
                  {productVariants.map((variant, idx) => {
                    const variantDisplay = getVariantDisplay(variant);
                    const variantPrice = variant.price || product.price;
                    const variantOriginalPrice = variant.compare_price || product.originalPrice;
                    const variantDiscount = variantOriginalPrice > variantPrice ? Math.round(((variantOriginalPrice - variantPrice) / variantOriginalPrice) * 100) : 0;
                    const variantStock = variant.stock_quantity || 0;
                    const isOutOfStock = variantStock <= 0;
                    const isSelected = selectedVariant?.sku === variant.sku;
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !isOutOfStock && setSelectedVariant(variant)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-[#3E7C47] text-white shadow-md"
                            : isOutOfStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                            : "bg-gray-100 text-gray-700 hover:bg-[#3E7C47]/10 border border-gray-200"
                        }`}
                      >
                        {variantDisplay}
                        {/* ✅ Show price on variant chip */}
                        <span className="ml-1 text-[10px] font-normal">
                          ₹{variantPrice}
                        </span>
                        {variantDiscount > 0 && !isOutOfStock && (
                          <span className="ml-1 text-[10px] text-[#B6463A]">-{variantDiscount}%</span>
                        )}
                        {isOutOfStock && <span className="ml-1 text-[10px]">(Out)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {modalQuantity}
                  </span>
                  <button
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price Display - ✅ FIXED: Show correct variant price */}
              <div className="mb-5 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Price</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-[#3E7C47]">
                      ₹{(selectedVariant?.price || product.price) * modalQuantity}
                    </span>
                    {selectedVariant?.compare_price && selectedVariant.compare_price > (selectedVariant?.price || product.price) && (
                      <p className="text-xs text-gray-400 line-through">
                        ₹{selectedVariant.compare_price * modalQuantity}
                      </p>
                    )}
                  </div>
                </div>
                {selectedVariant?.compare_price && selectedVariant.compare_price > (selectedVariant?.price || product.price) && (
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-200">
                    <span className="text-sm text-gray-600">You Save</span>
                    <span className="text-sm font-medium text-[#B6463A]">
                      ₹{(selectedVariant.compare_price - (selectedVariant?.price || product.price)) * modalQuantity}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons - ✅ FIXED: Show correct total in button */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowVariantModal(false);
                    setModalQuantity(1);
                    setSelectedVariant(productVariants[0] || null);
                  }}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWithVariant}
                  disabled={!selectedVariant || (selectedVariant.stock_quantity || 0) <= 0 || isAdding}
                  className="flex-1 py-3 bg-[#3E7C47] text-white rounded-xl text-sm font-semibold hover:bg-[#2E5C37] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isAdding ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    // ✅ Use selected variant price for total
                    `Add to Cart • ₹${(selectedVariant?.price || product.price) * modalQuantity}`
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