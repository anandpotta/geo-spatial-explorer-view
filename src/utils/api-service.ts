
import { toast } from "@/components/ui/use-toast";

// API configuration
const API_CONFIG = {
  BASE_URL: '',  // Empty base URL to prevent network requests
  TIMEOUT: 8000, // 8 seconds timeout
  RETRY_COUNT: 0, // Don't retry failed requests
  RETRY_DELAY: 1500,
  OFFLINE_MODE: true, // Force offline mode
};

// Network and backend status
let isOnline = navigator.onLine;
let isBackendAvailable = false;

// Check if backend is available - this function now immediately returns false in offline mode
export async function checkBackendAvailability(): Promise<boolean> {
  if (API_CONFIG.OFFLINE_MODE || !isOnline) {
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
// In offline mode, don't even try to check
if (!API_CONFIG.OFFLINE_MODE) {
  checkBackendAvailability().then(available => {
    if (!available) {
      console.log('Working in offline mode - backend not available');
    }
  });
}

// Network status event listeners
window.addEventListener('online', async () => {
  isOnline = true;
  if (!API_CONFIG.OFFLINE_MODE) {
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      toast({
        title: "Back online",
        description: "Connected to backend service. Syncing data...",
      });
    }
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  isBackendAvailable = false;
  
  toast({
    title: "Working offline",
    description: "Your data will be stored locally until you reconnect.",
  });
});

// Generic API call with retries - returns immediately in offline mode
export async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  retries = API_CONFIG.RETRY_COUNT
): Promise<T> {
  // If offline mode is enabled, reject immediately
  if (API_CONFIG.OFFLINE_MODE) {
    return Promise.reject(new Error('Offline mode enabled'));
  }
  
  // If offline or backend not available, reject immediately
  if (!isOnline || !isBackendAvailable) {
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
    
    if (retries > 0 && isOnline) {
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

// Get connection status
export function getConnectionStatus() {
  return {
    isOnline: !API_CONFIG.OFFLINE_MODE && isOnline,
    isBackendAvailable: !API_CONFIG.OFFLINE_MODE && isBackendAvailable
  };
}
