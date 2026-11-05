import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { DishCard } from './DishCard';
import { SearchIcon, CloseIcon } from './Icons';

const ITEMS_PER_PAGE = 10;

export const MenuPage = () => {
  const { dishes } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegFilter, setVegFilter] = useState("all"); // 'all', 'veg', 'non-veg'
  const [sortBy, setSortBy] = useState("default"); // 'default', 'price-low', 'price-high'
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, vegFilter, sortBy]);

  // Derive categories dynamically from MySQL dishes
  const categories = useMemo(() => {
    const set = new Set();
    dishes.forEach(d => { if (d.category) set.add(d.category); });
    return ["All", ...Array.from(set)];
  }, [dishes]);

  // Filter and Sort Logic
  const filteredDishes = dishes.filter(dish => {
    // Category filter
    const matchesCategory =
      selectedCategory === "All" ||
      dish.category.toLowerCase() === selectedCategory.toLowerCase();

    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      dish.name.toLowerCase().includes(searchLower) ||
      dish.description.toLowerCase().includes(searchLower);

    // Veg / Non-Veg filter
    const matchesVeg =
      vegFilter === "all" ||
      (vegFilter === "veg" && dish.isVeg) ||
      (vegFilter === "non-veg" && !dish.isVeg);

    return matchesCategory && matchesSearch && matchesVeg;
  });

  // Sorting
  const sortedDishes = [...filteredDishes].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0;
  });

  // Pagination calculation: exactly 10 dishes per page
  const totalPages = Math.max(1, Math.ceil(sortedDishes.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedDishes.length);
  const paginatedDishes = sortedDishes.slice(startIndex, endIndex);

  // Generate numbered pagination with ellipsis: e.g. 1, 2, ... 10
  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div style={{ padding: '20px 0 50px 0' }}>
      <div className="container">
        {/* Page Header */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Kumbakonam Kitchen
          </span>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800, color: '#2B2118', lineHeight: 1.2 }}>
            Our Menu
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#6B5E52', marginTop: '2px' }}>
            Fresh ingredients, authentic South Indian flavors. Pick your favorites and order fresh!
          </p>
        </div>

        {/* Search & Quick Filters Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #F6DFCA',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#C2410C'
              }}
            >
              <SearchIcon size={18} />
            </div>
            <input
              type="text"
              placeholder="Search dishes... (e.g. Biryani, Kadappa, Dosa, Degree Coffee)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{
                paddingLeft: '38px',
                paddingRight: searchQuery ? '36px' : '12px',
                minHeight: '38px',
                fontSize: '0.86rem',
                borderRadius: '8px'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B5E52'
                }}
              >
                <CloseIcon size={16} />
              </button>
            )}
          </div>

          {/* Veg Filter & Sort Dropdown */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {/* Veg / Non-Veg Toggle Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setVegFilter("all")}
                className="chip"
                style={{
                  minHeight: '32px',
                  padding: '3px 12px',
                  fontSize: '0.78rem',
                  backgroundColor: vegFilter === 'all' ? '#2B2118' : '#FFFFFF',
                  color: vegFilter === 'all' ? '#FFF8EE' : '#2B2118',
                  borderColor: vegFilter === 'all' ? '#2B2118' : '#F6DFCA'
                }}
              >
                All
              </button>
              <button
                onClick={() => setVegFilter("veg")}
                className="chip"
                style={{
                  minHeight: '32px',
                  padding: '3px 12px',
                  fontSize: '0.78rem',
                  backgroundColor: vegFilter === 'veg' ? '#16A34A' : '#FFFFFF',
                  color: vegFilter === 'veg' ? '#FFFFFF' : '#16A34A',
                  borderColor: '#16A34A'
                }}
              >
                <span className="veg-badge" style={{ width: '11px', height: '11px' }}>
                  <span className="veg-dot" style={{ width: '4px', height: '4px' }} />
                </span>
                Pure Veg
              </button>
              <button
                onClick={() => setVegFilter("non-veg")}
                className="chip"
                style={{
                  minHeight: '32px',
                  padding: '3px 12px',
                  fontSize: '0.78rem',
                  backgroundColor: vegFilter === 'non-veg' ? '#DC2626' : '#FFFFFF',
                  color: vegFilter === 'non-veg' ? '#FFFFFF' : '#DC2626',
                  borderColor: '#DC2626'
                }}
              >
                <span className="non-veg-badge" style={{ width: '11px', height: '11px' }}>
                  <span className="non-veg-dot" style={{ width: '4px', height: '4px' }} />
                </span>
                Non-Veg
              </button>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#6B5E52', fontWeight: 500 }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  minHeight: '32px',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  border: '1px solid #F6DFCA',
                  backgroundColor: '#FFFFFF',
                  color: '#2B2118',
                  fontFamily: 'Poppins',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="default">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Chips Scrollbar */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '10px',
            marginBottom: '14px',
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

        {/* Results Count Header */}
        <div style={{ marginBottom: '14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: '#6B5E52', fontWeight: 600 }}>
            {sortedDishes.length > 0 ? (
              <>
                Showing {startIndex + 1}–{endIndex} of {sortedDishes.length} dishes in {selectedCategory}
                {totalPages > 1 && (
                  <span style={{ marginLeft: '8px', color: '#C2410C', fontWeight: 700 }}>
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </>
            ) : (
              `0 dishes in ${selectedCategory}`
            )}
          </span>
          {searchQuery && (
            <span style={{ fontSize: '0.78rem', color: '#C2410C', fontWeight: 600 }}>
              Search result for "{searchQuery}"
            </span>
          )}
        </div>

        {/* Dishes Grid - Compact & Responsive */}
        {sortedDishes.length > 0 ? (
          <>
            <div className="grid-dishes">
              {paginatedDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>

            {/* Pagination Controls (1, 2 ... 10) */}
            {totalPages > 1 && (
              <nav aria-label="Menu pagination" className="pagination-container">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                  aria-label="Previous page"
                  style={{ padding: '0 12px' }}
                >
                  ← Prev
                </button>

                {getPageNumbers(currentPage, totalPages).map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(item);
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-btn ${isActive ? 'active' : ''}`}
                      aria-label={`Page ${pageNum}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                  aria-label="Next page"
                  style={{ padding: '0 12px' }}
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        ) : (
          /* Empty Search State */
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #F6DFCA'
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🍽️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2B2118', marginBottom: '4px' }}>
              No dishes found!
            </h3>
            <p style={{ color: '#6B5E52', marginBottom: '16px', maxWidth: '360px', margin: '0 auto 16px auto', fontSize: '0.82rem' }}>
              No dishes found matching your search. Please try another keyword!
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setVegFilter("all");
              }}
              className="btn btn-primary"
              style={{ minHeight: '36px', fontSize: '0.82rem' }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
