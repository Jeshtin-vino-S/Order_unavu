import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { HeartIcon, CartIcon, PlusIcon, MinusIcon, ClockIcon } from './Icons';

export const DishCard = ({ dish }) => {
  const {
    addToCart,
    updateQuantity,
    getItemQuantity,
    toggleWishlist,
    isInWishlist,
    openProductDetails
  } = useCart();

  const [isFlipped, setIsFlipped] = useState(false);

  const quantity = getItemQuantity(dish.id);
  const isLiked = isInWishlist(dish.id);
  const defaultFallback = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";

  const isInventory = dish.itemType === 'inventory';
  const isOutOfStock = isInventory && dish.stockQuantity !== null && dish.stockQuantity <= 0;
  const isSoldOut = dish.isAvailable === false || isOutOfStock;

  const getSlotBadge = () => {
    if (isInventory) {
      if (dish.stockQuantity !== null) {
        if (dish.stockQuantity <= 0) return { title: 'Out of Stock', subtitle: 'Sold Out' };
        if (dish.stockQuantity <= 5) return { title: `${dish.stockQuantity} Left`, subtitle: 'Limited' };
        return { title: `${dish.stockQuantity} in Stock`, subtitle: 'Available' };
      }
      return { title: 'In Stock', subtitle: 'Packaged' };
    }
    switch (dish.mealSlot) {
      case 'breakfast':
        return { title: 'Breakfast', subtitle: '7 - 11 AM' };
      case 'lunch':
        return { title: 'Lunch', subtitle: '12 - 3:30 PM' };
      case 'dinner':
        return { title: 'Dinner', subtitle: '7 - 10:30 PM' };
      default:
        return { title: 'All-Day', subtitle: 'Always Fresh' };
    }
  };

  const slotInfo = getSlotBadge();

  const handleCardClick = () => {
    // Allows tap-to-flip on mobile devices
    setIsFlipped(prev => !prev);
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    toggleWishlist(dish.id);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(dish);
  };

  const handleUpdateQty = (e, delta) => {
    e.stopPropagation();
    updateQuantity(dish.id, delta);
  };

  const handleOpenDetails = (e) => {
    e.stopPropagation();
    openProductDetails(dish);
  };

  return (
    <div
      className={`dish-card-gold-wrap ${isFlipped ? 'is-flipped' : ''}`}
      onClick={handleCardClick}
      title="Hover or tap to flip 360°"
    >
      <div className="dish-card-gold-inner">
        {/* ========================================================
            FRONT VIEW: LUXURY GOLD GLOW CARD (IMAGE & DISH NAME ONLY)
            (NO Wishlist button on front so hover doesn't break clicking)
            ======================================================== */}
        <div className="dish-card-gold-face dish-card-gold-front">
          {/* Main Dish Image */}
          <div className="dish-card-gold-img-wrap">
            <img
              src={dish.image || defaultFallback}
              alt={dish.name}
              loading="lazy"
              className="dish-card-gold-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = defaultFallback;
              }}
            />

            {/* Veg / Non-Veg Indicator Dot */}
            <div className="dish-card-gold-veg-badge" title={dish.isVeg ? "Pure Veg" : "Non-Veg"}>
              {dish.isVeg ? (
                <span className="veg-badge" style={{ width: '15px', height: '15px' }}>
                  <span className="veg-dot" style={{ width: '6px', height: '6px' }} />
                </span>
              ) : (
                <span className="non-veg-badge" style={{ width: '15px', height: '15px' }}>
                  <span className="non-veg-dot" style={{ width: '6px', height: '6px' }} />
                </span>
              )}
            </div>

            {/* Sold Out Dark Overlay */}
            {isSoldOut && (
              <div className="dish-card-gold-soldout-overlay">
                <span>{isOutOfStock ? "OUT OF STOCK" : "SOLD OUT"}</span>
              </div>
            )}
          </div>

          {/* Front Bottom Section: Dish Name & 360° Flip Indicator */}
          <div className="dish-card-gold-front-footer">
            <div className="dish-card-gold-title-row">
              <h3 className="dish-card-gold-title" title={dish.name}>
                {dish.name}
              </h3>
            </div>

            <div className="dish-card-gold-360-pill">
              <span className="dish-card-gold-360-text">360°</span>
              <span className="dish-card-gold-360-arrow">↻ Hover for details</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            BACK VIEW: REVEALED ON 360° HOVER
            (Wishlist button at top right, Dish Name, Real Rating,
             Price, Description, 3 Dynamic Specs, Golden Add to Cart)
            ======================================================== */}
        <div className="dish-card-gold-face dish-card-gold-back">
          {/* Top Row: Dish Name on left, Wishlist Button on right */}
          <div className="dish-card-gold-back-top">
            <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
              <h3
                className="dish-card-gold-back-name"
                title={dish.name}
                onClick={handleOpenDetails}
              >
                {dish.name}
              </h3>

              {/* Dynamic Rating (Strictly from real DB data, no hardcoded fake reviews) */}
              <div className="dish-card-gold-rating-row">
                <span className="dish-card-gold-category-tag">
                  {dish.category}
                </span>
              </div>
            </div>

            {/* Wishlist Button on Back (Comfortably clickable without card flipping away!) */}
            <button
              type="button"
              onClick={handleWishlistToggle}
              className={`dish-card-gold-heart-btn ${isLiked ? 'liked' : ''}`}
              aria-label={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
              title={isLiked ? "In your Wishlist" : "Add to Wishlist"}
            >
              <HeartIcon filled={isLiked} size={18} color={isLiked ? "#EF4444" : "#F5AF19"} />
            </button>
          </div>

          {/* Price Row */}
          <div className="dish-card-gold-price-row">
            <div className="dish-card-gold-price-val">
              <span className="dish-card-gold-currency">₹</span>
              <span>{dish.price}</span>
            </div>
            <div className="dish-card-gold-diet-badge" style={{ color: dish.isVeg ? '#86EFAC' : '#FCA5A5' }}>
              {dish.isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
            </div>
          </div>

          {/* Description (Real DB text) */}
          <div className="dish-card-gold-desc-wrap">
            <p className="dish-card-gold-desc">
              {dish.description && dish.description.trim()
                ? dish.description
                : "Authentic Kumbakonam preparation made fresh daily with hand-ground spices and traditional recipes."}
            </p>
          </div>

          {/* 3 Real Feature Specs (Exactly like the 3 icons in the reference image, using REAL data!) */}
          <div className="dish-card-gold-specs-grid">
            {/* Spec 1: Prep Time */}
            <div className="dish-card-gold-spec-col">
              <div className="dish-card-gold-spec-icon">
                <ClockIcon size={14} color="#F5AF19" />
              </div>
              <span className="dish-card-gold-spec-title">{dish.prepTime}</span>
              <span className="dish-card-gold-spec-sub">Prep Time</span>
            </div>

            {/* Spec 2: Meal Slot or Stock */}
            <div className="dish-card-gold-spec-col">
              <div className="dish-card-gold-spec-icon">
                <span style={{ fontSize: '0.85rem' }}>🍱</span>
              </div>
              <span className="dish-card-gold-spec-title">{slotInfo.title}</span>
              <span className="dish-card-gold-spec-sub">{slotInfo.subtitle}</span>
            </div>

            {/* Spec 3: Category / Preparation */}
            <div className="dish-card-gold-spec-col">
              <div className="dish-card-gold-spec-icon">
                <span style={{ fontSize: '0.85rem' }}>♨️</span>
              </div>
              <span className="dish-card-gold-spec-title">
                {dish.itemType === 'inventory' ? 'Packaged' : 'Fresh Cook'}
              </span>
              <span className="dish-card-gold-spec-sub">
                {dish.itemType === 'inventory' ? 'Quick Serve' : 'Kitchen Hot'}
              </span>
            </div>
          </div>

          {/* Bottom Action: Luxury Golden Add to Cart Button */}
          <div className="dish-card-gold-bottom-action">
            {isSoldOut ? (
              <button
                type="button"
                disabled
                className="dish-card-gold-soldout-btn"
              >
                Sold Out
              </button>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={handleAddToCart}
                className="dish-card-gold-add-btn"
              >
                <CartIcon size={17} color="#1A1008" />
                <span>Add to Cart</span>
              </button>
            ) : (
              <div className="dish-card-gold-stepper">
                <button
                  type="button"
                  onClick={(e) => handleUpdateQty(e, -1)}
                  className="dish-card-gold-stepper-btn"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon size={13} color="#1A1008" />
                </button>
                <span className="dish-card-gold-stepper-qty">
                  {quantity} in Cart
                </span>
                <button
                  type="button"
                  onClick={(e) => handleUpdateQty(e, 1)}
                  className="dish-card-gold-stepper-btn"
                  aria-label="Increase quantity"
                >
                  <PlusIcon size={13} color="#1A1008" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
