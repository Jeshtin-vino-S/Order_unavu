import React from 'react';
import { useCart } from '../context/CartContext';
import { HeartIcon, PlusIcon, MinusIcon, ClockIcon } from './Icons';

export const DishCard = ({ dish }) => {
  const {
    addToCart,
    updateQuantity,
    getItemQuantity,
    toggleWishlist,
    isInWishlist,
    openProductDetails
  } = useCart();

  const quantity = getItemQuantity(dish.id);
  const isLiked = isInWishlist(dish.id);
  const defaultFallback = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";

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

  return (
    <div className="dish-card">
      {/* 1. Image & Badges (Responsive height) */}
      <div
        onClick={() => openProductDetails(dish)}
        className="dish-card-img-wrap"
      >
        <img
          src={dish.image || defaultFallback}
          alt={dish.name}
          loading="lazy"
          className="dish-card-img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultFallback;
          }}
        />

        {/* Veg / Non-Veg Indicator */}
        <div style={{ position: 'absolute', top: '7px', left: '7px', zIndex: 2 }}>
          {dish.isVeg ? (
            <span className="veg-badge" style={{ width: '14px', height: '14px' }} title="Pure Veg">
              <span className="veg-dot" style={{ width: '5px', height: '5px' }} />
            </span>
          ) : (
            <span className="non-veg-badge" style={{ width: '14px', height: '14px' }} title="Non-Veg">
              <span className="non-veg-dot" style={{ width: '5px', height: '5px' }} />
            </span>
          )}
        </div>

        {/* Wishlist Heart Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(dish.id);
          }}
          className="dish-card-heart-btn"
          aria-label={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <HeartIcon filled={isLiked} size={15} color={isLiked ? "#DC2626" : "#2B2118"} />
        </button>

        {/* Category Tag on Image */}
        <span className="dish-card-cat-badge">
          {dish.category}
        </span>

        {/* Sold Out Dark Overlay */}
        {isSoldOut && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(43, 33, 24, 0.65)',
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
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              {isOutOfStock ? "OUT OF STOCK" : "SOLD OUT"}
            </span>
          </div>
        )}
      </div>

      {/* 2. Body Details */}
      <div className="dish-card-body">
        {/* Cooking Prep Time & Diet */}
        <div className="dish-card-meta">
          <span className="dish-card-prep-time">
            <ClockIcon size={11} color="#C2410C" /> {dish.prepTime}
          </span>
          <span
            className="dish-card-diet-tag"
            style={{ color: dish.isVeg ? '#15803D' : '#B91C1C' }}
          >
            {dish.isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
          </span>
        </div>

        {/* Timing Slot or Stock Pill */}
        <div>
          <span
            className="dish-card-slot-badge"
            style={{
              backgroundColor: slotBadge.bg,
              color: slotBadge.color
            }}
          >
            {slotBadge.text}
          </span>
        </div>

        {/* Dish Name */}
        <h3
          title={dish.name}
          onClick={() => openProductDetails(dish)}
          className="dish-card-title"
        >
          {dish.name}
        </h3>

        {/* Description (Visible on tablet/desktop, hidden on compact mobile) */}
        <p className="dish-card-desc">
          {dish.description}
        </p>

        {/* Price & Add / Stepper Button */}
        <div className="dish-card-footer">
          <div>
            <span className="dish-card-price">
              ₹{dish.price}
            </span>
          </div>

          <div>
            {isSoldOut ? (
              <button
                disabled
                className="dish-card-add-btn"
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#9CA3AF',
                  border: '1px solid #E5E7EB',
                  cursor: 'not-allowed',
                  fontWeight: 600
                }}
              >
                Sold Out
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={() => addToCart(dish)}
                className="btn btn-primary dish-card-add-btn"
              >
                <PlusIcon size={13} /> Add
              </button>
            ) : (
              <div className="dish-card-stepper">
                <button
                  onClick={() => updateQuantity(dish.id, -1)}
                  className="stepper-btn"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon size={12} color="#C2410C" />
                </button>
                <span
                  style={{
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity(dish.id, 1)}
                  className="stepper-btn"
                  aria-label="Increase quantity"
                >
                  <PlusIcon size={12} color="#C2410C" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
