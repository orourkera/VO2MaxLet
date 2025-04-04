/**
 * Utilities for handling API URLs and detecting overrides
 */

/**
 * Gets the base API URL for the application.
 * Logs debugging information to help track down issues with API routing.
 * 
 * @returns The base URL to use for API requests
 */
export function getApiBaseUrl(): string {
  // IMPORTANT: FORCE using window.location.origin to ensure we're using
  // the Next.js API routes and not the backend server or any other URL
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('🔴 FORCING API URL TO CURRENT DOMAIN:', origin);
    return origin;
  }
  
  // Fallback for SSR
  console.log('⚠️ SSR detected, no window object available');
  return '';
}

/**
 * Checks if we're using a custom backend API instead of the Next.js API routes
 * Always returns false to force using Next.js API routes
 */
export function isUsingCustomBackend(): boolean {
  console.log('⚠️ isUsingCustomBackend called, returning false to ensure Next.js API routes are used');
  return false;
} 