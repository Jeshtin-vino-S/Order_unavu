import React from 'react';
import { WhatsAppIcon, MapPinIcon, PhoneIcon, ClockIcon } from './Icons';

export const Footer = ({ setActivePage }) => {
  return (
    <footer
      id="footer-section"
      style={{
        background: 'linear-gradient(180deg, #18120C 0%, #0E0906 100%)',
        color: '#FFF8EE',
        paddingTop: '46px',
        paddingBottom: '26px',
        borderTop: '3px solid #C2410C',
        boxShadow: '0 -8px 28px rgba(0, 0, 0, 0.22)',
        position: 'relative'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
            marginBottom: '32px'
          }}
        >
          {/* Brand Info with White Badge for Logo so "Order" & "Unavu" are 100% clearly visible */}
          <div>
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '5px 14px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(254, 215, 170, 0.3)'
                }}
              >
                <img
                  src="/orderunavu-logo.png"
                  alt="OrderUnavu"
                  style={{ height: '36px', maxWidth: '180px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            </div>
            <p style={{ color: '#D4C5B6', fontSize: '0.84rem', lineHeight: 1.55, marginBottom: '14px' }}>
              Kumbakonam's authentic home-style kitchen. Serving traditional Kadappa, Seeraga Samba Biryani, Madurai Parotta & Degree Coffee.
            </p>
            {/* Tagline preserved in Tanglish as requested */}
            <p style={{ color: '#FED7AA', fontSize: '0.95rem', fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.2px' }}>
              "Order pannunga, saapdunga."
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.96rem', fontWeight: 700, marginBottom: '14px' }}>
              Quick Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setActivePage('home')}
                style={{ background: 'none', border: 'none', color: '#D4C5B6', textAlign: 'left', cursor: 'pointer', fontSize: '0.84rem', transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#EA580C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#D4C5B6')}
              >
                Home
              </button>
              <button
                onClick={() => setActivePage('menu')}
                style={{ background: 'none', border: 'none', color: '#D4C5B6', textAlign: 'left', cursor: 'pointer', fontSize: '0.84rem', transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#EA580C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#D4C5B6')}
              >
                Full Menu
              </button>
              <button
                onClick={() => setActivePage('wishlist')}
                style={{ background: 'none', border: 'none', color: '#D4C5B6', textAlign: 'left', cursor: 'pointer', fontSize: '0.84rem', transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#EA580C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#D4C5B6')}
              >
                Wishlist
              </button>
              <button
                onClick={() => setActivePage('cart')}
                style={{ background: 'none', border: 'none', color: '#D4C5B6', textAlign: 'left', cursor: 'pointer', fontSize: '0.84rem', transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#EA580C')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#D4C5B6')}
              >
                Cart & Checkout
              </button>
          
            </div>
          </div>

          {/* Kumbakonam Location & Contact */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.96rem', fontWeight: 700, marginBottom: '14px' }}>
              Location & Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.84rem', color: '#D4C5B6' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ color: '#EA580C', marginTop: '2px' }}>
                  <MapPinIcon size={16} />
                </div>
                <span>
                  No. 42, Big Bazaar Street,<br />
                  Opp. Sarangapani Temple Sannathi,<br />
                  Kumbakonam, Tamil Nadu - 612001
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ color: '#EA580C' }}>
                  <PhoneIcon size={16} />
                </div>
                <span style={{ fontWeight: 600 }}>+91 98765 43210</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ color: '#EA580C' }}>
                  <ClockIcon size={16} />
                </div>
                <span>Daily: 7:00 AM - 10:30 PM</span>
              </div>

              {/* Direct WhatsApp Button */}
              <a
                href="https://api.whatsapp.com/send?phone=919876543210&text=Hello%20OrderUnavu!%20I%20would%20like%20to%20order%20food."
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  marginTop: '4px',
                  minHeight: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: 'fit-content',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)'
                }}
              >
                <WhatsAppIcon size={17} color="#FFFFFF" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#9E8F82'
          }}
        >
          <span>© {new Date().getFullYear()} OrderUnavu Restaurant. All Rights Reserved.</span>
          <span>Made with ❤️ in Kumbakonam, Tamil Nadu</span>
        </div>
      </div>
    </footer>
  );
};
