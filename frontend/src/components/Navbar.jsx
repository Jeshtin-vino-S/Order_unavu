import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../config/api';
import { CartIcon, HeartIcon, UserIcon, MenuIcon, CloseIcon } from './Icons';

export const Navbar = ({ activePage, setActivePage, onOpenAuth }) => {
  const { cartItemCount, wishlist, user, setUser, setProfileModalOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Clean nav items - NO track order in navbar as requested
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (id) => {
    if (id === 'how-it-works') {
      setActivePage('home');
      setTimeout(() => {
        const el = document.getElementById('how-it-works-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (id === 'contact') {
      setActivePage('home');
      setTimeout(() => {
        const el = document.getElementById('footer-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setActivePage(id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="header-glass">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        {/* Brand Logo Only */}
        <div
          onClick={() => setActivePage('home')}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
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
        </div>

        {/* Desktop Nav Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '24px' }} className="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.86rem',
                fontWeight: activePage === item.id ? 700 : 500,
                color: activePage === item.id ? '#C2410C' : '#2B2118',
                cursor: 'pointer',
                padding: '6px 2px',
                position: 'relative',
                transition: 'color 0.15s ease'
              }}
            >
              {item.label}
              {activePage === item.id && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    backgroundColor: '#C2410C',
                    borderRadius: '9999px'
                  }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Wishlist Button */}
          <button
            onClick={() => setActivePage('wishlist')}
            className="btn-icon"
            aria-label="Wishlist"
            style={{
              backgroundColor: activePage === 'wishlist' ? '#FFEDD5' : '#FFFFFF',
              border: '1px solid #F6DFCA',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <HeartIcon filled={activePage === 'wishlist'} size={18} color="#C2410C" />
            {wishlist.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: '#C2410C',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '17px',
                  height: '17px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(194, 65, 12, 0.4)'
                }}
              >
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => setActivePage('cart')}
            className="btn btn-primary"
            style={{
              minHeight: '38px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              position: 'relative'
            }}
          >
            <CartIcon size={18} color="#FFFFFF" />
            {cartItemCount > 0 && (
              <span
                style={{
                  backgroundColor: '#2B2118',
                  color: '#FFF8EE',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  marginLeft: '2px'
                }}
              >
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Login / User Button with Dropdown when logged in */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                if (user) {
                  setUserDropdownOpen(!userDropdownOpen);
                } else {
                  onOpenAuth();
                }
              }}
              className="btn btn-secondary"
              style={{
                minHeight: '38px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                display: 'none',
                alignItems: 'center',
                gap: '6px'
              }}
              id="desktop-login-btn"
            >
              {user && user.profile_image ? (
                <img
                  src={resolveImageUrl(user.profile_image)}
                  alt={user.name}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <UserIcon size={16} color="#C2410C" />
              )}
              <span>{user ? user.name.split(' ')[0] : 'Login'}</span>
              {user && <span style={{ fontSize: '0.65rem', marginLeft: '2px' }}>▼</span>}
            </button>

            {/* Desktop User Dropdown Menu */}
            {user && userDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #F6DFCA',
                  borderRadius: '14px',
                  boxShadow: '0 8px 24px rgba(43, 33, 24, 0.12)',
                  minWidth: '220px',
                  zIndex: 100,
                  overflow: 'hidden',
                  padding: '6px 0'
                }}
              >
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #FFF1DE', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {user.profile_image ? (
                    <img
                      src={resolveImageUrl(user.profile_image)}
                      alt={user.name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #C2410C', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFEDD5', color: '#C2410C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, flexShrink: 0 }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#2B2118', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.name}
                    </p>
                    <p style={{ fontSize: '0.74rem', color: '#8A7A6D', margin: 0 }}>
                      +91 {user.phone}
                    </p>
                  </div>
                </div>

                {/* Orders option */}
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setActivePage('order-details');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#C2410C',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF8EE')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  🛍️ Orders
                </button>

                {/* Account Settings / Profile Page */}
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setActivePage('profile');
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#2B2118',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FFF8EE')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  ⚙️ Account Settings
                </button>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setUser(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.82rem',
                    color: '#DC2626',
                    cursor: 'pointer',
                    borderTop: '1px solid #FFF1DE'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon mobile-menu-btn"
            aria-label="Toggle Mobile Menu"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #F6DFCA',
              cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <CloseIcon size={20} color="#2B2118" /> : <MenuIcon size={20} color="#2B2118" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#FFF8EE',
            borderBottom: '2px solid #F6DFCA',
            padding: '12px 16px',
            boxShadow: '0 8px 20px rgba(43, 33, 24, 0.1)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  textAlign: 'left',
                  background: activePage === item.id ? '#FFEDD5' : 'none',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: activePage === item.id ? 700 : 500,
                  color: activePage === item.id ? '#C2410C' : '#2B2118',
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}

            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F6DFCA', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {user ? (
                <>
                  {/* Orders button directly in mobile menu when logged in */}
                  <button
                    onClick={() => {
                      setActivePage('order-details');
                      setMobileMenuOpen(false);
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', minHeight: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    🛍️ Orders
                  </button>
                  <button
                    onClick={() => {
                      setActivePage('profile');
                      setMobileMenuOpen(false);
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', minHeight: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {user.profile_image ? (
                      <img src={resolveImageUrl(user.profile_image)} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <UserIcon size={16} color="#C2410C" />
                    )}
                    <span>{user.name} (Account Settings)</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%', minHeight: '38px', fontSize: '0.85rem' }}
                >
                  <UserIcon size={16} color="#C2410C" />
                  <span>Sign In / Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for responsive navigation */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          #desktop-login-btn { display: inline-flex !important; }
          .desktop-cart-label { display: inline !important; }
        }
      `}</style>
    </header>
  );
};
