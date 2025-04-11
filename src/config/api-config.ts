
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
  
  // Feature flags
  FEATURES: {
    IMAGERY: false,
    TERRAIN: false,
    ATMOSPHERE: false,
    LIGHTING: false
  }
};
