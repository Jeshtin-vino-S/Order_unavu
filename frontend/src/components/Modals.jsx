import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL, resolveImageUrl } from '../config/api';
import { CloseIcon, UserIcon, CheckCircleIcon, ShieldCheckIcon } from './Icons';

export const LoginModal = ({ isOpen, onClose }) => {
  const { user, setUser, authModalMessage, setActivePage, setProfileModalOpen } = useCart();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!phone.trim() || phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }
    if (isRegisterMode && !name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setLoading(true);

    const endpoint = isRegisterMode
      ? `${API_BASE_URL}/api/auth/register`
      : `${API_BASE_URL}/api/auth/login`;

    const payload = isRegisterMode
      ? { name: name.trim(), phone: phone.trim(), email: email.trim() || null, password: password.trim() }
      : { phone: phone.trim(), password: password.trim() };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed. Please check your credentials.");
      }

      // Success
      setUser({
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        isLoggedIn: true
      });

      setSuccessMessage(isRegisterMode ? "Account created successfully!" : "Logged in successfully!");
      setTimeout(() => {
        onClose();
        setName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setSuccessMessage("");
      }, 700);
    } catch (err) {
      // If backend is offline or network error, provide graceful local account fallback
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setUser({
          id: Date.now(),
          name: name.trim() || "Customer",
          phone: phone.trim(),
          email: email.trim() || null,
          isLoggedIn: true
        });
        setSuccessMessage("Logged in! (Local Mode)");
        setTimeout(() => {
          onClose();
          setName("");
          setPhone("");
          setEmail("");
          setPassword("");
          setSuccessMessage("");
        }, 700);
      } else {
        setErrorMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    onClose();
  };

  return (
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
          borderRadius: '18px',
          maxWidth: '380px',
          width: '100%',
          padding: '24px 22px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          border: '1px solid #F6DFCA'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6B5E52'
          }}
        >
          <CloseIcon size={20} />
        </button>

        {/* If user is already logged in: View Profile / Logout */}
        {user ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: '#FFEDD5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px auto'
                }}
              >
                <UserIcon size={24} color="#C2410C" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2B2118' }}>
                Your Account
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6B5E52' }}>
                Logged in. Your orders and wishlist are synced.
              </p>
            </div>

            <div style={{ backgroundColor: '#FFF8EE', padding: '14px', borderRadius: '12px', border: '1px solid #F6DFCA', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#2B2118' }}>{user.name}</p>
              <p style={{ fontSize: '0.82rem', color: '#6B5E52' }}>+91 {user.phone}</p>
              {user.email && <p style={{ fontSize: '0.78rem', color: '#8C7E72' }}>{user.email}</p>}
            </div>

            {/* Orders Button for Logged-in User */}
            <button
              onClick={() => {
                onClose();
                setActivePage('order-details');
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                minHeight: '40px',
                fontSize: '0.88rem',
                fontWeight: 700,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              🛍️ Orders
            </button>

            {/* Account Settings / Profile Page */}
            <button
              onClick={() => {
                onClose();
                setActivePage('profile');
              }}
              className="btn btn-secondary"
              style={{
                width: '100%',
                minHeight: '40px',
                fontSize: '0.88rem',
                fontWeight: 700,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              ⚙️ Account Settings
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ width: '100%', minHeight: '38px', color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div>
            {/* Context Prompt Message (e.g. When adding dish without login) */}
            {authModalMessage && (
              <div
                style={{
                  backgroundColor: '#FFEDD5',
                  color: '#C2410C',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginBottom: '14px',
                  border: '1px solid #FED7AA'
                }}
              >
                🔒 {authModalMessage}
              </div>
            )}

            {/* Toggle Tabs: Sign In / Create Account */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#FFF8EE',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #F6DFCA',
                marginBottom: '16px'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: !isRegisterMode ? 700 : 500,
                  backgroundColor: !isRegisterMode ? '#FFFFFF' : 'transparent',
                  color: !isRegisterMode ? '#C2410C' : '#6B5E52',
                  boxShadow: !isRegisterMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: isRegisterMode ? 700 : 500,
                  backgroundColor: isRegisterMode ? '#FFFFFF' : 'transparent',
                  color: isRegisterMode ? '#C2410C' : '#6B5E52',
                  boxShadow: isRegisterMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                New Account
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2B2118' }}>
                {isRegisterMode ? "Create an Account" : "Welcome Back"}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6B5E52' }}>
                {isRegisterMode
                  ? "Sign up to order food and save dishes to wishlist."
                  : "Sign in with your mobile number to continue."}
              </p>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '12px' }}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '12px', fontWeight: 600 }}>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isRegisterMode && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '3px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karthik"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    style={{ minHeight: '38px', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '3px' }}>
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  style={{ minHeight: '38px', fontSize: '0.85rem' }}
                />
              </div>

              {isRegisterMode && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '3px' }}>
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{ minHeight: '38px', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '3px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ minHeight: '38px', fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  minHeight: '40px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginTop: '8px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Processing..." : isRegisterMode ? "Sign Up & Login" : "Sign In"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Password fields
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = React.useRef(null);

  // Sync state whenever modal opens or user changes
  React.useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setProfileImage(user.profile_image || '');
      setChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Handle avatar image file select & upload
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setUploadingPhoto(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/upload-avatar`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.image_url) {
          setProfileImage(data.image_url);
        }
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.detail || "Failed to upload photo. Please try again.");
      }
    } catch (err) {
      // Local preview fallback if backend network is unreachable
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage("Valid 10-digit mobile number is required.");
      return;
    }

    if (changePassword) {
      if (!currentPassword) {
        setErrorMessage("Please enter your current password.");
        return;
      }
      if (!newPassword || newPassword.length < 4) {
        setErrorMessage("New password must be at least 4 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("New password and confirm password do not match.");
        return;
      }
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      profile_image: profileImage || null,
      current_password: changePassword ? currentPassword : null,
      new_password: changePassword ? newPassword.trim() : null
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update profile.");
      }

      const updatedUser = await res.json();

      // Update state in CartContext
      setUser(prev => ({
        ...prev,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        profile_image: updatedUser.profile_image,
        isLoggedIn: true
      }));

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      // Offline/Local Mode fallback update
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setUser(prev => ({
          ...prev,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          profile_image: profileImage || null,
          isLoggedIn: true
        }));
        setSuccessMessage("Profile updated! (Local Mode)");
        setTimeout(() => {
          onClose();
        }, 700);
      } else {
        setErrorMessage(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
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
          borderRadius: '20px',
          maxWidth: '460px',
          width: '100%',
          padding: '24px 22px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          border: '1.5px solid #F6DFCA',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6B5E52'
          }}
          title="Close"
        >
          <CloseIcon size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2B2118', marginBottom: '4px' }}>
            Account Settings
          </h3>
          <p style={{ fontSize: '0.80rem', color: '#6B5E52' }}>
            Update your personal details, profile picture & password
          </p>
        </div>

        {/* Profile Picture Uploader Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            {profileImage ? (
              <img
                src={resolveImageUrl(profileImage)}
                alt={name || "Profile"}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #C2410C',
                  boxShadow: '0 4px 12px rgba(194, 65, 12, 0.2)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  backgroundColor: '#FFEDD5',
                  color: '#C2410C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  border: '2px dashed #FED7AA'
                }}
              >
                {name ? name.trim().charAt(0).toUpperCase() : <UserIcon size={36} color="#C2410C" />}
              </div>
            )}

            {/* Camera Overlay Badge Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Upload profile picture"
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                backgroundColor: '#C2410C',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              📷
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarFileSelect}
          />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              style={{
                background: 'none',
                border: 'none',
                color: '#C2410C',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {uploadingPhoto ? "Uploading..." : "Change Photo"}
            </button>

            {profileImage && (
              <>
                <span style={{ color: '#F6DFCA' }}>•</span>
                <button
                  type="button"
                  onClick={() => setProfileImage('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.80rem',
              fontWeight: 600,
              marginBottom: '16px',
              border: '1px solid #FCA5A5'
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.80rem',
              fontWeight: 700,
              marginBottom: '16px',
              border: '1px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircleIcon size={16} color="#15803D" /> {successMessage}
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Your name"
              style={{ minHeight: '38px', fontSize: '0.86rem' }}
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
              Mobile Number (10 digits) *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.86rem', color: '#6B5E52', fontWeight: 600 }}>
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="input-field"
                placeholder="9876543210"
                style={{ paddingLeft: '44px', minHeight: '38px', fontSize: '0.86rem' }}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="e.g. karthik@example.com"
              style={{ minHeight: '38px', fontSize: '0.86rem' }}
            />
          </div>

          {/* Change Password Checkbox / Accordion */}
          <div
            style={{
              backgroundColor: '#FFF8EE',
              border: '1px solid #F6DFCA',
              borderRadius: '12px',
              padding: '12px',
              marginTop: '4px'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', margin: 0 }}>
              <input
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                style={{ accentColor: '#C2410C', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2B2118' }}>
                Change Password
              </span>
            </label>

            {changePassword && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #FED7AA' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#6B5E52', display: 'block', marginBottom: '3px' }}>
                    Current Password *
                  </label>
                  <input
                    type="password"
                    required={changePassword}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter current password"
                    style={{ minHeight: '36px', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#6B5E52', display: 'block', marginBottom: '3px' }}>
                    New Password (min 4 characters) *
                  </label>
                  <input
                    type="password"
                    required={changePassword}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="New password"
                    style={{ minHeight: '36px', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#6B5E52', display: 'block', marginBottom: '3px' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required={changePassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Confirm new password"
                    style={{ minHeight: '36px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '40px', fontSize: '0.86rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: 2, minHeight: '40px', fontSize: '0.88rem', fontWeight: 700 }}
            >
              {saving ? "Saving Changes..." : "Save Profile Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


