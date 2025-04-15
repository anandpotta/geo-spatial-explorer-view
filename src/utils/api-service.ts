
import { toast } from "@/components/ui/use-toast";

const API_CONFIG = {
  BASE_URL: '',
  TIMEOUT: 8000,
  RETRY_COUNT: 0,
  RETRY_DELAY: 1500,
  OFFLINE_MODE: true,
  DISABLE_TRACKING: true  // New flag to disable tracking
};

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

export { API_CONFIG };
