import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useApp } from "../context/AppContext";

export function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  
  const productId = product.id || product._id;
  const isWishlisted = wishlist.includes(productId);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({
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
  };

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    const productObj = {
      _id: productId,
      id: productId,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      main_image: product.image,
      unit: product.unit,
      slug: product.slug
    };
    toggleWishlist(productObj);
  };

  const getStockStatus = () => {
    if (product.inStock === false) return { text: "Out of Stock", color: "text-red-500 bg-red-50" };
    if (product.stockQuantity && product.stockQuantity < 10) return { text: "Only few left", color: "text-orange-500 bg-orange-50" };
    return null;
  };

  const stockStatus = getStockStatus();
  const discount = product.discount || (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);

  return (
    <div
      onClick={() => navigate(`/product/${product.slug || productId}`)}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={product.image || "https://placehold.co/300x300/8B2C2C/white?text=Product"}
          alt={product.name}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://placehold.co/300x300/8B2C2C/white?text=No+Image"; }}
        />
        
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">
            {discount}% OFF
          </span>
        )}
        
        {product.isTrending && (
          <span className="absolute top-2 right-12 bg-[#8B2C2C] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">
            🔥 Trending
          </span>
        )}
        
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-all duration-200 z-10"
        >
          <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
        
        {stockStatus && !product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-red-500 px-3 py-1 rounded-full text-sm font-semibold">
              {stockStatus.text}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-1 group-hover:text-[#8B2C2C] transition-colors">
          {product.name}
        </h3>
        
        <p className="text-xs text-gray-400 mb-2">{product.unit || "Piece"}</p>
        
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-gray-700">{product.rating || 4.5}</span>
          </div>
          <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-bold text-[#8B2C2C]">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={product.inStock === false}
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#8B2C2C] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-[#8B2C2C] group-hover:text-white"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
        
        {stockStatus && product.inStock && stockStatus.text === "Only few left" && (
          <p className="text-xs text-orange-500 mt-2">{stockStatus.text}</p>
        )}
      </div>
    </div>
  );
}