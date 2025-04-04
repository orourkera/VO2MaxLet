/**
 * API Tracker - Utility to track and debug API requests
 */

// Store API calls for debugging
interface ApiCall {
  url: string;
  method: string;
  timestamp: string;
}

let apiCalls: ApiCall[] = [];

// Original fetch function
const originalFetch = global.fetch;

// Monkey patch fetch to track all calls
if (typeof window !== 'undefined') {
  // Only run in browser
  global.fetch = async function trackingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = input.toString();
    const method = init?.method || 'GET';
    const timestamp = new Date().toISOString();
    
    // Store the call
    apiCalls.push({ url, method, timestamp });
    
    // Call the original fetch
    return originalFetch(input, init);
  };
}

/**
 * Get the list of recent API calls
 */
export function getApiCalls(): ApiCall[] {
  return [...apiCalls];
}

/**
 * Clear the API call history
 */
export function clearApiCalls(): void {
  apiCalls = [];
}

export default {
  getApiCalls,
  clearApiCalls
}; 