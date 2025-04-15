
import { toast } from "@/components/ui/use-toast";

const API_CONFIG = {
  BASE_URL: '',
  TIMEOUT: 8000,
  RETRY_COUNT: 0,
  RETRY_DELAY: 1500,
  OFFLINE_MODE: true,
  DISABLE_TRACKING: true  // New flag to disable tracking
};

// Connection status tracking
let isOnline = navigator.onLine;
let isBackendAvailable = false;

// Modify existing fetch to block tracking requests
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  // Block specific tracking domains
  if (typeof input === 'string' && (
    input.includes('facebook.com/tr') || 
    input.includes('lovable.dev/ingest')
  )) {
    console.log('Blocked tracking request:', input);
    return Promise.resolve(new Response(null, { status: 200 }));
  }
  return originalFetch.apply(this, arguments as any);
};

// Function to check if backend is available
export async function checkBackendAvailability(): Promise<boolean> {
  if (!navigator.onLine || API_CONFIG.OFFLINE_MODE) {
    isBackendAvailable = false;
    return false;
  }

  try {
    // Simulate backend availability check for demo purposes
    // In a real app, you might ping your actual API endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        isBackendAvailable = API_CONFIG.OFFLINE_MODE ? false : true;
        resolve(isBackendAvailable);
      }, 100);
    });
  } catch (error) {
    console.error('Error checking backend availability:', error);
    isBackendAvailable = false;
    return false;
  }
}

// Function to get connection status
export function getConnectionStatus() {
  return {
    isOnline: !API_CONFIG.OFFLINE_MODE && navigator.onLine,
    isBackendAvailable: !API_CONFIG.OFFLINE_MODE && isBackendAvailable
  };
}

// Generic API call function
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  
  if (!isOnline || !isBackendAvailable) {
    throw new Error('Network unavailable');
  }
  
  const url = `${API_CONFIG.BASE_URL}/api/${endpoint}`;
  
  const fetchOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    toast({
      variant: "destructive",
      title: "API Error",
      description: "Could not connect to server",
    });
    throw error;
  }
}

export { API_CONFIG };
