/**
 * Centralized API Base URL configuration.
 * Loaded strictly from Vite environment variable (VITE_API_BASE_URL).
 * When deploying to production, simply change VITE_API_BASE_URL in your hosting dashboard/env.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

if (!API_BASE_URL) {
  console.warn(
    "[ORDER UNAVU] VITE_API_BASE_URL is not set in frontend/.env! Please ensure VITE_API_BASE_URL is defined."
  );
}

