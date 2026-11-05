import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config/api';
import { downloadOrderReceipt } from '../utils/generateReceipt';
import {
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  UserIcon
} from './Icons';

export const OrderDetailsPage = () => {
  const {
    selectedOrderId,
    setSelectedOrderId,
    lastOrder,
    setActivePage,
    user,
    setAuthModalOpen,
    setAuthModalMessage
  } = useCart();

  const [userOrders, setUserOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(() => {
    if (selectedOrderId) {
      const clean = parseInt(String(selectedOrderId).replace(/\D/g, ''), 10);
      return isNaN(clean) ? null : clean;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Fetch logged-in user's orders directly from DB
  const fetchUserOrders = async (isSilent = false) => {
    if (!user || !user.phone) return;
    if (!isSilent) setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders?phone=${encodeURIComponent(user.phone)}`);
      if (res.ok) {
        const orders = await res.json();
        if (Array.isArray(orders)) {
          setUserOrders(orders);
        }
      }
    } catch (e) {
      console.warn("Could not fetch user orders:", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // If user is not logged in but has a lastOrder from guest checkout, fetch single order
  const [guestOrder, setGuestOrder] = useState(null);
  const fetchGuestOrder = async (orderId) => {
    if (!orderId) return;
    const cleanId = String(orderId).replace(/\D/g, '');
    if (!cleanId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${cleanId}`);
      if (res.ok) {
        const data = await res.json();
        setGuestOrder(data);
      }
    } catch (e) {}
  };

  // Initial load
  useEffect(() => {
    if (user && user.phone) {
      fetchUserOrders(false);
    } else if (lastOrder && lastOrder.orderId) {
      fetchGuestOrder(lastOrder.orderId);
    }
  }, [user]);

  // Automatic 3-second live sync polling (for instant admin status updates)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && user.phone) {
        fetchUserOrders(true);
      } else if (lastOrder && lastOrder.orderId) {
        fetchGuestOrder(lastOrder.orderId);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, lastOrder]);

  // User Cancel Order Action
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancellingId(orderToCancel.id);

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderToCancel.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const updated = await res.json();
        setUserOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        if (guestOrder && guestOrder.id === updated.id) {
          setGuestOrder(updated);
        }
        setOrderToCancel(null);
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Unable to cancel order.");
      }
    } catch (err) {
      alert("Failed to cancel order. Please check your connection.");
    } finally {
      setCancellingId(null);
    }
  };

  // 4-Step Tracking Timeline Definitions
  const timelineSteps = [
    {
      id: 'Pending',
      label: 'Order Placed',
      subtext: 'Order received & sent to Kumbakonam kitchen',
      icon: '📝'
    },
    {
      id: 'Preparing',
      label: 'Kitchen Preparing',
      subtext: 'Chef cooking fresh with authentic spices',
      icon: '🍳'
    },
    {
      id: 'On the Way',
      label: 'Out for Delivery',
      subtext: 'Food packed hot & on the way to your door',
      icon: '🛵'
    },
    {
      id: 'Delivered',
      label: 'Delivered',
      subtext: 'Food delivered fresh. Order pannunga, saapdunga!',
      icon: '🎉'
    }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Preparing': return 1;
      case 'On the Way': return 2;
      case 'Delivered': return 3;
      case 'Cancelled': return -1;
      default: return 0;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return { bg: '#DCFCE7', color: '#15803D', label: 'Delivered' };
      case 'Preparing':
        return { bg: '#DBEAFE', color: '#1D4ED8', label: 'Preparing' };
      case 'On the Way':
        return { bg: '#F3E8FF', color: '#7E22CE', label: 'On the Way' };
      case 'Cancelled':
        return { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled' };
      default:
        return { bg: '#FEF3C7', color: '#B45309', label: 'Pending' };
    }
  };

  // Combine orders list: logged-in user orders or guest order
  const ordersList = user ? userOrders : (guestOrder ? [guestOrder] : []);

  return (
    <div style={{ padding: '24px 0 60px 0', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Your Account
            </span>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800, color: '#2B2118', lineHeight: 1.2 }}>
              Orders
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#6B5E52', marginTop: '2px' }}>
              View all your orders and live kitchen preparation timeline
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setActivePage('menu')}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              ← Back to Menu
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && ordersList.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#C2410C' }}>
            <div style={{ fontSize: '1.8rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>
              ⏳
            </div>
            <p style={{ marginTop: '10px', fontSize: '0.88rem', fontWeight: 600, color: '#2B2118' }}>
              Loading your orders...
            </p>
          </div>
        )}

        {/* Orders List: ONE BY ONE */}
        {!loading && ordersList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {ordersList.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const badge = getStatusBadge(order.status);
              const currentStepIdx = getStepIndex(order.status);
              const isCancelled = order.status === 'Cancelled';
              const canCancel = order.status === 'Pending' || order.status === 'Preparing';

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    border: isExpanded ? '2px solid #C2410C' : '1.5px solid #F6DFCA',
                    overflow: 'hidden',
                    boxShadow: isExpanded ? '0 8px 25px rgba(194, 65, 12, 0.10)' : '0 2px 10px rgba(43, 33, 24, 0.04)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Order Card Summary Header (Clickable to Expand / Collapse Timeline) */}
                  <div
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    style={{
                      padding: '18px 20px',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? '#FFFBF5' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#C2410C' }}>
                            #ORD-{order.id}
                          </span>
                          <span
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 10px',
                              borderRadius: '9999px',
                              border: '1px solid rgba(0,0,0,0.06)'
                            }}
                          >
                            ● {badge.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.76rem', color: '#8A7A6D', display: 'block', marginTop: '3px' }}>
                          Placed on {order.created_at ? new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                        </span>
                      </div>

                      {/* Total Amount & Expand Arrow */}
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div>
                          <span style={{ fontSize: '0.70rem', color: '#8A7A6D', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                            Total Bill
                          </span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2B2118' }}>
                            ₹{order.total_amount}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: isExpanded ? '#C2410C' : '#8A7A6D',
                            fontWeight: 700,
                            backgroundColor: isExpanded ? '#FFEDD5' : '#FFF8EE',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #F6DFCA'
                          }}
                        >
                          {isExpanded ? 'Hide Details ▲' : 'Track Order ▼'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Items Preview */}
                    <div style={{ fontSize: '0.82rem', color: '#4A3E34', lineHeight: 1.4 }}>
                      <strong style={{ color: '#6B5E52' }}>Items: </strong>
                      {order.items && order.items.length > 0 ? (
                        order.items.map(it => `${it.food_name} x ${it.quantity}`).join(', ')
                      ) : (
                        'Authentic meal items'
                      )}
                    </div>
                  </div>

                  {/* EXPANDABLE SECTION: TIMELINE, DETAILS & CANCELLATION */}
                  {isExpanded && (
                    <div style={{ padding: '20px', borderTop: '1px solid #F6DFCA', backgroundColor: '#FFFFFF' }}>
                      {/* 1. Live Tracking Timeline Header */}
                      <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#2B2118', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Live Tracking Timeline
                        </h3>
                      </div>

                      {isCancelled ? (
                        <div
                          style={{
                            backgroundColor: '#FEF2F2',
                            border: '1.5px solid #FCA5A5',
                            borderRadius: '14px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            marginBottom: '20px'
                          }}
                        >
                          <span style={{ fontSize: '1.4rem' }}>🚫</span>
                          <div>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#B91C1C', marginBottom: '3px' }}>
                              Order Cancelled by Customer
                            </h4>
                            <p style={{ fontSize: '0.80rem', color: '#7F1D1D', lineHeight: 1.45, margin: 0 }}>
                              This order was cancelled. Any packaged items have been returned to inventory.
                              If paid online, your refund will be processed back to source within 24-48 hours.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* 4-Step Vertical Timeline */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
                          {timelineSteps.map((step, idx) => {
                            const isDone = currentStepIdx > idx;
                            const isCurrent = currentStepIdx === idx;

                            return (
                              <div
                                key={step.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '14px',
                                  position: 'relative'
                                }}
                              >
                                {/* Step Indicator */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div
                                    style={{
                                      width: '34px',
                                      height: '34px',
                                      borderRadius: '50%',
                                      backgroundColor:
                                        isDone ? '#16A34A' :
                                        isCurrent ? '#C2410C' : '#F3F4F6',
                                      color:
                                        isDone || isCurrent ? '#FFFFFF' : '#9CA3AF',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.95rem',
                                      fontWeight: 800,
                                      boxShadow: isCurrent ? '0 0 0 4px #FED7AA' : 'none',
                                      transition: 'all 0.3s ease',
                                      zIndex: 2
                                    }}
                                  >
                                    {isDone ? '✓' : step.icon}
                                  </div>

                                  {/* Line connector */}
                                  {idx < timelineSteps.length - 1 && (
                                    <div
                                      style={{
                                        width: '3px',
                                        height: '24px',
                                        backgroundColor: isDone ? '#16A34A' : '#E5E7EB',
                                        margin: '3px 0'
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Step Label & Subtext */}
                                <div style={{ paddingTop: '3px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span
                                      style={{
                                        fontSize: '0.88rem',
                                        fontWeight: 800,
                                        color: isDone || isCurrent ? '#2B2118' : '#9CA3AF'
                                      }}
                                    >
                                      {step.label}
                                    </span>
                                    {isCurrent && (
                                      <span
                                        style={{
                                          backgroundColor: '#FFEDD5',
                                          color: '#C2410C',
                                          fontSize: '0.66rem',
                                          fontWeight: 800,
                                          padding: '2px 8px',
                                          borderRadius: '9999px',
                                          letterSpacing: '0.4px'
                                        }}
                                      >
                                        CURRENT STATUS
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: '0.76rem', color: isDone || isCurrent ? '#6B5E52' : '#9CA3AF', marginTop: '2px', margin: 0 }}>
                                    {step.subtext}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. User-Only Cancel Order Option */}
                      {!isCancelled && (
                        <div
                          style={{
                            backgroundColor: '#FFF8EE',
                            borderRadius: '12px',
                            border: '1px solid #F6DFCA',
                            padding: '12px 16px',
                            marginBottom: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2B2118', display: 'block' }}>
                              Need to cancel this order?
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#6B5E52' }}>
                              {canCancel
                                ? "Cancellation available while food is in kitchen preparation."
                                : "Order is already out for delivery or delivered and cannot be cancelled."}
                            </span>
                          </div>

                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => setOrderToCancel(order)}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: '1.5px solid #DC2626',
                                color: '#DC2626',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                            >
                              Cancel Order
                            </button>
                          ) : (
                            <button
                              disabled
                              style={{
                                backgroundColor: '#F3F4F6',
                                border: '1px solid #E5E7EB',
                                color: '#9CA3AF',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                cursor: 'not-allowed'
                              }}
                            >
                              Cannot Cancel
                            </button>
                          )}
                        </div>
                      )}

                      {/* 3. Delivery Details */}
                      <div
                        style={{
                          backgroundColor: '#FFFDF9',
                          borderRadius: '12px',
                          border: '1px solid #FFF1DE',
                          padding: '14px',
                          marginBottom: '16px'
                        }}
                      >
                        <h4 style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6B5E52', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Delivery Destination
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                          <MapPinIcon size={15} color="#C2410C" />
                          <p style={{ fontSize: '0.82rem', color: '#2B2118', fontWeight: 600, margin: 0 }}>
                            {order.delivery_address}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#6B5E52' }}>
                          <PhoneIcon size={13} color="#C2410C" />
                          <span>Recipient: <strong>{order.customer_name}</strong> ({order.customer_phone})</span>
                        </div>
                      </div>

                      {/* 4. Items List with Prices */}
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6B5E52', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Items Ordered ({order.items?.length || 0})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {order.items && order.items.map((it) => (
                            <div
                              key={it.id || it.food_name}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 12px',
                                backgroundColor: '#FFF8EE',
                                borderRadius: '8px',
                                border: '1px solid #FFF1DE',
                                fontSize: '0.82rem'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600, color: '#2B2118' }}>{it.food_name}</span>
                                <span style={{ color: '#C2410C', fontWeight: 700, marginLeft: '6px' }}>x {it.quantity}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: '#2B2118' }}>
                                ₹{it.price * it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 5. Payment Breakdown & WhatsApp Support */}
                      <div
                        style={{
                          borderTop: '1.5px dashed #F6DFCA',
                          paddingTop: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#8A7A6D', textTransform: 'uppercase' }}>
                            Payment Method
                          </span>
                          <p style={{ fontSize: '0.84rem', fontWeight: 700, color: '#2B2118', margin: 0 }}>
                            {order.payment_method}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: '#8A7A6D', textTransform: 'uppercase' }}>
                            Total Bill
                          </span>
                          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#C2410C', margin: 0 }}>
                            ₹{order.total_amount}
                          </p>
                        </div>
                      </div>

                      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #FFF1DE', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hello OrderUnavu team, I need assistance with Order #ORD-${order.id}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{
                            backgroundColor: '#25D366',
                            color: '#FFFFFF',
                            padding: '7px 14px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '8px',
                            textDecoration: 'none'
                          }}
                        >
                          <WhatsAppIcon size={14} color="#FFFFFF" /> Chat Support on WhatsApp
                        </a>

                        <button
                          type="button"
                          onClick={() => downloadOrderReceipt(order)}
                          className="btn btn-secondary"
                          style={{
                            padding: '7px 16px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#FFF8EE',
                            borderColor: '#FED7AA',
                            color: '#C2410C',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          title="Download Tax Invoice & Receipt in PDF format"
                        >
                          📄 Download Receipt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state when user is not logged in and has no orders */}
        {!loading && ordersList.length === 0 && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #F6DFCA',
              padding: '48px 20px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛍️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2B2118', marginBottom: '8px' }}>
              {user ? "No Orders Placed Yet" : "Sign In to View Your Orders"}
            </h2>
            <p style={{ color: '#6B5E52', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
              {user
                ? "You haven't placed any orders yet. Fresh authentic Kumbakonam meals are waiting for you!"
                : "Please log in with your phone number to view your order history and live kitchen updates."}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!user && (
                <button
                  onClick={() => {
                    setAuthModalMessage("Please log in to view your orders.");
                    setAuthModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserIcon size={16} /> Sign In
                </button>
              )}

              <button
                onClick={() => setActivePage('menu')}
                className="btn btn-secondary"
                style={{ padding: '8px 20px', fontSize: '0.86rem' }}
              >
                Browse Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Cancellation Confirmation Modal */}
      {orderToCancel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(43, 33, 24, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              border: '1.5px solid #FCA5A5',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#B91C1C', marginBottom: '8px' }}>
              Cancel Order #ORD-{orderToCancel.id}?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6B5E52', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to cancel this order? This will stop kitchen preparation and cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="btn btn-secondary"
                disabled={cancellingId === orderToCancel.id}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingId === orderToCancel.id}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '8px 18px',
                  cursor: cancellingId === orderToCancel.id ? 'not-allowed' : 'pointer'
                }}
              >
                {cancellingId === orderToCancel.id ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
