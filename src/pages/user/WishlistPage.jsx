import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, X, Loader2, Package, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { customerApi } from "../../services/customerApi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export function WishlistPage() {
  const navigate = useNavigate();
  const { toggleWishlist, addToCart } = useApp();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchWishlistProducts();
  }, []);

  const fetchWishlistProducts = async () => {
    setLoading(true);
    try {
      const productsData = await customerApi.wishlist.get();
      
      if (Array.isArray(productsData) && productsData.length > 0) {
        setWishlistProducts(productsData);
      } else {
        setWishlistProducts([]);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setWishlistProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await customerApi.wishlist.remove(productId);
      toggleWishlist(productId);
      setWishlistProducts(prev => prev.filter(p => p._id !== productId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toggleWishlist(productId);
      setWishlistProducts(prev => prev.filter(p => p._id !== productId));
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm("Are you sure you want to clear your entire wishlist? This action cannot be undone.")) {
      setClearing(true);
      try {
        await customerApi.wishlist.clear();
        for (const product of wishlistProducts) {
          toggleWishlist(product._id);
        }
        setWishlistProducts([]);
        alert("Wishlist cleared successfully!");
      } catch (error) {
        console.error("Error clearing wishlist:", error);
        alert("Failed to clear wishlist. Please try again.");
      } finally {
        setClearing(false);
      }
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      originalPrice: product.compare_price,
      image: product.main_image,
      unit: product.unit,
    }, 1);
    alert("Added to cart!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#3E7C47] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading wishlist...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5EFE6]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save your favorite items here!</p>
            <button
              onClick={() => navigate("/products")}
              className="px-6 py-3 bg-[#3E7C47] text-white rounded-full font-semibold hover:bg-[#2E5C37] transition-colors"
            >
              Start Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist ({wishlistProducts.length})</h1>
          <button
            onClick={handleClearWishlist}
            disabled={clearing}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {wishlistProducts.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative">
              <button
                onClick={() => handleRemoveFromWishlist(item._id)}
                className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/product/${item.slug}`)}
              >
                <div className="h-48 bg-gray-50 flex items-center justify-center p-4">
                  {item.main_image ? (
                    <img
                      src={item.main_image}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={(e) => { e.target.src = "https://placehold.co/200x200/3E7C47/white?text=Product"; }}
                    />
                  ) : (
                    <Package className="w-16 h-16 text-gray-300" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{item.unit || "Piece"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#3E7C47]">₹{item.price}</span>
                    {item.compare_price && (
                      <span className="text-xs text-gray-400 line-through">₹{item.compare_price}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-[#3E7C47] hover:text-white transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}