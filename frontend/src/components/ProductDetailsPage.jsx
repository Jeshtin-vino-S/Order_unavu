import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { DishCard } from './DishCard';
import { HeartIcon, PlusIcon, MinusIcon, ClockIcon, ArrowRightIcon, CartIcon } from './Icons';

export const ProductDetailsPage = () => {
  const {
    selectedDish,
    dishes,
    addToCart,
    updateQuantity,
    getItemQuantity,
    toggleWishlist,
    isInWishlist,
    setActivePage
  } = useCart();

  const [localQty, setLocalQty] = useState(1);
  const defaultFallback = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";

  // If no dish selected (e.g. fresh reload without session), pick first available dish
  const dish = selectedDish || (dishes.length > 0 ? dishes[0] : null);

  if (!dish) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2B2118', marginBottom: '8px' }}>
          No Dish Selected
        </h2>
        <p style={{ color: '#6B5E52', fontSize: '0.88rem', marginBottom: '20px' }}>
          Please browse our fresh Kumbakonam kitchen menu to pick your dish.
        </p>
        <button
          onClick={() => setActivePage('menu')}
          className="btn btn-primary"
          style={{ padding: '8px 24px', fontSize: '0.9rem' }}
        >
          Explore Menu
        </button>
      </div>
    );
  }

  const inCartQty = getItemQuantity(dish.id);
  const isLiked = isInWishlist(dish.id);

  const isInventory = dish.itemType === 'inventory';
  const isOutOfStock = isInventory && dish.stockQuantity !== null && dish.stockQuantity <= 0;
  const isSoldOut = dish.isAvailable === false || isOutOfStock;

  const getSlotBadge = () => {
    if (isInventory) {
      if (dish.stockQuantity !== null) {
        if (dish.stockQuantity <= 0) return { text: '🔴 Out of Stock', bg: '#FEE2E2', color: '#B91C1C' };
        if (dish.stockQuantity <= 5) return { text: `⚠️ Only ${dish.stockQuantity} left`, bg: '#FEF3C7', color: '#B45309' };
        return { text: `📦 ${dish.stockQuantity} in stock`, bg: '#FEF3C7', color: '#92400E' };
      }
      return { text: '📦 Packaged Item', bg: '#FEF3C7', color: '#92400E' };
    }
    switch (dish.mealSlot) {
      case 'breakfast':
        return { text: '🌅 Morning Tiffin (7-11 AM)', bg: '#FFEDD5', color: '#C2410C' };
      case 'lunch':
        return { text: '☀️ Lunch (12-3:30 PM)', bg: '#FFEDD5', color: '#C2410C' };
      case 'dinner':
        return { text: '🌙 Dinner (7-10:30 PM)', bg: '#EDE9FE', color: '#6D28D9' };
      default:
        return { text: '🕒 All-Day Available', bg: '#FFF2DF', color: '#8A4500' };
    }
  };

  const slotBadge = getSlotBadge();

  // Related dishes (same category or others, excluding current)
  const relatedDishes = dishes
    .filter(d => d.id !== dish.id && (d.category === dish.category || d.isPopular))
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < localQty; i++) {
      addToCart(dish);
    }
    setLocalQty(1);
  };

  return (
    <div style={{ padding: '24px 0 60px 0', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '1020px' }}>
        {/* Navigation Breadcrumbs & Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => setActivePage('menu')}
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Back to Menu
          </button>

          <div style={{ fontSize: '0.80rem', color: '#8A7A6D', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ cursor: 'pointer', color: '#C2410C' }} onClick={() => setActivePage('home')}>Home</span>
            <span>/</span>
            <span style={{ cursor: 'pointer', color: '#C2410C' }} onClick={() => setActivePage('menu')}>Menu</span>
            <span>/</span>
            <span style={{ color: '#2B2118', fontWeight: 600 }}>{dish.category}</span>
          </div>
        </div>

        {/* Main Product Section: Balanced 2-Column Showcase */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'start',
            marginBottom: '44px'
          }}
        >
          {/* Left Column: Framed Product Showcase Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '22px',
              border: '1.5px solid #F6DFCA',
              padding: '16px',
              boxShadow: '0 4px 20px rgba(43, 33, 24, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* The Image Frame - Height Increased */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '440px',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#FFF8EE',
                border: '1px solid #FFF1DE'
              }}
            >
              <img
                src={dish.image || defaultFallback}
                alt={dish.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.3s ease'
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultFallback;
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              />

              {/* Veg / Non-Veg Indicator */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: dish.isVeg ? '#15803D' : '#B91C1C'
                  }}
                >
                  {dish.isVeg ? (
                    <>
                      <span className="veg-badge" style={{ width: '13px', height: '13px' }}>
                        <span className="veg-dot" style={{ width: '5px', height: '5px' }} />
                      </span>
                      Pure Veg
                    </>
                  ) : (
                    <>
                      <span className="non-veg-badge" style={{ width: '13px', height: '13px' }}>
                        <span className="non-veg-dot" style={{ width: '5px', height: '5px' }} />
                      </span>
                      Non-Veg
                    </>
                  )}
                </span>
              </div>

              {/* Wishlist Heart Toggle */}
              <button
                onClick={() => toggleWishlist(dish.id)}
                title={isLiked ? "Remove from Wishlist" : "Save to Wishlist"}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              >
                <HeartIcon filled={isLiked} size={19} color={isLiked ? "#DC2626" : "#2B2118"} />
              </button>

              {/* Category Tag on Image */}
              <span
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  backgroundColor: 'rgba(43, 33, 24, 0.85)',
                  color: '#FFF8EE',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backdropFilter: 'blur(4px)',
                  zIndex: 2
                }}
              >
                {dish.category}
              </span>

              {/* Sold Out Dark Overlay */}
              {isSoldOut && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(43, 33, 24, 0.70)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3
                  }}
                >
                  <span
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      padding: '6px 16px',
                      borderRadius: '9999px',
                      letterSpacing: '0.6px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                    }}
                  >
                    {isOutOfStock ? "OUT OF STOCK" : "SOLD OUT FOR TODAY"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Dish Details & Order Actions */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '22px',
              border: '1.5px solid #F6DFCA',
              padding: '28px 24px',
              boxShadow: '0 4px 20px rgba(43, 33, 24, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Top Row: Timing Slot & Prep Time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: slotBadge.bg,
                  color: slotBadge.color
                }}
              >
                {slotBadge.text}
              </span>

              <span
                style={{
                  fontSize: '0.74rem',
                  color: '#6B5E52',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ClockIcon size={13} color="#C2410C" /> {dish.prepTime}
              </span>
            </div>

            {/* Dish Name */}
            <div>
              <h1
                style={{
                  fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)',
                  fontWeight: 800,
                  color: '#2B2118',
                  lineHeight: 1.28,
                  margin: 0
                }}
              >
                {dish.name}
              </h1>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', borderBottom: '1px solid #FFF1DE', paddingBottom: '14px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#C2410C' }}>
                ₹{dish.price}
              </span>
              <span style={{ fontSize: '0.76rem', color: '#8A7A6D' }}>
                (Inclusive of all taxes)
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                About this Dish
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#4A3E34', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                {dish.description || "Authentic Kumbakonam preparation made with fresh natural ingredients, traditional grinding techniques, and wholesome South Indian flavors."}
              </p>
            </div>

            {/* Quality Promise Card */}
            <div
              style={{
                backgroundColor: '#FFF8EE',
                borderRadius: '12px',
                border: '1px solid #F6DFCA',
                padding: '12px 14px',
                fontSize: '0.78rem',
                color: '#6B5E52',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>📦</span>
              <span>
                <strong>Fresh Delivery Guarantee:</strong> Prepared to order in our Kumbakonam kitchen, temperature-sealed, and delivered piping hot.
              </span>
            </div>

            {/* Add to Cart / Stepper Action */}
            <div
              style={{
                borderTop: '1px solid #FFF1DE',
                paddingTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              {isSoldOut ? (
                <button
                  disabled
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    padding: '8px 20px',
                    fontSize: '0.90rem',
                    borderRadius: '12px',
                    backgroundColor: '#F3F4F6',
                    color: '#9CA3AF',
                    border: '1px solid #E5E7EB',
                    cursor: 'not-allowed',
                    fontWeight: 700
                  }}
                >
                  Sold Out for Today
                </button>
              ) : inCartQty > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: '#FFEDD5',
                      border: '1.5px solid #F6DFCA',
                      borderRadius: '12px',
                      padding: '6px 14px'
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(dish.id, -1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#C2410C',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Decrease quantity"
                    >
                      <MinusIcon size={16} />
                    </button>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#C2410C', minWidth: '20px', textAlign: 'center' }}>
                      {inCartQty} in cart
                    </span>
                    <button
                      onClick={() => updateQuantity(dish.id, 1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#C2410C',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Increase quantity"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => setActivePage('cart')}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      minHeight: '42px',
                      fontSize: '0.86rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <CartIcon size={17} /> View Cart & Checkout
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {/* Quantity selector */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: '#FFF8EE',
                      border: '1.5px solid #F6DFCA',
                      borderRadius: '12px',
                      padding: '6px 12px'
                    }}
                  >
                    <button
                      onClick={() => setLocalQty(Math.max(1, localQty - 1))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#2B2118',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Decrease quantity"
                    >
                      <MinusIcon size={14} />
                    </button>
                    <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#2B2118', minWidth: '18px', textAlign: 'center' }}>
                      {localQty}
                    </span>
                    <button
                      onClick={() => setLocalQty(localQty + 1)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#2B2118',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Increase quantity"
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      minHeight: '44px',
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <PlusIcon size={15} /> Add to Cart • ₹{dish.price * localQty}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Dishes / You Might Also Like */}
        {relatedDishes.length > 0 && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                You Might Also Like
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2B2118' }}>
                Authentic Kumbakonam Delicacies
              </h2>
            </div>

            <div className="grid-dishes">
              {relatedDishes.map((rDish) => (
                <DishCard key={rDish.id} dish={rDish} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
