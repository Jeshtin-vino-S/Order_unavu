import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config/api';
import { PlusIcon, MinusIcon, TrashIcon, ArrowRightIcon, ShieldCheckIcon } from './Icons';

export const CartCheckout = ({ setActivePage }) => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    taxes,
    grandTotal,
    user,
    setLastOrder
  } = useCart();

  // Form State - ONLY name & phone fetched from authenticated user in DB; address starts empty
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    streetAddress: "",
    areaLandmark: "",
    deliveryNotes: ""
  });

  // Sync name & phone whenever user logs in or updates
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState("UPI"); // 'UPI', 'CARD', 'COD'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Quick Kumbakonam Locations to autofill
  const kumbakonamAreas = [
    "Big Bazaar Street",
    "Gandhi Park Road",
    "Sakkottai",
    "TSR Big Street",
    "Palakkarai"
  ];

  // Form Validation & Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.phone.trim() || formData.phone.length < 10) {
      errors.phone = "Enter a valid 10-digit mobile number.";
    }
    if (!formData.streetAddress.trim()) {
      errors.streetAddress = "Street address is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      orderId: "OU-" + Math.floor(100000 + Math.random() * 900000),
      customerName: formData.name,
      customerPhone: formData.phone,
      deliveryAddress: `${formData.streetAddress}, ${formData.areaLandmark}`,
      items: cart,
      subtotal,
      deliveryFee,
      taxes,
      grandTotal,
      paymentMethod,
      orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      eta: "25-35 mins"
    };

    // Post to backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_phone: formData.phone,
          delivery_address: `${formData.streetAddress}, ${formData.areaLandmark}`,
          payment_method: paymentMethod,
          items: cart.map(i => ({ food_id: i.id, quantity: i.quantity }))
        })
      });
      if (res.ok) {
        const createdOrder = await res.json();
        if (createdOrder && createdOrder.id) {
          orderPayload.orderId = createdOrder.id;
        }
      }
    } catch (err) {}

    setTimeout(() => {
      setLastOrder(orderPayload);
      clearCart();
      setIsSubmitting(false);
      setActivePage('order-confirmation');
    }, 1000);
  };

  // EMPTY CART STATE (Full-screen centered viewport fit)
  if (cart.length === 0) {
    return (
      <div
        style={{
          padding: '40px 16px',
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid #F6DFCA',
            borderRadius: '20px',
            padding: '40px 26px',
            maxWidth: '430px',
            width: '100%',
            boxShadow: '0 8px 24px rgba(43, 33, 24, 0.08)'
          }}
        >
          <div style={{ fontSize: '3.2rem', marginBottom: '12px' }}>🛒</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2B2118', marginBottom: '6px' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: '#6B5E52', fontSize: '0.86rem', lineHeight: 1.55, marginBottom: '22px' }}>
            Looks like you haven't added any dishes yet. Explore our delicious authentic menu and order your favorites!
          </p>
          <button
            onClick={() => setActivePage('menu')}
            className="btn btn-primary"
            style={{ minHeight: '42px', padding: '10px 24px', fontSize: '0.92rem', width: '100%', fontWeight: 700 }}
          >
            Explore Menu & Order <ArrowRightIcon size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px 0 50px 0',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      <div className="container">
        {/* Title */}
        <div style={{ marginBottom: '18px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#2B2118' }}>
            Cart & Checkout
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#6B5E52' }}>
            Review your order and enter delivery details for Kumbakonam.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* LEFT: CART ITEMS LIST */}
          <div>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #F6DFCA',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #F6DFCA' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2B2118' }}>
                  Ordered Items ({cart.length})
                </h2>
                <button
                  onClick={clearCart}
                  style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear All
                </button>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #FFF8EE'
                    }}
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1px solid #F6DFCA',
                        flexShrink: 0
                      }}
                    />

                    {/* Name & Unit Price */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {item.isVeg ? (
                          <span className="veg-badge" style={{ width: '12px', height: '12px' }}>
                            <span className="veg-dot" style={{ width: '5px', height: '5px' }} />
                          </span>
                        ) : (
                          <span className="non-veg-badge" style={{ width: '12px', height: '12px' }}>
                            <span className="non-veg-dot" style={{ width: '5px', height: '5px' }} />
                          </span>
                        )}
                        <h4
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: '#2B2118',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.name}
                        </h4>
                      </div>

                      <span style={{ fontSize: '0.78rem', color: '#6B5E52', display: 'block', marginTop: '1px' }}>
                        ₹{item.price} each
                      </span>

                      {/* Line Total */}
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#C2410C', display: 'block', marginTop: '2px' }}>
                        ₹{item.price * item.quantity}
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#FFEDD5',
                        borderRadius: '9999px',
                        padding: '3px 5px',
                        border: '1px solid #FED7AA'
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="stepper-btn"
                        style={{ width: '24px', height: '24px', backgroundColor: '#FFFFFF', color: '#C2410C' }}
                        aria-label="Decrease"
                      >
                        <MinusIcon size={12} color="#C2410C" />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', minWidth: '16px', textAlign: 'center', color: '#2B2118' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="stepper-btn"
                        style={{ width: '24px', height: '24px', backgroundColor: '#FFFFFF', color: '#C2410C' }}
                        aria-label="Increase"
                      >
                        <PlusIcon size={12} color="#C2410C" />
                      </button>
                    </div>

                    {/* Remove Icon */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn-icon"
                      style={{
                        width: '30px',
                        height: '30px',
                        minWidth: '30px',
                        minHeight: '30px',
                        backgroundColor: '#FFF2DF',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#B91C1C'
                      }}
                      title="Remove Item"
                    >
                      <TrashIcon size={14} color="#B91C1C" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add More Items Button */}
              <button
                onClick={() => setActivePage('menu')}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '12px', minHeight: '36px', fontSize: '0.82rem' }}
              >
                + Add More Dishes
              </button>
            </div>

            {/* Delivery Assurance */}
            <div
              style={{
                backgroundColor: '#FFF8EE',
                border: '1px solid #F6DFCA',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🛵</span>
              <div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 700, color: '#2B2118' }}>
                  Fast Local Kumbakonam Delivery
                </h4>
                <p style={{ fontSize: '0.76rem', color: '#6B5E52' }}>
                  Packed in insulated containers. Delivered piping hot in 30 minutes!
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: STICKY ORDER SUMMARY & DELIVERY FORM */}
          <div style={{ position: 'sticky', top: '76px' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #F6DFCA',
                padding: '18px 20px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2B2118', marginBottom: '14px' }}>
                Delivery & Payment
              </h2>

              <form onSubmit={handlePlaceOrder}>
                {/* 1. Name & Phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '3px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Karthik Raja"
                      className="input-field"
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    />
                    {formErrors.name && (
                      <span style={{ color: '#DC2626', fontSize: '0.74rem', marginTop: '2px', display: 'block' }}>
                        {formErrors.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '3px' }}>
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="input-field"
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    />
                    {formErrors.phone && (
                      <span style={{ color: '#DC2626', fontSize: '0.74rem', marginTop: '2px', display: 'block' }}>
                        {formErrors.phone}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '3px' }}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.streetAddress}
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                      placeholder="House / Flat No., Street Name"
                      className="input-field"
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    />
                    {formErrors.streetAddress && (
                      <span style={{ color: '#DC2626', fontSize: '0.74rem', marginTop: '2px', display: 'block' }}>
                        {formErrors.streetAddress}
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2B2118', display: 'block', marginBottom: '3px' }}>
                      Kumbakonam Area / Landmark
                    </label>
                    <input
                      type="text"
                      value={formData.areaLandmark}
                      onChange={(e) => setFormData({ ...formData, areaLandmark: e.target.value })}
                      placeholder="Near Temple, Park, School"
                      className="input-field"
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    />
                    {/* Quick Area Chips */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {kumbakonamAreas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => setFormData({ ...formData, areaLandmark: area + ", Kumbakonam" })}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#FFF2DF',
                            border: '1px solid #F6DFCA',
                            cursor: 'pointer',
                            color: '#C2410C'
                          }}
                        >
                          +{area}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. PAYMENT OPTIONS RADIO */}
                <div style={{ marginBottom: '16px', paddingTop: '10px', borderTop: '1px solid #F6DFCA' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2B2118', display: 'block', marginBottom: '8px' }}>
                    Payment Options
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* UPI Option */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${paymentMethod === 'UPI' ? '#C2410C' : '#F6DFCA'}`,
                        backgroundColor: paymentMethod === 'UPI' ? '#FFEDD5' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'UPI'}
                          onChange={() => setPaymentMethod('UPI')}
                          style={{ width: '16px', height: '16px', accentColor: '#C2410C' }}
                        />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#2B2118', display: 'block' }}>
                            UPI (GPay / PhonePe / Paytm)
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#6B5E52' }}>
                            Instant zero-fee transfer
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem' }}>⚡</span>
                    </label>

                    {/* Card Option */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${paymentMethod === 'CARD' ? '#C2410C' : '#F6DFCA'}`,
                        backgroundColor: paymentMethod === 'CARD' ? '#FFEDD5' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'CARD'}
                          onChange={() => setPaymentMethod('CARD')}
                          style={{ width: '16px', height: '16px', accentColor: '#C2410C' }}
                        />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#2B2118', display: 'block' }}>
                            Credit / Debit Card
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#6B5E52' }}>
                            Visa, MasterCard, RuPay
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem' }}>💳</span>
                    </label>

                    {/* Cash on Delivery Option */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${paymentMethod === 'COD' ? '#C2410C' : '#F6DFCA'}`,
                        backgroundColor: paymentMethod === 'COD' ? '#FFEDD5' : '#FFFFFF',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'COD'}
                          onChange={() => setPaymentMethod('COD')}
                          style={{ width: '16px', height: '16px', accentColor: '#C2410C' }}
                        />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#2B2118', display: 'block' }}>
                            Cash on Delivery (COD)
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#6B5E52' }}>
                            Pay with cash upon delivery
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem' }}>💵</span>
                    </label>
                  </div>
                </div>

                {/* 3. BILL BREAKDOWN (Offers removed as requested) */}
                <div
                  style={{
                    backgroundColor: '#FFF8EE',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.84rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B5E52' }}>
                    <span>Items Subtotal</span>
                    <span style={{ fontWeight: 600, color: '#2B2118' }}>₹{subtotal}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B5E52' }}>
                    <span>Delivery Fee {subtotal >= 500 && <strong style={{ color: '#16A34A' }}>(Free)</strong>}</span>
                    <span style={{ fontWeight: 600, color: deliveryFee === 0 ? '#16A34A' : '#2B2118' }}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B5E52' }}>
                    <span>GST & Restaurant Taxes (5%)</span>
                    <span style={{ fontWeight: 600, color: '#2B2118' }}>₹{taxes}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px dashed #F6DFCA',
                      paddingTop: '8px',
                      marginTop: '2px',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#2B2118'
                    }}
                  >
                    <span>Total Amount</span>
                    <span style={{ color: '#C2410C' }}>₹{grandTotal}</span>
                  </div>
                </div>

                {/* 4. PLACE ORDER BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Placing Order...' : `Place Order (₹${grandTotal})`}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>
                  <ShieldCheckIcon size={14} color="#16A34A" />
                  <span style={{ fontSize: '0.74rem', color: '#6B5E52' }}>100% Secure & Contactless Delivery</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
