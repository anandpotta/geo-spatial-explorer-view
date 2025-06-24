
// Angular module and components for Angular environments only
export { AngularMapComponent } from './map.component';
export { AngularGlobeComponent } from './globe.component';
export { GeospatialExplorerModule } from './geospatial-explorer.module';

// Additional aliases for easier usage
export { AngularMapComponent as GeoMapComponent } from './map.component';
export { AngularGlobeComponent as GeoGlobeComponent } from './globe.component';

// Default export for easier importing
export { GeospatialExplorerModule as default } from './geospatial-explorer.module';

// Core types re-exported for convenience
export type {
  GeoLocation,
  MapViewOptions,
  GlobeOptions
} from '../geospatial-core/types';

// Simple DrawingData interface without dependencies
export interface DrawingData {
  id: string;
  type: string;
  data: any;
}

// Platform-specific utilities
export const isAngular = true;
export const isWeb = true;
export const isReactNative = false;
export const isReact = false;

// Angular-specific drawing utilities (simplified interface)
export interface AngularDrawingService {
  handleFileUpload: (drawingId: string, file: File) => void;
  handleShapeCreation: (shape: any) => void;
  setupEventHandlers: (element: Element) => void;
}

// Legacy exports for backwards compatibility
export { AngularMapComponent as MapComponent } from './map.component';
export { AngularGlobeComponent as GlobeComponent } from './globe.component';
export { AngularMapComponent as MapComponentAngular } from './map.component';

// Public API for Angular applications
export { GeospatialExplorerModule as GEOSPATIAL_EXPLORER_MODULE } from './geospatial-explorer.module';
export { AngularMapComponent as GEO_MAP_COMPONENT } from './map.component';
export { AngularGlobeComponent as GEO_GLOBE_COMPONENT } from './globe.component';
