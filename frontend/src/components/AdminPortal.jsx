import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL, resolveImageUrl } from '../config/api';
import { ImageCropperModal } from './ImageCropperModal';
import { downloadDishesTemplateXLSX, parseDishesExcelFile } from '../utils/excelDishes';
import {
  CloseIcon,
  PlusIcon,
  TrashIcon,
  SearchIcon,
  ClockIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserIcon
} from './Icons';

export const AdminPortal = ({ setActivePage }) => {
  const {
    dishes,
    refreshDishes,
    heroImage,
    setHeroImage,
    adminSession,
    setAdminSession
  } = useCart();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('dishes'); // 'dishes', 'orders', 'users', 'hero-settings', 'database'

  // Helper: Format date as DD/MM/YYYY (date/month/year)
  const formatDateDMY = (dateStr, includeTime = false) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    if (!includeTime) return formattedDate;
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${formattedDate} • ${timeStr}`;
  };

  // Admin Login State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard Stats
  const [stats, setStats] = useState({
    total_foods: 0,
    total_orders: 0,
    total_users: 0,
    pending_orders: 0,
    total_revenue: 0
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Dish Form Modal State (Add / Edit)
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishFormData, setDishFormData] = useState({
    name: '',
    category: 'Biryani',
    price: '',
    is_veg: true,
    prep_time: '15-20 mins',
    description: '',
    image_url: '',
    rating: 4.8,
    is_available: true,
    item_type: 'kitchen',
    meal_slot: 'lunch',
    stock_quantity: ''
  });
  const [savingDish, setSavingDish] = useState(false);
  const [dishFilterCategory, setDishFilterCategory] = useState('All');
  const [dishFilterSlot, setDishFilterSlot] = useState('All');
  const [dishSearch, setDishSearch] = useState('');

  // Hero Image Upload State (Zero fallbacks, pure File Upload)
  const [selectedHeroFile, setSelectedHeroFile] = useState(null);
  const [heroFilePreview, setHeroFilePreview] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroToast, setHeroToast] = useState('');
  const [removingHero, setRemovingHero] = useState(false);
  const [showHeroCropper, setShowHeroCropper] = useState(false);
  const [rawHeroSourceUrl, setRawHeroSourceUrl] = useState('');
  const [rawHeroFileName, setRawHeroFileName] = useState('');

  // Dish Photo Upload & Cropper State
  const [dishUploading, setDishUploading] = useState(false);
  const [showDishCropper, setShowDishCropper] = useState(false);
  const [rawDishSourceUrl, setRawDishSourceUrl] = useState('');
  const [rawDishFileName, setRawDishFileName] = useState('');

  // Excel Bulk Upload Dishes State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsedBulkItems, setParsedBulkItems] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkParsing, setBulkParsing] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkToast, setBulkToast] = useState('');
  const bulkFileInputRef = useRef(null);

  // Handle parsing selected Excel / CSV file
  const handleBulkFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkParsing(true);
    setBulkToast('');
    setBulkErrors([]);

    try {
      const { validItems, errors } = await parseDishesExcelFile(file);
      setParsedBulkItems(validItems);
      setBulkErrors(errors);
      if (validItems.length === 0) {
        setBulkToast("No valid dishes found in this file. Please check column headers.");
      }
    } catch (err) {
      setBulkErrors([`Failed to parse file: ${err.message}`]);
      setParsedBulkItems([]);
    } finally {
      setBulkParsing(false);
    }
  };

  // Submit bulk items to backend
  const handleConfirmBulkUpload = async () => {
    if (parsedBulkItems.length === 0) return;
    setBulkUploading(true);
    setBulkToast('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/foods/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBulkItems)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to upload dishes");
      }

      setBulkToast(`✓ Successfully added ${data.count || parsedBulkItems.length} dishes to the menu!`);
      refreshDishes();
      fetchStats();
      setTimeout(() => {
        setBulkModalOpen(false);
        setBulkFile(null);
        setParsedBulkItems([]);
        setBulkErrors([]);
        setBulkToast('');
      }, 1500);
    } catch (err) {
      setBulkToast(`⚠️ Error: ${err.message}`);
    } finally {
      setBulkUploading(false);
    }
  };

  // Change Admin Password State (DB-driven, Salt & Token in .env)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {}
  };

  // Fetch Customer Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {}
    setLoadingOrders(false);
  };

  // Fetch Website Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {}
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (adminSession) {
      fetchStats();
      fetchOrders();
      fetchUsers();
    }
  }, [adminSession]);

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.detail || "Authentication failed. Invalid admin credentials.");
      } else {
        setAdminSession(data);
        setPassword('');
      }
    } catch (err) {
      setLoginError(`Could not connect to backend server on ${API_BASE_URL}.`);
    } finally {
      setLoggingIn(false);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    setAdminSession(null);
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        fetchStats();
      }
    } catch (err) {
      alert("Failed to update order status.");
    }
  };

  // Open Dish Modal for Add / Edit
  const handleOpenAddDish = () => {
    setEditingDish(null);
    setDishFormData({
      name: '',
      category: 'Biryani',
      price: '',
      is_veg: true,
      prep_time: '15-20 mins',
      description: '',
      image_url: '',
      rating: 4.8,
      is_available: true,
      item_type: 'kitchen',
      meal_slot: 'lunch',
      stock_quantity: ''
    });
    setDishModalOpen(true);
  };

  const handleOpenEditDish = (dish) => {
    setEditingDish(dish);
    setDishFormData({
      name: dish.name || '',
      category: dish.category || 'Biryani',
      price: dish.price || '',
      is_veg: Boolean(dish.isVeg),
      prep_time: dish.prepTime || '15-20 mins',
      description: dish.description || '',
      image_url: dish.image || '',
      rating: dish.rating || 4.8,
      is_available: dish.isAvailable !== false,
      item_type: dish.itemType || (dish.category === 'Drinks' || dish.category === 'Snacks' ? 'inventory' : 'kitchen'),
      meal_slot: dish.mealSlot || 'lunch',
      stock_quantity: dish.stockQuantity !== null && dish.stockQuantity !== undefined ? dish.stockQuantity : ''
    });
    setDishModalOpen(true);
  };

  // Save Dish (Add or Edit)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dishFormData.name.trim() || !dishFormData.price) {
      alert("Please provide dish name and price.");
      return;
    }

    let resolvedImageUrl = (dishFormData.image_url && dishFormData.image_url.trim())
      ? dishFormData.image_url.trim()
      : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80';
    if (resolvedImageUrl.includes('/uploads/')) {
      resolvedImageUrl = '/uploads/' + resolvedImageUrl.split('/uploads/').pop();
    }

    setSavingDish(true);
    const payload = {
      name: dishFormData.name.trim(),
      category: dishFormData.category.trim(),
      price: parseFloat(dishFormData.price),
      is_veg: Boolean(dishFormData.is_veg),
      prep_time: dishFormData.prep_time.trim(),
      description: dishFormData.description.trim(),
      image_url: resolvedImageUrl,
      rating: parseFloat(dishFormData.rating) || 4.8,
      is_available: Boolean(dishFormData.is_available),
      item_type: dishFormData.item_type || 'kitchen',
      meal_slot: dishFormData.item_type === 'kitchen' ? (dishFormData.meal_slot || 'all_day') : 'all_day',
      stock_quantity: dishFormData.item_type === 'inventory' ? (parseInt(dishFormData.stock_quantity) || 0) : null
    };

    try {
      const url = editingDish
        ? `${API_BASE_URL}/api/foods/${editingDish.id}`
        : `${API_BASE_URL}/api/foods`;
      const method = editingDish ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await refreshDishes();
        fetchStats();
        setDishModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save dish.");
      }
    } catch (err) {
      alert("Error saving dish to database.");
    } finally {
      setSavingDish(false);
    }
  };

  // Delete Dish
  const handleDeleteDish = async (dishId, dishName) => {
    if (!window.confirm(`Are you sure you want to delete "${dishName}" from the menu?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/foods/${dishId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await refreshDishes();
        fetchStats();
      } else {
        alert("Failed to delete dish from database.");
      }
    } catch (err) {
      alert("Error deleting dish.");
    }
  };

  // Toggle Dish Availability
  const handleToggleAvailability = async (dish) => {
    const updatedStatus = !dish.isAvailable;
    try {
      const res = await fetch(`${API_BASE_URL}/api/foods/${dish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: updatedStatus })
      });
      if (res.ok) {
        await refreshDishes();
      }
    } catch (err) {}
  };

  // Handle Hero Image File Selection (Opens Visual Cropper Modal)
  const handleHeroFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      setRawHeroSourceUrl(objUrl);
      setRawHeroFileName(file.name);
      setShowHeroCropper(true);
      // Reset input value so user can select the same file again if desired
      e.target.value = '';
    }
  };

  // Called when user confirms crop in ImageCropperModal
  // Called when user confirms crop in ImageCropperModal for Hero
  const handleHeroCropComplete = (croppedFile, croppedPreviewUrl) => {
    setSelectedHeroFile(croppedFile);
    setHeroFilePreview(croppedPreviewUrl);
    setShowHeroCropper(false);
  };

  // Edit already uploaded active hero photo
  const handleEditActiveHeroImage = () => {
    if (!heroImage) return;
    setRawHeroSourceUrl(heroImage);
    setRawHeroFileName("active-hero-banner.jpg");
    setShowHeroCropper(true);
  };

  // Remove Hero Image and reset to default fallback food photo
  const handleRemoveHeroImage = async () => {
    if (!window.confirm("Are you sure you want to remove the custom hero image and reset to the default photo?")) {
      return;
    }

    setRemovingHero(true);
    setHeroToast('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings/hero-image`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setHeroImage('');
        setSelectedHeroFile(null);
        setHeroFilePreview('');
        setHeroToast('Hero Section image removed. Default hero photo restored successfully!');
        setTimeout(() => setHeroToast(''), 4000);
      } else {
        alert(data.detail || "Failed to remove hero image.");
      }
    } catch (err) {
      alert(`Error connecting to server on ${API_BASE_URL}.`);
    } finally {
      setRemovingHero(false);
    }
  };

  // Upload Hero Image directly to backend uploads/ and save to MySQL DB
  const handleUploadHeroImage = async () => {
    if (!selectedHeroFile) {
      alert("Please choose an image file first.");
      return;
    }

    setUploadingHero(true);
    setHeroToast('');
    try {
      const formData = new FormData();
      formData.append('file', selectedHeroFile);

      const res = await fetch(`${API_BASE_URL}/api/admin/settings/hero-image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setHeroImage(resolveImageUrl(data.hero_image));
        setHeroToast('Hero Section image uploaded and saved successfully! Home page is updated.');
        setSelectedHeroFile(null);
        setHeroFilePreview('');
        setTimeout(() => setHeroToast(''), 4000);
      } else {
        alert(data.detail || "Failed to upload hero image.");
      }
    } catch (err) {
      alert(`Error connecting to upload API on ${API_BASE_URL}.`);
    } finally {
      setUploadingHero(false);
    }
  };

  // Handle Dish Photo File Selection (Opens Visual Cropper)
  const handleDishFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      setRawDishSourceUrl(objUrl);
      setRawDishFileName(file.name);
      setShowDishCropper(true);
      e.target.value = '';
    }
  };

  // Edit already uploaded dish photo
  const handleEditExistingDishImage = () => {
    if (!dishFormData.image_url) return;
    setRawDishSourceUrl(dishFormData.image_url);
    setRawDishFileName("dish-image.jpg");
    setShowDishCropper(true);
  };

  // Remove dish photo (clears form state & deletes file from uploads/ if uploaded)
  const handleRemoveDishImage = async () => {
    const imgToRemove = dishFormData.image_url;
    setDishFormData(prev => ({ ...prev, image_url: '' }));
    if (imgToRemove && imgToRemove.includes('/uploads/')) {
      try {
        await fetch(`${API_BASE_URL}/api/admin/uploaded-image?image_url=${encodeURIComponent(imgToRemove)}`, {
          method: 'DELETE'
        });
      } catch (err) {}
    }
  };

  // Upload cropped dish image to backend
  const handleDishCropComplete = async (croppedFile) => {
    setShowDishCropper(false);
    setDishUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', croppedFile);

      const res = await fetch(`${API_BASE_URL}/api/admin/upload-dish-image`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.image_url) {
        setDishFormData(prev => ({ ...prev, image_url: data.image_url }));
      } else {
        alert(data.detail || "Failed to upload dish image.");
      }
    } catch (err) {
      alert("Error uploading dish image.");
    } finally {
      setDishUploading(false);
    }
  };

  // Change Admin Password in MySQL Database
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 4) {
      setPwdError("New password must be at least 4 characters long.");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminSession?.admin?.username || username || 'admin',
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.detail || "Failed to update admin password.");
      } else {
        setPwdSuccess(data.message || "Admin password updated successfully in database!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPwdError(`Could not connect to backend server on ${API_BASE_URL}.`);
    } finally {
      setPwdLoading(false);
    }
  };

  // ==========================================
  // VIEW 1: ADMIN LOGIN SCREEN
  // ==========================================
  if (!adminSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFF8EE' }}>
        {/* Same website navbar style on login view */}
        <header className="header-glass">
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
            <div
              onClick={() => setActivePage('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
            >
              <img
                src="/orderunavu-logo.png"
                alt="OrderUnavu"
                style={{
                  height: '42px',
                  maxWidth: '180px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
              <span
                style={{
                  backgroundColor: '#FFEDD5',
                  color: '#C2410C',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  border: '1px solid #FED7AA'
                }}
              >
                Admin
              </span>
            </div>

            <button
              onClick={() => setActivePage('home')}
              className="btn btn-secondary"
              style={{ minHeight: '34px', padding: '4px 14px', fontSize: '0.8rem', fontWeight: 600 }}
            >
              ← Return to Website
            </button>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px 16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #F6DFCA',
              boxShadow: '0 12px 36px rgba(43, 33, 24, 0.10)',
              maxWidth: '400px',
              width: '100%',
              padding: '32px 26px',
              textAlign: 'center'
            }}
          >
            <div style={{ marginBottom: '22px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2B2118' }}>
                Admin Portal Login
              </h1>
              <p style={{ fontSize: '0.82rem', color: '#6B5E52', marginTop: '4px' }}>
                Sign in with your administrator credentials.
              </p>
            </div>

            {loginError && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #F87171',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '16px',
                  textAlign: 'left'
                }}
              >
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
                  Admin Username / Phone *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="input-field"
                  style={{ minHeight: '40px', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
                  Admin Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="input-field"
                  style={{ minHeight: '40px', fontSize: '0.88rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  minHeight: '42px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  marginTop: '4px',
                  opacity: loggingIn ? 0.7 : 1
                }}
              >
                {loggingIn ? "Signing In..." : "Sign In →"}
              </button>
            </form>

            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #F6DFCA', fontSize: '0.76rem', color: '#8A7A6D' }}>
              <span>Default credentials: <strong>admin</strong> / <strong>admin123</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtered dishes for admin table
  const filteredAdminDishes = dishes.filter(d => {
    const matchesCat = dishFilterCategory === 'All' || d.category.toLowerCase() === dishFilterCategory.toLowerCase();
    const matchesSearch = !dishSearch || d.name.toLowerCase().includes(dishSearch.toLowerCase()) || d.category.toLowerCase().includes(dishSearch.toLowerCase());
    const matchesSlot = dishFilterSlot === 'All'
      || (dishFilterSlot === 'inventory' ? d.itemType === 'inventory' : d.mealSlot === dishFilterSlot);
    return matchesCat && matchesSearch && matchesSlot;
  });

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.status.toLowerCase() === orderStatusFilter.toLowerCase();
  });

  // Filtered users
  const filteredUsers = usersList.filter(u => {
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.phone.includes(term) || (u.email && u.email.toLowerCase().includes(term));
  });

  // ==========================================
  // VIEW 2: FULL ADMIN PORTAL DASHBOARD
  // ==========================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8EE', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Navbar - Exact Website Style (Logo on Left, Logout on Right) */}
      <header className="header-glass">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          {/* Brand Logo with Admin badge */}
          <div
            onClick={() => setActivePage('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
            title="Go to Restaurant Website"
          >
            <img
              src="/orderunavu-logo.png"
              alt="OrderUnavu"
              style={{
                height: '42px',
                maxWidth: '180px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            <span
              style={{
                backgroundColor: '#FFEDD5',
                color: '#C2410C',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.72rem',
                border: '1px solid #FED7AA'
              }}
            >
              Admin
            </span>
          </div>

          {/* Right Action: Logout Button Only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleAdminLogout}
              className="btn btn-secondary"
              style={{
                minHeight: '34px',
                padding: '4px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#B91C1C',
                borderColor: '#FCA5A5',
                backgroundColor: '#FEF2F2'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Layout: Sidebar on Left, Content on Right */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        {/* Left Sidebar */}
        <aside
          style={{
            width: '240px',
            minWidth: '240px',
            position: 'sticky',
            top: '60px',
            height: 'calc(100vh - 60px)',
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #F6DFCA',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '18px 12px',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ padding: '4px 10px 8px', fontSize: '0.68rem', fontWeight: 800, color: '#8A7A6D', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Management
            </div>

            {/* Dishes */}
            <button
              onClick={() => setActiveTab('dishes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'dishes' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'dishes' ? '#FFEDD5' : 'transparent',
                color: activeTab === 'dishes' ? '#C2410C' : '#2B2118',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>🍲</span> Dishes
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  backgroundColor: activeTab === 'dishes' ? '#C2410C' : '#F6DFCA',
                  color: activeTab === 'dishes' ? '#FFFFFF' : '#6B5E52',
                  fontWeight: 600
                }}
              >
                {dishes.length}
              </span>
            </button>

            {/* Customer Orders */}
            <button
              onClick={() => {
                setActiveTab('orders');
                fetchOrders();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'orders' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'orders' ? '#FFEDD5' : 'transparent',
                color: activeTab === 'orders' ? '#C2410C' : '#2B2118',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>📦</span> Orders
              </span>
              {stats.pending_orders > 0 ? (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: '#C2410C',
                    color: '#FFFFFF',
                    fontWeight: 700
                  }}
                >
                  {stats.pending_orders}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: activeTab === 'orders' ? '#C2410C' : '#F6DFCA',
                    color: activeTab === 'orders' ? '#FFFFFF' : '#6B5E52',
                    fontWeight: 600
                  }}
                >
                  {orders.length}
                </span>
              )}
            </button>

            {/* Customers / Users */}
            <button
              onClick={() => {
                setActiveTab('users');
                fetchUsers();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'users' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'users' ? '#FFEDD5' : 'transparent',
                color: activeTab === 'users' ? '#C2410C' : '#2B2118',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>👥</span> Customers
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  backgroundColor: activeTab === 'users' ? '#C2410C' : '#F6DFCA',
                  color: activeTab === 'users' ? '#FFFFFF' : '#6B5E52',
                  fontWeight: 600
                }}
              >
                {usersList.length}
              </span>
            </button>

            {/* Hero Image */}
            <button
              onClick={() => setActiveTab('hero-settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'hero-settings' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'hero-settings' ? '#FFEDD5' : 'transparent',
                color: activeTab === 'hero-settings' ? '#C2410C' : '#2B2118',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '1rem' }}>🖼️</span> Hero Banner
            </button>

            <div style={{ padding: '14px 10px 4px', fontSize: '0.68rem', fontWeight: 800, color: '#8A7A6D', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Settings
            </div>

            {/* Password & Security */}
            <button
              onClick={() => {
                setActiveTab('security');
                setPwdSuccess('');
                setPwdError('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'security' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'security' ? '#FFEDD5' : 'transparent',
                color: activeTab === 'security' ? '#C2410C' : '#2B2118',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '1rem' }}>🔒</span> Password & Security
            </button>

            {/* System / Reset */}
            <button
              onClick={() => setActiveTab('database')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'database' ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'database' ? '#FFEDD5' : 'transparent',
                color: activeTab === 'database' ? '#C2410C' : '#2B2118',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '1rem' }}>⚙️</span> Sync Store Data
            </button>
          </div>

          {/* Bottom Sidebar Action */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #F6DFCA' }}>
            <button
              onClick={() => setActivePage('home')}
              className="btn btn-secondary"
              style={{
                width: '100%',
                minHeight: '36px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              ← Visit Store
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main
          style={{
            flex: 1,
            padding: '24px 28px',
            overflowY: 'auto',
            minWidth: 0
          }}
        >
          {/* Metric Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '12px',
              marginBottom: '18px'
            }}
          >
            <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #F6DFCA', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Dishes</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#C2410C', marginTop: '2px' }}>{stats.total_foods}</div>
              <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 600 }}>Active in Menu</span>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #F6DFCA', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Customer Orders</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2B2118', marginTop: '2px' }}>{stats.total_orders}</div>
              <span style={{ fontSize: '0.68rem', color: '#C2410C', fontWeight: 600 }}>{stats.pending_orders} Pending Action</span>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #F6DFCA', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Registered Customers</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2B2118', marginTop: '2px' }}>{stats.total_users}</div>
              <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 600 }}>Active Accounts</span>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #F6DFCA', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Revenue</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>₹{stats.total_revenue}</div>
              <span style={{ fontSize: '0.68rem', color: '#6B5E52' }}>Gross Sales</span>
            </div>
          </div>

        {/* ==================================================== */}
        {/* TAB 1: DISHES MANAGEMENT (ADD & EDIT DISHES)        */}
        {/* ==================================================== */}
        {activeTab === 'dishes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '200px' }}>
                  <input
                    type="text"
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    placeholder="Search dishes..."
                    className="input-field"
                    style={{ minHeight: '34px', paddingLeft: '30px', fontSize: '0.76rem' }}
                  />
                  <div style={{ position: 'absolute', left: '9px', top: '9px', color: '#8A7A6D' }}>
                    <SearchIcon size={13} />
                  </div>
                </div>

                {/* Filter Category */}
                <select
                  value={dishFilterCategory}
                  onChange={(e) => setDishFilterCategory(e.target.value)}
                  className="input-field"
                  style={{ minWidth: '140px', width: 'auto', minHeight: '34px', fontSize: '0.76rem', cursor: 'pointer', paddingRight: '24px' }}
                >
                  <option value="All">All Categories</option>
                  <option value="Biryani">Biryani</option>
                  <option value="Meals">Meals</option>
                  <option value="Tiffin">Tiffin</option>
                  <option value="South Indian">South Indian</option>
                  <option value="Starters">Starters</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Desserts">Desserts</option>
                </select>

                {/* Filter Timing / Type */}
                <select
                  value={dishFilterSlot}
                  onChange={(e) => setDishFilterSlot(e.target.value)}
                  className="input-field"
                  style={{ minWidth: '150px', width: 'auto', minHeight: '34px', fontSize: '0.76rem', cursor: 'pointer', paddingRight: '24px' }}
                >
                  <option value="All">All Timings / Types</option>
                  <option value="breakfast">🌅 Morning Tiffin</option>
                  <option value="lunch">☀️ Afternoon Lunch</option>
                  <option value="dinner">🌙 Night Dinner</option>
                  <option value="all_day">🕒 All-Day Cooked</option>
                  <option value="inventory">📦 Packaged / Stock</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setBulkModalOpen(true);
                    setBulkFile(null);
                    setParsedBulkItems([]);
                    setBulkErrors([]);
                    setBulkToast('');
                  }}
                  className="btn btn-secondary"
                  style={{
                    minHeight: '34px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#FFF8EE',
                    borderColor: '#FED7AA',
                    color: '#C2410C',
                    cursor: 'pointer'
                  }}
                  title="Bulk upload multiple dishes via Excel (.xlsx / .csv)"
                >
                  📊 Bulk Upload (Excel)
                </button>

                <button
                  onClick={handleOpenAddDish}
                  className="btn btn-primary"
                  style={{ minHeight: '34px', padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  <PlusIcon size={14} /> Add New Dish
                </button>
              </div>
            </div>

            {/* Dishes Table */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #F6DFCA', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FFF5E8', borderBottom: '1px solid #F6DFCA', color: '#2B2118', fontWeight: 800, fontSize: '0.69rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      <th style={{ padding: '11px 14px', minWidth: '220px' }}>Dish</th>
                      <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>Timing / Inventory</th>
                      <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>Category</th>
                      <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>Price</th>
                      <th style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>Diet</th>
                      <th style={{ padding: '11px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>Live Status</th>
                      <th style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminDishes.length > 0 ? (
                      filteredAdminDishes.map((dish) => (
                        <tr key={dish.id} style={{ borderBottom: '1px solid #FFF2DF' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={dish.image || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"}
                                alt={dish.name}
                                style={{ width: '40px', height: '40px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";
                                }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <span style={{ fontWeight: 700, color: '#2B2118', display: 'block', fontSize: '0.80rem', lineHeight: 1.25 }}>{dish.name}</span>
                                <span style={{ fontSize: '0.67rem', color: '#8A7A6D' }}>{dish.prepTime}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            {dish.itemType === 'inventory' ? (
                              <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                📦 {dish.stockQuantity !== null ? `${dish.stockQuantity} in stock` : 'Packaged'}
                              </span>
                            ) : (
                              <span style={{ backgroundColor: '#FFF2DF', color: '#C2410C', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                {dish.mealSlot === 'breakfast' && '🌅 Morning Tiffin (7-11 AM)'}
                                {dish.mealSlot === 'lunch' && '☀️ Lunch (12-3:30 PM)'}
                                {dish.mealSlot === 'dinner' && '🌙 Dinner (7-10:30 PM)'}
                                {(!dish.mealSlot || dish.mealSlot === 'all_day') && '🕒 All-Day Available'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <span style={{ backgroundColor: '#FFEDD5', color: '#C2410C', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.68rem', display: 'inline-block', whiteSpace: 'nowrap' }}>
                              {dish.category}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#2B2118', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            ₹{dish.price}
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: dish.isVeg ? '#16A34A' : '#DC2626',
                                fontWeight: 700,
                                fontSize: '0.70rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: dish.isVeg ? '#16A34A' : '#DC2626', flexShrink: 0 }} />
                              {dish.isVeg ? 'Veg' : 'Non-Veg'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(dish)}
                              title={dish.isAvailable !== false ? "Active / Available Today (Click to mark Sold Out)" : "Sold Out (Click to mark Available)"}
                              aria-label="Toggle availability"
                              style={{
                                position: 'relative',
                                width: '38px',
                                height: '21px',
                                borderRadius: '9999px',
                                backgroundColor: dish.isAvailable !== false ? '#16A34A' : '#DC2626',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                outline: 'none',
                                boxShadow: dish.isAvailable !== false ? '0 1px 4px rgba(22, 163, 74, 0.35)' : '0 1px 4px rgba(220, 38, 38, 0.35)'
                              }}
                            >
                              <span
                                style={{
                                  display: 'block',
                                  width: '17px',
                                  height: '17px',
                                  borderRadius: '50%',
                                  backgroundColor: '#FFFFFF',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                  transform: dish.isAvailable !== false ? 'translateX(17px)' : 'translateX(0px)',
                                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                            </button>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '5px' }}>
                              <button
                                onClick={() => handleOpenEditDish(dish)}
                                className="btn btn-secondary"
                                style={{ minHeight: '26px', padding: '2px 9px', fontSize: '0.70rem' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDish(dish.id, dish.name)}
                                style={{
                                  backgroundColor: '#FEE2E2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontSize: '0.70rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#8A7A6D' }}>
                          No dishes found in the menu. Use "+ Add New Dish" to add items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: CUSTOMER ORDERS (VIEW & UPDATE STATUS)       */}
        {/* ==================================================== */}
        {activeTab === 'orders' && (
          <div>
            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {['all', 'Pending', 'Preparing', 'On the Way', 'Delivered', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid #F6DFCA',
                    backgroundColor: orderStatusFilter === st ? '#C2410C' : '#FFFFFF',
                    color: orderStatusFilter === st ? '#FFFFFF' : '#2B2118'
                  }}
                >
                  {st === 'all' ? 'All Orders' : st}
                </button>
              ))}
            </div>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B5E52' }}>Loading customer orders...</div>
            ) : filteredOrders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #F6DFCA',
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2B2118' }}>
                            Order #{order.id}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#8A7A6D' }}>
                            {order.created_at ? formatDateDMY(order.created_at, true) : 'Recent'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#2B2118', marginTop: '2px' }}>
                          {order.customer_name} • <a href={`tel:${order.customer_phone}`} style={{ color: '#C2410C', textDecoration: 'none' }}>📞 {order.customer_phone}</a>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6B5E52', marginTop: '2px' }}>
                          📍 {order.delivery_address}
                        </div>
                      </div>

                      {/* Status Selector - Admin can only progress order. Cancellation is user-only */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2B2118' }}>Status:</span>
                        {order.status === 'Cancelled' ? (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              backgroundColor: '#FEE2E2',
                              color: '#B91C1C',
                              border: '1.5px solid #FCA5A5'
                            }}
                          >
                            🚫 Cancelled by Customer
                          </span>
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              border: '1.5px solid #F6DFCA',
                              backgroundColor:
                                order.status === 'Delivered' ? '#DCFCE7' :
                                order.status === 'Preparing' ? '#DBEAFE' :
                                order.status === 'On the Way' ? '#F3E8FF' : '#FEF3C7',
                              color:
                                order.status === 'Delivered' ? '#15803D' :
                                order.status === 'Preparing' ? '#1D4ED8' :
                                order.status === 'On the Way' ? '#7E22CE' : '#B45309'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Preparing">Preparing</option>
                            <option value="On the Way">On the Way</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Items list */}
                    <div style={{ backgroundColor: '#FFFDF9', padding: '10px 14px', borderRadius: '10px', border: '1px solid #FFF1DE' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B5E52', textTransform: 'uppercase' }}>Items Ordered:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                        {order.items && order.items.map((it) => (
                          <span
                            key={it.id || it.food_name}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #FED7AA',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              color: '#2B2118'
                            }}
                          >
                            {it.food_name} x {it.quantity} (₹{it.price * it.quantity})
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #F6DFCA' }}>
                        <span style={{ fontSize: '0.74rem', color: '#8A7A6D' }}>Payment Method: <strong>{order.payment_method}</strong></span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#16A34A' }}>Total: ₹{order.total_amount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#8A7A6D', border: '1px solid #F6DFCA' }}>
                No customer orders found under this filter.
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: WEBSITE USER DETAILS                          */}
        {/* ==================================================== */}
        {activeTab === 'users' && (
          <div>
            <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search customers by name or phone..."
                className="input-field"
                style={{ minHeight: '38px', fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #F6DFCA', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#FFF5E8', borderBottom: '1px solid #F6DFCA', color: '#2B2118', fontWeight: 800 }}>
                      <th style={{ padding: '12px 16px' }}>User ID</th>
                      <th style={{ padding: '12px 16px' }}>Full Name</th>
                      <th style={{ padding: '12px 16px' }}>Mobile Phone</th>
                      <th style={{ padding: '12px 16px' }}>Email Address</th>
                      <th style={{ padding: '12px 16px' }}>Orders Placed</th>
                      <th style={{ padding: '12px 16px' }}>Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #FFF2DF' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 700, color: '#8A7A6D' }}>#{u.id}</td>
                          <td style={{ padding: '10px 16px', fontWeight: 700, color: '#2B2118' }}>
                            {u.name}
                            {u.is_admin && (
                              <span style={{ marginLeft: '6px', backgroundColor: '#C2410C', color: '#FFFFFF', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px' }}>
                                ADMIN
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: '#C2410C' }}>{u.phone}</td>
                          <td style={{ padding: '10px 16px', color: '#6B5E52' }}>{u.email || '—'}</td>
                          <td style={{ padding: '10px 16px', fontWeight: 800, color: '#2B2118' }}>
                            <span style={{ backgroundColor: '#FFEDD5', color: '#C2410C', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                              {u.orders_count} orders
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', color: '#8A7A6D', fontSize: '0.78rem' }}>
                            {u.created_at ? formatDateDMY(u.created_at) : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#8A7A6D' }}>
                          No customer accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: HERO SECTION IMAGE UPLOAD                     */}
        {/* ==================================================== */}
        {activeTab === 'hero-settings' && (
          <div style={{ maxWidth: '780px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #F6DFCA', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2B2118', marginBottom: '6px' }}>
                Hero Banner Food Photo
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#6B5E52', marginBottom: '20px' }}>
                Upload an authentic food photo directly from your device to display on the Home page hero banner.
              </p>

              {heroToast && (
                <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', padding: '10px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, marginBottom: '16px' }}>
                  ✓ {heroToast}
                </div>
              )}

              {/* Current Image Preview */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '8px' }}>
                  Current Active Hero Photo (Full Width Fit on Home Page):
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '540px',
                    aspectRatio: '16 / 10',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '3px solid #FFF1DE',
                    boxShadow: 'var(--shadow-md)',
                    backgroundColor: '#FFF8EE',
                    position: 'relative'
                  }}
                >
                  {heroImage ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img
                        src={resolveImageUrl(heroImage)}
                        alt="Hero Live Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '12px',
                          right: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end'
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleEditActiveHeroImage}
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            border: '1.5px solid #C2410C',
                            color: '#C2410C',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                            backdropFilter: 'blur(4px)'
                          }}
                        >
                          ✂️ Edit / Re-Crop Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveHeroImage}
                          disabled={removingHero}
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            border: '1.5px solid #DC2626',
                            color: '#DC2626',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: removingHero ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                            backdropFilter: 'blur(4px)',
                            opacity: removingHero ? 0.7 : 1
                          }}
                        >
                          {removingHero ? 'Removing...' : '🗑️ Remove Photo'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img
                        src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"
                        alt="Default Fallback Hero Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: 'rgba(0, 0, 0, 0.65)',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.70rem',
                          fontWeight: 600,
                          backdropFilter: 'blur(4px)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        ℹ️ Default Fallback Food Photo Active
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* File Upload & Crop Section */}
              <div style={{ padding: '18px', borderRadius: '14px', backgroundColor: '#FFFDF9', border: '1.5px dashed #F6DFCA', maxWidth: '540px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '8px' }}>
                  Select Food Photo to Crop & Upload *
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroFileSelect}
                    className="input-field"
                    style={{ minHeight: '34px', padding: '4px 8px', fontSize: '0.74rem', backgroundColor: '#FFFFFF' }}
                  />

                  <p style={{ fontSize: '0.70rem', color: '#8A7A6D', margin: 0 }}>
                    💡 Tip: Vertical or horizontal phone photos can be cropped to fit the Hero Card (16:10) with 100% full container coverage.
                  </p>

                  {heroFilePreview && (
                    <div style={{ padding: '10px', backgroundColor: '#FFF8EE', borderRadius: '10px', border: '1px solid #F6DFCA' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✓ Cropped Hero Preview (Ready to Save):
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowHeroCropper(true)}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #C2410C',
                            color: '#C2410C',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ✂️ Re-adjust Crop
                        </button>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '16 / 10',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '2px solid #C2410C',
                          boxShadow: 'var(--shadow-sm)',
                          backgroundColor: '#FFF8EE'
                        }}
                      >
                        <img
                          src={heroFilePreview}
                          alt="New Upload Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      onClick={handleUploadHeroImage}
                      disabled={uploadingHero || !selectedHeroFile}
                      className="btn btn-primary"
                      style={{
                        minHeight: '36px',
                        padding: '0 22px',
                        fontSize: '0.80rem',
                        fontWeight: 700,
                        opacity: (!selectedHeroFile || uploadingHero) ? 0.6 : 1,
                        cursor: (!selectedHeroFile || uploadingHero) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {uploadingHero ? "Uploading Cropped Photo..." : "Upload & Save Hero Photo"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: STORE DATA SYNCHRONIZATION                    */}
        {/* ==================================================== */}
        {activeTab === 'database' && (
          <div style={{ maxWidth: '680px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #F6DFCA', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2B2118', marginBottom: '6px' }}>
                Store Data Synchronization
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#6B5E52', marginBottom: '18px' }}>
                Re-sync active dishes, customer orders, and registered accounts directly from database.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FFFDF9', border: '1px solid #F6DFCA' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2B2118', marginBottom: '4px' }}>
                    Sync Store Data
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#6B5E52', marginBottom: '12px' }}>
                    Refresh all dishes, customer orders, and dashboard metrics.
                  </p>
                  <button
                    onClick={() => {
                      refreshDishes();
                      fetchStats();
                      fetchOrders();
                      fetchUsers();
                      alert("Store data synchronized successfully!");
                    }}
                    className="btn btn-secondary"
                    style={{ minHeight: '36px', fontSize: '0.82rem', padding: '6px 16px' }}
                  >
                    Sync Store Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: SECURITY & PASSWORD                           */}
        {/* ==================================================== */}
        {activeTab === 'security' && (
          <div style={{ maxWidth: '680px' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #F6DFCA',
                padding: '26px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2B2118', marginBottom: '6px' }}>
                Admin Password & Security
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#6B5E52', marginBottom: '20px' }}>
                Update administrator credentials and login password.
              </p>

              {/* Admin Profile Info Card */}
              <div
                style={{
                  backgroundColor: '#FFF8EE',
                  borderRadius: '12px',
                  border: '1px solid #FED7AA',
                  padding: '16px',
                  marginBottom: '22px'
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Active Administrator Profile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#6B5E52' }}>Username: </span>
                    <strong style={{ color: '#2B2118' }}>{adminSession?.admin?.username || 'admin'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6B5E52' }}>Name: </span>
                    <strong style={{ color: '#2B2118' }}>{adminSession?.admin?.name || 'System Admin'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6B5E52' }}>Email: </span>
                    <strong style={{ color: '#2B2118' }}>{adminSession?.admin?.email || 'admin@orderunavu.com'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6B5E52' }}>Role: </span>
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>Administrator</span>
                  </div>
                </div>
              </div>

              {/* Feedback messages */}
              {pwdSuccess && (
                <div
                  style={{
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    color: '#15803D',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '18px'
                  }}
                >
                  ✅ {pwdSuccess}
                </div>
              )}

              {pwdError && (
                <div
                  style={{
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #F87171',
                    color: '#B91C1C',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '18px'
                  }}
                >
                  ⚠️ {pwdError}
                </div>
              )}

              {/* Password Change Form */}
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                    Admin Username
                  </label>
                  <input
                    type="text"
                    disabled
                    value={adminSession?.admin?.username || 'admin'}
                    className="input-field"
                    style={{ minHeight: '34px', fontSize: '0.78rem', backgroundColor: '#F9FAFB', cursor: 'not-allowed', padding: '6px 10px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                    Current Password *
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (default: admin123)"
                    className="input-field"
                    style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                      New Password *
                    </label>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      className="input-field"
                      style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                      Confirm New Password *
                    </label>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="input-field"
                      style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="show_pwd_toggle"
                    checked={showPwd}
                    onChange={(e) => setShowPwd(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#C2410C', cursor: 'pointer' }}
                  />
                  <label htmlFor="show_pwd_toggle" style={{ fontSize: '0.74rem', fontWeight: 600, color: '#2B2118', cursor: 'pointer' }}>
                    Show Passwords
                  </label>
                </div>

                <div style={{ marginTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="btn btn-primary"
                    style={{ minHeight: '34px', padding: '6px 20px', fontSize: '0.78rem' }}
                  >
                    {pwdLoading ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: '20px', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: '0.76rem', color: '#6B5E52' }}>
                ℹ️ Keep your login credentials confidential. Choose a strong password with at least 4 characters.
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT DISH (Wide 2-Column No-Scroll UI) */}
      {/* ==================================================== */}
      {dishModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(43, 33, 24, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '780px',
              width: '95%',
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: '22px 26px',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              border: '1px solid #F6DFCA'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid #FFF2DF', paddingBottom: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#2B2118', margin: 0 }}>
                  {editingDish ? `Edit Dish: ${editingDish.name}` : "Add New Dish to Menu"}
                </h2>
                <p style={{ fontSize: '0.74rem', color: '#6B5E52', margin: '2px 0 0 0' }}>
                  Fill in dish details, cooking timing, pricing, and live availability.
                </p>
              </div>
              <button
                onClick={() => setDishModalOpen(false)}
                style={{
                  background: '#FFF5E8',
                  border: '1px solid #F6DFCA',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#6B5E52'
                }}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDish}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', alignItems: 'start' }}>
                {/* LEFT COLUMN: Food Core Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={dishFormData.name}
                      onChange={(e) => setDishFormData({ ...dishFormData, name: e.target.value })}
                      placeholder="e.g. Kumbakonam Kadappa with Idli"
                      className="input-field"
                      style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                    />
                  </div>

                  {/* Item Type & Timing / Stock Selection */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                        Item Type *
                      </label>
                      <select
                        value={dishFormData.item_type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setDishFormData({
                            ...dishFormData,
                            item_type: newType,
                            category: newType === 'inventory' ? 'Drinks' : dishFormData.category
                          });
                        }}
                        className="input-field"
                        style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                      >
                        <option value="kitchen">🍲 Cooked (Kitchen)</option>
                        <option value="inventory">📦 Packaged (Stock)</option>
                      </select>
                    </div>

                    <div>
                      {dishFormData.item_type === 'kitchen' ? (
                        <div>
                          <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                            Timing Slot *
                          </label>
                          <select
                            value={dishFormData.meal_slot}
                            onChange={(e) => setDishFormData({ ...dishFormData, meal_slot: e.target.value })}
                            className="input-field"
                            style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                          >
                            <option value="breakfast">🌅 Morning (7-11 AM)</option>
                            <option value="lunch">☀️ Lunch (12-3:30 PM)</option>
                            <option value="dinner">🌙 Dinner (7-10:30 PM)</option>
                            <option value="all_day">🕒 All-Day Available</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                            Units in Stock *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={dishFormData.stock_quantity}
                            onChange={(e) => setDishFormData({ ...dishFormData, stock_quantity: e.target.value })}
                            placeholder="e.g. 25 units"
                            className="input-field"
                            style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                        Category *
                      </label>
                      <select
                        value={dishFormData.category}
                        onChange={(e) => setDishFormData({ ...dishFormData, category: e.target.value })}
                        className="input-field"
                        style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                      >
                        <option value="Biryani">Biryani</option>
                        <option value="Meals">Meals</option>
                        <option value="Tiffin">Tiffin</option>
                        <option value="South Indian">South Indian</option>
                        <option value="Starters">Starters</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={dishFormData.price}
                        onChange={(e) => setDishFormData({ ...dishFormData, price: e.target.value })}
                        placeholder="e.g. 180"
                        className="input-field"
                        style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                        Diet Type *
                      </label>
                      <select
                        value={dishFormData.is_veg ? 'true' : 'false'}
                        onChange={(e) => setDishFormData({ ...dishFormData, is_veg: e.target.value === 'true' })}
                        className="input-field"
                        style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                      >
                        <option value="true">🟢 Vegetarian</option>
                        <option value="false">🔴 Non-Vegetarian</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                        Prep Time
                      </label>
                      <input
                        type="text"
                        value={dishFormData.prep_time}
                        onChange={(e) => setDishFormData({ ...dishFormData, prep_time: e.target.value })}
                        placeholder="e.g. 15-20 mins"
                        className="input-field"
                        style={{ minHeight: '34px', fontSize: '0.78rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Photo, Description & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                      Dish Photo (Optional - Defaults to Hero Image)
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDishFileSelect}
                        className="input-field"
                        style={{ minHeight: '34px', padding: '4px 8px', fontSize: '0.74rem', cursor: 'pointer' }}
                      />
                      {dishUploading && (
                        <span style={{ fontSize: '0.68rem', color: '#C2410C', fontWeight: 600 }}>
                          Uploading dish image to server...
                        </span>
                      )}
                      {!dishFormData.image_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', backgroundColor: '#FFF8EE', borderRadius: '8px', border: '1px dashed #FED7AA' }}>
                          <img
                            src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"
                            alt="Hero Fallback"
                            style={{ width: '32px', height: '32px', borderRadius: '5px', objectFit: 'cover' }}
                          />
                          <span style={{ fontSize: '0.66rem', color: '#6B5E52' }}>
                            No photo chosen. <strong>Hero section fallback food image</strong> will be used automatically.
                          </span>
                        </div>
                      )}
                      {dishFormData.image_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', backgroundColor: '#FFF5E8', borderRadius: '8px', border: '1px solid #F6DFCA' }}>
                          <img
                            src={resolveImageUrl(dishFormData.image_url)}
                            alt="Dish Preview"
                            style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #E5D5C5', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.70rem', fontWeight: 600, color: '#15803D' }}>
                              ✓ Photo Uploaded
                            </div>
                            <div style={{ fontSize: '0.64rem', color: '#8A7A6D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {dishFormData.image_url.split('/').pop()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={handleEditExistingDishImage}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #C2410C',
                                color: '#C2410C',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                cursor: 'pointer',
                                fontSize: '0.68rem',
                                fontWeight: 700
                              }}
                            >
                              ✂️ Crop
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveDishImage}
                              style={{
                                background: '#FEE2E2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                borderRadius: '6px',
                                padding: '2px 8px',
                                cursor: 'pointer',
                                fontSize: '0.68rem',
                                fontWeight: 700
                              }}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.70rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '2px' }}>
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={dishFormData.description}
                      onChange={(e) => setDishFormData({ ...dishFormData, description: e.target.value })}
                      placeholder="Traditional authentic preparation description..."
                      className="input-field"
                      style={{ minHeight: '52px', fontSize: '0.78rem', padding: '6px 10px' }}
                    />
                  </div>

                  <div style={{ padding: '8px 10px', backgroundColor: '#FFFDF9', borderRadius: '8px', border: '1px solid #F6DFCA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="dish_available_cb"
                        checked={dishFormData.is_available}
                        onChange={(e) => setDishFormData({ ...dishFormData, is_available: e.target.checked })}
                        style={{ width: '15px', height: '15px', accentColor: '#C2410C', cursor: 'pointer' }}
                      />
                      <label htmlFor="dish_available_cb" style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2B2118', cursor: 'pointer' }}>
                        {dishFormData.item_type === 'kitchen'
                          ? "🟢 Available Today (Cooked & Ready)"
                          : "🟢 In Stock & Ready for Ordering"}
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setDishModalOpen(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, minHeight: '34px', fontSize: '0.78rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingDish}
                      className="btn btn-primary"
                      style={{ flex: 1, minHeight: '34px', fontSize: '0.78rem' }}
                    >
                      {savingDish ? "Saving..." : editingDish ? "Update Dish" : "Create Dish"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================================================== */}
      {/* MODAL: IMAGE CROPPER & FRAMING TOOL                  */}
      {/* ==================================================== */}
      {showHeroCropper && rawHeroSourceUrl && (
        <ImageCropperModal
          imageSrc={rawHeroSourceUrl}
          fileName={rawHeroFileName}
          onCropComplete={handleHeroCropComplete}
          onClose={() => setShowHeroCropper(false)}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL: DISH IMAGE CROPPER & FRAMING TOOL             */}
      {/* ==================================================== */}
      {showDishCropper && rawDishSourceUrl && (
        <ImageCropperModal
          imageSrc={rawDishSourceUrl}
          fileName={rawDishFileName}
          onCropComplete={handleDishCropComplete}
          onClose={() => setShowDishCropper(false)}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL: EXCEL BULK DISHES UPLOAD & FORMAT DOWNLOAD    */}
      {/* ==================================================== */}
      {bulkModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(43, 33, 24, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
              border: '1.5px solid #F6DFCA',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #FFF1DE', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2B2118', margin: 0 }}>
                  📊 Bulk Upload Dishes via Excel
                </h3>
                <p style={{ fontSize: '0.80rem', color: '#6B5E52', margin: '3px 0 0 0' }}>
                  Quickly import multiple dishes to your menu using an Excel (.xlsx / .xls) or CSV spreadsheet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="btn-icon"
                style={{ width: '32px', height: '32px', border: '1px solid #F6DFCA' }}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Template Download Banner */}
            <div
              style={{
                backgroundColor: '#FFF8EE',
                border: '1.5px solid #FED7AA',
                borderRadius: '14px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#C2410C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📥 Download Excel Template Format
                </span>
              </div>
              <button
                type="button"
                onClick={downloadDishesTemplateXLSX}
                className="btn btn-primary"
                style={{
                  padding: '7px 16px',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                📥 Download Template (.xlsx)
              </button>
            </div>

            {/* File Upload Dotted Zone */}
            <div
              onClick={() => bulkFileInputRef.current?.click()}
              style={{
                border: '2px dashed #C2410C',
                borderRadius: '16px',
                padding: '24px 16px',
                backgroundColor: '#FFFDF9',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF8EE')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFDF9')}
            >
              <input
                ref={bulkFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleBulkFileChange}
              />
              <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>📁</div>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#2B2118', margin: '0 0 4px 0' }}>
                {bulkFile ? bulkFile.name : "Click to select or drop your Excel / CSV file"}
              </p>
              <p style={{ fontSize: '0.76rem', color: '#8A7A6D', margin: 0 }}>
                {bulkFile
                  ? `${(bulkFile.size / 1024).toFixed(1)} KB • Click to choose a different file`
                  : "Supports .xlsx, .xls, and .csv files"}
              </p>
            </div>

            {/* Parsing State */}
            {bulkParsing && (
              <div style={{ textAlign: 'center', padding: '12px', color: '#C2410C', fontSize: '0.84rem', fontWeight: 600 }}>
                ⏳ Reading and validating Excel spreadsheet...
              </div>
            )}

            {/* Toast Alerts */}
            {bulkToast && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backgroundColor: bulkToast.startsWith('✓') ? '#DCFCE7' : '#FEF3C7',
                  color: bulkToast.startsWith('✓') ? '#15803D' : '#B45309',
                  border: `1px solid ${bulkToast.startsWith('✓') ? '#86EFAC' : '#FCD34D'}`
                }}
              >
                {bulkToast}
              </div>
            )}

            {/* Error List */}
            {bulkErrors.length > 0 && (
              <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '10px 14px', fontSize: '0.78rem', color: '#B91C1C' }}>
                <strong>⚠️ Warnings / Errors:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {bulkErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {bulkErrors.length > 5 && <li>...and {bulkErrors.length - 5} more issues</li>}
                </ul>
              </div>
            )}

            {/* Live Parsed Dishes Preview Table */}
            {parsedBulkItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#2B2118' }}>
                    Preview of Dishes to Import ({parsedBulkItems.length})
                  </span>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>
                    ✓ Ready to upload
                  </span>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #F6DFCA', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#FFF5E8', borderBottom: '1px solid #F6DFCA', color: '#6B5E52', fontWeight: 700 }}>
                        <th style={{ padding: '8px 10px' }}>Dish Name</th>
                        <th style={{ padding: '8px 10px' }}>Category</th>
                        <th style={{ padding: '8px 10px' }}>Price</th>
                        <th style={{ padding: '8px 10px' }}>Diet</th>
                        <th style={{ padding: '8px 10px' }}>Slot</th>
                        <th style={{ padding: '8px 10px' }}>Type</th>
                        <th style={{ padding: '8px 10px' }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedBulkItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #FFF1DE' }}>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#2B2118' }}>{item.name}</td>
                          <td style={{ padding: '7px 10px', color: '#6B5E52' }}>{item.category}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 700, color: '#C2410C' }}>₹{item.price}</td>
                          <td style={{ padding: '7px 10px' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: item.is_veg ? '#15803D' : '#B91C1C' }}>
                              {item.is_veg ? "Veg" : "Non-Veg"}
                            </span>
                          </td>
                          <td style={{ padding: '7px 10px', color: '#6B5E52' }}>{item.meal_slot}</td>
                          <td style={{ padding: '7px 10px', color: '#6B5E52' }}>{item.item_type}</td>
                          <td style={{ padding: '7px 10px', color: '#6B5E52' }}>{item.stock_quantity ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #FFF1DE', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="btn btn-secondary"
                disabled={bulkUploading}
                style={{ padding: '7px 16px', fontSize: '0.80rem' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkUpload}
                disabled={bulkUploading || parsedBulkItems.length === 0}
                className="btn btn-primary"
                style={{
                  padding: '7px 20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  opacity: parsedBulkItems.length === 0 ? 0.6 : 1,
                  cursor: parsedBulkItems.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {bulkUploading ? "Uploading to Menu..." : `Confirm & Upload ${parsedBulkItems.length} Dishes`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

