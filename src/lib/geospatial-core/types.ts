
/**
 * Core types for the GeoSpatial library
 * These types are framework-agnostic and used across all implementations
 */

// Basic location type
export interface GeoLocation {
  id: string;
  label: string;
  latitude: number; // Changed from y to latitude
  longitude: number; // Changed from x to longitude
  altitude?: number; // Changed from z to altitude
  metadata?: Record<string, any>;
}

// Map options interface
export interface MapOptions {
  zoom?: number;
  center?: { lat: number; lng: number };
  tileProvider?: string;
  minZoom?: number;
  maxZoom?: number;
  showControls?: boolean;
}

// Globe configuration options
export interface GlobeOptions {
  earthRadius?: number;
  texturePath?: string;
  bumpMapPath?: string;
  specularMapPath?: string;
  backgroundColor?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  enableAtmosphere?: boolean;
}

// Map view options
export interface MapViewOptions {
  initialCenter?: [number, number];
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  tileProvider?: string;
  showControls?: boolean;
}

// Event handler types
export interface GlobeEventHandlers {
  onReady?: (api: any) => void;
  onFlyComplete?: () => void;
  onLocationSelect?: (location: GeoLocation) => void;
  onError?: (error: Error) => void;
}

// Renderer context - abstraction for platform-specific rendering
export interface RendererContext {
  getElement: () => any; // Platform-specific element or reference
  getDimensions: () => { width: number; height: number };
  onResize?: (callback: () => void) => void;
  onCleanup?: (callback: () => void) => void;
}

// Core API interface that adapters will implement
export interface GeoSpatialCoreAPI {
  // Globe methods
  initGlobe: (context: RendererContext, options?: GlobeOptions) => void;
  destroyGlobe: () => void;
  flyToLocation: (longitude: number, latitude: number, callback?: () => void) => void;
  
  // Map methods
  initMap: (context: RendererContext, options?: MapViewOptions) => void;
  destroyMap: () => void;
  centerMap: (longitude: number, latitude: number, zoom?: number) => void;
  
  // Shared methods
  setLocation: (location: GeoLocation) => void;
  getLocation: () => GeoLocation | null;
}
