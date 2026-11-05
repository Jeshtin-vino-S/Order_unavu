import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL, resolveImageUrl } from '../config/api';
import {
  UserIcon,
  CheckCircleIcon,
  PhoneIcon,
  ArrowRightIcon
} from './Icons';

export const ProfilePage = () => {
  const {
    user,
    setUser,
    setActivePage,
    setAuthModalOpen,
    setAuthModalMessage
  } = useCart();

  // Personal Details state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Change state (Completely separate from Personal Details)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state whenever user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setProfileImage(user.profile_image || '');
      setIsEditingProfile(false);
      setShowPasswordForm(false);
      setProfileError('');
      setProfileSuccess('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setPasswordSuccess('');
    }
  }, [user]);

  // Cancel Personal Details editing
  const handleCancelEditProfile = () => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
    setProfileError('');
    setIsEditingProfile(false);
  };

  // Cancel Password change
  const handleCancelPasswordChange = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordForm(false);
  };

  // Avatar file upload
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setUploadingPhoto(true);
    setProfileError('');
    setProfileSuccess('');

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
          // Persist immediately to user profile in DB
          if (user && user.id) {
            await fetch(`${API_BASE_URL}/api/auth/profile/${user.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profile_image: data.image_url })
            });
            setUser(prev => ({ ...prev, profile_image: data.image_url }));
            setProfileSuccess("Profile picture updated!");
          }
        }
      } else {
        const errorData = await res.json();
        setProfileError(errorData.detail || "Failed to upload photo. Please try again.");
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setProfileImage('');
    if (user && user.id) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/profile/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_image: "" })
        });
        setUser(prev => ({ ...prev, profile_image: null }));
        setProfileSuccess("Profile picture removed!");
      } catch (e) {}
    }
  };

  // Save Personal Details (Only Name, Phone, Email)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError("Full name is required.");
      return;
    }

    if (!phone.trim() || phone.trim().length < 10) {
      setProfileError("Valid 10-digit mobile number is required.");
      return;
    }

    setSavingProfile(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null
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

      setUser(prev => ({
        ...prev,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        profile_image: updatedUser.profile_image,
        isLoggedIn: true
      }));

      setProfileSuccess("Personal details updated successfully!");
      setIsEditingProfile(false);
    } catch (err) {
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setUser(prev => ({
          ...prev,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          isLoggedIn: true
        }));
        setProfileSuccess("Personal details saved locally!");
        setIsEditingProfile(false);
      } else {
        setProfileError(err.message);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // Separate Password Change Handler (Checks old password against DB before saving)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setPasswordError("New password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setUpdatingPassword(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to update password.");
      }

      setPasswordSuccess("Password changed successfully! Your new password is now active.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || "Failed to change password. Please check current password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage('home');
  };

  // If user is not logged in
  if (!user) {
    return (
      <div style={{ padding: '60px 20px', minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '22px',
            border: '1.5px solid #F6DFCA',
            padding: '44px 28px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(43, 33, 24, 0.06)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#FFEDD5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <UserIcon size={32} color="#C2410C" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2B2118', marginBottom: '8px' }}>
            Sign In to View Profile
          </h2>
          <p style={{ color: '#6B5E52', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '22px' }}>
            Please log in with your phone number to manage your personal details, profile picture, and account settings.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setAuthModalMessage("Please log in to access your profile.");
                setAuthModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 22px', fontSize: '0.88rem' }}
            >
              Sign In / Login
            </button>
            <button
              onClick={() => setActivePage('menu')}
              className="btn btn-secondary"
              style={{ padding: '8px 20px', fontSize: '0.88rem' }}
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 0 60px 0', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Your Account
            </span>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.95rem)', fontWeight: 800, color: '#2B2118', lineHeight: 1.2 }}>
              Profile & Account Settings
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#6B5E52', marginTop: '3px' }}>
              Manage your personal information, profile picture & password
            </p>
          </div>

          <button
            onClick={() => setActivePage('home')}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Home
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Avatar & Account Summary Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '22px',
              border: '1.5px solid #F6DFCA',
              padding: '28px 22px',
              boxShadow: '0 4px 20px rgba(43, 33, 24, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            {/* Avatar Image with Camera Badge */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              {profileImage ? (
                <img
                  src={resolveImageUrl(profileImage)}
                  alt={name || "Profile"}
                  style={{
                    width: '105px',
                    height: '105px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3.5px solid #C2410C',
                    boxShadow: '0 6px 16px rgba(194, 65, 12, 0.22)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '105px',
                    height: '105px',
                    borderRadius: '50%',
                    backgroundColor: '#FFEDD5',
                    color: '#C2410C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    border: '3px dashed #FED7AA'
                  }}
                >
                  {name ? name.trim().charAt(0).toUpperCase() : <UserIcon size={46} color="#C2410C" />}
                </div>
              )}

              {/* Camera Icon Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Upload Profile Picture"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  backgroundColor: '#C2410C',
                  color: '#FFFFFF',
                  border: '2.5px solid #FFFFFF',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  fontSize: '0.9rem'
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

            {/* Change / Remove Photo Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={{
                  backgroundColor: '#FFF8EE',
                  border: '1px solid #FED7AA',
                  color: '#C2410C',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                {uploadingPhoto ? "Uploading..." : "Upload New Photo"}
              </button>

              {profileImage && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    backgroundColor: '#FFF8EE',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    fontSize: '0.76rem',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Name & Phone */}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2B2118', marginBottom: '4px' }}>
              {user.name}
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#6B5E52', margin: '0 0 16px 0' }}>
              +91 {user.phone}
            </p>

            {/* Quick Action Navigation Buttons */}
            <div style={{ width: '100%', borderTop: '1px solid #FFF1DE', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setActivePage('order-details')}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  minHeight: '40px',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                🛍️ View Your Orders <ArrowRightIcon size={15} />
              </button>

              <button
                onClick={() => setActivePage('wishlist')}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  minHeight: '38px',
                  fontSize: '0.84rem'
                }}
              >
                ❤️ Saved in Wishlist
              </button>

              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  minHeight: '38px',
                  fontSize: '0.82rem',
                  color: '#DC2626',
                  borderColor: '#FCA5A5',
                  marginTop: '4px'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Right Column: Personal Details Card & Dedicated Change Password Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* CARD 1: PERSONAL DETAILS */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '22px',
                border: '1.5px solid #F6DFCA',
                padding: '26px 24px',
                boxShadow: '0 4px 20px rgba(43, 33, 24, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2B2118', margin: 0 }}>
                    Personal Details
                  </h3>
                  <p style={{ fontSize: '0.80rem', color: '#6B5E52', margin: '2px 0 0 0' }}>
                    Your contact information and profile identity
                  </p>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(true);
                      setProfileError('');
                      setProfileSuccess('');
                    }}
                    className="btn btn-secondary"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#FFF8EE',
                      borderColor: '#FED7AA',
                      color: '#C2410C',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Edit Details
                  </button>
                )}
              </div>

              {/* Feedback Alerts for Personal Details */}
              {profileError && (
                <div
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#B91C1C',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    border: '1px solid #FCA5A5'
                  }}
                >
                  ⚠️ {profileError}
                </div>
              )}

              {profileSuccess && (
                <div
                  style={{
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginBottom: '16px',
                    border: '1px solid #86EFAC',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircleIcon size={16} color="#15803D" /> {profileSuccess}
                </div>
              )}

              {!isEditingProfile ? (
                /* Clean Read-Only Info View (No locked badges, just clean details) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      backgroundColor: '#FFFDF9',
                      border: '1px solid #F6DFCA',
                      borderRadius: '12px',
                      padding: '12px 16px'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#8A7A6D', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block' }}>
                      Full Name
                    </span>
                    <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#2B2118', marginTop: '2px', display: 'block' }}>
                      {user.name}
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#FFFDF9',
                      border: '1px solid #F6DFCA',
                      borderRadius: '12px',
                      padding: '12px 16px'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#8A7A6D', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block' }}>
                      Mobile Number
                    </span>
                    <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#2B2118', marginTop: '2px', display: 'block' }}>
                      +91 {user.phone}
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#FFFDF9',
                      border: '1px solid #F6DFCA',
                      borderRadius: '12px',
                      padding: '12px 16px'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#8A7A6D', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block' }}>
                      Email Address
                    </span>
                    <span style={{ fontSize: '0.96rem', fontWeight: 600, color: user.email ? '#2B2118' : '#A39282', marginTop: '2px', display: 'block' }}>
                      {user.email || 'No email address added'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Editable Form (Triggered only when clicking Edit Details) */
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      placeholder="Your full name"
                      style={{ minHeight: '40px', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
                      Mobile Number (10 digits) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.88rem', color: '#6B5E52', fontWeight: 600 }}>
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
                        style={{ paddingLeft: '44px', minHeight: '40px', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="name@example.com"
                      style={{ minHeight: '40px', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleCancelEditProfile}
                      disabled={savingProfile}
                      className="btn btn-secondary"
                      style={{ flex: '1 1 110px', minHeight: '40px', fontSize: '0.86rem', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="btn btn-primary"
                      style={{
                        flex: '2 1 180px',
                        minHeight: '40px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(194, 65, 12, 0.22)'
                      }}
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* CARD 2: DEDICATED CHANGE PASSWORD */}
            {!showPasswordForm ? (
              /* Collapsed State: Clean Card with "Change Password" Button */
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '22px',
                  border: '1.5px solid #F6DFCA',
                  padding: '22px 24px',
                  boxShadow: '0 4px 20px rgba(43, 33, 24, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2B2118', margin: 0 }}>
                    Change Password
                  </h3>
                  <p style={{ fontSize: '0.80rem', color: '#6B5E52', margin: '3px 0 0 0' }}>
                    Keep your account secure by setting a new password
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(true);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#FFF8EE',
                    borderColor: '#FED7AA',
                    color: '#C2410C',
                    cursor: 'pointer'
                  }}
                >
                  🔑 Change Password
                </button>
              </div>
            ) : (
              /* Expanded State: Password Change Form */
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '22px',
                  border: '1.5px solid #F6DFCA',
                  padding: '26px 24px',
                  boxShadow: '0 4px 20px rgba(43, 33, 24, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2B2118', margin: 0 }}>
                      Change Password
                    </h3>
                    <p style={{ fontSize: '0.80rem', color: '#6B5E52', margin: '2px 0 0 0' }}>
                      Enter your current password to verify your account, then set a new password
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelPasswordChange}
                    className="btn btn-secondary"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {/* Feedback Alerts for Password Change */}
                {passwordError && (
                  <div
                    style={{
                      backgroundColor: '#FEE2E2',
                      color: '#B91C1C',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      marginBottom: '16px',
                      border: '1px solid #FCA5A5'
                    }}
                  >
                    ⚠️ {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div
                    style={{
                      backgroundColor: '#DCFCE7',
                      color: '#15803D',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      marginBottom: '16px',
                      border: '1px solid #86EFAC',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircleIcon size={16} color="#15803D" /> {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Current Password (User enters it, never fetched) */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-field"
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      style={{ minHeight: '40px', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
                      New Password (min 4 characters) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      style={{ minHeight: '40px', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '4px' }}>
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      style={{ minHeight: '40px', fontSize: '0.88rem' }}
                    />
                  </div>

                  {/* Submit & Cancel Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleCancelPasswordChange}
                      disabled={updatingPassword}
                      className="btn btn-secondary"
                      style={{ flex: '1 1 100px', minHeight: '42px', fontSize: '0.86rem', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="btn btn-primary"
                      style={{
                        flex: '2 1 180px',
                        minHeight: '42px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(194, 65, 12, 0.2)'
                      }}
                    >
                      {updatingPassword ? "Verifying with Database..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
