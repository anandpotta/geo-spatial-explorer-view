
import { toast } from 'sonner';

// API configuration
const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com/api' 
    : 'http://localhost:3001/api',
  TIMEOUT: 8000, // 8 seconds timeout
  RETRY_COUNT: 2,
  RETRY_DELAY: 1500,
  OFFLINE_MODE: true // Set to true to enable full offline mode
};

// Network and backend status
let isOnline = navigator.onLine;
let isBackendAvailable = false;

// Check if backend is available
export async function checkBackendAvailability(): Promise<boolean> {
  if (!isOnline || API_CONFIG.OFFLINE_MODE) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      // Ensure we actually got JSON back and not HTML
      if (contentType && contentType.includes('application/json')) {
        console.log('Backend API is available');
        isBackendAvailable = true;
        return true;
      } else {
        console.warn('Backend API returned non-JSON response');
        isBackendAvailable = false;
        return false;
      }
    } else {
      console.warn(`Backend API returned non-200 status: ${response.status}`);
      isBackendAvailable = false;
      return false;
    }
  } catch (error) {
    console.warn('Backend API is not available:', error);
    isBackendAvailable = false;
    return false;
  }
}

// Check backend status immediately but don't show toast initially
checkBackendAvailability().then(available => {
  if (!available) {
    console.log('Working in offline mode - backend not available');
    // Don't show toast on initial load to avoid confusion
  }
});

// Network status event listeners
window.addEventListener('online', async () => {
  isOnline = true;
  if (!API_CONFIG.OFFLINE_MODE) {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      toast("Back online", {
        description: "Connected to backend service. Syncing data...",
      });
    }
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  isBackendAvailable = false;
  
  toast("Working offline", {
    description: "Your data will be stored locally until you reconnect.",
  });
});

// Generic API call with retries
export async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  retries = API_CONFIG.RETRY_COUNT
): Promise<T> {
  // If offline, offline mode is enabled, or backend not available, reject immediately
  if (!isOnline || API_CONFIG.OFFLINE_MODE || !isBackendAvailable) {
    return Promise.reject(new Error('Backend not available'));
  }
  
  const url = `${API_CONFIG.BASE_URL}/${endpoint.replace(/^\//, '')}`;
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };
  
  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Check for non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response from API:', contentType);
      throw new Error('Invalid response format');
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && isOnline && !API_CONFIG.OFFLINE_MODE) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      return apiCall<T>(endpoint, options, retries - 1);
    }
    
    // If we're out of retries, check if backend is still available
    if (!API_CONFIG.OFFLINE_MODE) {
      checkBackendAvailability();
    }
    throw error;
  }
}

// Get backend status
export function getConnectionStatus() {
  return {
    isOnline: isOnline && !API_CONFIG.OFFLINE_MODE,
    isBackendAvailable: isBackendAvailable && !API_CONFIG.OFFLINE_MODE
  };
}
