
export const API_CONFIG = {
  // Completely disable Cesium Ion integration
  CESIUM_ION_TOKEN: "",
  
  // Disable all external services
  USE_ION_FALLBACK: false,
  
  // Force offline mode
  USE_LOCAL: true,
  OFFLINE_MODE: true,
  BASE_URL: "",
  
  // Disable ion services explicitly
  DISABLE_ION: true,
  
  // Prevent network requests in Cesium
  PREVENT_NETWORK_REQUESTS: true,
  
  // Additional flags to ensure offline mode
  FORCE_OFFLINE: true,
  
  // Maximum attempts to make any requests
  MAX_REQUEST_ATTEMPTS: 0,
  
  // Flags for asset loading
  ASSETS_ENABLED: false,
  
  // Network request settings
  NETWORK: {
    ENABLED: false,
    TIMEOUT: 0,
    RETRY_ATTEMPTS: 0
  },
  
  // Feature flags
  FEATURES: {
    IMAGERY: false,
    TERRAIN: false,
    ATMOSPHERE: true, // Enable atmosphere for better visibility
    LIGHTING: true,   // Enable lighting for better visibility
    GLOBE_EFFECTS: true // Enable globe effects for better visibility
  },
  
  // Debug settings
  DEBUG: {
    FORCE_RENDER: true,
    LOGGING: true,
    VISIBILITY_CHECKS: true,
    RENDER_LOOPS: 10,
    RENDER_INTERVAL_MS: 100
  }
};
