// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { customerApi } from '../services/customerApi';

const AppContext = createContext();

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
  
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setCartLoading(false);
      setWishlistLoading(false);
      return;
    }
    
    if (user && !isAdmin) {
      loadCartFromBackend();
      loadWishlistFromBackend();
    } else {
      const savedCart = localStorage.getItem('cart');
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        setWishlist(parsedWishlist);
        setWishlistProducts(parsedWishlist);
      }
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
      
      if (backendCart && backendCart.data && backendCart.data.items && backendCart.data.items.length > 0) {
        const transformedCart = backendCart.data.items.map(item => ({
          id: item.product_id,
          name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          image: item.main_image,
          unit: item.unit,
          originalPrice: item.compare_price,
          slug: item.slug
        }));
        setCart(transformedCart);
      } else {
        const savedCart = localStorage.getItem('cart');
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
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
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
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
      
    } catch (error) {
      console.error('Error loading wishlist from backend:', error);
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        setWishlistProducts(parsedWishlist);
        setWishlist(parsedWishlist.map(item => item._id || item.id));
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
        await customerApi.cart.add(item.id, item.quantity);
      }
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
        const existingItem = prevCart.find(item => (item.id === productId));
        if (existingItem) {
          return prevCart.map(item =>
            (item.id === productId)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prevCart, { 
          id: productId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice || product.compare_price,
          image: product.image || product.main_image,
          unit: product.unit,
          slug: product.slug,
          discount: product.discount,
          quantity: quantity
        }];
      });
      return;
    }
    
    try {
      await customerApi.cart.add(productId, quantity, variantSku);
      
      setCart(prevCart => {
        const existingItem = prevCart.find(item => (item.id === productId));
        if (existingItem) {
          return prevCart.map(item =>
            (item.id === productId)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prevCart, { 
          id: productId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice || product.compare_price,
          image: product.image || product.main_image,
          unit: product.unit,
          slug: product.slug,
          discount: product.discount,
          quantity: quantity
        }];
      });
      
      const updatedCart = [...cart];
      const existingIndex = updatedCart.findIndex(item => (item.id === productId));
      if (existingIndex >= 0) {
        updatedCart[existingIndex].quantity += quantity;
      } else {
        updatedCart.push({ 
          id: productId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice || product.compare_price,
          image: product.image || product.main_image,
          unit: product.unit,
          slug: product.slug,
          discount: product.discount,
          quantity: quantity
        });
      }
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCart(prevCart => {
        const existingItem = prevCart.find(item => (item.id === productId));
        if (existingItem) {
          return prevCart.map(item =>
            (item.id === productId)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prevCart, { ...product, id: productId, quantity }];
      });
    }
  };

  const removeFromCart = async (productId) => {
    if (isAdmin) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      localStorage.setItem('cart', JSON.stringify(cart.filter(item => item.id !== productId)));
      return;
    }
    
    try {
      await customerApi.cart.remove(productId);
      
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      const updatedCart = cart.filter(item => item.id !== productId);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      
    } catch (error) {
      console.error('Error removing from cart:', error);
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    
    if (isAdmin) {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
      localStorage.setItem('cart', JSON.stringify(
        cart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      ));
      return;
    }
    
    try {
      await customerApi.cart.update(productId, quantity);
      
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
      
      const updatedCart = cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = async () => {
    if (isAdmin) {
      setCart([]);
      localStorage.removeItem('cart');
      return;
    }
    
    try {
      await customerApi.cart.clear();
      setCart([]);
      localStorage.removeItem('cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
      setCart([]);
      localStorage.removeItem('cart');
    }
  };

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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      localStorage.setItem('wishlist', JSON.stringify(wishlistProducts));
      return;
    }
    
    try {
      if (isInWishlist) {
        await customerApi.wishlist.remove(productId);
        
        setWishlist(prev => prev.filter(id => id !== productId));
        setWishlistProducts(prev => prev.filter(item => (item._id || item.id) !== productId));
        
        const updatedWishlist = wishlistProducts.filter(item => (item._id || item.id) !== productId);
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        
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
        
        const updatedWishlist = [...wishlistProducts, wishlistProduct];
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      }
      
    } catch (error) {
      console.error('Error toggling wishlist:', error);
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
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.includes(productId);
  };

  const getWishlistProducts = () => {
    return wishlistProducts;
  };

  const logout = async () => {
    authLogout();
    localStorage.removeItem('authToken');
    setCart([]);
    setWishlist([]);
    setWishlistProducts([]);
    localStorage.removeItem('cart');
    localStorage.removeItem('wishlist');
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
      isInWishlist,
      getWishlistProducts,
      loadWishlist,
      syncing
    }}>
      {children}
    </AppContext.Provider>
  );
};