
export { GlobeComponent } from './GlobeComponent';
export { MapComponent } from './MapComponent';
export { StandaloneMapComponent, StandaloneMapComponent as default } from './StandaloneMapComponent';
export type { StandaloneMapComponentProps, StandaloneMapProps } from './StandaloneMapComponent';

// Enhanced utilities
export { 
  generateEnhancedGeoJSON, 
  downloadEnhancedGeoJSON, 
  getEnhancedGeoJSONString 
} from '../../utils/enhanced-geojson-export';

export type { 
  EnhancedLocation, 
  StandaloneGeoJSON, 
  StandaloneGeoJSONFeature 
} from '../../utils/enhanced-geo-utils';

// Drawing-related exports
export { useDrawingFileUpload } from '../../hooks/useDrawingFileUpload';
export { useHandleShapeCreation } from '../../hooks/useHandleShapeCreation';

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Drawing types
export type { DrawingData } from '../../utils/drawing-utils';

// Platform-specific utilities
export const isReact = true;
export const isWeb = true;
export const isReactNative = false;
