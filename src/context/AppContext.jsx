// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { customerApi } from '../services/customerApi';

const AppContext = createContext();

// LocalStorage keys
const CART_STORAGE_KEY = 'dailybasket_cart';
const CART_TOTAL_KEY = 'dailybasket_cart_total';
const WISHLIST_STORAGE_KEY = 'dailybasket_wishlist';

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user, logout: authLogout } = useAuth();
  
  const userRole = user?.role || user?.user?.role;
  const isAdmin = userRole === 'admin' || userRole === 'ADMIN' || userRole === 'super_admin';
  
  // Initialize cart from localStorage on page load
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        return JSON.parse(savedWishlist);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [wishlistProducts, setWishlistProducts] = useState(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        return JSON.parse(savedWishlist);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isAdmin) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      localStorage.setItem(CART_TOTAL_KEY, cartTotal.toString());
    }
  }, [cart, cartTotal, isAdmin]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!isAdmin) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistProducts));
    }
  }, [wishlistProducts, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      setCartLoading(false);
      setWishlistLoading(false);
      return;
    }
    
    if (user && !isAdmin) {
      loadCartFromBackend();
      loadWishlistFromBackend();
    } else if (!user) {
      // Guest user - load from localStorage only
      setCartLoading(false);
      setWishlistLoading(false);
    }
  }, [user, isAdmin]);

  const loadCartFromBackend = async () => {
    if (isAdmin) {
      setCartLoading(false);
      return;
    }
    
    try {
      setCartLoading(true);
      const backendCart = await customerApi.cart.get();
      
      if (backendCart && backendCart.items && backendCart.items.length > 0) {
        const transformedCart = backendCart.items.map(item => ({
          id: item.product_id || item.id,
          name: item.product_name || item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.main_image || item.image,
          unit: item.unit,
          originalPrice: item.compare_price,
          slug: item.slug,
          variantSku: item.variant_sku
        }));
        setCart(transformedCart);
      } else {
        // If backend cart is empty but local cart exists, sync local to backend
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const localCart = JSON.parse(savedCart);
          if (localCart.length > 0) {
            await syncLocalCartToBackend(localCart);
          }
        }
        setCart([]);
      }
    } catch (error) {
      console.error('Error loading cart from backend:', error);
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          setCart([]);
        }
      }
    } finally {
      setCartLoading(false);
    }
  };

  const loadWishlistFromBackend = async () => {
    if (isAdmin) {
      setWishlistLoading(false);
      return;
    }
    
    try {
      setWishlistLoading(true);
      const wishlistData = await customerApi.wishlist.get();
      
      let wishlistItems = [];
      if (Array.isArray(wishlistData)) {
        wishlistItems = wishlistData;
      } else if (wishlistData && wishlistData.products && Array.isArray(wishlistData.products)) {
        wishlistItems = wishlistData.products;
      } else if (wishlistData && wishlistData.data && Array.isArray(wishlistData.data)) {
        wishlistItems = wishlistData.data;
      }
      
      setWishlistProducts(wishlistItems);
      setWishlist(wishlistItems.map(item => item._id || item.id));
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
      
    } catch (error) {
      console.error('Error loading wishlist from backend:', error);
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) {
        try {
          const parsedWishlist = JSON.parse(savedWishlist);
          setWishlistProducts(parsedWishlist);
          setWishlist(parsedWishlist.map(item => item._id || item.id));
        } catch (e) {
          setWishlistProducts([]);
          setWishlist([]);
        }
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const syncLocalCartToBackend = async (localCart) => {
    if (isAdmin) return;
    
    try {
      setSyncing(true);
      for (const item of localCart) {
        await customerApi.cart.add(item.id, item.quantity, item.variantSku);
      }
      // Clear local cart after sync
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error("Error syncing cart:", error);
    } finally {
      setSyncing(false);
    }
  };

  const addToCart = async (product, quantity = 1, variantSku = null) => {
    const productId = product.id || product._id;
    
    if (isAdmin) {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => (item.id === productId) && (item.variantSku === variantSku));
        let newCart;
        if (existingItem) {
          newCart = prevCart.map(item =>
            (item.id === productId && item.variantSku === variantSku)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newCart = [...prevCart, { 
            id: productId,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || product.compare_price,
            image: product.image || product.main_image,
            unit: product.unit,
            slug: product.slug,
            discount: product.discount,
            quantity: quantity,
            variantSku: variantSku
          }];
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
        return newCart;
      });
      return;
    }
    
    try {
      await customerApi.cart.add(productId, quantity, variantSku);
      
      setCart(prevCart => {
        const existingItem = prevCart.find(item => (item.id === productId) && (item.variantSku === variantSku));
        let newCart;
        if (existingItem) {
          newCart = prevCart.map(item =>
            (item.id === productId && item.variantSku === variantSku)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newCart = [...prevCart, { 
            id: productId,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || product.compare_price,
            image: product.image || product.main_image,
            unit: product.unit,
            slug: product.slug,
            discount: product.discount,
            quantity: quantity,
            variantSku: variantSku
          }];
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
        return newCart;
      });
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Fallback to local only
      setCart(prevCart => {
        const existingItem = prevCart.find(item => (item.id === productId) && (item.variantSku === variantSku));
        let newCart;
        if (existingItem) {
          newCart = prevCart.map(item =>
            (item.id === productId && item.variantSku === variantSku)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newCart = [...prevCart, { 
            id: productId,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || product.compare_price,
            image: product.image || product.main_image,
            unit: product.unit,
            slug: product.slug,
            discount: product.discount,
            quantity: quantity,
            variantSku: variantSku
          }];
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
        return newCart;
      });
    }
  };

  // FIXED: removeFromCart - ensures UI updates immediately
  const removeFromCart = useCallback(async (productId, variantSku = null) => {
    if (isAdmin) {
      setCart(prevCart => {
        const newCart = prevCart.filter(item => !(item.id === productId && item.variantSku === variantSku));
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
        return newCart;
      });
      return;
    }
    
    // Optimistically update UI first
    setCart(prevCart => {
      const newCart = prevCart.filter(item => !(item.id === productId && item.variantSku === variantSku));
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      return newCart;
    });
    
    try {
      await customerApi.cart.remove(productId, variantSku);
      console.log('Item removed from backend successfully');
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Revert on error - reload from backend
      await loadCartFromBackend();
    }
  }, [isAdmin, loadCartFromBackend]);

  // FIXED: updateQuantity - ensures UI updates immediately with optimistic update
  const updateQuantity = useCallback(async (productId, quantity, variantSku = null) => {
    if (quantity <= 0) {
      await removeFromCart(productId, variantSku);
      return;
    }
    
    if (isAdmin) {
      setCart(prevCart => {
        const newCart = prevCart.map(item =>
          (item.id === productId && item.variantSku === variantSku) ? { ...item, quantity } : item
        );
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
        return newCart;
      });
      return;
    }
    
    // Optimistically update UI first
    setCart(prevCart => {
      const newCart = prevCart.map(item =>
        (item.id === productId && item.variantSku === variantSku) ? { ...item, quantity } : item
      );
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      return newCart;
    });
    
    try {
      await customerApi.cart.update(productId, quantity, variantSku);
      console.log('Quantity updated on backend successfully');
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      // Revert on error - reload from backend
      await loadCartFromBackend();
    }
  }, [isAdmin, removeFromCart, loadCartFromBackend]);

  // FIXED: clearCart - ensures UI updates immediately
  const clearCart = useCallback(async () => {
    if (isAdmin) {
      setCart([]);
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_TOTAL_KEY);
      return;
    }
    
    // Optimistically clear UI first
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_TOTAL_KEY);
    
    try {
      await customerApi.cart.clear();
      console.log('Cart cleared from backend successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Revert on error - reload from backend
      await loadCartFromBackend();
    }
  }, [isAdmin, loadCartFromBackend]);

  const loadCart = async () => {
    if (!isAdmin) {
      await loadCartFromBackend();
    }
  };

  const loadWishlist = async () => {
    if (!isAdmin) {
      await loadWishlistFromBackend();
    }
  };

  const toggleWishlist = async (product) => {
    const productId = product._id || product.id;
    const isInWishlist = wishlist.includes(productId);
    
    if (isAdmin) {
      if (isInWishlist) {
        setWishlist(prev => prev.filter(id => id !== productId));
        setWishlistProducts(prev => prev.filter(item => (item._id || item.id) !== productId));
      } else {
        setWishlist(prev => [...prev, productId]);
        const wishlistProduct = {
          _id: productId,
          id: productId,
          name: product.name,
          price: product.price,
          main_image: product.image || product.main_image,
          unit: product.unit,
          slug: product.slug
        };
        setWishlistProducts(prev => [...prev, wishlistProduct]);
      }
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistProducts));
      return;
    }
    
    try {
      if (isInWishlist) {
        await customerApi.wishlist.remove(productId);
        
        setWishlist(prev => prev.filter(id => id !== productId));
        setWishlistProducts(prev => prev.filter(item => (item._id || item.id) !== productId));
        
      } else {
        await customerApi.wishlist.add(productId);
        
        const wishlistProduct = {
          _id: productId,
          id: productId,
          name: product.name,
          price: product.price,
          main_image: product.image || product.main_image,
          unit: product.unit,
          slug: product.slug,
          compare_price: product.compare_price || product.originalPrice
        };
        
        setWishlist(prev => [...prev, productId]);
        setWishlistProducts(prev => [...prev, wishlistProduct]);
      }
      
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistProducts));
      
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      if (!isInWishlist) {
        setWishlist(prev => prev.filter(id => id !== productId));
        setWishlistProducts(prev => prev.filter(item => (item._id || item.id) !== productId));
      }
    }
  };

  const checkIsInWishlist = (productId) => {
    return wishlist.includes(productId);
  };

  const getWishlistProducts = () => {
    return wishlistProducts;
  };

  const logout = async () => {
    authLogout();
    localStorage.removeItem('authToken');
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_TOTAL_KEY);
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
    setCart([]);
    setWishlist([]);
    setWishlistProducts([]);
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      isAdmin, 
      logout,
      cart,
      cartTotal,
      cartLoading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      loadCart,
      wishlist,
      wishlistProducts,
      wishlistLoading,
      toggleWishlist,
      isInWishlist: checkIsInWishlist,
      getWishlistProducts,
      loadWishlist,
      syncing,
      updatingItemId,
      setUpdatingItemId
    }}>
      {children}
    </AppContext.Provider>
  );
};