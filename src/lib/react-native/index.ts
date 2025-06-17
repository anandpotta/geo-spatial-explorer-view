
export { GlobeComponent } from './GlobeComponent';
export { MapComponent, MapComponent as default } from './MapComponent';

// Drawing-related exports for React Native
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
export const isReactNative = true;
export const isWeb = false;
export const isReact = false;
