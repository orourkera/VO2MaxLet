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
  // IMPORTANT: Always use window.location.origin to ensure we're using
  // the Next.js API routes and not the backend server
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for SSR
  return '';
}

/**
 * Checks if we're using a custom backend API instead of the Next.js API routes
 */
export function isUsingCustomBackend(): boolean {
  return false;
} 