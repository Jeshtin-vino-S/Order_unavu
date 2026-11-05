import React from 'react';
import { CartProvider, useCart, pathToPageMap, pageToPathMap, getPageFromPath } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { MenuPage } from './components/MenuPage';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { OrderDetailsPage } from './components/OrderDetailsPage';
import { CartCheckout } from './components/CartCheckout';
import { OrderConfirmation } from './components/OrderConfirmation';
import { WishlistPage } from './components/WishlistPage';
import { ProfilePage } from './components/ProfilePage';
import { AdminPortal } from './components/AdminPortal';
import { Footer } from './components/Footer';
import { LoginModal, ProfileSettingsModal } from './components/Modals';

const AppContent = () => {
  const {
    activePage,
    setActivePage: handlePageChange,
    authModalOpen,
    setAuthModalOpen,
    setAuthModalMessage,
    profileModalOpen,
    setProfileModalOpen
  } = useCart();

  const handleOpenAuth = () => {
    setAuthModalMessage("");
    setAuthModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFF8EE' }}>
      {/* Shared Header / Navbar (Shown on all customer pages) */}
      {activePage !== 'admin' && (
        <Navbar
          activePage={activePage}
          setActivePage={handlePageChange}
          onOpenAuth={handleOpenAuth}
        />
      )}

      {/* Main Pages Switcher */}
      <main style={{ flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        {activePage === 'home' && (
          <Home setActivePage={handlePageChange} />
        )}

        {activePage === 'menu' && (
          <MenuPage />
        )}

        {activePage === 'product-details' && (
          <ProductDetailsPage />
        )}

        {activePage === 'order-details' && (
          <OrderDetailsPage />
        )}

        {activePage === 'cart' && (
          <CartCheckout setActivePage={handlePageChange} />
        )}

        {activePage === 'order-confirmation' && (
          <OrderConfirmation setActivePage={handlePageChange} />
        )}

        {activePage === 'wishlist' && (
          <WishlistPage
            setActivePage={handlePageChange}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activePage === 'profile' && (
          <ProfilePage />
        )}

        {activePage === 'admin' && (
          <AdminPortal setActivePage={handlePageChange} />
        )}
      </main>

      {/* Shared Footer (Shown on customer pages) */}
      {activePage !== 'admin' && (
        <Footer setActivePage={handlePageChange} />
      )}

      {/* Modals */}
      <LoginModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthModalMessage("");
        }}
      />

      <ProfileSettingsModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
