import React from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircleIcon, WhatsAppIcon, ArrowRightIcon, ClockIcon, MapPinIcon } from './Icons';

export const OrderConfirmation = ({ setActivePage }) => {
  const { lastOrder, openOrderDetails } = useCart();

  if (!lastOrder) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h2>No recent order found!</h2>
        <button onClick={() => setActivePage('home')} className="btn btn-primary" style={{ marginTop: '16px' }}>
          Go to Home
        </button>
      </div>
    );
  }

  // Generate WhatsApp Share Message
  const whatsappMessage = encodeURIComponent(
    `*Order Confirmation - OrderUnavu Kumbakonam* 🍛\n\n` +
    `*Order ID:* ${lastOrder.orderId}\n` +
    `*Customer:* ${lastOrder.customerName} (${lastOrder.customerPhone})\n` +
    `*Delivery Address:* ${lastOrder.deliveryAddress}\n\n` +
    `*Items Ordered:*\n` +
    lastOrder.items.map(item => `• ${item.name} x ${item.quantity} = ₹${item.price * item.quantity}`).join('\n') +
    `\n\n*Total Amount:* ₹${lastOrder.grandTotal} (${lastOrder.paymentMethod})\n` +
    `*Status:* Order Confirmed! Delivering hot soon.`
  );

  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  return (
    <div style={{ padding: '30px 0 60px 0' }}>
      <div className="container" style={{ maxWidth: '580px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1.5px solid #F6DFCA',
            padding: '28px 22px',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}
        >
          {/* Animated Checkmark */}
          <div
            style={{
              width: '68px',
              height: '68px',
              backgroundColor: '#DCFCE7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 16px rgba(22, 163, 74, 0.2)'
            }}
          >
            <CheckCircleIcon size={38} color="#16A34A" />
          </div>

          <span
            style={{
              backgroundColor: '#FFEDD5',
              color: '#C2410C',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-block',
              marginBottom: '10px'
            }}
          >
            Order Confirmed! • Kitchen Preparing Food
          </span>

          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800, color: '#2B2118', marginBottom: '6px' }}>
            Thank You! Order Placed Successfully
          </h1>

          <p style={{ color: '#6B5E52', fontSize: '0.86rem', lineHeight: 1.45, marginBottom: '20px' }}>
            Your order has been confirmed! Our chef is preparing your meal with authentic ingredients and pure country ghee.
          </p>

          {/* Order Details Card */}
          <div
            style={{
              backgroundColor: '#FFF8EE',
              borderRadius: '14px',
              border: '1px solid #F6DFCA',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F6DFCA', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Order Number
                </span>
                <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#C2410C' }}>
                  #{lastOrder.orderId}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#6B5E52', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Estimated Arrival
                </span>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                  <ClockIcon size={14} /> {lastOrder.eta}
                </p>
              </div>
            </div>

            {/* Delivery Destination */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ color: '#C2410C', marginTop: '2px' }}>
                <MapPinIcon size={16} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6B5E52', fontWeight: 600 }}>Delivering to:</span>
                <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#2B2118' }}>
                  {lastOrder.customerName} ({lastOrder.customerPhone})
                </p>
                <p style={{ fontSize: '0.78rem', color: '#6B5E52' }}>
                  {lastOrder.deliveryAddress}
                </p>
              </div>
            </div>

            {/* Items Summary */}
            <div style={{ borderTop: '1px solid #F6DFCA', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#6B5E52', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Items Ordered:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {lastOrder.items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#2B2118', fontWeight: 500 }}>
                      {it.name} <strong style={{ color: '#C2410C' }}>x {it.quantity}</strong>
                    </span>
                    <span style={{ fontWeight: 700, color: '#2B2118' }}>
                      ₹{it.price * it.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F6DFCA', marginTop: '10px', paddingTop: '8px', fontSize: '1rem', fontWeight: 800 }}>
                <span>Paid via {lastOrder.paymentMethod}</span>
                <span style={{ color: '#C2410C' }}>₹{lastOrder.grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Live Tracking, WhatsApp Share & Order More */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => openOrderDetails(lastOrder.orderId)}
              className="btn btn-primary"
              style={{
                minHeight: '44px',
                fontSize: '0.92rem',
                fontWeight: 700,
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              🛍️ View in Orders & Track Live <ArrowRightIcon size={16} />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                minHeight: '44px',
                fontSize: '0.92rem',
                fontWeight: 700,
                width: '100%',
                boxShadow: '0 2px 10px rgba(37, 211, 102, 0.25)'
              }}
            >
              <WhatsAppIcon size={20} color="#FFFFFF" />
              Share Order on WhatsApp
            </a>

            <button
              onClick={() => setActivePage('menu')}
              className="btn btn-secondary"
              style={{ minHeight: '40px', width: '100%', fontSize: '0.88rem' }}
            >
              Order More Dishes <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
