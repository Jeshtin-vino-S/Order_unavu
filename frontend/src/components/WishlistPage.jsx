import React from 'react';
import { useCart } from '../context/CartContext';
import { HeartIcon, PlusIcon, ArrowRightIcon, ClockIcon } from './Icons';

export const WishlistPage = ({ setActivePage, onOpenAuth }) => {
  const {
    wishlist,
    dishes,
    toggleWishlist,
    removeFromWishlist,
    moveWishlistToCart,
    addToCart,
    user,
    openProductDetails
  } = useCart();

  const savedDishes = dishes.filter(d => wishlist.includes(d.id));
  const defaultFallback = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80";

  const handleMoveToCart = (dish) => {
    if (moveWishlistToCart) {
      moveWishlistToCart(dish);
    } else {
      addToCart(dish);
      if (removeFromWishlist) removeFromWishlist(dish.id);
    }
  };

  return (
    <div
      style={{
        padding: '24px 0 50px 0',
        width: '100%',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
    >
      <div
        className="container"
        style={{
          width: '100%',
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '0 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header Section */}
        <div style={{ marginBottom: '18px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Saved Favorites
          </span>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800, color: '#2B2118', marginTop: '2px', lineHeight: 1.2 }}>
            Your Wishlist
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#6B5E52', marginTop: '2px' }}>
            Save your favorite dishes now and order anytime with a single tap.
          </p>

          {/* User Account Login Banner */}
          {!user && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 14px',
                backgroundColor: '#FFEDD5',
                borderRadius: '10px',
                border: '1px solid #FED7AA',
                display: 'inline-flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#9A3412', fontWeight: 600 }}>
                💡 Wishlist persists across all your devices when you sign in!
              </span>
              <button
                onClick={onOpenAuth}
                className="btn btn-primary"
                style={{ minHeight: '30px', padding: '3px 10px', fontSize: '0.74rem' }}
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Items Grid or Empty State */}
        {savedDishes.length > 0 ? (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#6B5E52', fontWeight: 600 }}>
                {savedDishes.length} {savedDishes.length === 1 ? 'item' : 'items'} saved in your wishlist
              </span>
            </div>

            {/* Responsive Grid matching Myntra standard */}
            <div className="grid-dishes">
              {savedDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '14px',
                    border: '1px solid #F6DFCA',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    height: '100%',
                    width: '100%'
                  }}
                >
                  {/* Photo & Remove Wishlist Button */}
                  <div
                    onClick={() => openProductDetails(dish)}
                    style={{ position: 'relative', width: '100%', height: '140px', overflow: 'hidden', backgroundColor: '#FFF8EE', cursor: 'pointer' }}
                  >
                    <img
                      src={dish.image || defaultFallback}
                      alt={dish.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultFallback;
                      }}
                    />

                    {/* Veg / Non-veg */}
                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2 }}>
                      {dish.isVeg ? (
                        <span className="veg-badge" style={{ width: '14px', height: '14px' }}>
                          <span className="veg-dot" style={{ width: '5px', height: '5px' }} />
                        </span>
                      ) : (
                        <span className="non-veg-badge" style={{ width: '14px', height: '14px' }}>
                          <span className="non-veg-dot" style={{ width: '5px', height: '5px' }} />
                        </span>
                      )}
                    </div>

                    {/* Filled Heart Button (Click to remove from wishlist) */}
                    <button
                      onClick={() => toggleWishlist(dish.id)}
                      title="Remove from Wishlist"
                      aria-label="Remove from Wishlist"
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        zIndex: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                      }}
                    >
                      <HeartIcon filled={true} size={15} />
                    </button>

                    {/* Category Tag */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        backgroundColor: 'rgba(43, 33, 24, 0.85)',
                        color: '#FFF8EE',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        backdropFilter: 'blur(4px)',
                        zIndex: 2
                      }}
                    >
                      {dish.category}
                    </span>
                  </div>

                  {/* Details Body */}
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#6B5E52', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        <ClockIcon size={11} /> {dish.prepTime}
                      </span>
                    </div>

                    {/* Dish Name: English Only with Wrapping */}
                    <h3
                      title={dish.name}
                      onClick={() => openProductDetails(dish)}
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#2B2118',
                        lineHeight: 1.25,
                        marginBottom: '4px',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.4em',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#C2410C')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#2B2118')}
                    >
                      {dish.name}
                    </h3>

                    {/* 2-line Description */}
                    <p
                      style={{
                        fontSize: '0.76rem',
                        color: '#6B5E52',
                        lineHeight: 1.3,
                        marginBottom: '10px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        flex: 1
                      }}
                    >
                      {dish.description}
                    </p>

                    {/* Bottom Price & Full-width "Move to Cart" button */}
                    <div
                      style={{
                        paddingTop: '6px',
                        borderTop: '1px solid #FFF1DE',
                        marginTop: 'auto'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#6B5E52', textTransform: 'uppercase' }}>Price</span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2B2118' }}>
                          ₹{dish.price}
                        </span>
                      </div>

                      <button
                        onClick={() => handleMoveToCart(dish)}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          minHeight: '34px',
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          borderRadius: '9999px'
                        }}
                      >
                        <PlusIcon size={12} /> Move to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty Wishlist State - Centered in Fullscreen Viewport */
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 0'
            }}
          >
            <div
              style={{
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #F6DFCA',
                borderRadius: '20px',
                padding: '40px 24px',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 8px 24px rgba(43, 33, 24, 0.08)'
              }}
            >
              <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>❤️</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2B2118', marginBottom: '6px' }}>
                Your Wishlist is Empty
              </h2>
              <p style={{ color: '#6B5E52', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '20px' }}>
                No dishes saved yet! Tap the heart icon on any dish card to save your favorites and order whenever you want.
              </p>
              <button
                onClick={() => setActivePage('menu')}
                className="btn btn-primary"
                style={{ minHeight: '40px', padding: '9px 24px', fontSize: '0.9rem' }}
              >
                Browse Menu <ArrowRightIcon size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
