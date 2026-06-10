import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Plus, Minus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

export function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart, removeFromCart, updateQuantity, wishlist, toggleWishlist } = useApp();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Find current cart item to get actual quantity
  const { cart } = useApp();
  const cartItem = cart.find(item => (item.id === product.id || item.id === product._id));
  const currentCartQuantity = cartItem?.quantity || 0;
  const showQuantityControls = currentCartQuantity > 0;
  
  const productId = product.id || product._id;

  // Update wishlist status when wishlist changes
  useEffect(() => {
    setIsWishlisted(wishlist.includes(productId));
  }, [wishlist, productId]);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isAdding || product.inStock === false) return;
    
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
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        unit: product.unit,
        discount: product.discount || 0,
      }, 1);
      
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.message?.includes("401") || error.message?.includes("authenticated")) {
        alert("Session expired. Please login again.");
        navigate("/signin");
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
      await updateQuantity(productId, newQuantity);
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
        await updateQuantity(productId, newQuantity);
      } else {
        // If quantity becomes 0, remove from cart
        await removeFromCart(productId);
      }
    } catch (error) {
      console.error("Error decreasing quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to add items to wishlist");
      navigate("/signin");
      return;
    }
    
    const productObj = {
      _id: productId,
      id: productId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      main_image: product.image,
      unit: product.unit,
      slug: product.slug,
      compare_price: product.originalPrice
    };
    
    // Optimistically update UI
    setIsWishlisted(!isWishlisted);
    
    try {
      await toggleWishlist(productObj);
    } catch (error) {
      // Revert on error
      setIsWishlisted(isWishlisted);
      console.error("Error toggling wishlist:", error);
      alert("Failed to update wishlist. Please try again.");
    }
  };

  const getStockStatus = () => {
    if (product.inStock === false) return { text: "Out of Stock" };
    if (product.stockQuantity && product.stockQuantity < 10) return { text: "Only few left" };
    return null;
  };

  const stockStatus = getStockStatus();
  const discount = product.discount || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);

  return (
    <div
      onClick={() => navigate(`/product/${product.slug || productId}`)}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={product.image || "https://placehold.co/300x300/3E7C47/white?text=Product"}
          alt={product.name}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://placehold.co/300x300/3E7C47/white?text=No+Image"; }}
        />
        
        {discount > 0 && (
          <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md">
            {discount}% OFF
          </span>
        )}
        
        <button
          onClick={handleToggleWishlist}
          className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-all duration-200 z-10"
        >
          <Heart className={`w-3 h-3 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
        
        {stockStatus && !product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-red-500 px-2 py-0.5 rounded text-xs font-semibold">
              {stockStatus.text}
            </span>
          </div>
        )}
      </div>

      <div className="p-2">
        <h3 className="font-medium text-gray-800 text-xs line-clamp-2 mb-0.5 group-hover:text-green-600 transition-colors leading-tight">
          {product.name}
        </h3>
        
        <p className="text-[10px] text-gray-400 mb-1">{product.unit || "Piece"}</p>
        
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-medium text-gray-700">{product.rating || 4.5}</span>
          </div>
          <span className="text-[9px] text-gray-400">({product.reviewCount || 0})</span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-green-600">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice}</span>
            )}
          </div>
          
          {product.inStock === false ? (
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
              <span className="text-xs font-medium text-gray-700 min-w-[12px] text-center">
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
              disabled={isAdding}
              className="px-3 py-0.5 bg-green-600 text-white rounded-md text-[11px] font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
            >
              {isAdding ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "ADD"
              )}
            </button>
          )}
        </div>
        
        {stockStatus && product.inStock && stockStatus.text === "Only few left" && (
          <p className="text-[9px] text-orange-500 mt-1">{stockStatus.text}</p>
        )}
      </div>
    </div>
  );
}