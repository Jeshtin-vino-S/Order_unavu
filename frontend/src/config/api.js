/**
 * Centralized API Base URL configuration.
 * Loaded strictly from Vite environment variable (VITE_API_BASE_URL).
 * When deploying to production, simply change VITE_API_BASE_URL in your hosting dashboard/env.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

/**
 * Resolves any image URL to work dynamically across local dev, Render live deployment, or custom domains.
 * Automatically fixes legacy 'localhost:8000' URLs stored in the database.
 */
export const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If it's an external CDN image (e.g. Unsplash), use as is
  if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('/uploads/')) {
    return trimmed;
  }

  // If it's an uploaded file (/uploads/...), extract filename
  if (trimmed.includes('/uploads/')) {
    const filename = trimmed.split('/uploads/').pop();
    return API_BASE_URL ? `${API_BASE_URL}/uploads/${filename}` : `/uploads/${filename}`;
  }

  return trimmed;
};

if (!API_BASE_URL) {
  console.warn(
    "[ORDER UNAVU] VITE_API_BASE_URL is not set in frontend/.env! Please ensure VITE_API_BASE_URL is defined."
  );
}

