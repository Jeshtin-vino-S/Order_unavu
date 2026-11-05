import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { resolveImageUrl } from '../config/api';
import { DishCard } from './DishCard';
import { ArrowRightIcon, ShieldCheckIcon, ClockIcon } from './Icons';

export const Home = ({ setActivePage }) => {
  const { dishes, heroImage } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Derive unique categories dynamically from MySQL dishes
  const categories = useMemo(() => {
    const set = new Set();
    dishes.forEach(d => { if (d.category) set.add(d.category); });
    return ["All", ...Array.from(set)];
  }, [dishes]);

  const filteredDishes = selectedCategory === "All"
    ? dishes.filter(d => d.isPopular || d.isSpecial).slice(0, 8)
    : dishes.filter(d => d.category.toLowerCase() === selectedCategory.toLowerCase()).slice(0, 8);

  const scrollToMenu = () => {
    const titleEl = document.getElementById('popular-dishes-title');
    if (titleEl) {
      // 60px sticky navbar + 16px clean space so heading starts perfectly below navbar
      const navOffset = 76;
      const elementPosition = titleEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div>
      {/* 1. HERO SECTION - TRUE FULL-SCREEN VIEWPORT FIT */}
      <section
        className="hero-fullscreen"
        style={{
          background: 'linear-gradient(180deg, #FFF8EE 0%, #FFF1DE 100%)',
          borderBottom: '1px solid #F6DFCA',
          position: 'relative',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div
          className="container hero-container"
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingTop: '16px',
            paddingBottom: '60px',
            boxSizing: 'border-box'
          }}
        >
          {/* Main 2-Column Content */}
          <div
            className="hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
              alignItems: 'center',
              width: '100%'
            }}
          >
            {/* Left Hero Content */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* Kumbakonam Heritage Badge */}
              <div style={{ marginBottom: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#FFEDD5',
                    color: '#C2410C',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: '1px solid #FED7AA'
                  }}
                >
                  🪔 Kumbakonam Heritage • Authentic Taste
                </span>
              </div>

              {/* Main Headline */}
              <h1
                style={{
                  fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                  fontWeight: 800,
                  color: '#2B2118',
                  lineHeight: 1.18,
                  letterSpacing: '-0.5px',
                  marginBottom: '8px'
                }}
              >
                Authentic South Indian Food, <br />
                <span style={{ color: '#C2410C' }}>Delivered Fresh to Your Door!</span>
              </h1>

              {/* Official Tagline (Tanglish) */}
              <p
                style={{
                  fontSize: 'clamp(1.1rem, 1.9vw, 1.3rem)',
                  fontWeight: 700,
                  color: '#C2410C',
                  marginBottom: '10px'
                }}
              >
                "Order pannunga, saapdunga."
              </p>

              <p style={{ fontSize: '0.88rem', color: '#6B5E52', lineHeight: 1.55, marginBottom: '18px', maxWidth: '490px' }}>
                From signature Kumbakonam Kadappa and fragrant Seeraga Samba Biryani to flaky Madurai Bun Parotta and piping hot Degree Coffee — prepared fresh and delivered hot.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <button
                  onClick={() => setActivePage('menu')}
                  className="btn btn-primary"
                  style={{ minHeight: '42px', padding: '9px 24px', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  Order Now <ArrowRightIcon size={16} />
                </button>

                <button
                  onClick={scrollToMenu}
                  className="btn btn-secondary"
                  style={{ minHeight: '42px', padding: '9px 20px', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  View Menu
                </button>
              </div>

              {/* Trust Highlights */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', paddingTop: '12px', borderTop: '1px solid #F6DFCA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClockIcon size={16} color="#C2410C" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2B2118' }}>30 Mins Hot Delivery</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheckIcon size={16} color="#16A34A" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2B2118' }}>100% Pure Ghee & Fresh Spices</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card - Full Width 16:10 Ratio Fit */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <div
                style={{
                  borderRadius: '22px',
                  overflow: 'hidden',
                  boxShadow: '0 14px 34px rgba(43, 33, 24, 0.14)',
                  border: '4px solid #FFFFFF',
                  position: 'relative',
                  aspectRatio: '16 / 10',
                  width: '100%',
                  maxWidth: '560px',
                  backgroundColor: '#FFF8EE',
                  boxSizing: 'border-box'
                }}
              >
                <img
                  src={resolveImageUrl(heroImage) || "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"}
                  alt="Delicious Kumbakonam Food"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Explore Dishes Button - Elevated INSIDE hero section, always clearly visible */}
        <div
          style={{
            position: 'absolute',
            bottom: '22px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20
          }}
        >
          <button
            onClick={scrollToMenu}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              color: '#C2410C',
              border: '1.5px solid #FED7AA',
              padding: '7px 22px',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(194, 65, 12, 0.16)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFEDD5';
              e.currentTarget.style.borderColor = '#C2410C';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#FED7AA';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Explore Dishes</span>
            <span style={{ animation: 'bounce 1.5s infinite', display: 'inline-block', fontWeight: 800 }}>↓</span>
          </button>
        </div>

        <style>{`
          .hero-fullscreen {
            height: calc(100vh - 60px);
            min-height: calc(100vh - 60px);
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(3px); }
            60% { transform: translateY(1.5px); }
          }
          @media (max-width: 820px) {
            .hero-fullscreen {
              height: auto !important;
              min-height: calc(100vh - 60px);
              padding: 24px 0 60px 0 !important;
            }
          }
        `}</style>
      </section>

      {/* 2. POPULAR DISHES & CATEGORY FILTER */}
      <section id="popular-dishes-section" style={{ padding: '28px 0 50px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2
                id="popular-dishes-title"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#2B2118',
                  scrollMarginTop: '76px'
                }}
              >
                Popular Dishes in Kumbakonam
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#6B5E52' }}>
                Handpicked customer favorites prepared fresh to order
              </p>
            </div>

            <button
              onClick={() => setActivePage('menu')}
              className="btn btn-outline-primary"
              style={{ minHeight: '36px', fontSize: '0.82rem', padding: '6px 14px' }}
            >
              View Full Menu ({dishes.length}) <ArrowRightIcon size={14} />
            </button>
          </div>

          {/* Category Chips Scrollbar */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '10px',
              marginBottom: '16px',
              scrollbarWidth: 'none'
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                style={{ minHeight: '34px', padding: '4px 14px', fontSize: '0.8rem' }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Popular Dishes Grid - Compact 4-column */}
          <div className="grid-dishes">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. 3-STEP "HOW IT WORKS" ON DARK BROWN BACKGROUND */}
      <section
        id="how-it-works-section"
        style={{
          backgroundColor: '#2B2118',
          color: '#FFF8EE',
          padding: '48px 0',
          position: 'relative'
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '540px', margin: '0 auto 36px auto' }}>
            <span
              style={{
                color: '#FED7AA',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                marginBottom: '4px'
              }}
            >
              Simple & Fast
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, color: '#FFF8EE', marginBottom: '8px' }}>
              How OrderUnavu Works
            </h2>
            <p style={{ color: '#D6C8B8', fontSize: '0.85rem', lineHeight: 1.4 }}>
              Fresh authentic food at your doorstep in three easy steps!
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                backgroundColor: '#3D3024',
                padding: '24px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(254, 215, 170, 0.12)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: '#C2410C',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  margin: '0 auto 14px auto',
                  boxShadow: '0 3px 10px rgba(194, 65, 12, 0.35)'
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF8EE', marginBottom: '6px' }}>
                Choose Your Dishes
              </h3>
              <p style={{ color: '#D6C8B8', fontSize: '0.82rem', lineHeight: 1.45 }}>
                Browse our curated menu — Biryani, Tiffin, Meals, Snacks & famous Degree Coffee.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                backgroundColor: '#3D3024',
                padding: '24px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(254, 215, 170, 0.12)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: '#C2410C',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  margin: '0 auto 14px auto',
                  boxShadow: '0 3px 10px rgba(194, 65, 12, 0.35)'
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF8EE', marginBottom: '6px' }}>
                Enter Address & Pay
              </h3>
              <p style={{ color: '#D6C8B8', fontSize: '0.82rem', lineHeight: 1.45 }}>
                Enter your Kumbakonam delivery address. Pay via GPay, PhonePe, Card, or Cash on Delivery.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                backgroundColor: '#3D3024',
                padding: '24px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(254, 215, 170, 0.12)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: '#C2410C',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  margin: '0 auto 14px auto',
                  boxShadow: '0 3px 10px rgba(194, 65, 12, 0.35)'
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF8EE', marginBottom: '6px' }}>
                Fast Hot Delivery!
              </h3>
              <p style={{ color: '#D6C8B8', fontSize: '0.82rem', lineHeight: 1.45 }}>
                Within 30 minutes, piping hot food arrives fresh at your doorstep. Track status & enjoy!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
