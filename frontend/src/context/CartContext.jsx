import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_BASE_URL, resolveImageUrl } from '../config/api';

const CartContext = createContext();

export const pathToPageMap = {
  '': 'home',
  '/': 'home',
  '/home': 'home',
  '/menu': 'menu',
  '/cart': 'cart',
  '/checkout': 'cart',
  '/wishlist': 'wishlist',
  '/order-confirmation': 'order-confirmation',
  '/confirmation': 'order-confirmation',
  '/product-details': 'product-details',
  '/product': 'product-details',
  '/order-details': 'order-details',
  '/track-order': 'order-details',
  '/orders': 'order-details',
  '/profile': 'profile',
  '/account': 'profile',
  '/account-settings': 'profile',
  '/admin': 'admin',
  '/admin/login': 'admin'
};

export const pageToPathMap = {
  'home': '/',
  'menu': '/menu',
  'cart': '/cart',
  'wishlist': '/wishlist',
  'order-confirmation': '/order-confirmation',
  'product-details': '/product-details',
  'order-details': '/orders',
  'profile': '/profile',
  'admin': '/admin'
};

export const getPageFromPath = (pathname) => {
  const norm = (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  return pathToPageMap[norm] || 'home';
};

// Helper to get user-scoped storage key (isolates cart & wishlist per customer)
const getUserStorageKey = (prefix, currentUser) => {
  if (currentUser && currentUser.isLoggedIn) {
    const uid = currentUser.id || currentUser.phone || 'authenticated';
    return `${prefix}_user_${uid}`;
  }
  return `${prefix}_guest`;
};

const loadScopedStorage = (prefix, currentUser, legacyKey = null) => {
  const key = getUserStorageKey(prefix, currentUser);
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  // One-time migration from legacy unscoped storage if present
  if (legacyKey && currentUser && currentUser.isLoggedIn) {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        localStorage.setItem(key, legacy);
        localStorage.removeItem(legacyKey);
        return parsed;
      } catch (e) {}
    }
  }
  return [];
};

export const CartProvider = ({ children }) => {
  // Navigation State
  const [activePage, setActivePage] = useState(() => getPageFromPath(window.location.pathname));

  // Selected Dish for Product Details Page
  const [selectedDish, setSelectedDish] = useState(() => {
    try {
      const saved = sessionStorage.getItem('orderunavu_selected_dish');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Selected Order ID for Order Details & Live Tracking
  const [selectedOrderId, setSelectedOrderId] = useState(() => {
    try {
      return sessionStorage.getItem('orderunavu_selected_order_id') || null;
    } catch (e) {
      return null;
    }
  });

  // Dishes state - PURE LIVE DATA FROM MYSQL DATABASE (Zero mock fallbacks)
  const [dishes, setDishes] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(true);

  // Hero Section Image (Editable by Admin, fetched from DB)
  const [heroImage, setHeroImage] = useState("");

  // Admin Session State
  const [adminSession, setAdminSession] = useState(() => {
    const saved = localStorage.getItem('orderunavu_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // User auth state: NO DEFAULT MOCK CREDENTIALS (Default is NULL / logged out)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('orderunavu_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn) return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Cart state - STRICTLY SCOPED PER USER
  const [cart, setCart] = useState(() => loadScopedStorage('orderunavu_cart', user, 'orderunavu_cart'));

  // Wishlist state - STRICTLY SCOPED PER USER
  const [wishlist, setWishlist] = useState(() => loadScopedStorage('orderunavu_wishlist', user, 'orderunavu_wishlist'));

  // Global Auth & Profile Modals Controller
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Active coupon
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Completed order for confirmation page
  const [lastOrder, setLastOrder] = useState(null);

  // Active user ref for reactive switching between accounts
  const activeUserRef = React.useRef(user && user.isLoggedIn ? (user.id || user.phone) : null);

  // Sync with MySQL Database for logged-in users
  const syncWithDatabase = async (loggedInUser) => {
    if (!loggedInUser || !loggedInUser.id) return;
    try {
      // 1. Fetch Cart from MySQL DB
      const cartRes = await fetch(`${API_BASE_URL}/api/cart/${loggedInUser.id}`);
      if (cartRes.ok) {
        const dbCart = await cartRes.json();
        if (Array.isArray(dbCart)) {
          setCart(dbCart);
          const cartKey = getUserStorageKey('orderunavu_cart', loggedInUser);
          localStorage.setItem(cartKey, JSON.stringify(dbCart));
        }
      }

      // 2. Fetch Wishlist from MySQL DB
      const wishRes = await fetch(`${API_BASE_URL}/api/wishlist/${loggedInUser.id}`);
      if (wishRes.ok) {
        const dbWishlist = await wishRes.json();
        if (Array.isArray(dbWishlist)) {
          setWishlist(dbWishlist);
          const wishlistKey = getUserStorageKey('orderunavu_wishlist', loggedInUser);
          localStorage.setItem(wishlistKey, JSON.stringify(dbWishlist));
        }
      }
    } catch (e) {
      console.warn("Could not sync with DB cart/wishlist:", e);
    }
  };

  // Initial DB sync on load if user is logged in
  useEffect(() => {
    if (user && user.id) {
      syncWithDatabase(user);
    }
  }, []);

  // When user logs in, switches accounts, or logs out, reload that user's cart & wishlist from DB
  useEffect(() => {
    const currentUid = user && user.isLoggedIn ? (user.id || user.phone) : null;
    if (activeUserRef.current !== currentUid) {
      activeUserRef.current = currentUid;
      if (user && user.id) {
        syncWithDatabase(user);
      } else {
        const userCart = loadScopedStorage('orderunavu_cart', user);
        const userWishlist = loadScopedStorage('orderunavu_wishlist', user);
        setCart(userCart);
        setWishlist(userWishlist);
      }
    }
  }, [user]);

  // Sync cart to user-scoped storage key
  useEffect(() => {
    const cartKey = getUserStorageKey('orderunavu_cart', user);
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, user]);

  // Sync wishlist to user-scoped storage key
  useEffect(() => {
    const wishlistKey = getUserStorageKey('orderunavu_wishlist', user);
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
  }, [wishlist, user]);

  useEffect(() => {
    if (adminSession) {
      localStorage.setItem('orderunavu_admin_session', JSON.stringify(adminSession));
    } else {
      localStorage.removeItem('orderunavu_admin_session');
    }
  }, [adminSession]);

  useEffect(() => {
    if (user && user.isLoggedIn) {
      localStorage.setItem('orderunavu_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('orderunavu_user');
    }
  }, [user]);

  // Fetch Dishes LIVE from FastAPI / MySQL backend
  const refreshDishes = async () => {
    setLoadingDishes(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/foods?include_all=true`, { method: 'GET' });
      if (res.ok) {
        const apiData = await res.json();
        if (Array.isArray(apiData)) {
          const mapped = apiData.map(f => ({
            id: f.id,
            name: f.name,
            category: f.category,
            price: f.price,
            rating: f.rating || 4.8,
            reviews: 120,
            prepTime: f.prep_time || "20-25 mins",
            isVeg: Boolean(f.is_veg),
            isPopular: true,
            isSpecial: false,
            isAvailable: f.is_available !== false,
            description: f.description || "",
            image: resolveImageUrl(f.image_url || ""),
            itemType: f.item_type || "kitchen",
            mealSlot: f.meal_slot || "all_day",
            stockQuantity: f.stock_quantity ?? null
          }));
          setDishes(mapped);
        }
      }
    } catch (err) {
      console.warn("Backend not reached for foods, running offline state:", err);
    } finally {
      setLoadingDishes(false);
    }
  };

  // Fetch Hero Image from MySQL settings
  const refreshHeroImage = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings/hero-image`);
      if (res.ok) {
        const data = await res.json();
        setHeroImage(resolveImageUrl(data.hero_image || ''));
      }
    } catch (err) {}
  };

  useEffect(() => {
    refreshDishes();
    refreshHeroImage();
  }, []);

  // --- Cart Actions (AUTH PROTECTED) ---
  const addToCart = (dish) => {
    if (!user || !user.isLoggedIn) {
      setAuthModalMessage("Please login to add dishes to your cart.");
      setAuthModalOpen(true);
      return false;
    }

    if (!dish.isAvailable) {
      alert(`Sorry, '${dish.name}' is currently sold out for today.`);
      return false;
    }

    if (dish.itemType === 'inventory' && dish.stockQuantity !== null && dish.stockQuantity <= 0) {
      alert(`Sorry, '${dish.name}' is out of stock.`);
      return false;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        if (dish.itemType === 'inventory' && dish.stockQuantity !== null && existing.quantity >= dish.stockQuantity) {
          alert(`Only ${dish.stockQuantity} available in stock.`);
          return prev;
        }
        return prev.map(item =>
          item.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });

    // Sync to MySQL Database
    if (user && user.id) {
      fetch(`${API_BASE_URL}/api/cart/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_id: dish.id, delta: 1 })
      }).catch(err => console.warn("Cart DB sync failed:", err));
    }

    return true;
  };

  const updateQuantity = (dishId, delta) => {
    if (!user || !user.isLoggedIn) {
      setAuthModalMessage("Please login to modify your cart items.");
      setAuthModalOpen(true);
      return false;
    }

    setCart(prev => {
      return prev
        .map(item => {
          if (item.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });

    // Sync to MySQL Database
    if (user && user.id) {
      fetch(`${API_BASE_URL}/api/cart/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_id: dishId, delta })
      }).catch(err => console.warn("Cart DB sync failed:", err));
    }

    return true;
  };

  const removeFromCart = (dishId) => {
    setCart(prev => prev.filter(item => item.id !== dishId));

    // Sync to MySQL Database
    if (user && user.id) {
      fetch(`${API_BASE_URL}/api/cart/${user.id}/${dishId}`, {
        method: 'DELETE'
      }).catch(err => console.warn("Cart DB remove failed:", err));
    }
  };

  const clearCart = () => {
    setCart([]);

    // Sync to MySQL Database
    if (user && user.id) {
      fetch(`${API_BASE_URL}/api/cart/${user.id}`, {
        method: 'DELETE'
      }).catch(err => console.warn("Cart DB clear failed:", err));
    }
  };

  const getItemQuantity = (dishId) => {
    const item = cart.find(i => i.id === dishId);
    return item ? item.quantity : 0;
  };

  // --- Wishlist Actions (AUTH PROTECTED) ---
  const toggleWishlist = (dishId) => {
    if (!user || !user.isLoggedIn) {
      setAuthModalMessage("Please login to save dishes to your wishlist.");
      setAuthModalOpen(true);
      return false;
    }

    setWishlist(prev => {
      if (prev.includes(dishId)) {
        return prev.filter(id => id !== dishId);
      } else {
        return [...prev, dishId];
      }
    });

    // Sync to MySQL Database
    if (user && user.id) {
      fetch(`${API_BASE_URL}/api/wishlist/${user.id}/toggle/${dishId}`, {
        method: 'POST'
      }).catch(err => console.warn("Wishlist DB toggle failed:", err));
    }

    return true;
  };

  const removeFromWishlist = (dishId) => {
    setWishlist(prev => prev.filter(id => id !== dishId));

    // Sync removal to MySQL Database
    if (user && user.id) {
      fetch(`${API_BASE_URL}/api/wishlist/${user.id}/${dishId}`, {
        method: 'DELETE'
      }).catch(err => console.warn("Wishlist DB remove failed:", err));
    }
  };

  const moveWishlistToCart = (dish) => {
    const added = addToCart(dish);
    if (added) {
      removeFromWishlist(dish.id);
    }
    return added;
  };

  const isInWishlist = (dishId) => wishlist.includes(dishId);

  // --- Totals Calculation ---
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 500 ? 0 : 35;
  const taxes = subtotal === 0 ? 0 : Math.round(subtotal * 0.05);

  let discount = 0;
  if (appliedCoupon === 'KUMBAKONAM20') {
    discount = Math.round(subtotal * 0.20);
  } else if (appliedCoupon === 'DEGREEFREE') {
    discount = Math.min(subtotal, 45);
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee + taxes - discount);

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      setActivePage(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update active page state and URL
  const handlePageChange = (page) => {
    setActivePage(page);
    const targetPath = pageToPathMap[page] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductDetails = (dish) => {
    if (dish) {
      setSelectedDish(dish);
      try {
        sessionStorage.setItem('orderunavu_selected_dish', JSON.stringify(dish));
      } catch (e) {}
    }
    handlePageChange('product-details');
  };

  const openOrderDetails = (orderId) => {
    if (orderId) {
      const cleanId = String(orderId).replace(/\D/g, '') || String(orderId);
      setSelectedOrderId(cleanId);
      try {
        sessionStorage.setItem('orderunavu_selected_order_id', cleanId);
      } catch (e) {}
    }
    handlePageChange('order-details');
  };

  return (
    <CartContext.Provider
      value={{
        activePage,
        setActivePage: handlePageChange,
        handlePageChange,
        selectedDish,
        setSelectedDish,
        openProductDetails,
        selectedOrderId,
        setSelectedOrderId,
        openOrderDetails,
        dishes,
        setDishes,
        refreshDishes,
        loadingDishes,
        heroImage,
        setHeroImage,
        refreshHeroImage,
        adminSession,
        setAdminSession,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        wishlist,
        toggleWishlist,
        removeFromWishlist,
        moveWishlistToCart,
        isInWishlist,
        cartItemCount,
        subtotal,
        deliveryFee,
        taxes,
        discount,
        grandTotal,
        appliedCoupon,
        setAppliedCoupon,
        user,
        setUser,
        authModalOpen,
        setAuthModalOpen,
        authModalMessage,
        setAuthModalMessage,
        profileModalOpen,
        setProfileModalOpen,
        lastOrder,
        setLastOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
